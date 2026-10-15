"""Diagnostic completion and scoring API (Task 11)."""

from decimal import Decimal

from django.utils import timezone
from rest_framework_simplejwt.tokens import RefreshToken

from authentication.tests.base import AuthAPITestCase
from curriculum.models import Concept, Subject, Topic, Unit
from diagnostics.constants import DIAGNOSTIC_STATUS_COMPLETED, DIAGNOSTIC_STATUS_IN_PROGRESS
from diagnostics.models import DiagnosticAnswer, DiagnosticAttempt
from diagnostics.services import (
    _pct,
    complete_diagnostic_attempt,
    start_diagnostic_attempt,
    submit_diagnostic_answer,
)
from questions.constants import MIN_OPTIONS_FOR_PUBLISH, QUESTION_STATUS_PUBLISHED
from questions.services import create_question
from users.models import User

FORBIDDEN_KEYS = {
    "correct_option",
    "correct_option_id",
    "correct_option_index",
    "is_correct",
    "explanation",
}


def _collect_keys(payload):
    keys = set()
    if isinstance(payload, dict):
        keys.update(payload.keys())
        for value in payload.values():
            keys.update(_collect_keys(value))
    elif isinstance(payload, list):
        for item in payload:
            keys.update(_collect_keys(item))
    return keys


