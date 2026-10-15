"""Admin question DELETE returns 409 when diagnostic history references it."""

from django.utils import timezone
from rest_framework_simplejwt.tokens import RefreshToken

from authentication.tests.base import AuthAPITestCase
from curriculum.models import Concept, Subject, Topic, Unit
from diagnostics.models import DiagnosticAttempt, DiagnosticQuestion
from questions.constants import MIN_OPTIONS_FOR_PUBLISH, QUESTION_STATUS_PUBLISHED
from questions.services import create_question
from users.models import User


class DiagnosticReferencedQuestionDeleteAPITests(AuthAPITestCase):
    URL = "/api/v1/questions/"

    def setUp(self):
        super().setUp()
        self.staff = User.objects.create_user(
            "0912348201",
            password="Str0ng-Entrance-2026",
            phone_verified_at=timezone.now(),
            is_staff=True,
        )
        self.student = User.objects.create_user(
            "0912348202",
            password="Str0ng-Entrance-2026",
            phone_verified_at=timezone.now(),
        )
        subject = Subject.objects.create(
            name="Physics", slug="physics", grade=12, stream=None, sort_order=1
        )
        unit = Unit.objects.create(
            subject=subject, name="Mechanics", slug="mechanics", sort_order=1
        )
        topic = Topic.objects.create(
            unit=unit, name="Kinematics", slug="kinematics", sort_order=1
        )
        concept = Concept.objects.create(
            topic=topic, name="Velocity", slug="velocity", sort_order=1
        )
        self.question = create_question(
            data={
                "prompt": "Referenced by diagnostic",
                "topic_id": topic.id,
                "concept_id": concept.id,
                "difficulty": 2,
                "status": QUESTION_STATUS_PUBLISHED,
                "options": [
                    {"text": f"C{i}", "sort_order": i}
                    for i in range(MIN_OPTIONS_FOR_PUBLISH)
                ],
                "correct_option_index": 0,
            },
            created_by=self.staff,
        )
        attempt = DiagnosticAttempt.objects.create(student=self.student)
        DiagnosticQuestion.objects.create(
            attempt=attempt, question=self.question, position=1
        )
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {RefreshToken.for_user(self.staff).access_token}"
        )

    def test_delete_returns_409_when_referenced(self):
        response = self.client.delete(f"{self.URL}{self.question.id}/")
        self.assertEqual(response.status_code, 409)
        self.assertFalse(response.data["success"])
        from questions.models import Question

        self.assertTrue(Question.objects.filter(pk=self.question.id).exists())
