from datetime import datetime, timedelta
from datetime import timezone as dt_timezone

from django.utils import timezone
from rest_framework_simplejwt.tokens import RefreshToken

from authentication.tests.base import AuthAPITestCase
from curriculum.models import Subject, Topic, Unit
from engagement.services import record_learning_activity
from mastery.services import upsert_topic_mastery
from users.models import User
from users.services import ensure_student_records


class DashboardEngagementAPITests(AuthAPITestCase):
    URL = "/api/v1/dashboard/me/"

    def setUp(self):
        super().setUp()
        self.user = User.objects.create_user(
            "0912346011",
            password="Str0ng-Entrance-2026",
            phone_verified_at=timezone.now(),
            first_name="Selam",
            last_name="Bekele",
        )
        self.other = User.objects.create_user(
            "0912346012",
            password="Str0ng-Entrance-2026",
            phone_verified_at=timezone.now(),
            first_name="Abebe",
            last_name="Kebede",
        )
        self.math = Subject.objects.create(
            name="Mathematics", slug="mathematics", grade=12, stream=None, sort_order=1
        )
        unit = Unit.objects.create(subject=self.math, name="Algebra", slug="algebra")
        self.topic_a = Topic.objects.create(unit=unit, name="Quadratics", slug="quadratics")
        self.topic_b = Topic.objects.create(
            unit=unit, name="Trigonometry", slug="trigonometry"
        )
        ensure_student_records(self.user)
        ensure_student_records(self.other)
        self._auth(self.user)

    def _auth(self, user):
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {RefreshToken.for_user(user).access_token}"
        )

    def _at(self, days_ago=0, hour=12):
        now = timezone.now()
        day = (now - timedelta(days=days_ago)).date()
        return timezone.make_aware(
            datetime(day.year, day.month, day.day, hour, 0, 0),
            dt_timezone.utc,
        )

    def test_unauthenticated_rejected(self):
        self.client.credentials()
        response = self.client.get(self.URL)
        self.assertEqual(response.status_code, 401)

    def test_no_history_returns_zero_streak_and_empty_feed(self):
        response = self.client.get(self.URL)
        self.assertEqual(response.status_code, 200)
        engagement = response.data["data"]["engagement"]
        self.assertEqual(engagement["streak"], 0)
        self.assertEqual(engagement["recent_activity"], [])
        self.assertTrue(engagement["available"])
        self.assertTrue(response.data["data"]["data_availability"]["streak"])
        self.assertTrue(response.data["data"]["data_availability"]["recent_activity"])

    def test_dashboard_surfaces_streak_and_recent_activity(self):
        record_learning_activity(
            user=self.user,
            topic=self.topic_a,
            occurred_at=self._at(days_ago=0, hour=15),
        )
        record_learning_activity(
            user=self.user,
            topic=self.topic_b,
            occurred_at=self._at(days_ago=1, hour=11),
        )
        response = self.client.get(self.URL)
        engagement = response.data["data"]["engagement"]
        self.assertEqual(engagement["streak"], 2)
        self.assertEqual(len(engagement["recent_activity"]), 2)
        first = engagement["recent_activity"][0]
        self.assertEqual(first["type"], "practice")
        self.assertEqual(first["status"], "completed")
        self.assertEqual(first["title"], "Mathematics Practice")
        self.assertIn("timestamp", first)

    def test_other_student_engagement_does_not_leak(self):
        record_learning_activity(
            user=self.other,
            topic=self.topic_a,
            occurred_at=self._at(days_ago=0),
        )
        record_learning_activity(
            user=self.other,
            topic=self.topic_b,
            occurred_at=self._at(days_ago=1),
        )
        upsert_topic_mastery(
            user=self.user,
            topic=self.topic_a,
            mastery_score=50,
            questions_attempted=4,
            last_practiced_at=self._at(days_ago=0),
        )
        response = self.client.get(self.URL)
        engagement = response.data["data"]["engagement"]
        self.assertEqual(engagement["streak"], 1)
        self.assertEqual(len(engagement["recent_activity"]), 1)

        self._auth(self.other)
        other = self.client.get(self.URL).data["data"]["engagement"]
        self.assertEqual(other["streak"], 2)

    def test_student_id_query_param_ignored(self):
        record_learning_activity(
            user=self.user,
            topic=self.topic_a,
            occurred_at=self._at(days_ago=0),
        )
        record_learning_activity(
            user=self.other,
            topic=self.topic_b,
            occurred_at=self._at(days_ago=0),
        )
        record_learning_activity(
            user=self.other,
            topic=self.topic_a,
            occurred_at=self._at(days_ago=1),
        )
        response = self.client.get(self.URL, {"student_id": str(self.other.id)})
        self.assertEqual(response.data["data"]["overview"]["full_name"], "Selam Bekele")
        self.assertEqual(response.data["data"]["engagement"]["streak"], 1)

    def test_existing_dashboard_fields_remain_compatible(self):
        response = self.client.get(self.URL)
        data = response.data["data"]
        for key in (
            "overview",
            "topic_performance",
            "current_learning",
            "engagement",
            "learning_status",
            "data_availability",
        ):
            self.assertIn(key, data)
        self.assertIn("overall_progress", data["overview"])
        self.assertIn("learning_path", data["learning_status"])
        self.assertEqual(data["learning_status"]["diagnostic"]["status"], "unavailable")
        self.assertEqual(data["learning_status"]["practice"]["status"], "unavailable")
