"""Diagnostic attempt creation, question delivery, and answer submit helpers.

Completion, scoring, and mastery updates are intentionally not implemented.
"""

from __future__ import annotations

from collections import defaultdict
from decimal import ROUND_HALF_UP, Decimal

from django.db import IntegrityError, transaction
from django.db.models import Count, Prefetch
from django.utils import timezone

from authentication.exceptions import ServiceError
from diagnostics.constants import (
    DIAGNOSTIC_QUESTION_COUNT,
    DIAGNOSTIC_STATUS_COMPLETED,
    DIAGNOSTIC_STATUS_IN_PROGRESS,
)
from diagnostics.models import DiagnosticAnswer, DiagnosticAttempt, DiagnosticQuestion
from questions.constants import MIN_OPTIONS_FOR_PUBLISH
from questions.models import QuestionOption
from questions.services import (
    serialize_question_student,
    student_eligible_question_queryset,
)

_SCORE_QUANTIZE = Decimal("0.01")


def _pct(correct: int, total: int) -> Decimal:
    """Percent score on 0–100 with two decimal places (ROUND_HALF_UP)."""
    if total <= 0:
        return Decimal("0.00")
    raw = (Decimal(correct) * Decimal(100)) / Decimal(total)
    return raw.quantize(_SCORE_QUANTIZE, rounding=ROUND_HALF_UP)


def diagnostic_eligible_question_queryset():
    """Student-eligible questions that are complete enough for a diagnostic."""
    return (
        student_eligible_question_queryset()
        .filter(correct_option__isnull=False)
        .annotate(_option_count=Count("options", distinct=True))
        .filter(_option_count=MIN_OPTIONS_FOR_PUBLISH)
    )


def _select_questions_for_diagnostic(required_count: int) -> list:
    """Pick ``required_count`` eligible questions with even subject coverage.

    Selection is deterministic: questions are ordered by subject sort, then
    question id, then assigned round-robin across subjects.
    """
    qs = (
        diagnostic_eligible_question_queryset()
        .select_related("topic__unit__subject")
        .order_by(
            "topic__unit__subject__sort_order",
            "topic__unit__subject_id",
            "id",
        )
    )
    by_subject: dict = defaultdict(list)
    for question in qs:
        by_subject[question.topic.unit.subject_id].append(question)

    subject_ids = sorted(
        by_subject.keys(),
        key=lambda sid: (
            by_subject[sid][0].topic.unit.subject.sort_order,
            str(sid),
        ),
    )
    selected = []
    while len(selected) < required_count:
        progressed = False
        for subject_id in subject_ids:
            bucket = by_subject[subject_id]
            if not bucket:
                continue
            selected.append(bucket.pop(0))
            progressed = True
            if len(selected) >= required_count:
                break
        if not progressed:
            break
    return selected


def serialize_attempt(attempt: DiagnosticAttempt) -> dict:
    """Attempt summary for start/detail responses."""
    sections = (
        DiagnosticQuestion.objects.filter(attempt=attempt)
        .values(
            "question__topic__unit__subject_id",
            "question__topic__unit__subject__name",
        )
        .annotate(question_count=Count("id"))
        .order_by("question__topic__unit__subject__name")
    )
    section_payload = [
        {
            "subject_id": str(row["question__topic__unit__subject_id"]),
            "subject_name": row["question__topic__unit__subject__name"],
            "question_count": row["question_count"],
        }
        for row in sections
    ]
    return {
        "id": str(attempt.id),
        # Contract §15.1 name for the same identifier.
        "diagnostic_test_id": str(attempt.id),
        "status": attempt.status,
        "started_at": attempt.started_at,
        "completed_at": attempt.completed_at,
        "total_questions": attempt.total_questions,
        "overall_score_pct": attempt.overall_score_pct,
        "sections": section_payload,
    }


