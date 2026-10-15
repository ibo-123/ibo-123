from authentication.tests.base import AuthAPITestCase
from curriculum.models import Concept, Subject, Topic, Unit


class CurriculumAPITests(AuthAPITestCase):
    def setUp(self):
        super().setUp()
        self.math = Subject.objects.create(
            name="Mathematics",
            slug="mathematics",
            grade=12,
            stream="natural_science",
            sort_order=1,
        )
        self.english = Subject.objects.create(
            name="English",
            slug="english",
            grade=12,
            stream=None,
            sort_order=0,
        )
        self.history = Subject.objects.create(
            name="History",
            slug="history",
            grade=12,
            stream="social_science",
            sort_order=1,
        )
        self.inactive = Subject.objects.create(
            name="Retired",
            slug="retired",
            grade=12,
            stream="natural_science",
            is_active=False,
        )
        self.unit = Unit.objects.create(
            subject=self.math,
            name="Algebra",
            slug="algebra",
            sort_order=1,
        )
        self.topic = Topic.objects.create(
            unit=self.unit,
            name="Quadratic Equations",
            slug="quadratic-equations",
            sort_order=1,
            estimated_study_minutes=90,
        )
        self.concept = Concept.objects.create(
            topic=self.topic,
            name="Discriminant",
            slug="discriminant",
            sort_order=1,
        )

    def test_list_subjects_filters_by_grade_and_stream(self):
        response = self.client.get(
            "/api/v1/curriculum/subjects/",
            {"grade": 12, "stream": "natural_science"},
        )
        self.assertEqual(response.status_code, 200)
        ids = {item["id"] for item in response.data["data"]["items"]}
        self.assertIn(str(self.math.id), ids)
        self.assertIn(str(self.english.id), ids)
        self.assertNotIn(str(self.history.id), ids)
        self.assertNotIn(str(self.inactive.id), ids)

    def test_subject_units_and_topics(self):
        units = self.client.get(f"/api/v1/curriculum/subjects/{self.math.id}/units/")
        self.assertEqual(units.status_code, 200)
        self.assertEqual(units.data["data"]["count"], 1)
        self.assertEqual(units.data["data"]["items"][0]["name"], "Algebra")

        topics = self.client.get(f"/api/v1/curriculum/units/{self.unit.id}/topics/")
        self.assertEqual(topics.status_code, 200)
        self.assertEqual(topics.data["data"]["items"][0]["slug"], "quadratic-equations")

        detail = self.client.get(f"/api/v1/curriculum/topics/{self.topic.id}/")
        self.assertEqual(detail.status_code, 200)
        self.assertEqual(detail.data["data"]["subject_id"], str(self.math.id))
        self.assertEqual(detail.data["data"]["estimated_study_minutes"], 90)
        self.assertEqual(len(detail.data["data"]["concepts"]), 1)
        self.assertEqual(detail.data["data"]["concepts"][0]["name"], "Discriminant")

    def test_missing_curriculum_resources_return_404(self):
        import uuid

        missing = uuid.uuid4()
        self.assertEqual(
            self.client.get(f"/api/v1/curriculum/subjects/{missing}/units/").status_code,
            404,
        )
        self.assertEqual(
            self.client.get(f"/api/v1/curriculum/units/{missing}/topics/").status_code,
            404,
        )
        self.assertEqual(
            self.client.get(f"/api/v1/curriculum/topics/{missing}/").status_code,
            404,
        )
