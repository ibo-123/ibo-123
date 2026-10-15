from datetime import datetime, timedelta
from datetime import timezone as dt_timezone

from django.test import TestCase, override_settings
from django.utils import timezone

from curriculum.models import Subject, Topic, Unit
from engagement.constants import ACTIVITY_TYPE_PRACTICE, RECENT_ACTIVITY_LIMIT
from engagement.models import LearningActivityEvent
from engagement.services import (
    compute_current_streak,
    compute_engagement_snapshot,
    list_recent_activity,
    record_learning_activity,
)
from mastery.services import upsert_topic_mastery
from users.models import User


@override_settings(TIME_ZONE="UTC", USE_TZ=True)
class EngagementStreakAndFeedTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            "0912346001",
            password="Str0ng-Entrance-2026",
            phone_verified_at=timezone.now(),
        )
        self.other = User.objects.create_user(
            "0912346002",
            password="Str0ng-Entrance-2026",
            phone_verified_at=timezone.now(),
        )
        self.math = Subject.objects.create(
            name="Mathematics", slug="mathematics", grade=12, stream=None, sort_order=1
        )
        unit = Unit.objects.create(subject=self.math, name="Algebra", slug="algebra")
        self.topic_a = Topic.objects.create(unit=unit, name="Quadratics", slug="quadratics")
        self.topic_b = Topic.objects.create(
            unit=unit, name="Trigonometry", slug="trigonometry"
        )

    def _at(self, days_ago=0, hour=12):
        now = timezone.now()
        day = (now - timedelta(days=days_ago)).date()
        return timezone.make_aware(
            datetime(day.year, day.month, day.day, hour, 0, 0),
            dt_timezone.utc,
        )

    def _event(self, user, topic, days_ago=0, hour=12, title=None):
        return record_learning_activity(
            user=user,
            topic=topic,
            occurred_at=self._at(days_ago=days_ago, hour=hour),
            title=title,
        )

    def test_consecutive_days_including_today(self):
        self._event(self.user, self.topic_a, days_ago=0)
        self._event(self.user, self.topic_b, days_ago=1)
        self._event(self.user, self.topic_a, days_ago=2)
        self.assertEqual(compute_current_streak(self.user), 3)

    def test_consecutive_days_ending_yesterday(self):
        self._event(self.user, self.topic_a, days_ago=1)
        self._event(self.user, self.topic_b, days_ago=2)
        self._event(self.user, self.topic_a, days_ago=3)
        self.assertEqual(compute_current_streak(self.user), 3)

    def test_gap_breaks_streak(self):
        self._event(self.user, self.topic_a, days_ago=0)
        self._event(self.user, self.topic_b, days_ago=2)
        self.assertEqual(compute_current_streak(self.user), 1)

    def test_only_older_than_yesterday_returns_zero(self):
        self._event(self.user, self.topic_a, days_ago=3)
        self._event(self.user, self.topic_b, days_ago=4)
        self.assertEqual(compute_current_streak(self.user), 0)

    def test_multiple_events_same_day_count_once(self):
        self._event(self.user, self.topic_a, days_ago=0, hour=9)
        self._event(self.user, self.topic_b, days_ago=0, hour=18)
        self.assertEqual(compute_current_streak(self.user), 1)
        self.assertEqual(
            LearningActivityEvent.objects.filter(user=self.user).count(), 2
        )

    def test_no_activity_returns_zero(self):
        self.assertEqual(compute_current_streak(self.user), 0)
        snap = compute_engagement_snapshot(self.user)
        self.assertEqual(snap["streak"], 0)
        self.assertEqual(snap["recent_activity"], [])
        self.assertTrue(snap["available"])

    def test_near_midnight_uses_project_timezone_calendar_day(self):
        # 23:30 UTC yesterday and 00:30 UTC today are different calendar days.
        self._event(self.user, self.topic_a, days_ago=1, hour=23)
        self._event(self.user, self.topic_b, days_ago=0, hour=0)
        self.assertEqual(compute_current_streak(self.user), 2)

    def test_zero_attempt_mastery_does_not_create_event(self):
        upsert_topic_mastery(
            user=self.user,
            topic=self.topic_a,
            mastery_score=0,
            questions_attempted=0,
            questions_correct=0,
        )
        self.assertEqual(LearningActivityEvent.objects.filter(user=self.user).count(), 0)
        self.assertEqual(compute_current_streak(self.user), 0)

    def test_upsert_with_attempts_records_qualifying_event(self):
        when = self._at(days_ago=0, hour=15)
        upsert_topic_mastery(
            user=self.user,
            topic=self.topic_a,
            mastery_score=40,
            questions_attempted=5,
            last_practiced_at=when,
        )
        events = list(LearningActivityEvent.objects.filter(user=self.user))
        self.assertEqual(len(events), 1)
        self.assertEqual(events[0].activity_type, ACTIVITY_TYPE_PRACTICE)
        self.assertEqual(events[0].status, "completed")
        self.assertEqual(events[0].title, "Mathematics Practice")
        self.assertEqual(compute_current_streak(self.user), 1)

    def test_same_topic_same_day_upsert_is_idempotent(self):
        when = self._at(days_ago=0, hour=10)
        upsert_topic_mastery(
            user=self.user,
            topic=self.topic_a,
            mastery_score=40,
            questions_attempted=5,
            last_practiced_at=when,
        )
        upsert_topic_mastery(
            user=self.user,
            topic=self.topic_a,
            mastery_score=55,
            questions_attempted=8,
            last_practiced_at=when + timedelta(hours=2),
        )
        self.assertEqual(LearningActivityEvent.objects.filter(user=self.user).count(), 1)
        feed = list_recent_activity(self.user)
        self.assertEqual(len(feed), 1)

    def test_recent_activity_newest_first_and_limit(self):
        for day in range(12):
            topic = self.topic_a if day % 2 == 0 else self.topic_b
            self._event(self.user, topic, days_ago=day)
        feed = list_recent_activity(self.user)
        self.assertEqual(len(feed), RECENT_ACTIVITY_LIMIT)
        timestamps = [item["timestamp"] for item in feed]
        self.assertEqual(timestamps, sorted(timestamps, reverse=True))
        self.assertEqual(feed[0]["type"], ACTIVITY_TYPE_PRACTICE)
        self.assertEqual(feed[0]["status"], "completed")
        self.assertIn("timestamp", feed[0])

    def test_other_student_events_excluded(self):
        self._event(self.other, self.topic_a, days_ago=0)
        self._event(self.other, self.topic_b, days_ago=1)
        self._event(self.user, self.topic_a, days_ago=0)
        self.assertEqual(compute_current_streak(self.user), 1)
        feed = list_recent_activity(self.user)
        self.assertEqual(len(feed), 1)
        self.assertEqual(feed[0]["title"], "Mathematics Practice")
