"""Reusable V1 learning-path recommendation and progress services.

Policy (approved V1):
- No prerequisite-based locking or ``review_prerequisite`` recommendations.
- Incomplete topics ranked by ascending mastery (null = lowest), then name/id.
- Prefer a stored ``in_progress`` item when it remains incomplete.
- Current topic = that in_progress item, else highest-priority incomplete topic.
- Next activity: ``study_topic`` if never practiced; ``practice`` until Strong (80).
- Progress = completed topics / total path topics (complete = mastery ≥ 80).
- Empty path → unavailable / progress null (dashboard empty contract preserved).

Dashboard and future ``/learning-path`` endpoints must call these helpers rather
than re-implementing sequencing rules.
"""

from decimal import ROUND_HALF_UP, Decimal

from django.db import transaction
from django.utils import timezone

from curriculum.models import Topic
from learning_path.constants import (
    ACTIVITY_PRACTICE,
    ACTIVITY_STUDY_TOPIC,
    PATH_STATUS_COMPLETED,
    PATH_STATUS_IN_PROGRESS,
    PATH_STATUS_NOT_STARTED,
    PATH_STATUS_UNAVAILABLE,
    PROGRESS_DECIMAL_PLACES,
    TOPIC_COMPLETE_MASTERY_MIN,
)
from learning_path.models import LearningPath, LearningPathItem, PathItemStatus
from mastery.models import TopicMastery


def _quantize(score: Decimal) -> float:
    quant = Decimal("1").scaleb(-PROGRESS_DECIMAL_PLACES)
    return float(score.quantize(quant, rounding=ROUND_HALF_UP))


def _mastery_float(value) -> float | None:
    if value is None:
        return None
    return _quantize(Decimal(str(value)))


def _is_complete(mastery_score) -> bool:
    if mastery_score is None:
        return False
    return Decimal(str(mastery_score)) >= TOPIC_COMPLETE_MASTERY_MIN


def _has_been_practiced(mastery_row: TopicMastery | None) -> bool:
    return bool(mastery_row and mastery_row.questions_attempted > 0)


def ensure_learning_path(user) -> LearningPath:
    """Return the student's learning path row, creating it when absent."""
    path, _created = LearningPath.objects.get_or_create(
        user=user,
        defaults={"title": "My learning path", "generated_at": timezone.now()},
    )
    return path


def _selected_topics_qs(user):
    """Active curriculum topics under the student's selected subjects."""
    subject_ids = list(
        user.selected_subjects.values_list("subject_id", flat=True)
    )
    if not subject_ids:
        return Topic.objects.none()
    return (
        Topic.objects.filter(
            is_active=True,
            unit__is_active=True,
            unit__subject__is_active=True,
            unit__subject_id__in=subject_ids,
        )
        .select_related("unit", "unit__subject")
        .order_by(
            "unit__subject__sort_order",
            "unit__subject__name",
            "unit__sort_order",
            "unit__name",
            "sort_order",
            "name",
            "id",
        )
    )


@transaction.atomic
def sync_learning_path_items(user, path=None) -> LearningPath:
    """Align path items with selected-subject topics and refresh statuses.

    Does not fabricate topics outside the student's selected subjects.
    Preserves a single valid ``in_progress`` item when that topic is still
    incomplete; otherwise clears in_progress and leaves items as recommended
    or completed from mastery.
    """
    path = path or ensure_learning_path(user)
    topics = list(_selected_topics_qs(user))
    topic_by_id = {topic.id: topic for topic in topics}
    desired_ids = set(topic_by_id)

    existing = {
        item.topic_id: item
        for item in path.items.select_related(
            "topic", "topic__unit", "topic__unit__subject"
        )
    }

    # Drop items for topics no longer on the selected-subject curriculum.
    stale_ids = set(existing) - desired_ids
    if stale_ids:
        path.items.filter(topic_id__in=stale_ids).delete()
        for topic_id in stale_ids:
            existing.pop(topic_id, None)

    mastery_by_topic = {
        row.topic_id: row
        for row in TopicMastery.objects.filter(user=user, topic_id__in=desired_ids)
    }

    previous_in_progress_id = next(
        (
            item.topic_id
            for item in existing.values()
            if item.status == PathItemStatus.IN_PROGRESS
        ),
        None,
    )

    for index, topic in enumerate(topics):
        mastery_row = mastery_by_topic.get(topic.id)
        mastery_score = mastery_row.mastery_score if mastery_row else None
        complete = _is_complete(mastery_score)
        item = existing.get(topic.id)
        if item is None:
            item = LearningPathItem(learning_path=path, topic=topic)
            existing[topic.id] = item
        item.sort_order = index
        if complete:
            item.status = PathItemStatus.COMPLETED
            item.reason = "mastery_strong"
            item.priority = None
        else:
            item.status = PathItemStatus.RECOMMENDED
            item.reason = "incomplete"
            item.priority = None
        item.save()

    # Re-load after writes for ranking.
    items = list(
        path.items.select_related("topic", "topic__unit", "topic__unit__subject").all()
    )
    incomplete = [
        item
        for item in items
        if item.status != PathItemStatus.COMPLETED
        and item.status != PathItemStatus.SKIPPED
    ]

    def rank_key(item):
        mastery_row = mastery_by_topic.get(item.topic_id)
        score = (
            float(mastery_row.mastery_score)
            if mastery_row is not None
            else float("-inf")
        )
        return (score, item.topic.name.lower(), str(item.topic_id))

    incomplete.sort(key=rank_key)

    # Restore in_progress when the previous topic is still incomplete and eligible.
    chosen_in_progress = None
    if previous_in_progress_id is not None:
        for item in incomplete:
            if item.topic_id == previous_in_progress_id:
                chosen_in_progress = item
                break

    for priority, item in enumerate(incomplete, start=1):
        item.priority = priority
        if chosen_in_progress is not None and item.id == chosen_in_progress.id:
            item.status = PathItemStatus.IN_PROGRESS
            item.reason = "in_progress"
        else:
            item.status = PathItemStatus.RECOMMENDED
            item.reason = "low_mastery" if priority == 1 else "queued"
        item.save(update_fields=["priority", "status", "reason", "updated_at"])

    path.generated_at = timezone.now()
    path.save(update_fields=["generated_at", "updated_at"])
    return path


