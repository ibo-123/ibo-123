"""Dashboard diagnostic / practice status while those domains are missing.

These tests lock the ``unavailable`` contract so the dashboard does not invent
assessment or practice records. When real domains ship, replace unavailable
assertions with lifecycle fixtures from those apps.
"""

from django.utils import timezone
from rest_framework_simplejwt.tokens import RefreshToken

from authentication.tests.base import AuthAPITestCase
from dashboard.learning_status_sources import (
    get_diagnostic_status,
    get_practice_status,
)
from users.models import User
from users.services import ensure_student_records


class DashboardDiagnosticPracticeStatusTests(AuthAPITestCase):
    URL = "/api/v1/dashboard/me/"

    def setUp(self):
        super().setUp()
        self.user = User.objects.create_user(
            "0912346101",
            password="Str0ng-Entrance-2026",
            phone_verified_at=timezone.now(),
            first_name="Selam",
            last_name="Bekele",
        )
        self.other = User.objects.create_user(
            "0912346102",
            password="Str0ng-Entrance-2026",
            phone_verified_at=timezone.now(),
            first_name="Abebe",
            last_name="Kebede",
        )
        ensure_student_records(self.user)
        ensure_student_records(self.other)
        self._auth(self.user)

    def _auth(self, user):
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {RefreshToken.for_user(user).access_token}"
        )

    def test_unauthenticated_rejected(self):
        self.client.credentials()
        response = self.client.get(self.URL)
        self.assertEqual(response.status_code, 401)

    def test_diagnostic_and_practice_are_unavailable_without_domain_models(self):
        response = self.client.get(self.URL)
        self.assertEqual(response.status_code, 200)
        data = response.data["data"]
        diagnostic = data["learning_status"]["diagnostic"]
        practice = data["learning_status"]["practice"]

        self.assertEqual(diagnostic["status"], "unavailable")
        self.assertFalse(diagnostic["completed"])
        self.assertIsNone(diagnostic["detail"])
        self.assertFalse(data["data_availability"]["diagnostic"])

        self.assertEqual(practice["status"], "unavailable")
        self.assertIsNone(practice["sessions_count"])
        self.assertIsNone(practice["detail"])
        self.assertFalse(data["data_availability"]["practice"])

    def test_helpers_return_unavailable_for_any_student(self):
        for student in (self.user, self.other):
            diagnostic = get_diagnostic_status(student)
            practice = get_practice_status(student)
            self.assertEqual(diagnostic["status"], "unavailable")
            self.assertEqual(practice["status"], "unavailable")

    def test_student_id_query_param_does_not_change_owner(self):
        response = self.client.get(self.URL, {"student_id": str(self.other.id)})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.data["data"]["overview"]["full_name"], "Selam Bekele"
        )
        self.assertEqual(
            response.data["data"]["learning_status"]["diagnostic"]["status"],
            "unavailable",
        )

    def test_phase4_fields_remain_present_alongside_unavailable_status(self):
        response = self.client.get(self.URL)
        data = response.data["data"]
        for key in (
            "overview",
            "topic_performance",
            "current_learning",
            "engagement",
            "learning_status",
            "data_availability",
            "profile_context",
        ):
            self.assertIn(key, data)
        for key in ("diagnostic", "practice", "learning_path"):
            self.assertIn(key, data["learning_status"])
        self.assertIn("overall_progress", data["overview"])
        self.assertIn("strong_topics", data["topic_performance"])
