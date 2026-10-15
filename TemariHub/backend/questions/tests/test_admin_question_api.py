from django.utils import timezone
from rest_framework_simplejwt.tokens import RefreshToken

from authentication.tests.base import AuthAPITestCase
from curriculum.models import Concept, Subject, Topic, Unit
from questions.constants import (
    MIN_OPTIONS_FOR_PUBLISH,
    QUESTION_STATUS_DRAFT,
    QUESTION_STATUS_PUBLISHED,
)
from questions.models import Question, QuestionOption
from users.models import User


class AdminQuestionAPITests(AuthAPITestCase):
    URL = "/api/v1/questions/"

    def setUp(self):
        super().setUp()
        self.staff = User.objects.create_user(
            "0912347101",
            password="Str0ng-Entrance-2026",
            phone_verified_at=timezone.now(),
            is_staff=True,
        )
        self.student = User.objects.create_user(
            "0912347102",
            password="Str0ng-Entrance-2026",
            phone_verified_at=timezone.now(),
            is_staff=False,
        )
        self.subject = Subject.objects.create(
            name="Mathematics",
            slug="mathematics",
            grade=12,
            stream=None,
            sort_order=1,
        )
        self.unit = Unit.objects.create(
            subject=self.subject, name="Algebra", slug="algebra", sort_order=1
        )
        self.topic = Topic.objects.create(
            unit=self.unit,
            name="Quadratic Equations",
            slug="quadratic-equations",
            sort_order=1,
        )
        self.other_topic = Topic.objects.create(
            unit=self.unit,
            name="Linear Equations",
            slug="linear-equations",
            sort_order=2,
        )
        self.concept = Concept.objects.create(
            topic=self.topic,
            name="Discriminant",
            slug="discriminant",
            sort_order=1,
        )
        self.other_concept = Concept.objects.create(
            topic=self.other_topic,
            name="Slope",
            slug="slope",
            sort_order=1,
        )
        self._auth(self.staff)

    def _auth(self, user):
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {RefreshToken.for_user(user).access_token}"
        )

    def _four_options(self):
        return [
            {"text": f"Choice {i}", "sort_order": i}
            for i in range(MIN_OPTIONS_FOR_PUBLISH)
        ]

    def _draft_payload(self, **overrides):
        payload = {
            "prompt": "What is the discriminant of x^2 - 5x + 6?",
            "topic_id": str(self.topic.id),
            "concept_id": str(self.concept.id),
            "difficulty": 3,
            "status": QUESTION_STATUS_DRAFT,
        }
        payload.update(overrides)
        return payload

    def test_anonymous_denied(self):
        self.client.credentials()
        response = self.client.get(self.URL)
        self.assertEqual(response.status_code, 401)

    def test_student_cannot_mutate(self):
        self._auth(self.student)
        response = self.client.post(self.URL, self._draft_payload(), format="json")
        self.assertEqual(response.status_code, 403)
        # Students may GET (Task 5); writes remain staff-only.

    def test_staff_create_draft(self):
        response = self.client.post(self.URL, self._draft_payload(), format="json")
        self.assertEqual(response.status_code, 201)
        self.assertTrue(response.data["success"])
        data = response.data["data"]
        self.assertEqual(data["status"], QUESTION_STATUS_DRAFT)
        self.assertEqual(data["options"], [])
        self.assertIsNone(data["correct_option_id"])
        self.assertEqual(Question.objects.count(), 1)

    def test_staff_create_published_with_options(self):
        payload = self._draft_payload(
            status=QUESTION_STATUS_PUBLISHED,
            options=self._four_options(),
            correct_option_index=1,
            explanation="b^2-4ac",
            estimated_time_seconds=60,
            source="Entrance Exam",
            exam_year=2025,
        )
        response = self.client.post(self.URL, payload, format="json")
        self.assertEqual(response.status_code, 201, response.data)
        data = response.data["data"]
        self.assertEqual(data["status"], QUESTION_STATUS_PUBLISHED)
        self.assertEqual(len(data["options"]), 4)
        self.assertTrue(data["options"][1]["is_correct"])
        self.assertEqual(data["correct_option_id"], data["options"][1]["id"])
        self.assertEqual(data["explanation"], "b^2-4ac")

    def test_reject_client_is_correct_flag(self):
        payload = self._draft_payload(
            options=[
                {"text": "A", "sort_order": 0, "is_correct": True},
                {"text": "B", "sort_order": 1},
                {"text": "C", "sort_order": 2},
                {"text": "D", "sort_order": 3},
            ]
        )
        response = self.client.post(self.URL, payload, format="json")
        self.assertEqual(response.status_code, 400)

    def test_retrieve_and_list(self):
        created = self.client.post(self.URL, self._draft_payload(), format="json")
        qid = created.data["data"]["id"]
        detail = self.client.get(f"{self.URL}{qid}/")
        self.assertEqual(detail.status_code, 200)
        self.assertEqual(detail.data["data"]["id"], qid)

        listing = self.client.get(self.URL)
        self.assertEqual(listing.status_code, 200)
        self.assertEqual(listing.data["data"]["total"], 1)
        self.assertEqual(listing.data["data"]["page"], 1)
        self.assertEqual(listing.data["data"]["page_size"], 20)

    def test_patch_metadata_and_publish(self):
        created = self.client.post(self.URL, self._draft_payload(), format="json")
        qid = created.data["data"]["id"]
        patch = self.client.patch(
            f"{self.URL}{qid}/",
            {
                "options": self._four_options(),
                "correct_option_index": 0,
                "status": QUESTION_STATUS_PUBLISHED,
                "source": "Workbook",
            },
            format="json",
        )
        self.assertEqual(patch.status_code, 200, patch.data)
        self.assertEqual(patch.data["data"]["status"], QUESTION_STATUS_PUBLISHED)
        self.assertEqual(patch.data["data"]["source"], "Workbook")

    def test_change_correct_option_by_id(self):
        created = self.client.post(
            self.URL,
            self._draft_payload(
                status=QUESTION_STATUS_PUBLISHED,
                options=self._four_options(),
                correct_option_index=0,
            ),
            format="json",
        )
        qid = created.data["data"]["id"]
        option_ids = [o["id"] for o in created.data["data"]["options"]]
        patched = self.client.patch(
            f"{self.URL}{qid}/",
            {"correct_option_id": option_ids[2]},
            format="json",
        )
        self.assertEqual(patched.status_code, 200, patched.data)
        self.assertEqual(patched.data["data"]["correct_option_id"], option_ids[2])
        self.assertTrue(patched.data["data"]["options"][2]["is_correct"])

    def test_delete_draft(self):
        created = self.client.post(self.URL, self._draft_payload(), format="json")
        qid = created.data["data"]["id"]
        deleted = self.client.delete(f"{self.URL}{qid}/")
        self.assertEqual(deleted.status_code, 200)
        self.assertEqual(Question.objects.count(), 0)

    def test_delete_published(self):
        created = self.client.post(
            self.URL,
            self._draft_payload(
                status=QUESTION_STATUS_PUBLISHED,
                options=self._four_options(),
                correct_option_index=0,
            ),
            format="json",
        )
        qid = created.data["data"]["id"]
        deleted = self.client.delete(f"{self.URL}{qid}/")
        self.assertEqual(deleted.status_code, 200)
        self.assertFalse(Question.objects.filter(pk=qid).exists())

    def test_invalid_concept_topic_combo(self):
        response = self.client.post(
            self.URL,
            self._draft_payload(concept_id=str(self.other_concept.id)),
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertFalse(response.data["success"])

    def test_publish_without_options_rejected_and_no_partial(self):
        before = Question.objects.count()
        response = self.client.post(
            self.URL,
            self._draft_payload(status=QUESTION_STATUS_PUBLISHED),
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(Question.objects.count(), before)

    def test_invalid_difficulty(self):
        response = self.client.post(
            self.URL,
            self._draft_payload(difficulty=9),
            format="json",
        )
        self.assertEqual(response.status_code, 400)

    def test_invalid_solving_time(self):
        response = self.client.post(
            self.URL,
            self._draft_payload(estimated_time_seconds=0),
            format="json",
        )
        self.assertEqual(response.status_code, 400)

    def test_foreign_correct_option_rejected(self):
        other = Question.objects.create(
            prompt="Other",
            topic=self.topic,
            concept=self.concept,
            difficulty=2,
        )
        foreign = QuestionOption.objects.create(
            question=other, text="Foreign", sort_order=0
        )
        created = self.client.post(
            self.URL,
            self._draft_payload(options=self._four_options()),
            format="json",
        )
        qid = created.data["data"]["id"]
        response = self.client.patch(
            f"{self.URL}{qid}/",
            {"correct_option_id": str(foreign.id)},
            format="json",
        )
        self.assertEqual(response.status_code, 400)

    def test_put_full_update(self):
        created = self.client.post(self.URL, self._draft_payload(), format="json")
        qid = created.data["data"]["id"]
        response = self.client.put(
            f"{self.URL}{qid}/",
            self._draft_payload(
                prompt="Updated prompt",
                difficulty=4,
                options=self._four_options(),
                correct_option_index=3,
                status=QUESTION_STATUS_PUBLISHED,
            ),
            format="json",
        )
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data["data"]["prompt"], "Updated prompt")
        self.assertEqual(response.data["data"]["difficulty"], 4)
        self.assertTrue(response.data["data"]["options"][3]["is_correct"])