def _score_assigned_questions(attempt: DiagnosticAttempt) -> dict:
    """Score only questions assigned to ``attempt``.

    Correct when ``selected_option_id == question.correct_option_id``.
    Missing answers / null selected options count as incorrect.
    """
    rows = (
        DiagnosticQuestion.objects.filter(attempt=attempt)
        .select_related(
            "question",
            "question__correct_option",
            "question__topic",
            "question__topic__unit",
            "question__topic__unit__subject",
        )
        .prefetch_related(
            Prefetch(
                "answer",
                queryset=DiagnosticAnswer.objects.select_related("selected_option"),
            )
        )
        .order_by("position", "id")
    )

    total = 0
    answered = 0
    correct = 0
    by_subject: dict = defaultdict(
        lambda: {"name": "", "question_count": 0, "correct_count": 0}
    )

    for row in rows:
        total += 1
        subject = row.question.topic.unit.subject
        bucket = by_subject[subject.id]
        bucket["name"] = subject.name
        bucket["question_count"] += 1

        try:
            answer = row.answer
        except DiagnosticAnswer.DoesNotExist:
            answer = None

        if answer is not None and answer.selected_option_id is not None:
            answered += 1
            if (
                row.question.correct_option_id is not None
                and answer.selected_option_id == row.question.correct_option_id
            ):
                correct += 1
                bucket["correct_count"] += 1
        # Unanswered / wrong → incorrect (do not increment correct).

    subjects = [
        {
            "subject_id": str(subject_id),
            "subject_name": data["name"],
            "question_count": data["question_count"],
            "correct_count": data["correct_count"],
            "score_pct": _pct(data["correct_count"], data["question_count"]),
        }
        for subject_id, data in sorted(
            by_subject.items(), key=lambda item: item[1]["name"]
        )
    ]

    return {
        "total_questions": total,
        "questions_answered": answered,
        "questions_correct": correct,
        "overall_score_pct": _pct(correct, total),
        "subjects": subjects,
    }


def serialize_completion_result(attempt: DiagnosticAttempt, scoring: dict | None = None) -> dict:
    """Completion payload — no per-question keys or explanations."""
    base = serialize_attempt(attempt)
    if scoring is None:
        # Idempotent re-complete: recompute summary stats without mutating score.
        scoring = _score_assigned_questions(attempt)
        # Prefer the persisted historical overall score.
        scoring = {
            **scoring,
            "overall_score_pct": attempt.overall_score_pct
            if attempt.overall_score_pct is not None
            else scoring["overall_score_pct"],
        }
    base.update(
        {
            "questions_answered": scoring["questions_answered"],
            "questions_correct": scoring["questions_correct"],
            "overall_score_pct": scoring["overall_score_pct"],
            "subjects": scoring["subjects"],
            # Mastery-driven topic rankings are deferred (no upsert in Task 11).
            "strong_topics": [],
            "weak_topics": [],
        }
    )
    return base


def get_student_attempt(*, student, attempt_id) -> DiagnosticAttempt:
    try:
        return DiagnosticAttempt.objects.get(pk=attempt_id, student=student)
    except DiagnosticAttempt.DoesNotExist as exc:
        raise ServiceError(
            message="Diagnostic attempt not found.",
            errors={"id": ["Not found."]},
            status_code=404,
        ) from exc