def _topic_payload(item: LearningPathItem, mastery_row: TopicMastery | None) -> dict:
    topic = item.topic
    unit = topic.unit
    subject = unit.subject
    return {
        "id": topic.id,
        "name": topic.name,
        "subject_id": subject.id,
        "subject_name": subject.name,
        "unit_id": unit.id,
        "unit_name": unit.name,
        "mastery": _mastery_float(
            mastery_row.mastery_score if mastery_row is not None else None
        ),
        "path_item_id": item.id,
        "status": item.status,
    }


def _activity_for_topic(
    item: LearningPathItem,
    mastery_row: TopicMastery | None,
    path: LearningPath,
) -> dict | None:
    if item.status == PathItemStatus.COMPLETED or _is_complete(
        mastery_row.mastery_score if mastery_row else None
    ):
        return None

    topic = item.topic
    subject = topic.unit.subject
    if not _has_been_practiced(mastery_row):
        activity_type = ACTIVITY_STUDY_TOPIC
        reason = "never_practiced"
    else:
        activity_type = ACTIVITY_PRACTICE
        reason = "below_strong_mastery"

    return {
        "type": activity_type,
        "activity_type": activity_type,
        "topic_id": topic.id,
        "topic_name": topic.name,
        "subject_id": subject.id,
        "subject_name": subject.name,
        "unit_id": topic.unit_id,
        "unit_name": topic.unit.name,
        "learning_path_id": path.id,
        "path_item_id": item.id,
        "reason": reason,
        "priority": item.priority or 1,
    }


def _path_status(total: int, completed: int, has_in_progress: bool) -> str:
    if total == 0:
        return PATH_STATUS_UNAVAILABLE
    if completed >= total:
        return PATH_STATUS_COMPLETED
    if completed > 0 or has_in_progress:
        return PATH_STATUS_IN_PROGRESS
    return PATH_STATUS_NOT_STARTED


def compute_learning_path_snapshot(user, *, sync=True):
    """Aggregate current topic, next activity, and path progress for ``user``.

    Parameters
    ----------
    user:
        Authenticated user — never a client-supplied student id.
    sync:
        When True (default), refresh path items from selected subjects before
        reading. Pass False in tests that fixture items manually.
    """
    path = ensure_learning_path(user)
    if sync:
        sync_learning_path_items(user, path=path)

    items = list(
        path.items.select_related("topic", "topic__unit", "topic__unit__subject")
        .order_by("sort_order", "id")
        .all()
    )
    if not items:
        return {
            "available": False,
            "current_topic": None,
            "recommended_activity": None,
            "path_status": PATH_STATUS_UNAVAILABLE,
            "progress": None,
            "completed_topics": 0,
            "total_topics": 0,
            "detail": None,
        }

    topic_ids = [item.topic_id for item in items]
    mastery_by_topic = {
        row.topic_id: row
        for row in TopicMastery.objects.filter(user=user, topic_id__in=topic_ids)
    }

    completed_items = [
        item for item in items if item.status == PathItemStatus.COMPLETED
    ]
    incomplete_items = [
        item
        for item in items
        if item.status
        in (PathItemStatus.RECOMMENDED, PathItemStatus.IN_PROGRESS)
    ]

    def rank_key(item):
        mastery_row = mastery_by_topic.get(item.topic_id)
        score = (
            float(mastery_row.mastery_score)
            if mastery_row is not None
            else float("-inf")
        )
        return (score, item.topic.name.lower(), str(item.topic_id))

    incomplete_items.sort(key=rank_key)

    in_progress = next(
        (
            item
            for item in incomplete_items
            if item.status == PathItemStatus.IN_PROGRESS
        ),
        None,
    )
    current_item = in_progress or (incomplete_items[0] if incomplete_items else None)

    current_topic = None
    recommended_activity = None
    if current_item is not None:
        mastery_row = mastery_by_topic.get(current_item.topic_id)
        current_topic = _topic_payload(current_item, mastery_row)
        recommended_activity = _activity_for_topic(current_item, mastery_row, path)

    total = len(items)
    completed = len(completed_items)
    if total == 0:
        progress = None
    else:
        progress = _quantize(Decimal(completed) * Decimal("100") / Decimal(total))

    path_status = _path_status(
        total,
        completed,
        has_in_progress=in_progress is not None,
    )

    detail = {
        "id": path.id,
        "title": path.title or "My learning path",
        "completed_topics": completed,
        "total_topics": total,
        "status": path_status,
        "generated_at": path.generated_at,
    }

    return {
        "available": True,
        "current_topic": current_topic,
        "recommended_activity": recommended_activity,
        "path_status": path_status,
        "progress": progress,
        "completed_topics": completed,
        "total_topics": total,
        "detail": detail,
    }
