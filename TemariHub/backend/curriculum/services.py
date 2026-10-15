from django.db.models import Q

from curriculum.models import Subject


def selectable_subjects_queryset(grade=None, stream=None, *, active_only=True):
    """Subjects the curriculum exposes for browsing / onboarding selection.

    When ``grade`` is provided, only that grade is returned. When ``stream`` is
    also provided, stream-specific rows must match and stream-agnostic rows
    (``stream`` null) are included.
    """
    qs = Subject.objects.all()
    if active_only:
        qs = qs.filter(is_active=True)
    if grade is not None:
        qs = qs.filter(grade=grade)
    if stream is not None:
        qs = qs.filter(Q(stream__isnull=True) | Q(stream=stream))
    return qs.order_by("sort_order", "name")


def resolve_selectable_subjects(subject_ids, grade, stream):
    """Validate and return Subject rows for the given IDs and academic track.

    Raises ``ValueError`` with a field-errors dict when validation fails.
    """
    if grade is None or stream is None:
        raise ValueError(
            {
                "subject_ids": (
                    "Set grade and stream before selecting subjects."
                )
            }
        )

    # Preserve caller order while deduplicating.
    seen = set()
    ordered_ids = []
    for raw in subject_ids:
        key = str(raw)
        if key in seen:
            continue
        seen.add(key)
        ordered_ids.append(raw)

    if not ordered_ids:
        return []

    found = {
        str(subject.id): subject
        for subject in selectable_subjects_queryset(grade, stream).filter(
            id__in=ordered_ids
        )
    }
    missing = [str(subject_id) for subject_id in ordered_ids if str(subject_id) not in found]
    if missing:
        raise ValueError(
            {
                "subject_ids": (
                    "One or more subjects are invalid or not available for "
                    f"grade {grade} / {stream}: {', '.join(missing)}."
                )
            }
        )
    return [found[str(subject_id)] for subject_id in ordered_ids]
