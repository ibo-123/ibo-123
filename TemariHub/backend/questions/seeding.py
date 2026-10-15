"""Idempotent question-bank seeding (practice content only).

Curriculum ``Concept`` rows are not created by ``seed_curriculum``. This module
upserts the concepts required by each blueprint under the matching topic, then
creates/updates questions using the same ``create_question`` / ``update_question``
validation paths as the admin API.

Idempotency uses deterministic UUIDs derived from ``seed_key`` (uuid5). Manually
authored questions keep random UUIDs and are never matched or overwritten.
"""

from __future__ import annotations

from dataclasses import dataclass, field

from django.db import transaction
from django.utils.text import slugify

from authentication.exceptions import ServiceError
from curriculum.models import Concept, Subject, Topic
from questions.constants import QUESTION_STATUS_PUBLISHED
from questions.models import Question
from questions.seed_data.blueprints import get_question_blueprints
from questions.seed_data.constants import (
    question_id_for_seed_key,
    source_for_seed_key,
)
from questions.services import create_question, update_question


@dataclass
class SeedStats:
    created: int = 0
    updated: int = 0
    skipped: int = 0
    failed: int = 0
    concepts_created: int = 0
    concepts_reused: int = 0
    failures: list[str] = field(default_factory=list)
    missing_topics: list[str] = field(default_factory=list)

    def as_dict(self) -> dict:
        return {
            "created": self.created,
            "updated": self.updated,
            "skipped": self.skipped,
            "failed": self.failed,
            "concepts_created": self.concepts_created,
            "concepts_reused": self.concepts_reused,
            "failures": list(self.failures),
            "missing_topics": list(self.missing_topics),
        }


def _resolve_topic(blueprint: dict) -> Topic | None:
    subject_slug = blueprint["subject_slug"]
    unit_slug = blueprint["unit_slug"]
    topic_slug = blueprint["topic_slug"]
    return (
        Topic.objects.select_related("unit", "unit__subject")
        .filter(
            slug=topic_slug,
            unit__slug=unit_slug,
            unit__subject__slug=subject_slug,
            unit__subject__grade=12,
        )
        .first()
    )


def _ensure_concept(topic: Topic, blueprint: dict, stats: SeedStats) -> Concept:
    slug = blueprint["concept_slug"] or slugify(blueprint["concept_name"])
    concept, created = Concept.objects.get_or_create(
        topic=topic,
        slug=slug,
        defaults={
            "name": blueprint["concept_name"],
            "is_active": True,
            "sort_order": 1,
        },
    )
    if created:
        stats.concepts_created += 1
    else:
        stats.concepts_reused += 1
        # Keep name/active in sync for seed-owned concept slugs without touching others.
        dirty = False
        if concept.name != blueprint["concept_name"]:
            concept.name = blueprint["concept_name"]
            dirty = True
        if not concept.is_active:
            concept.is_active = True
            dirty = True
        if dirty:
            concept.save(update_fields=["name", "is_active", "updated_at"])
    return concept


def _option_payload(blueprint: dict) -> list[dict]:
    return [
        {"text": text, "sort_order": index}
        for index, text in enumerate(blueprint["options"])
    ]


def _write_payload(blueprint: dict, topic: Topic, concept: Concept) -> dict:
    return {
        "prompt": blueprint["prompt"],
        "topic_id": topic.id,
        "concept_id": concept.id,
        "difficulty": blueprint["difficulty"],
        "status": QUESTION_STATUS_PUBLISHED,
        "estimated_time_seconds": blueprint.get("estimated_time_seconds"),
        "source": source_for_seed_key(blueprint["seed_key"]),
        "exam_year": None,
        "explanation": blueprint.get("explanation", ""),
        "options": _option_payload(blueprint),
        "correct_option_index": blueprint["correct_index"],
    }