@transaction.atomic
def start_diagnostic_attempt(
    *,
    student,
    required_count: int = DIAGNOSTIC_QUESTION_COUNT,
) -> tuple[DiagnosticAttempt, bool]:
    """Create a diagnostic attempt or return the existing in-progress one.

    Returns ``(attempt, created)``.
    """
    if required_count < 1:
        raise ServiceError(
            message="Invalid diagnostic size.",
            errors={"total_questions": ["Must be at least 1."]},
            status_code=400,
        )

    existing = (
        DiagnosticAttempt.objects.select_for_update()
        .filter(student=student, status=DIAGNOSTIC_STATUS_IN_PROGRESS)
        .first()
    )
    if existing is not None:
        return existing, False

    eligible_count = diagnostic_eligible_question_queryset().count()
    if eligible_count < required_count:
        raise ServiceError(
            message=(
                "Not enough eligible questions to start a diagnostic "
                f"(need {required_count}, found {eligible_count})."
            ),
            errors={
                "questions": [
                    f"At least {required_count} eligible published questions "
                    "are required."
                ]
            },
            status_code=400,
        )

    selected = _select_questions_for_diagnostic(required_count)
    if len(selected) < required_count:
        # Defensive: count raced or filter mismatch.
        raise ServiceError(
            message=(
                "Not enough eligible questions to start a diagnostic "
                f"(need {required_count}, found {len(selected)})."
            ),
            errors={
                "questions": [
                    f"At least {required_count} eligible published questions "
                    "are required."
                ]
            },
            status_code=400,
        )

    try:
        attempt = DiagnosticAttempt(
            student=student,
            status=DIAGNOSTIC_STATUS_IN_PROGRESS,
            total_questions=required_count,
        )
        attempt.save()
    except IntegrityError as exc:
        # Concurrent start lost the race — resume the winner's attempt.
        existing = DiagnosticAttempt.objects.filter(
            student=student, status=DIAGNOSTIC_STATUS_IN_PROGRESS
        ).first()
        if existing is not None:
            return existing, False
        raise ServiceError(
            message="Could not start diagnostic attempt.",
            errors={"status": ["Conflict creating in-progress attempt."]},
            status_code=409,
        ) from exc

    for position, question in enumerate(selected, start=1):
        DiagnosticQuestion(
            attempt=attempt,
            question=question,
            position=position,
        ).save()

    return attempt, True


def list_attempt_questions(*, attempt: DiagnosticAttempt) -> list[dict]:
    """Student-safe questions for an attempt in persisted position order."""
    rows = (
        DiagnosticQuestion.objects.filter(attempt=attempt)
        .select_related(
            "question",
            "question__topic",
            "question__topic__unit",
            "question__topic__unit__subject",
            "question__concept",
        )
        .prefetch_related(
            Prefetch(
                "question__options",
                queryset=QuestionOption.objects.order_by("sort_order", "id"),
            )
        )
        .order_by("position", "id")
    )
    items = []
    for row in rows:
        payload = serialize_question_student(row.question)
        payload["position"] = row.position
        items.append(payload)
    return items


def serialize_answer(answer: DiagnosticAnswer) -> dict:
    """Acknowledge an answer without leaking correctness or explanations."""
    dq = answer.diagnostic_question
    return {
        "attempt_id": str(dq.attempt_id),
        "question_id": str(dq.question_id),
        "position": dq.position,
        "selected_option_id": (
            str(answer.selected_option_id) if answer.selected_option_id else None
        ),
        "time_spent_seconds": answer.time_spent_seconds,
        "answered_at": answer.answered_at,
    }


