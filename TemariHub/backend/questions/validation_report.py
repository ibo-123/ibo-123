"""Read-only question-bank readiness reporting."""

from __future__ import annotations

from collections import Counter

from django.db.models import Count, F, Q

from questions.constants import (
    MIN_OPTIONS_FOR_PUBLISH,
    QUESTION_STATUS_DRAFT,
    QUESTION_STATUS_PUBLISHED,
)
from questions.models import Question
from questions.seed_data.constants import ELIGIBLE_TARGET
from questions.services import student_eligible_question_queryset


def build_question_bank_report() -> dict:
    """Assemble a readiness report without modifying any rows."""
    total = Question.objects.count()
    published = Question.objects.filter(status=QUESTION_STATUS_PUBLISHED).count()
    drafts = Question.objects.filter(status=QUESTION_STATUS_DRAFT).count()
    eligible_qs = student_eligible_question_queryset()
    eligible = eligible_qs.count()

    invalid_option_count = (
        Question.objects.filter(status=QUESTION_STATUS_PUBLISHED)
        .annotate(option_count=Count("options"))
        .filter(~Q(option_count=MIN_OPTIONS_FOR_PUBLISH))
        .count()
    )

    missing_correct = Question.objects.filter(
        status=QUESTION_STATUS_PUBLISHED,
        correct_option__isnull=True,
    ).count()

    inactive_curriculum = (
        Question.objects.filter(status=QUESTION_STATUS_PUBLISHED)
        .filter(
            Q(topic__is_active=False)
            | Q(topic__unit__is_active=False)
            | Q(topic__unit__subject__is_active=False)
            | Q(concept__is_active=False)
        )
        .count()
    )

    mismatched_concept = Question.objects.exclude(concept__topic_id=F("topic_id")).count()

    by_subject = Counter()
    for row in (
        eligible_qs.values("topic__unit__subject__name")
        .annotate(c=Count("id"))
        .order_by("topic__unit__subject__name")
    ):
        by_subject[row["topic__unit__subject__name"] or "(unknown)"] = row["c"]

    by_difficulty = Counter()
    for row in (
        eligible_qs.values("difficulty").annotate(c=Count("id")).order_by("difficulty")
    ):
        by_difficulty[row["difficulty"]] = row["c"]

    return {
        "total_questions": total,
        "published": published,
        "drafts": drafts,
        "eligible_published": eligible,
        "eligible_target": ELIGIBLE_TARGET,
        "eligible_target_met": eligible >= ELIGIBLE_TARGET,
        "published_invalid_option_count": invalid_option_count,
        "published_missing_correct_option": missing_correct,
        "published_on_inactive_curriculum": inactive_curriculum,
        "concept_topic_mismatches": mismatched_concept,
        "eligible_by_subject": dict(by_subject),
        "eligible_by_difficulty": {
            str(key): value for key, value in sorted(by_difficulty.items())
        },
        "notes": [
            "eligible_published uses student_eligible_question_queryset "
            "(published + all active curriculum parents).",
            "published count can exceed eligible when curriculum nodes are inactive.",
            "This report is read-only and does not change question status.",
        ],
    }