class DiagnosticCompleteAPITests(AuthAPITestCase):
    def setUp(self):
        super().setUp()
        self.staff = User.objects.create_user(
            "0912349301",
            password="Str0ng-Entrance-2026",
            phone_verified_at=timezone.now(),
            is_staff=True,
        )
        self.student = User.objects.create_user(
            "0912349302",
            password="Str0ng-Entrance-2026",
            phone_verified_at=timezone.now(),
        )
        self.other = User.objects.create_user(
            "0912349303",
            password="Str0ng-Entrance-2026",
            phone_verified_at=timezone.now(),
        )
        subject = Subject.objects.create(
            name="Mathematics",
            slug="mathematics",
            grade=12,
            stream=None,
            sort_order=1,
        )
        unit = Unit.objects.create(
            subject=subject, name="Algebra", slug="algebra", sort_order=1
        )
        self.topic = Topic.objects.create(
            unit=unit, name="Functions", slug="functions", sort_order=1
        )
        self.concept = Concept.objects.create(
            topic=self.topic, name="Notation", slug="notation", sort_order=1
        )
        self.questions = [self._publish(f"Q{i}") for i in range(4)]
        self.attempt, _ = start_diagnostic_attempt(
            student=self.student, required_count=4
        )
        self._auth(self.student)

    def _auth(self, user):
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {RefreshToken.for_user(user).access_token}"
        )

    def _publish(self, prompt):
        return create_question(
            data={
                "prompt": prompt,
                "topic_id": self.topic.id,
                "concept_id": self.concept.id,
                "difficulty": 2,
                "status": QUESTION_STATUS_PUBLISHED,
                "options": [
                    {"text": f"{prompt}-{i}", "sort_order": i}
                    for i in range(MIN_OPTIONS_FOR_PUBLISH)
                ],
                "correct_option_index": 0,
                "explanation": "SECRET explanation",
            },
            created_by=self.staff,
        )

    def _complete_url(self, attempt_id=None):
        attempt_id = attempt_id or self.attempt.id
        return f"/api/v1/diagnostic/attempts/{attempt_id}/complete/"

    def _answer_correct(self, question):
        correct = question.correct_option
        submit_diagnostic_answer(
            student=self.student,
            attempt_id=self.attempt.id,
            question_id=question.id,
            selected_option_id=correct.id,
        )

    def _answer_wrong(self, question):
        wrong = list(question.options_in_order())[1]
        submit_diagnostic_answer(
            student=self.student,
            attempt_id=self.attempt.id,
            question_id=question.id,
            selected_option_id=wrong.id,
        )

    def test_pct_rounding(self):
        self.assertEqual(_pct(1, 3), Decimal("33.33"))
        self.assertEqual(_pct(2, 3), Decimal("66.67"))
        self.assertEqual(_pct(0, 4), Decimal("0.00"))
        self.assertEqual(_pct(4, 4), Decimal("100.00"))

    def test_anonymous_denied(self):
        self.client.credentials()
        self.assertEqual(self.client.post(self._complete_url()).status_code, 401)

    def test_complete_scores_correct_wrong_and_unanswered(self):
        # 2 correct, 1 wrong, 1 unanswered → 50.00%
        self._answer_correct(self.questions[0])
        self._answer_correct(self.questions[1])
        self._answer_wrong(self.questions[2])

        response = self.client.post(self._complete_url(), {}, format="json")
        self.assertEqual(response.status_code, 200, response.data)
        data = response.data["data"]
        self.assertEqual(data["status"], DIAGNOSTIC_STATUS_COMPLETED)
        self.assertEqual(Decimal(data["overall_score_pct"]), Decimal("50.00"))
        self.assertEqual(data["questions_answered"], 3)
        self.assertEqual(data["questions_correct"], 2)
        self.assertEqual(data["total_questions"], 4)
        self.assertIsNotNone(data["completed_at"])
        self.assertEqual(data["strong_topics"], [])
        self.assertEqual(data["weak_topics"], [])
        self.assertTrue(data["subjects"])

        attempt = DiagnosticAttempt.objects.get(pk=self.attempt.id)
        self.assertEqual(attempt.status, DIAGNOSTIC_STATUS_COMPLETED)
        self.assertEqual(attempt.overall_score_pct, Decimal("50.00"))
        self.assertIsNotNone(attempt.completed_at)

        leaked = _collect_keys(response.data) & FORBIDDEN_KEYS
        self.assertFalse(leaked, leaked)
        self.assertNotIn("SECRET", str(response.data))

    def test_repeated_complete_preserves_stored_score(self):
        self._answer_correct(self.questions[0])
        first = self.client.post(self._complete_url(), {}, format="json")
        self.assertEqual(first.status_code, 200)
        stored = first.data["data"]["overall_score_pct"]
        completed_at = first.data["data"]["completed_at"]

        second = self.client.post(self._complete_url(), {}, format="json")
        self.assertEqual(second.status_code, 200)
        self.assertIn("already completed", second.data["message"].lower())
        self.assertEqual(second.data["data"]["overall_score_pct"], stored)
        self.assertEqual(second.data["data"]["completed_at"], completed_at)
        self.assertEqual(
            DiagnosticAttempt.objects.filter(
                student=self.student, status=DIAGNOSTIC_STATUS_COMPLETED
            ).count(),
            1,
        )

    def test_other_student_cannot_complete(self):
        self._auth(self.other)
        response = self.client.post(self._complete_url(), {}, format="json")
        self.assertEqual(response.status_code, 404)
        self.attempt.refresh_from_db()
        self.assertEqual(self.attempt.status, DIAGNOSTIC_STATUS_IN_PROGRESS)

    def test_client_supplied_score_rejected(self):
        response = self.client.post(
            self._complete_url(),
            {
                "overall_score_pct": 99,
                "student_id": str(self.other.id),
                "completed_at": "2020-01-01T00:00:00Z",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.attempt.refresh_from_db()
        self.assertEqual(self.attempt.status, DIAGNOSTIC_STATUS_IN_PROGRESS)

    def test_all_correct_is_100(self):
        for question in self.questions:
            self._answer_correct(question)
        response = self.client.post(self._complete_url(), {}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            Decimal(response.data["data"]["overall_score_pct"]), Decimal("100.00")
        )

    def test_all_unanswered_is_zero(self):
        response = self.client.post(self._complete_url(), {}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            Decimal(response.data["data"]["overall_score_pct"]), Decimal("0.00")
        )
        self.assertEqual(response.data["data"]["questions_answered"], 0)
        self.assertEqual(response.data["data"]["questions_correct"], 0)

    def test_answer_blocked_after_complete(self):
        self.client.post(self._complete_url(), {}, format="json")
        option = self.questions[0].correct_option
        response = self.client.put(
            (
                f"/api/v1/diagnostic/attempts/{self.attempt.id}/"
                f"questions/{self.questions[0].id}/answer/"
            ),
            {"selected_option_id": str(option.id)},
            format="json",
        )
        self.assertEqual(response.status_code, 409)

    def test_failed_score_leaves_in_progress(self):
        from unittest.mock import patch

        from authentication.exceptions import ServiceError

        with patch(
            "diagnostics.services._score_assigned_questions",
            side_effect=ServiceError(message="boom", errors={}, status_code=500),
        ):
            with self.assertRaises(ServiceError):
                complete_diagnostic_attempt(
                    student=self.student, attempt_id=self.attempt.id
                )
        self.attempt.refresh_from_db()
        self.assertEqual(self.attempt.status, DIAGNOSTIC_STATUS_IN_PROGRESS)
        self.assertIsNone(self.attempt.overall_score_pct)
        self.assertIsNone(self.attempt.completed_at)
        self.assertEqual(DiagnosticAnswer.objects.count(), 0)