@transaction.atomic
def submit_diagnostic_answer(
    *,
    student,
    attempt_id,
    question_id,
    selected_option_id,
    time_spent_seconds=None,
) -> tuple[DiagnosticAnswer, bool]:
    """Create or update the answer for an assigned diagnostic question.

    Returns ``(answer, created)``. Answer changes are allowed while the attempt
    is ``in_progress``. Does not complete or score the attempt.
    """
    try:
        attempt = (
            DiagnosticAttempt.objects.select_for_update()
            .get(pk=attempt_id, student=student)
        )
    except DiagnosticAttempt.DoesNotExist as exc:
        raise ServiceError(
            message="Diagnostic attempt not found.",
            errors={"attempt_id": ["Not found."]},
            status_code=404,
        ) from exc

    if attempt.status != DIAGNOSTIC_STATUS_IN_PROGRESS:
        raise ServiceError(
            message="Answers can only be submitted for in-progress attempts.",
            errors={"status": ["Attempt is not in progress."]},
            status_code=409,
        )

    try:
        diagnostic_question = (
            DiagnosticQuestion.objects.select_for_update()
            .select_related("question")
            .get(attempt=attempt, question_id=question_id)
        )
    except DiagnosticQuestion.DoesNotExist as exc:
        raise ServiceError(
            message="Question is not assigned to this diagnostic attempt.",
            errors={"question_id": ["Not assigned to this attempt."]},
            status_code=400,
        ) from exc

    try:
        option = QuestionOption.objects.get(pk=selected_option_id)
    except QuestionOption.DoesNotExist as exc:
        raise ServiceError(
            message="Selected option not found.",
            errors={"selected_option_id": ["Invalid option."]},
            status_code=400,
        ) from exc

    if option.question_id != diagnostic_question.question_id:
        raise ServiceError(
            message="Selected option does not belong to this question.",
            errors={
                "selected_option_id": [
                    "Option must belong to the assigned question."
                ]
            },
            status_code=400,
        )

    now = timezone.now()
    try:
        answer = DiagnosticAnswer.objects.select_for_update().get(
            diagnostic_question=diagnostic_question
        )
        created = False
    except DiagnosticAnswer.DoesNotExist:
        answer = DiagnosticAnswer(diagnostic_question=diagnostic_question)
        created = True

    answer.selected_option = option
    answer.answered_at = now
    if time_spent_seconds is not None:
        answer.time_spent_seconds = time_spent_seconds

    try:
        answer.save()
    except IntegrityError as exc:
        # Concurrent first-insert race: reload and update the winner's row.
        try:
            answer = DiagnosticAnswer.objects.select_for_update().get(
                diagnostic_question=diagnostic_question
            )
        except DiagnosticAnswer.DoesNotExist as missing:
            raise ServiceError(
                message="Could not save diagnostic answer.",
                errors={"question_id": ["Conflict saving answer."]},
                status_code=409,
            ) from missing
        answer.selected_option = option
        answer.answered_at = now
        if time_spent_seconds is not None:
            answer.time_spent_seconds = time_spent_seconds
        answer.save()
        created = False
        return answer, created

    return answer, created


@transaction.atomic
def complete_diagnostic_attempt(*, student, attempt_id) -> tuple[DiagnosticAttempt, dict, bool]:
    """Score and complete an in-progress attempt.

    Returns ``(attempt, scoring_dict, newly_completed)``.

    Repeated completion of an already-completed attempt returns the stored
    result without recalculating or mutating ``overall_score_pct``.
    """
    try:
        attempt = (
            DiagnosticAttempt.objects.select_for_update()
            .get(pk=attempt_id, student=student)
        )
    except DiagnosticAttempt.DoesNotExist as exc:
        raise ServiceError(
            message="Diagnostic attempt not found.",
            errors={"attempt_id": ["Not found."]},
            status_code=404,
        ) from exc

    if attempt.status == DIAGNOSTIC_STATUS_COMPLETED:
        scoring = _score_assigned_questions(attempt)
        scoring["overall_score_pct"] = attempt.overall_score_pct
        return attempt, scoring, False

    if attempt.status != DIAGNOSTIC_STATUS_IN_PROGRESS:
        raise ServiceError(
            message="Only in-progress attempts can be completed.",
            errors={"status": ["Attempt cannot be completed."]},
            status_code=409,
        )

    scoring = _score_assigned_questions(attempt)
    if scoring["total_questions"] < 1:
        raise ServiceError(
            message="Diagnostic attempt has no assigned questions.",
            errors={"questions": ["Cannot score an empty attempt."]},
            status_code=400,
        )

    attempt.status = DIAGNOSTIC_STATUS_COMPLETED
    attempt.completed_at = timezone.now()
    attempt.overall_score_pct = scoring["overall_score_pct"]
    attempt.save()
    return attempt, scoring, True
