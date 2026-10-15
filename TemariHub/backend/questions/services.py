"""Administrative write services for the question bank.

Nested creates/updates run inside a transaction. Publication and curriculum
rules are enforced by ``Question.save()`` / ``QuestionOption`` validation —
never via ``QuerySet.update()``.
"""

from django.core.exceptions import ValidationError
from django.db import transaction

from authentication.exceptions import ServiceError
from curriculum.models import Concept, Topic
from questions.constants import (
    QUESTION_STATUS_DRAFT,
    QUESTION_STATUS_PUBLISHED,
    QUESTION_TYPE_MCQ_SINGLE,
)
from questions.models import Question, QuestionOption


def _validation_error_to_service(exc: ValidationError) -> ServiceError:
    if hasattr(exc, "message_dict"):
        return ServiceError(
            message="Request failed.",
            errors=exc.message_dict,
            status_code=400,
        )
    return ServiceError(message=str(exc), errors={}, status_code=400)


def _get_topic(topic_id) -> Topic:
    try:
        return Topic.objects.select_related("unit", "unit__subject").get(pk=topic_id)
    except Topic.DoesNotExist as exc:
        raise ServiceError(
            message="Topic not found.",
            errors={"topic_id": ["Invalid topic."]},
            status_code=400,
        ) from exc


def _get_concept(concept_id) -> Concept:
    try:
        return Concept.objects.select_related("topic").get(pk=concept_id)
    except Concept.DoesNotExist as exc:
        raise ServiceError(
            message="Concept not found.",
            errors={"concept_id": ["Invalid concept."]},
            status_code=400,
        ) from exc


def serialize_question_admin(question: Question) -> dict:
    """Admin read payload including privileged answer fields."""
    correct_id = question.correct_option_id
    options = []
    for option in question.options_in_order():
        options.append(
            {
                "id": str(option.id),
                "text": option.text,
                "sort_order": option.sort_order,
                # Derived server-side for staff UX — never accepted on write.
                "is_correct": bool(correct_id and option.id == correct_id),
            }
        )
    return {
        "id": str(question.id),
        "prompt": question.prompt,
        "question_type": question.question_type,
        "status": question.status,
        "topic_id": str(question.topic_id),
        "concept_id": str(question.concept_id),
        "subject_id": str(question.topic.unit.subject_id),
        "unit_id": str(question.topic.unit_id),
        "difficulty": question.difficulty,
        "estimated_time_seconds": question.estimated_time_seconds,
        "source": question.source,
        "exam_year": question.exam_year,
        "explanation": question.explanation,
        "correct_option_id": str(correct_id) if correct_id else None,
        "options": options,
        "created_at": question.created_at,
        "updated_at": question.updated_at,
    }


def serialize_question_student(question: Question) -> dict:
    """Student-safe read payload — never includes answers or explanations."""
    topic = question.topic
    unit = topic.unit
    subject = unit.subject
    concept = question.concept
    options = [
        {
            "id": str(option.id),
            "text": option.text,
            "sort_order": option.sort_order,
        }
        for option in question.options_in_order()
    ]
    return {
        "id": str(question.id),
        "prompt": question.prompt,
        "question_type": question.question_type,
        "difficulty": question.difficulty,
        "estimated_time_seconds": question.estimated_time_seconds,
        "subject": {
            "id": str(subject.id),
            "name": subject.name,
            "slug": subject.slug,
        },
        "unit": {
            "id": str(unit.id),
            "name": unit.name,
            "slug": unit.slug,
        },
        "topic": {
            "id": str(topic.id),
            "name": topic.name,
            "slug": topic.slug,
        },
        "concept": {
            "id": str(concept.id),
            "name": concept.name,
            "slug": concept.slug,
        },
        "options": options,
    }