def _matches_blueprint(question: Question, blueprint: dict, concept: Concept) -> bool:
    options = list(question.options_in_order())
    if len(options) != 4:
        return False
    expected = [o.strip() for o in blueprint["options"]]
    actual = [o.text.strip() for o in options]
    if actual != expected:
        return False
    correct = question.correct_option
    if correct is None or correct.sort_order != blueprint["correct_index"]:
        return False
    return (
        question.prompt.strip() == blueprint["prompt"].strip()
        and question.difficulty == blueprint["difficulty"]
        and (question.explanation or "").strip()
        == (blueprint.get("explanation") or "").strip()
        and question.concept_id == concept.id
        and question.topic_id == concept.topic_id
        and question.status == QUESTION_STATUS_PUBLISHED
        and question.source == source_for_seed_key(blueprint["seed_key"])
        and question.estimated_time_seconds
        == blueprint.get("estimated_time_seconds")
    )


def upsert_blueprint(blueprint: dict, *, dry_run: bool, stats: SeedStats) -> None:
    seed_key = blueprint["seed_key"]
    topic = _resolve_topic(blueprint)
    if topic is None:
        stats.failed += 1
        path = (
            f"{blueprint['subject_slug']}/{blueprint['unit_slug']}/"
            f"{blueprint['topic_slug']}"
        )
        msg = f"{seed_key}: topic not found ({path})"
        stats.failures.append(msg)
        if path not in stats.missing_topics:
            stats.missing_topics.append(path)
        return

    if not (
        topic.is_active
        and topic.unit.is_active
        and topic.unit.subject.is_active
    ):
        stats.failed += 1
        stats.failures.append(
            f"{seed_key}: topic/unit/subject inactive — cannot publish"
        )
        return

    qid = question_id_for_seed_key(seed_key)

    try:
        with transaction.atomic():
            concept = _ensure_concept(topic, blueprint, stats)
            payload = _write_payload(blueprint, topic, concept)
            existing = Question.objects.filter(pk=qid).first()

            if existing is not None:
                if _matches_blueprint(existing, blueprint, concept):
                    stats.skipped += 1
                    if dry_run:
                        transaction.set_rollback(True)
                    return
                if dry_run:
                    stats.updated += 1
                    transaction.set_rollback(True)
                    return
                update_question(question=existing, data=payload)
                stats.updated += 1
                return

            if dry_run:
                stats.created += 1
                transaction.set_rollback(True)
                return

            create_question(data=payload, question_id=qid)
            stats.created += 1
    except ServiceError as exc:
        stats.failed += 1
        stats.failures.append(f"{seed_key}: {exc.message} {exc.errors}")
    except Exception as exc:  # pragma: no cover - defensive
        stats.failed += 1
        stats.failures.append(f"{seed_key}: {exc}")


def seed_question_bank(*, dry_run: bool = False, blueprints=None) -> SeedStats:
    """Seed all blueprints. Safe to re-run; never deletes questions."""
    stats = SeedStats()
    catalog = list(blueprints if blueprints is not None else get_question_blueprints())

    # Preflight: report subject coverage gaps (topics with no blueprints).
    # Concepts remain a known curriculum seed gap until this command runs.
    for blueprint in catalog:
        upsert_blueprint(blueprint, dry_run=dry_run, stats=stats)
    return stats


def curriculum_gap_report() -> dict:
    """Read-only summary of curriculum readiness for question seeding."""
    subjects = Subject.objects.filter(grade=12, is_active=True).count()
    topics = Topic.objects.filter(
        unit__subject__grade=12, is_active=True, unit__is_active=True
    ).count()
    concepts = Concept.objects.filter(
        topic__unit__subject__grade=12,
        is_active=True,
        topic__is_active=True,
    ).count()
    blueprint_topics = {
        (b["subject_slug"], b["unit_slug"], b["topic_slug"])
        for b in get_question_blueprints()
    }
    return {
        "active_grade12_subjects": subjects,
        "active_topics": topics,
        "active_concepts": concepts,
        "blueprint_topic_count": len(blueprint_topics),
        "blueprint_question_count": len(get_question_blueprints()),
        "note": (
            "seed_curriculum does not create Concept rows; "
            "seed_question_bank upserts concepts required by blueprints."
        ),
    }
