"""Mastery aggregation consumed by the dashboard (and future /mastery APIs).

Business rules
--------------
Source of truth
    ``TopicMastery`` rows written by diagnostic/practice pipelines. This
    module never invents scores from unrelated fields.

Eligibility
    A topic is eligible when ``questions_attempted >= MIN_OBSERVATIONS_FOR_RANKING``.
    Unattempted topics (no row) and under-observed topics are excluded from
    rankings and from strong/weak classification — they are not treated as
    demonstrated weak topics.

Subject mastery
    Mean of eligible topic ``mastery_score`` values under that subject
    (via ``topic.unit.subject``), rounded to ``SCORE_DECIMAL_PLACES``.

Overall progress
    Mean of eligible topic mastery scores for topics belonging to the
    student's selected subjects. ``None`` when no eligible topics exist
    (unavailable). ``0.0`` when eligible topics exist and the mean is zero.

Strong / weak topics
    Strong: eligible and ``mastery_score >= STRONG_TOPIC_MIN`` (80).
    Weak: eligible and ``mastery_score <= WEAK_TOPIC_MAX`` (39).
    Bands match API contract §22.4.

Strongest / weakest subject
    Strongest requires ≥1 eligible subject; weakest requires ≥2 so a lone
    subject is not presented as both strongest and weakest.
    Strongest tie-break: ``name`` ascending, then ``id`` ascending.
    Weakest tie-break: ``name`` descending, then ``id`` descending, so a
    full mastery tie still yields a distinct, deterministic pair.
    Topic lists use mastery order (desc for strong, asc for weak), then
    topic ``name`` ascending, then ``id`` ascending.
"""

from decimal import ROUND_HALF_UP, Decimal

from curriculum.models import Subject
from mastery.bands import mastery_band
from mastery.constants import (
    MIN_OBSERVATIONS_FOR_RANKING,
    SCORE_DECIMAL_PLACES,
    STRONG_TOPIC_MIN,
    WEAK_TOPIC_MAX,
)
from mastery.models import TopicMastery


def _quantize(score: Decimal) -> float:
    quant = Decimal("1").scaleb(-SCORE_DECIMAL_PLACES)
    return float(score.quantize(quant, rounding=ROUND_HALF_UP))


def _accuracy_float(value) -> float | None:
    if value is None:
        return None
    return _quantize(Decimal(str(value)))


def eligible_topic_masteries_qs(user, subject_ids=None):
    """Return TopicMastery queryset for ``user`` with enough observations."""
    qs = (
        TopicMastery.objects.filter(
            user=user,
            questions_attempted__gte=MIN_OBSERVATIONS_FOR_RANKING,
        )
        .select_related("topic", "topic__unit", "topic__unit__subject")
        .order_by("topic__name", "topic_id")
    )
    if subject_ids is not None:
        qs = qs.filter(topic__unit__subject_id__in=subject_ids)
    return qs


def _subject_mastery_rows(eligible_rows):
    """Group eligible TopicMastery rows into per-subject aggregates."""
    by_subject = {}
    for row in eligible_rows:
        subject = row.topic.unit.subject
        bucket = by_subject.setdefault(
            subject.id,
            {
                "subject": subject,
                "scores": [],
                "attempted": 0,
                "correct": 0,
            },
        )
        bucket["scores"].append(Decimal(str(row.mastery_score)))
        bucket["attempted"] += row.questions_attempted
        bucket["correct"] += row.questions_correct

    results = []
    for subject_id, bucket in by_subject.items():
        scores = bucket["scores"]
        mean = sum(scores) / Decimal(len(scores))
        accuracy = None
        if bucket["attempted"]:
            accuracy = (
                Decimal(bucket["correct"]) * Decimal("100") / Decimal(bucket["attempted"])
            )
        results.append(
            {
                "subject": bucket["subject"],
                "mastery": _quantize(mean),
                "accuracy": _quantize(accuracy) if accuracy is not None else None,
                "available": True,
            }
        )
    # Deterministic order for tie-breaking consumers.
    results.sort(key=lambda item: (item["subject"].name.lower(), str(item["subject"].id)))
    return results


def _topic_payload(row: TopicMastery) -> dict:
    subject = row.topic.unit.subject
    score = Decimal(str(row.mastery_score))
    return {
        "id": row.topic.id,
        "name": row.topic.name,
        "subject_id": subject.id,
        "subject_name": subject.name,
        "mastery": _quantize(score),
        "mastery_band": mastery_band(score),
        "accuracy": _accuracy_float(row.accuracy_pct),
    }


def _subject_summary_payload(item: dict) -> dict:
    subject = item["subject"]
    return {
        "id": subject.id,
        "name": subject.name,
        "slug": subject.slug,
        "grade": subject.grade,
        "stream": subject.stream,
        "mastery": item["mastery"],
        "accuracy": item["accuracy"],
        "available": True,
    }