def _apply_option_payload(question: Question, options_data: list) -> list[QuestionOption]:
    """Replace/update options for ``question``.

    Semantics:
    - Entries with ``id`` update that option (must belong to this question).
    - Entries without ``id`` create new options.
    - Existing options not listed are deleted (blocked if question is published).
    """
    keep_ids = set()
    created_or_updated = []

    for entry in options_data:
        option_id = entry.get("id")
        text = entry["text"]
        sort_order = entry.get("sort_order", 0)
        if option_id:
            try:
                option = question.options.get(pk=option_id)
            except QuestionOption.DoesNotExist as exc:
                raise ServiceError(
                    message="Option not found on this question.",
                    errors={"options": [f"Unknown option id: {option_id}"]},
                    status_code=400,
                ) from exc
            option.text = text
            option.sort_order = sort_order
            try:
                option.save()
            except ValidationError as exc:
                raise _validation_error_to_service(exc) from exc
            keep_ids.add(option.id)
            created_or_updated.append(option)
        else:
            try:
                option = QuestionOption(
                    question=question,
                    text=text,
                    sort_order=sort_order,
                )
                option.save()
            except ValidationError as exc:
                raise _validation_error_to_service(exc) from exc
            keep_ids.add(option.id)
            created_or_updated.append(option)

    for obsolete in list(question.options.exclude(id__in=keep_ids)):
        try:
            obsolete.delete()
        except ValidationError as exc:
            raise _validation_error_to_service(exc) from exc

    return created_or_updated


def _resolve_correct_option(
    question: Question,
    *,
    correct_option_id=None,
    correct_option_index=None,
    options_list=None,
):
    if correct_option_id is not None and correct_option_index is not None:
        raise ServiceError(
            message="Provide only one of correct_option_id or correct_option_index.",
            errors={
                "correct_option_id": ["Mutually exclusive with correct_option_index."],
                "correct_option_index": ["Mutually exclusive with correct_option_id."],
            },
            status_code=400,
        )

    if correct_option_index is not None:
        if options_list is None:
            options_list = list(question.options_in_order())
        if correct_option_index < 0 or correct_option_index >= len(options_list):
            raise ServiceError(
                message="correct_option_index is out of range.",
                errors={"correct_option_index": ["Index does not match options."]},
                status_code=400,
            )
        return options_list[correct_option_index]

    if correct_option_id is not None:
        try:
            return question.options.get(pk=correct_option_id)
        except QuestionOption.DoesNotExist as exc:
            raise ServiceError(
                message="Correct option must belong to this question.",
                errors={"correct_option_id": ["Invalid option for this question."]},
                status_code=400,
            ) from exc

    return None


@transaction.atomic
def create_question(*, data: dict, created_by=None, question_id=None) -> Question:
    """Create a question, optionally with nested options, in one transaction.

    ``question_id`` may be supplied by the seed command for deterministic UUIDs.
    """
    topic = _get_topic(data["topic_id"])
    concept = _get_concept(data["concept_id"])
    intended_status = data.get("status", QUESTION_STATUS_DRAFT)
    options_data = data.get("options")
    correct_option_id = data.get("correct_option_id")
    correct_option_index = data.get("correct_option_index")

    question_kwargs = {
        "prompt": data["prompt"],
        "question_type": data.get("question_type", QUESTION_TYPE_MCQ_SINGLE),
        "status": QUESTION_STATUS_DRAFT,
        "topic": topic,
        "concept": concept,
        "difficulty": data["difficulty"],
        "estimated_time_seconds": data.get("estimated_time_seconds"),
        "source": data.get("source", ""),
        "exam_year": data.get("exam_year"),
        "explanation": data.get("explanation", ""),
        "created_by": created_by,
    }
    if question_id is not None:
        question_kwargs["id"] = question_id
    question = Question(**question_kwargs)
    try:
        question.save()
    except ValidationError as exc:
        raise _validation_error_to_service(exc) from exc

    options_list = None
    if options_data is not None:
        options_list = _apply_option_payload(question, options_data)

    if correct_option_id is not None or correct_option_index is not None:
        question.correct_option = _resolve_correct_option(
            question,
            correct_option_id=correct_option_id,
            correct_option_index=correct_option_index,
            options_list=options_list,
        )

    question.status = intended_status
    try:
        question.save()
    except ValidationError as exc:
        raise _validation_error_to_service(exc) from exc

    return (
        Question.objects.select_related(
            "topic", "topic__unit", "topic__unit__subject", "concept", "correct_option"
        )
        .prefetch_related("options")
        .get(pk=question.pk)
    )


