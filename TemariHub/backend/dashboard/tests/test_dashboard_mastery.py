from django.utils import timezone
from rest_framework_simplejwt.tokens import RefreshToken

from authentication.tests.base import AuthAPITestCase
from curriculum.models import Subject, Topic, Unit
from mastery.constants import MIN_OBSERVATIONS_FOR_RANKING
from mastery.services import upsert_topic_mastery
from users.models import StudentSelectedSubject, User
from users.services import ensure_student_records


class DashboardMasteryAPITests(AuthAPITestCase):
    URL = "/api/v1/dashboard/me/"

    def setUp(self):
        super().setUp()
        self.user = User.objects.create_user(
            "0912345801",
            password="Str0ng-Entrance-2026",
            phone_verified_at=timezone.now(),
            first_name="Selam",
            last_name="Bekele",
            grade=12,
            stream="natural_science",
        )
        self.other = User.objects.create_user(
            "0912345802",
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
            unit=math_unit, name="Quadratics", slug="quadratics"
        )
        self.topic_trig = Topic.objects.create(
            unit=math_unit, name="Trigonometry", slug="trigonometry"
        )
        self.topic_force = Topic.objects.create(
            unit=phys_unit, name="Forces", slug="forces"
        )
        StudentSelectedSubject.objects.create(user=self.user, subject=self.math)
        StudentSelectedSubject.objects.create(user=self.user, subject=self.physics)
        StudentSelectedSubject.objects.create(user=self.other, subject=self.math)
        StudentSelectedSubject.objects.create(user=self.other, subject=self.physics)
        ensure_student_records(self.user)
        ensure_student_records(self.other)
        self._auth(self.user)

    def _auth(self, user):
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {RefreshToken.for_user(user).access_token}"
        )

    def _seed(self, user, topic, score, attempted=5, correct=None, accuracy=None):
        if correct is None:
            correct = int(round(attempted * float(score) / 100))
        if accuracy is None:
            accuracy = score
        upsert_topic_mastery(
            user=user,
            topic=topic,
            mastery_score=score,
            questions_attempted=attempted,
            questions_correct=correct,
            accuracy_pct=accuracy,
        )

    def test_unauthenticated_rejected(self):
        self.client.credentials()
        response = self.client.get(self.URL)
        self.assertEqual(response.status_code, 401)

    def test_no_mastery_data_keeps_unavailable_contract(self):
        response = self.client.get(self.URL)
        self.assertEqual(response.status_code, 200)
        data = response.data["data"]
        self.assertIsNone(data["overview"]["overall_progress"])
        self.assertIsNone(data["overview"]["strongest_subject"])
        self.assertIsNone(data["overview"]["weakest_subject"])
        self.assertEqual(data["topic_performance"]["strong_topics"], [])
        self.assertEqual(data["topic_performance"]["weak_topics"], [])
        self.assertFalse(data["topic_performance"]["available"])
        self.assertFalse(data["data_availability"]["mastery"])
        # Practice / diagnostic domains still absent — flags stay false.
        self.assertFalse(data["data_availability"]["practice"])
        self.assertFalse(data["data_availability"]["diagnostic"])

    def test_dashboard_aggregates_mastery_fields(self):
        self._seed(self.user, self.topic_quad, 90, attempted=10)
        self._seed(self.user, self.topic_trig, 80, attempted=10)
        self._seed(self.user, self.topic_force, 30, attempted=10)

        response = self.client.get(self.URL)
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["success"])
        data = response.data["data"]
        overview = data["overview"]

        self.assertEqual(overview["overall_progress"], 66.7)
        self.assertEqual(overview["strongest_subject"]["name"], "Mathematics")
        self.assertEqual(overview["strongest_subject"]["mastery"], 85.0)
        self.assertTrue(overview["strongest_subject"]["available"])
        self.assertEqual(overview["weakest_subject"]["name"], "Physics")
        self.assertEqual(overview["weakest_subject"]["mastery"], 30.0)

        topic_perf = data["topic_performance"]
        self.assertTrue(topic_perf["available"])
        self.assertEqual(
            [t["name"] for t in topic_perf["strong_topics"]],
            ["Quadratics", "Trigonometry"],
        )
        self.assertEqual([t["name"] for t in topic_perf["weak_topics"]], ["Forces"])
        self.assertTrue(data["data_availability"]["mastery"])
        self.assertTrue(data["data_availability"]["topic_performance"])

        math_summary = next(
            s for s in overview["subject_summaries"] if s["name"] == "Mathematics"
        )
        self.assertEqual(math_summary["mastery"], 85.0)
        self.assertTrue(math_summary["available"])

    def test_other_student_mastery_does_not_leak(self):
        self._seed(self.other, self.topic_quad, 99, attempted=20)
        self._seed(self.other, self.topic_force, 5, attempted=20)
        self._seed(self.user, self.topic_quad, 60, attempted=5)

        response = self.client.get(self.URL)
        overview = response.data["data"]["overview"]
        self.assertEqual(overview["overall_progress"], 60.0)
        self.assertEqual(overview["strongest_subject"]["mastery"], 60.0)
        self.assertIsNone(overview["weakest_subject"])
        strong = response.data["data"]["topic_performance"]["strong_topics"]
        weak = response.data["data"]["topic_performance"]["weak_topics"]
        self.assertEqual(strong, [])
        self.assertEqual(weak, [])

        self._auth(self.other)
        other_overview = self.client.get(self.URL).data["data"]["overview"]
        self.assertEqual(other_overview["overall_progress"], 52.0)
        self.assertEqual(other_overview["strongest_subject"]["name"], "Mathematics")
        self.assertEqual(other_overview["weakest_subject"]["name"], "Physics")

    def test_student_id_query_param_ignored_with_mastery(self):
        self._seed(self.user, self.topic_quad, 70, attempted=5)
        self._seed(self.other, self.topic_force, 20, attempted=5)
        response = self.client.get(self.URL, {"student_id": str(self.other.id)})
        overview = response.data["data"]["overview"]
        self.assertEqual(overview["full_name"], "Selam Bekele")
        self.assertEqual(overview["overall_progress"], 70.0)
        self.assertEqual(overview["strongest_subject"]["name"], "Mathematics")

    def test_insufficient_history_not_ranked_on_dashboard(self):
        self._seed(
            self.user,
            self.topic_quad,
            95,
            attempted=MIN_OBSERVATIONS_FOR_RANKING - 1,
        )
        response = self.client.get(self.URL)
        data = response.data["data"]
        self.assertIsNone(data["overview"]["overall_progress"])
        self.assertFalse(data["data_availability"]["mastery"])

    def test_genuine_zero_progress_is_numeric_zero(self):
        self._seed(self.user, self.topic_force, 0, attempted=5, correct=0, accuracy=0)
        response = self.client.get(self.URL)
        overview = response.data["data"]["overview"]
        self.assertEqual(overview["overall_progress"], 0.0)
        self.assertTrue(response.data["data"]["data_availability"]["mastery"])
        self.assertEqual(
            response.data["data"]["topic_performance"]["weak_topics"][0]["mastery"],
            0.0,
        )
