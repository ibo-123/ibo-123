from django.utils import timezone
from rest_framework_simplejwt.tokens import RefreshToken

from authentication.tests.base import AuthAPITestCase
from curriculum.models import Subject, Topic, Unit
from learning_path.constants import ACTIVITY_PRACTICE, ACTIVITY_STUDY_TOPIC
from learning_path.models import PathItemStatus
from learning_path.services import sync_learning_path_items
from mastery.services import upsert_topic_mastery
from users.models import StudentSelectedSubject, User
from users.services import ensure_student_records


class DashboardLearningPathAPITests(AuthAPITestCase):
    URL = "/api/v1/dashboard/me/"

    def setUp(self):
        super().setUp()
        self.user = User.objects.create_user(
            "0912345911",
            password="Str0ng-Entrance-2026",
            phone_verified_at=timezone.now(),
            first_name="Selam",
            last_name="Bekele",
            grade=12,
            stream="natural_science",
        )
        self.other = User.objects.create_user(
            "0912345912",
            password="Str0ng-Entrance-2026",
            phone_verified_at=timezone.now(),
            first_name="Abebe",
            last_name="Kebede",
            grade=12,
            stream="natural_science",
        )
        self.math = Subject.objects.create(
            name="Mathematics", slug="mathematics", grade=12, stream=None, sort_order=1
        )
        self.physics = Subject.objects.create(
            name="Physics", slug="physics", grade=12, stream="natural_science", sort_order=2
        )
        math_unit = Unit.objects.create(subject=self.math, name="Algebra", slug="algebra")
        phys_unit = Unit.objects.create(
            subject=self.physics, name="Mechanics", slug="mechanics"
        )
        self.topic_quad = Topic.objects.create(
            unit=math_unit, name="Quadratics", slug="quadratics", sort_order=1
        )
        self.topic_trig = Topic.objects.create(
            unit=math_unit, name="Trigonometry", slug="trigonometry", sort_order=2
        )
        self.topic_force = Topic.objects.create(
            unit=phys_unit, name="Forces", slug="forces", sort_order=1
        )
        ensure_student_records(self.user)
        ensure_student_records(self.other)
        self._auth(self.user)

    def _auth(self, user):
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {RefreshToken.for_user(user).access_token}"
        )

    def _select(self, user, *subjects):
        for subject in subjects:
            StudentSelectedSubject.objects.get_or_create(user=user, subject=subject)

    def _seed(self, user, topic, score, attempted=5):
        upsert_topic_mastery(
            user=user,
            topic=topic,
            mastery_score=score,
            questions_attempted=attempted,
            questions_correct=int(round(attempted * float(score) / 100)),
            accuracy_pct=score,
        )

    def test_unauthenticated_rejected(self):
        self.client.credentials()
        response = self.client.get(self.URL)
        self.assertEqual(response.status_code, 401)

    def test_new_learner_keeps_empty_learning_contract(self):
        response = self.client.get(self.URL)
        self.assertEqual(response.status_code, 200)
        data = response.data["data"]
        self.assertIsNone(data["current_learning"]["current_topic"])
        self.assertIsNone(data["current_learning"]["recommended_activity"])
        self.assertFalse(data["current_learning"]["available"])
        self.assertEqual(data["learning_status"]["learning_path"]["status"], "unavailable")
        self.assertIsNone(data["learning_status"]["learning_path"]["progress"])
        self.assertFalse(data["data_availability"]["learning_path"])
        self.assertFalse(data["data_availability"]["recommendations"])
        # Existing mastery fields remain compatible.
        self.assertIsNone(data["overview"]["overall_progress"])

    def test_enrolled_not_started_returns_study_topic(self):
        self._select(self.user, self.math, self.physics)
        response = self.client.get(self.URL)
        data = response.data["data"]
        current = data["current_learning"]
        self.assertTrue(current["available"])
        self.assertIsNotNone(current["current_topic"])
        self.assertEqual(current["recommended_activity"]["type"], ACTIVITY_STUDY_TOPIC)
        path_block = data["learning_status"]["learning_path"]
        self.assertEqual(path_block["status"], "not_started")
        self.assertEqual(path_block["progress"], 0.0)
        self.assertEqual(path_block["detail"]["total_topics"], 3)
        self.assertTrue(data["data_availability"]["learning_path"])
        self.assertTrue(data["data_availability"]["recommendations"])

    def test_in_progress_learner_gets_current_topic_and_practice(self):
        self._select(self.user, self.math, self.physics)
        self._seed(self.user, self.topic_trig, 25, attempted=6)
        self._seed(self.user, self.topic_quad, 60, attempted=6)
        self._seed(self.user, self.topic_force, 90, attempted=6)
        response = self.client.get(self.URL)
        data = response.data["data"]
        current = data["current_learning"]
        self.assertEqual(current["current_topic"]["name"], "Trigonometry")
        self.assertEqual(current["recommended_activity"]["type"], ACTIVITY_PRACTICE)
        self.assertEqual(data["learning_status"]["learning_path"]["status"], "in_progress")
        self.assertEqual(data["learning_status"]["learning_path"]["progress"], 33.3)
        self.assertEqual(
            data["learning_status"]["learning_path"]["detail"]["completed_topics"], 1
        )

    def test_prefers_stored_in_progress_item(self):
        self._select(self.user, self.math, self.physics)
        path = sync_learning_path_items(self.user)
        trig = path.items.get(topic=self.topic_trig)
        trig.status = PathItemStatus.IN_PROGRESS
        trig.save(update_fields=["status", "updated_at"])
        response = self.client.get(self.URL)
        self.assertEqual(
            response.data["data"]["current_learning"]["current_topic"]["name"],
            "Trigonometry",
        )

    def test_completed_path_has_no_next_activity(self):
        self._select(self.user, self.math)
        self._seed(self.user, self.topic_quad, 90, attempted=5)
        self._seed(self.user, self.topic_trig, 85, attempted=5)
        response = self.client.get(self.URL)
        data = response.data["data"]
        self.assertIsNone(data["current_learning"]["current_topic"])
        self.assertIsNone(data["current_learning"]["recommended_activity"])
        self.assertTrue(data["current_learning"]["available"])
        self.assertEqual(data["learning_status"]["learning_path"]["status"], "completed")
        self.assertEqual(data["learning_status"]["learning_path"]["progress"], 100.0)
        self.assertFalse(data["data_availability"]["recommendations"])

    def test_other_student_path_does_not_leak(self):
        self._select(self.user, self.math)
        self._select(self.other, self.physics)
        self._seed(self.other, self.topic_force, 15, attempted=10)
        self._seed(self.user, self.topic_quad, 40, attempted=5)
        self._seed(self.user, self.topic_trig, 90, attempted=5)

        response = self.client.get(self.URL)
        current = response.data["data"]["current_learning"]["current_topic"]
        self.assertEqual(current["name"], "Quadratics")
        self.assertNotEqual(current["name"], "Forces")

        self._auth(self.other)
        other = self.client.get(self.URL).data["data"]["current_learning"]["current_topic"]
        self.assertEqual(other["name"], "Forces")

    def test_student_id_query_param_ignored(self):
        self._select(self.user, self.math)
        self._select(self.other, self.physics)
        # Seed both math topics so ranking is by mastery, not null-vs-score.
        self._seed(self.user, self.topic_quad, 30, attempted=5)
        self._seed(self.user, self.topic_trig, 70, attempted=5)
        response = self.client.get(self.URL, {"student_id": str(self.other.id)})
        overview = response.data["data"]["overview"]
        current = response.data["data"]["current_learning"]["current_topic"]
        self.assertEqual(overview["full_name"], "Selam Bekele")
        self.assertEqual(current["name"], "Quadratics")
        self.assertNotEqual(current["name"], "Forces")

    def test_existing_mastery_fields_remain_compatible(self):
        self._select(self.user, self.math, self.physics)
        self._seed(self.user, self.topic_quad, 90, attempted=10)
        self._seed(self.user, self.topic_force, 30, attempted=10)
        response = self.client.get(self.URL)
        data = response.data["data"]
        self.assertIn("overall_progress", data["overview"])
        self.assertIn("strongest_subject", data["overview"])
        self.assertIn("weak_topics", data["topic_performance"])
        self.assertTrue(data["data_availability"]["mastery"])
        self.assertTrue(data["current_learning"]["available"])