@transaction.atomic
def update_question(*, question: Question, data: dict) -> Question:
    """Update question fields and optionally replace/merge options."""
    if "topic_id" in data:
        question.topic = _get_topic(data["topic_id"])
    if "concept_id" in data:
        question.concept = _get_concept(data["concept_id"])

    for field in (
        "prompt",
        "question_type",
        "difficulty",
        "estimated_time_seconds",
        "source",
        "exam_year",
        "explanation",
    ):
        if field in data:
            setattr(question, field, data[field])

    intended_status = data.get("status", question.status)
    # Persist metadata as draft first when publishing so option mutations can run.
    publishing = intended_status == QUESTION_STATUS_PUBLISHED
    question.status = (
        QUESTION_STATUS_DRAFT if publishing else intended_status
    )
    try:
        question.save()
    except ValidationError as exc:
        raise _validation_error_to_service(exc) from exc

    options_list = None
    if "options" in data:
        options_list = _apply_option_payload(question, data["options"])

    if "correct_option_id" in data or "correct_option_index" in data:
        if data.get("correct_option_id") is None and data.get(
            "correct_option_index"
        ) is None:
            question.correct_option = None
        else:
            question.correct_option = _resolve_correct_option(
                question,
                correct_option_id=data.get("correct_option_id"),
                correct_option_index=data.get("correct_option_index"),
                options_list=options_list,
            )

    question.status = intended_status
    try:
        question.save()
    except ValidationError as exc:
        raise _validation_error_to_service(exc) from exc

    return (
        Question.objects.select_related(
            "topic", "topic__unit", "topic__unit__subject", "concept", "correct_option"
        )
        .prefetch_related("options")
        .get(pk=question.pk)
    )


@transaction.atomic
def delete_question(*, question: Question) -> None:
    """Hard-delete an unreferenced question.

    Questions referenced by diagnostic history are protected (``PROTECT`` on
    ``DiagnosticQuestion.question``). Reject with HTTP 409 instead of cascading
    or orphaning assessment history. Prefer unpublishing unsuitable questions.
    """
    # Local import avoids an install-time cycle with diagnostics → questions.
    from diagnostics.models import DiagnosticQuestion

    if DiagnosticQuestion.objects.filter(question_id=question.pk).exists():
        raise ServiceError(
            message=(
                "Question is referenced by diagnostic history and cannot be "
                "deleted. Unpublish it instead."
            ),
            errors={
                "id": [
                    "Referenced by one or more diagnostic attempts."
                ]
            },
            status_code=409,
        )
    question.delete()


def admin_question_queryset():
    return (
        Question.objects.select_related(
            "topic",
            "topic__unit",
            "topic__unit__subject",
            "concept",
            "correct_option",
        )
        .prefetch_related("options")
        .order_by("-created_at", "id")
    )


def student_eligible_question_queryset():
    """Published questions on fully active curriculum nodes only.

    Used for both student list and detail so UUID probing cannot bypass
    draft / inactive-curriculum visibility.
    """
    return (
        Question.objects.filter(
            status=QUESTION_STATUS_PUBLISHED,
            topic__is_active=True,
            topic__unit__is_active=True,
            topic__unit__subject__is_active=True,
            concept__is_active=True,
        )
        .select_related(
            "topic",
            "topic__unit",
            "topic__unit__subject",
            "concept",
        )
        .prefetch_related("options")
        .order_by("-created_at", "id")
    )
