"""Reusable streak and recent-activity services for the student dashboard.

Streak rule (V1)
----------------
- Qualifying day: calendar day (project ``TIME_ZONE``) with ≥1 qualifying event.
- If active today → count consecutive days ending today.
- Else if active yesterday → count consecutive days ending yesterday.
- Else → ``0``.
- Same-day events collapse to one day.

Recent activity
---------------
Newest-first feed of qualifying events, capped at ``RECENT_ACTIVITY_LIMIT``.
"""

from datetime import timedelta

from django.utils import timezone

from engagement.constants import (
    ACTIVITY_STATUS_COMPLETED,
    ACTIVITY_TYPE_PRACTICE,
    RECENT_ACTIVITY_LIMIT,
)
from engagement.models import LearningActivityEvent


def _project_today():
    """Return today's date in the configured Django timezone."""
    return timezone.localdate()


def _activity_date_for(occurred_at):
    """Map a timezone-aware instant to the project-local calendar day."""
    if timezone.is_naive(occurred_at):
        occurred_at = timezone.make_aware(occurred_at, timezone.get_current_timezone())
    return timezone.localtime(occurred_at).date()


def _practice_title(topic) -> str:
    if topic is None:
        return "Practice"
    subject = getattr(getattr(topic, "unit", None), "subject", None)
    if subject is None and getattr(topic, "unit_id", None):
        from curriculum.models import Topic

        topic = Topic.objects.select_related("unit__subject").get(pk=topic.pk)
        subject = topic.unit.subject
    if subject is not None:
        return f"{subject.name} Practice"
    return f"{topic.name} Practice"


def record_learning_activity(
    *,
    user,
    occurred_at=None,
    topic=None,
    activity_type=ACTIVITY_TYPE_PRACTICE,
    status=ACTIVITY_STATUS_COMPLETED,
    title=None,
):
    """Record a qualifying learning event (idempotent per user/topic/type/day).

    Returns the event row, or ``None`` when the write is intentionally skipped
    (non-qualifying callers should not invoke this for abandoned work).
    """
    when = occurred_at or timezone.now()
    if timezone.is_naive(when):
        when = timezone.make_aware(when, timezone.get_current_timezone())
    activity_date = _activity_date_for(when)
    resolved_title = title or _practice_title(topic)

    event, _created = LearningActivityEvent.objects.update_or_create(
        user=user,
        topic=topic,
        activity_type=activity_type,
        activity_date=activity_date,
        defaults={
            "title": resolved_title,
            "status": status,
            "occurred_at": when,
        },
    )
    return event


def compute_current_streak(user, *, today=None) -> int:
    """Return the current consecutive qualifying-day streak for ``user``."""
    today = today or _project_today()
    dates = set(
        LearningActivityEvent.objects.filter(user=user).values_list(
            "activity_date", flat=True
        )
    )
    if not dates:
        return 0

    if today in dates:
        cursor = today
    elif (today - timedelta(days=1)) in dates:
        cursor = today - timedelta(days=1)
    else:
        return 0

    streak = 0
    while cursor in dates:
        streak += 1
        cursor -= timedelta(days=1)
    return streak


def list_recent_activity(user, *, limit=RECENT_ACTIVITY_LIMIT):
    """Return normalized recent learning events, newest first."""
    rows = (
        LearningActivityEvent.objects.filter(user=user)
        .select_related("topic", "topic__unit", "topic__unit__subject")
        .order_by("-occurred_at", "-created_at")[:limit]
    )
    return [
        {
            "type": row.activity_type,
            "title": row.title,
            "status": row.status,
            "timestamp": row.occurred_at,
            "topic_id": row.topic_id,
            "activity_date": row.activity_date.isoformat(),
        }
        for row in rows
    ]


def compute_engagement_snapshot(user, *, today=None, limit=RECENT_ACTIVITY_LIMIT):
    """Aggregate streak + recent activity for the authenticated student."""
    recent = list_recent_activity(user, limit=limit)
    streak = compute_current_streak(user, today=today)
    return {
        "streak": streak,
        "recent_activity": recent,
        "available": True,
    }