def compute_student_mastery_snapshot(user, selected_subjects=None):
    """Aggregate mastery metrics for the authenticated student.

    Parameters
    ----------
    user:
        Authenticated user — never a client-supplied student id.
    selected_subjects:
        Optional iterable of ``Subject`` instances. When provided, overall
        progress and subject ranking are scoped to those subjects. Topic
        strong/weak lists use the same scope.
    """
    if selected_subjects is None:
        subject_ids = None
        subjects = list(
            Subject.objects.filter(
                units__topics__masteries__user=user,
                units__topics__masteries__questions_attempted__gte=MIN_OBSERVATIONS_FOR_RANKING,
            ).distinct()
        )
    else:
        subjects = list(selected_subjects)
        subject_ids = [s.id for s in subjects]

    eligible = list(eligible_topic_masteries_qs(user, subject_ids=subject_ids))
    subject_rows = _subject_mastery_rows(eligible)
    subject_by_id = {row["subject"].id: row for row in subject_rows}

    # Overall progress: mean of eligible topic scores (not a mix of metrics).
    if eligible:
        total = sum(Decimal(str(row.mastery_score)) for row in eligible)
        overall_progress = _quantize(total / Decimal(len(eligible)))
    else:
        overall_progress = None

    # Strongest / weakest with deterministic tie-break.
    strongest = None
    weakest = None
    if subject_rows:
        ranked_strongest = sorted(
            subject_rows,
            key=lambda item: (
                -item["mastery"],
                item["subject"].name.lower(),
                str(item["subject"].id),
            ),
        )
        strongest = _subject_summary_payload(ranked_strongest[0])
        if len(subject_rows) >= 2:
            min_mastery = min(item["mastery"] for item in subject_rows)
            weakest_tied = [
                item for item in subject_rows if item["mastery"] == min_mastery
            ]
            # Name/id descending so an all-equal tie differs from strongest.
            weakest_tied.sort(
                key=lambda item: (
                    item["subject"].name.lower(),
                    str(item["subject"].id),
                ),
                reverse=True,
            )
            weakest = _subject_summary_payload(weakest_tied[0])

    strong_topics = [
        _topic_payload(row)
        for row in sorted(
            (
                row
                for row in eligible
                if Decimal(str(row.mastery_score)) >= STRONG_TOPIC_MIN
            ),
            key=lambda row: (
                -float(row.mastery_score),
                row.topic.name.lower(),
                str(row.topic.id),
            ),
        )
    ]
    weak_topics = [
        _topic_payload(row)
        for row in sorted(
            (
                row
                for row in eligible
                if Decimal(str(row.mastery_score)) <= WEAK_TOPIC_MAX
            ),
            key=lambda row: (
                float(row.mastery_score),
                row.topic.name.lower(),
                str(row.topic.id),
            ),
        )
    ]

    # Per-selected-subject summaries (preserve caller order for selected list).
    subject_summaries = []
    for subject in subjects:
        row = subject_by_id.get(subject.id)
        if row:
            subject_summaries.append(_subject_summary_payload(row))
        else:
            subject_summaries.append(
                {
                    "id": subject.id,
                    "name": subject.name,
                    "slug": subject.slug,
                    "grade": subject.grade,
                    "stream": subject.stream,
                    "mastery": None,
                    "accuracy": None,
                    "available": False,
                }
            )

    has_mastery = bool(eligible)
    return {
        "overall_progress": overall_progress,
        "strongest_subject": strongest,
        "weakest_subject": weakest,
        "strong_topics": strong_topics,
        "weak_topics": weak_topics,
        "subject_summaries": subject_summaries,
        "available": has_mastery,
    }


def upsert_topic_mastery(
    *,
    user,
    topic,
    mastery_score,
    questions_attempted,
    questions_correct=0,
    accuracy_pct=None,
    last_practiced_at=None,
    algorithm_version=None,
):
    """Create or replace a TopicMastery row.

    Intended for diagnostic/practice writers and tests. Dashboard code
    must not call this to fabricate display data.

    When ``questions_attempted > 0``, also records a qualifying learning
    activity event for streak / recent-activity (see ``engagement``).
    """
    from django.utils import timezone

    from engagement.services import record_learning_activity
    from mastery.constants import MASTERY_ALGORITHM_VERSION

    practiced_at = last_practiced_at or (
        timezone.now() if questions_attempted > 0 else None
    )
    defaults = {
        "mastery_score": Decimal(str(mastery_score)),
        "questions_attempted": questions_attempted,
        "questions_correct": questions_correct,
        "accuracy_pct": None if accuracy_pct is None else Decimal(str(accuracy_pct)),
        "last_practiced_at": practiced_at,
        "algorithm_version": algorithm_version or MASTERY_ALGORITHM_VERSION,
    }
    obj, _created = TopicMastery.objects.update_or_create(
        user=user,
        topic=topic,
        defaults=defaults,
    )
    if questions_attempted > 0:
        record_learning_activity(
            user=user,
            topic=topic,
            occurred_at=practiced_at or timezone.now(),
        )
    return obj
