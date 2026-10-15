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
from questions.services import create_question
from users.models import User

FORBIDDEN_ANSWER_KEYS = {
    "correct_option",
    "correct_option_id",
    "correct_option_index",
    "is_correct",
    "explanation",
}


def _collect_keys(payload):
    """Recursively collect JSON object keys from a response payload."""
    keys = set()
    if isinstance(payload, dict):
        keys.update(payload.keys())
        for value in payload.values():
            keys.update(_collect_keys(value))
    elif isinstance(payload, list):
        for item in payload:
            keys.update(_collect_keys(item))
    return keys


class StudentQuestionAPITests(AuthAPITestCase):
    URL = "/api/v1/questions/"

    def setUp(self):
        super().setUp()
        self.staff = User.objects.create_user(
            "0912347201",
            password="Str0ng-Entrance-2026",
            phone_verified_at=timezone.now(),
            is_staff=True,
        )
        self.student = User.objects.create_user(
            "0912347202",
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
        self.concept = Concept.objects.create(
            topic=self.topic,
            name="Discriminant",
            slug="discriminant",
            sort_order=1,
        )
        self.published = create_question(
            data={
                "prompt": "What is the discriminant of x^2 - 5x + 6?",
                "topic_id": self.topic.id,
                "concept_id": self.concept.id,
                "difficulty": 3,
                "status": QUESTION_STATUS_PUBLISHED,
                "estimated_time_seconds": 45,
                "explanation": "SECRET explanation must not leak",
                "options": [
                    {"text": f"Choice {i}", "sort_order": i}
                    for i in range(MIN_OPTIONS_FOR_PUBLISH)
                ],
                "correct_option_index": 1,
            },
            created_by=self.staff,
        )
        self.draft = create_question(
            data={
                "prompt": "Draft only",
                "topic_id": self.topic.id,
                "concept_id": self.concept.id,
                "difficulty": 2,
                "status": QUESTION_STATUS_DRAFT,
            },
            created_by=self.staff,
        )
        self._auth(self.student)

    def _auth(self, user):
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {RefreshToken.for_user(user).access_token}"
        )

    def test_anonymous_denied(self):
        self.client.credentials()
        self.assertEqual(self.client.get(self.URL).status_code, 401)
        self.assertEqual(
            self.client.get(f"{self.URL}{self.published.id}/").status_code, 401
        )

    def test_student_lists_published_only(self):
        response = self.client.get(self.URL)
        self.assertEqual(response.status_code, 200)
        ids = {item["id"] for item in response.data["data"]["items"]}
        self.assertIn(str(self.published.id), ids)
        self.assertNotIn(str(self.draft.id), ids)

    def test_student_retrieves_published(self):
        response = self.client.get(f"{self.URL}{self.published.id}/")
        self.assertEqual(response.status_code, 200)
        data = response.data["data"]
        self.assertEqual(data["id"], str(self.published.id))
        self.assertEqual(data["prompt"], self.published.prompt)
        self.assertEqual(len(data["options"]), 4)
        self.assertEqual(data["topic"]["name"], "Quadratic Equations")
        self.assertEqual(data["concept"]["name"], "Discriminant")

    def test_student_cannot_retrieve_draft_by_uuid(self):
        response = self.client.get(f"{self.URL}{self.draft.id}/")
        self.assertEqual(response.status_code, 404)

    def test_student_cannot_mutate(self):
        self.assertEqual(
            self.client.post(
                self.URL,
                {
                    "prompt": "Nope",
                    "topic_id": str(self.topic.id),
                    "concept_id": str(self.concept.id),
                    "difficulty": 1,
                },
                format="json",
            ).status_code,
            403,
        )
        self.assertEqual(
            self.client.patch(
                f"{self.URL}{self.published.id}/",
                {"prompt": "Hacked"},
                format="json",
            ).status_code,
            403,
        )
        self.assertEqual(
            self.client.delete(f"{self.URL}{self.published.id}/").status_code,
            403,
        )

    def test_inactive_topic_hidden(self):
        self.topic.is_active = False
        self.topic.save()
        self.assertEqual(self.client.get(self.URL).data["data"]["total"], 0)
        self.assertEqual(
            self.client.get(f"{self.URL}{self.published.id}/").status_code, 404
        )

    def test_inactive_unit_hidden(self):
        self.unit.is_active = False
        self.unit.save()
        self.assertEqual(
            self.client.get(f"{self.URL}{self.published.id}/").status_code, 404
        )

    def test_inactive_subject_hidden(self):
        self.subject.is_active = False
        self.subject.save()
        self.assertEqual(
            self.client.get(f"{self.URL}{self.published.id}/").status_code, 404
        )

    def test_inactive_concept_hidden(self):
        self.concept.is_active = False
        self.concept.save()
        self.assertEqual(
            self.client.get(f"{self.URL}{self.published.id}/").status_code, 404
        )

    def test_student_list_and_detail_never_leak_answers(self):
        listing = self.client.get(self.URL)
        detail = self.client.get(f"{self.URL}{self.published.id}/")
        for response in (listing, detail):
            self.assertEqual(response.status_code, 200)
            keys = _collect_keys(response.data)
            leaked = keys & FORBIDDEN_ANSWER_KEYS
            self.assertFalse(
                leaked,
                f"Student response leaked privileged keys: {leaked}",
            )
            # Correct option text must not appear as a privileged sibling field.
            blob = str(response.data)
            self.assertNotIn("SECRET explanation", blob)

    def test_staff_still_sees_answers(self):
        self._auth(self.staff)
        detail = self.client.get(f"{self.URL}{self.published.id}/")
        self.assertEqual(detail.status_code, 200)
        data = detail.data["data"]
        self.assertIn("correct_option_id", data)
        self.assertIn("explanation", data)
        self.assertTrue(any(opt.get("is_correct") for opt in data["options"]))
        # Staff can still see drafts.
        draft_detail = self.client.get(f"{self.URL}{self.draft.id}/")
        self.assertEqual(draft_detail.status_code, 200)

    def test_options_ordered_deterministically(self):
        response = self.client.get(f"{self.URL}{self.published.id}/")
        orders = [opt["sort_order"] for opt in response.data["data"]["options"]]
        self.assertEqual(orders, sorted(orders))
