from django.utils import timezone
from rest_framework_simplejwt.tokens import RefreshToken

from authentication.tests.base import AuthAPITestCase
from curriculum.models import Subject
from users.models import (
    LearningGoal,
    OnboardingStatus,
    StudentLearningGoal,
    StudentOnboarding,
    StudentSelectedSubject,
    User,
)
from users.services import complete_student_onboarding, ensure_student_records


class StudentDashboardAPITests(AuthAPITestCase):
    URL = "/api/v1/dashboard/me/"

    def setUp(self):
        super().setUp()
        self.user_a = User.objects.create_user(
            "0912345601",
            password="Str0ng-Entrance-2026",
            phone_verified_at=timezone.now(),
            first_name="Selam",
            last_name="Bekele",
            grade=12,
            stream="natural_science",
        )
        self.user_b = User.objects.create_user(
            "0912345602",
            password="Str0ng-Entrance-2026",
            phone_verified_at=timezone.now(),
            first_name="Abebe",
            last_name="Kebede",
            grade=12,
            stream="social_science",
        )
        self.math = Subject.objects.create(
            name="Mathematics",
            slug="mathematics",
            grade=12,
            stream=None,
            sort_order=1,
        )
        self.physics = Subject.objects.create(
            name="Physics",
            slug="physics",
            grade=12,
            stream="natural_science",
            sort_order=2,
        )
        self.history = Subject.objects.create(
            name="History",
            slug="history",
            grade=12,
            stream="social_science",
            sort_order=3,
        )
        StudentSelectedSubject.objects.create(user=self.user_a, subject=self.math)
        StudentSelectedSubject.objects.create(user=self.user_a, subject=self.physics)
        StudentSelectedSubject.objects.create(user=self.user_b, subject=self.history)
        StudentLearningGoal.objects.create(
            user=self.user_a, goal=LearningGoal.ENTRANCE_EXAM_PREP
        )
        ensure_student_records(self.user_a)
        ensure_student_records(self.user_b)
        self._auth(self.user_a)

    def _auth(self, user):
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {RefreshToken.for_user(user).access_token}"
        )

    def test_unauthenticated_request_is_rejected(self):
        self.client.credentials()
        response = self.client.get(self.URL)
        self.assertEqual(response.status_code, 401)
        self.assertFalse(response.data.get("success", True))

    def test_authenticated_dashboard_uses_envelope_and_five_feature_areas(self):
        response = self.client.get(self.URL)
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["success"])
        self.assertEqual(response.data["message"], "Dashboard retrieved successfully")
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

        overview = data["overview"]
        self.assertEqual(overview["full_name"], "Selam Bekele")
        self.assertEqual(overview["grade"], 12)
        self.assertEqual(overview["stream"], "natural_science")
        self.assertEqual(
            overview["learning_goals"], [LearningGoal.ENTRANCE_EXAM_PREP]
        )
        subject_ids = {item["id"] for item in overview["selected_subjects"]}
        self.assertEqual(subject_ids, {str(self.math.id), str(self.physics.id)})
        self.assertIsNone(overview["overall_progress"])
        self.assertIsNone(overview["strongest_subject"])
        self.assertIsNone(overview["weakest_subject"])

        self.assertEqual(data["topic_performance"]["strong_topics"], [])
        self.assertEqual(data["topic_performance"]["weak_topics"], [])
        self.assertFalse(data["topic_performance"]["available"])
        self.assertIsNone(data["current_learning"]["current_topic"])
        self.assertIsNone(data["current_learning"]["recommended_activity"])
        self.assertEqual(data["engagement"]["streak"], 0)
        self.assertEqual(data["engagement"]["recent_activity"], [])
        self.assertTrue(data["engagement"]["available"])
        self.assertEqual(data["learning_status"]["diagnostic"]["status"], "unavailable")
        self.assertEqual(data["learning_status"]["practice"]["status"], "unavailable")
        self.assertEqual(
            data["learning_status"]["learning_path"]["status"], "unavailable"
        )
        self.assertFalse(data["data_availability"]["mastery"])
        self.assertTrue(data["data_availability"]["selected_subjects"])
        self.assertTrue(data["data_availability"]["streak"])
        self.assertTrue(data["data_availability"]["recent_activity"])

    def test_data_isolation_between_students(self):
        response_a = self.client.get(self.URL)
        ids_a = {
            item["id"] for item in response_a.data["data"]["overview"]["selected_subjects"]
        }
        self.assertIn(str(self.math.id), ids_a)
        self.assertNotIn(str(self.history.id), ids_a)

        self._auth(self.user_b)
        response_b = self.client.get(self.URL)
        self.assertEqual(response_b.status_code, 200)
        overview_b = response_b.data["data"]["overview"]
        self.assertEqual(overview_b["full_name"], "Abebe Kebede")
        ids_b = {item["id"] for item in overview_b["selected_subjects"]}
        self.assertEqual(ids_b, {str(self.history.id)})
        self.assertNotIn(str(self.physics.id), ids_b)
        self.assertEqual(overview_b["learning_goals"], [])

    def test_student_without_learning_history_gets_stable_empty_payload(self):
        empty = User.objects.create_user(
            "0912345603",
            password="Str0ng-Entrance-2026",
            phone_verified_at=timezone.now(),
        )
        self._auth(empty)
        response = self.client.get(self.URL)
        self.assertEqual(response.status_code, 200)
        data = response.data["data"]
        self.assertEqual(data["overview"]["selected_subjects"], [])
        self.assertEqual(data["overview"]["learning_goals"], [])
        self.assertFalse(data["overview"]["onboarded"])
        self.assertEqual(
            data["overview"]["onboarding_status"], OnboardingStatus.NOT_STARTED
        )
        self.assertIsNone(data["overview"]["overall_progress"])
        self.assertEqual(data["topic_performance"]["strong_topics"], [])
        self.assertEqual(data["engagement"]["streak"], 0)
        self.assertEqual(data["engagement"]["recent_activity"], [])
        self.assertFalse(data["data_availability"]["onboarding"])
        self.assertFalse(data["data_availability"]["selected_subjects"])
        self.assertTrue(data["data_availability"]["streak"])
        # ensure_student_records should have created empty profile/onboarding
        self.assertTrue(StudentOnboarding.objects.filter(user=empty).exists())

    def test_onboarded_flag_reflects_completed_onboarding(self):
        complete_student_onboarding(
            self.user_a,
            {
                "full_name": "Selam Bekele",
                "grade": 12,
                "stream": "natural_science",
                "subject_ids": [self.math.id, self.physics.id],
                "learning_goals": [LearningGoal.ENTRANCE_EXAM_PREP],
                "preferences": {
                    "daily_study_minutes": 45,
                    "study_frequency": "daily",
                },
            },
        )
        response = self.client.get(self.URL)
        self.assertEqual(response.status_code, 200)
        overview = response.data["data"]["overview"]
        self.assertTrue(overview["onboarded"])
        self.assertEqual(overview["onboarding_status"], OnboardingStatus.COMPLETED)
        self.assertTrue(response.data["data"]["data_availability"]["onboarding"])

    def test_student_id_query_param_is_ignored_for_isolation(self):
        """Passing another user's id must not change whose dashboard is returned."""
        response = self.client.get(self.URL, {"student_id": str(self.user_b.id)})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.data["data"]["overview"]["full_name"], "Selam Bekele"
        )
        ids = {
            item["id"]
            for item in response.data["data"]["overview"]["selected_subjects"]
        }
        self.assertNotIn(str(self.history.id), ids)
