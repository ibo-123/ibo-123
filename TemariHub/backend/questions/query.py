"""List filtering, search, and ordering for ``GET /api/v1/questions/``."""

import uuid

from django.db.models import Q
from rest_framework.exceptions import ValidationError

from curriculum.models import Concept, Topic, Unit
from questions.constants import (
    DIFFICULTY_MAX,
    DIFFICULTY_MIN,
    QUESTION_STATUS_CHOICES,
    QUESTION_TYPE_CHOICES,
)

SEARCH_MAX_LENGTH = 200

ORDERING_ALLOWLIST = {
    "difficulty",
    "-difficulty",
    "exam_year",
    "-exam_year",
    "created_at",
    "-created_at",
}

_VALID_TYPES = {value for value, _label in QUESTION_TYPE_CHOICES}
_VALID_STATUSES = {value for value, _label in QUESTION_STATUS_CHOICES}


def _parse_uuid(raw, field):
    try:
        return uuid.UUID(str(raw))
    except (TypeError, ValueError) as exc:
        raise ValidationError({field: ["Must be a valid UUID."]}) from exc


def _parse_int(raw, field):
    try:
        return int(raw)
    except (TypeError, ValueError) as exc:
        raise ValidationError({field: ["Must be an integer."]}) from exc


def validate_and_apply_question_filters(queryset, query_params, *, is_staff: bool):
    """Validate query params and return a filtered, ordered queryset."""
    errors = {}

    subject_id = query_params.get("subject_id")
    unit_id = query_params.get("unit_id")
    topic_id = query_params.get("topic_id")
    concept_id = query_params.get("concept_id")
    difficulty = query_params.get("difficulty")
    question_type = query_params.get("question_type")
    exam_year = query_params.get("exam_year")
    source = query_params.get("source")
    status = query_params.get("status")
    search = query_params.get("search")
    ordering = query_params.get("ordering", "-created_at")

    parsed = {}

    if subject_id is not None:
        parsed["subject_id"] = _parse_uuid(subject_id, "subject_id")
    if unit_id is not None:
        parsed["unit_id"] = _parse_uuid(unit_id, "unit_id")
    if topic_id is not None:
        parsed["topic_id"] = _parse_uuid(topic_id, "topic_id")
    if concept_id is not None:
        parsed["concept_id"] = _parse_uuid(concept_id, "concept_id")

    if difficulty is not None:
        value = _parse_int(difficulty, "difficulty")
        if value < DIFFICULTY_MIN or value > DIFFICULTY_MAX:
            errors["difficulty"] = [
                f"Must be an integer between {DIFFICULTY_MIN} and {DIFFICULTY_MAX}."
            ]
        else:
            parsed["difficulty"] = value

    if question_type is not None:
        if question_type not in _VALID_TYPES:
            errors["question_type"] = ["Unsupported question type."]
        else:
            parsed["question_type"] = question_type

    if exam_year is not None:
        parsed["exam_year"] = _parse_int(exam_year, "exam_year")

    if source is not None:
        parsed["source"] = str(source).strip()

    if status is not None:
        if not is_staff:
            errors["status"] = ["Status filtering is available to staff only."]
        elif status not in _VALID_STATUSES:
            errors["status"] = ["Unsupported status."]
        else:
            parsed["status"] = status

    if search is not None:
        term = str(search).strip()
        if len(term) > SEARCH_MAX_LENGTH:
            errors["search"] = [
                f"Search term must be at most {SEARCH_MAX_LENGTH} characters."
            ]
        elif term:
            parsed["search"] = term

    if ordering not in ORDERING_ALLOWLIST:
        errors["ordering"] = [
            "Unsupported ordering. Allowed: "
            + ", ".join(sorted(ORDERING_ALLOWLIST))
            + "."
        ]
    else:
        parsed["ordering"] = ordering

    # Curriculum consistency (reject contradictory combinations).
    unit = topic = concept = None
    try:
        if "unit_id" in parsed:
            unit = Unit.objects.select_related("subject").get(pk=parsed["unit_id"])
            if "subject_id" in parsed and unit.subject_id != parsed["subject_id"]:
                errors["unit_id"] = ["Unit does not belong to the given subject."]
        if "topic_id" in parsed:
            topic = Topic.objects.select_related("unit", "unit__subject").get(
                pk=parsed["topic_id"]
            )
            if "unit_id" in parsed and topic.unit_id != parsed["unit_id"]:
                errors["topic_id"] = ["Topic does not belong to the given unit."]
            if "subject_id" in parsed and topic.unit.subject_id != parsed["subject_id"]:
                errors["topic_id"] = ["Topic does not belong to the given subject."]
        if "concept_id" in parsed:
            concept = Concept.objects.select_related(
                "topic", "topic__unit", "topic__unit__subject"
            ).get(pk=parsed["concept_id"])
            if "topic_id" in parsed and concept.topic_id != parsed["topic_id"]:
                errors["concept_id"] = ["Concept does not belong to the given topic."]
            if "unit_id" in parsed and concept.topic.unit_id != parsed["unit_id"]:
                errors["concept_id"] = ["Concept does not belong to the given unit."]
            if (
                "subject_id" in parsed
                and concept.topic.unit.subject_id != parsed["subject_id"]
            ):
                errors["concept_id"] = [
                    "Concept does not belong to the given subject."
                ]
    except Unit.DoesNotExist:
        errors["unit_id"] = ["Unit not found."]
    except Topic.DoesNotExist:
        errors["topic_id"] = ["Topic not found."]
    except Concept.DoesNotExist:
        errors["concept_id"] = ["Concept not found."]

    if errors:
        raise ValidationError(errors)

    if "subject_id" in parsed:
        queryset = queryset.filter(topic__unit__subject_id=parsed["subject_id"])
    if "unit_id" in parsed:
        queryset = queryset.filter(topic__unit_id=parsed["unit_id"])
    if "topic_id" in parsed:
        queryset = queryset.filter(topic_id=parsed["topic_id"])
    if "concept_id" in parsed:
        queryset = queryset.filter(concept_id=parsed["concept_id"])
    if "difficulty" in parsed:
        queryset = queryset.filter(difficulty=parsed["difficulty"])
    if "question_type" in parsed:
        queryset = queryset.filter(question_type=parsed["question_type"])
    if "exam_year" in parsed:
        queryset = queryset.filter(exam_year=parsed["exam_year"])
    if "source" in parsed:
        queryset = queryset.filter(source__iexact=parsed["source"])
    if "status" in parsed:
        queryset = queryset.filter(status=parsed["status"])
    if "search" in parsed:
        term = parsed["search"]
        queryset = queryset.filter(
            Q(prompt__icontains=term) | Q(source__icontains=term)
        ).distinct()

    # Stable secondary key prevents pagination jitter on ties.
    primary = parsed.get("ordering", "-created_at")
    queryset = queryset.order_by(primary, "id")
    return queryset
