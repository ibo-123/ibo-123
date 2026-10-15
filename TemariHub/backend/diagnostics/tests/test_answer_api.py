"""Diagnostic answer submission API (Task 10)."""

from django.utils import timezone
from rest_framework_simplejwt.tokens import RefreshToken

from authentication.tests.base import AuthAPITestCase
from curriculum.models import Concept, Subject, Topic, Unit
from diagnostics.constants import (
    DIAGNOSTIC_MAX_TIME_SPENT_SECONDS,
    DIAGNOSTIC_STATUS_COMPLETED,
    DIAGNOSTIC_STATUS_IN_PROGRESS,
)
from diagnostics.models import DiagnosticAnswer, DiagnosticAttempt, DiagnosticQuestion
from diagnostics.services import start_diagnostic_attempt, submit_diagnostic_answer
from questions.constants import MIN_OPTIONS_FOR_PUBLISH, QUESTION_STATUS_PUBLISHED
from questions.services import create_question
from users.models import User

FORBIDDEN_KEYS = {
    "correct_option",
    "correct_option_id",
    "correct_option_index",
    "is_correct",
    "explanation",
    "overall_score_pct",
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


class DiagnosticAnswerAPITests(AuthAPITestCase):
    def setUp(self):
        super().setUp()
        self.staff = User.objects.create_user(
            "0912349201",
            password="Str0ng-Entrance-2026",
            phone_verified_at=timezone.now(),
            is_staff=True,
        )
        self.student = User.objects.create_user(
            "0912349202",
            password="Str0ng-Entrance-2026",
            phone_verified_at=timezone.now(),
        )
        self.other = User.objects.create_user(
            "0912349203",
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
        self.q1 = self._publish("Question one")
        self.q2 = self._publish("Question two")
        self.q3 = self._publish("Question three")
        self.q4 = self._publish("Question four")
        self.attempt, _ = start_diagnostic_attempt(
            student=self.student, required_count=4
        )
        self.dq1 = DiagnosticQuestion.objects.get(
            attempt=self.attempt, question=self.q1
        )
        self.option_q1 = list(self.q1.options_in_order())[1]
        self.option_q2 = list(self.q2.options_in_order())[0]
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

    def _url(self, attempt_id=None, question_id=None):
        attempt_id = attempt_id or self.attempt.id
        question_id = question_id or self.q1.id
        return (
            f"/api/v1/diagnostic/attempts/{attempt_id}/"
            f"questions/{question_id}/answer/"
        )

    def test_anonymous_denied(self):
        self.client.credentials()
        response = self.client.put(
            self._url(),
            {"selected_option_id": str(self.option_q1.id)},
            format="json",
        )
        self.assertEqual(response.status_code, 401)

    def test_submit_valid_answer(self):
        response = self.client.put(
            self._url(),
            {
                "selected_option_id": str(self.option_q1.id),
                "time_spent_seconds": 42,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201, response.data)
        data = response.data["data"]
        self.assertEqual(data["attempt_id"], str(self.attempt.id))
        self.assertEqual(data["question_id"], str(self.q1.id))
        self.assertEqual(data["selected_option_id"], str(self.option_q1.id))
        self.assertEqual(data["time_spent_seconds"], 42)
        self.assertIsNotNone(data["answered_at"])
        self.assertEqual(DiagnosticAnswer.objects.count(), 1)
        answer = DiagnosticAnswer.objects.get()
        self.assertEqual(answer.selected_option_id, self.option_q1.id)
        leaked = _collect_keys(response.data) & FORBIDDEN_KEYS
        self.assertFalse(leaked, leaked)
        self.assertNotIn("SECRET", str(response.data))

    def test_selected_choice_id_alias(self):
        response = self.client.put(
            self._url(),
            {"selected_choice_id": str(self.option_q1.id)},
            format="json",
        )
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(
            response.data["data"]["selected_option_id"], str(self.option_q1.id)
        )

    def test_repeated_submission_updates_same_row(self):
        first = self.client.put(
            self._url(),
            {
                "selected_option_id": str(self.option_q1.id),
                "time_spent_seconds": 10,
            },
            format="json",
        )
        self.assertEqual(first.status_code, 201)
        other_option = list(self.q1.options_in_order())[2]
        second = self.client.put(
            self._url(),
            {
                "selected_option_id": str(other_option.id),
                "time_spent_seconds": 25,
            },
            format="json",
        )
        self.assertEqual(second.status_code, 200, second.data)
        self.assertEqual(DiagnosticAnswer.objects.count(), 1)
        answer = DiagnosticAnswer.objects.get()
        self.assertEqual(answer.selected_option_id, other_option.id)
        self.assertEqual(answer.time_spent_seconds, 25)

    def test_option_from_other_question_rejected(self):
        response = self.client.put(
            self._url(),
            {"selected_option_id": str(self.option_q2.id)},
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(DiagnosticAnswer.objects.count(), 0)

    def test_unassigned_question_rejected(self):
        extra = self._publish("Not on attempt")
        option = list(extra.options_in_order())[0]
        response = self.client.put(
            self._url(question_id=extra.id),
            {"selected_option_id": str(option.id)},
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(DiagnosticAnswer.objects.count(), 0)

    def test_completed_attempt_rejected(self):
        self.attempt.status = DIAGNOSTIC_STATUS_COMPLETED
        self.attempt.completed_at = timezone.now()
        self.attempt.save()
        response = self.client.put(
            self._url(),
            {"selected_option_id": str(self.option_q1.id)},
            format="json",
        )
        self.assertEqual(response.status_code, 409)
        self.assertEqual(DiagnosticAnswer.objects.count(), 0)

    def test_other_student_cannot_answer(self):
        self._auth(self.other)
        response = self.client.put(
            self._url(),
            {"selected_option_id": str(self.option_q1.id)},
            format="json",
        )
        self.assertEqual(response.status_code, 404)
        self.assertEqual(DiagnosticAnswer.objects.count(), 0)

    def test_client_student_id_and_is_correct_rejected(self):
        response = self.client.put(
            self._url(),
            {
                "selected_option_id": str(self.option_q1.id),
                "student_id": str(self.other.id),
                "is_correct": True,
                "explanation": "nope",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("student_id", response.data["errors"])
        self.assertIn("is_correct", response.data["errors"])
        self.assertEqual(DiagnosticAnswer.objects.count(), 0)

    def test_missing_option_rejected(self):
        response = self.client.put(self._url(), {}, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(DiagnosticAnswer.objects.count(), 0)

    def test_negative_time_spent_rejected(self):
        response = self.client.put(
            self._url(),
            {
                "selected_option_id": str(self.option_q1.id),
                "time_spent_seconds": -1,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400)

    def test_excessive_time_spent_rejected(self):
        response = self.client.put(
            self._url(),
            {
                "selected_option_id": str(self.option_q1.id),
                "time_spent_seconds": DIAGNOSTIC_MAX_TIME_SPENT_SECONDS + 1,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400)

    def test_invalid_option_uuid_rejected(self):
        response = self.client.put(
            self._url(),
            {"selected_option_id": "00000000-0000-0000-0000-000000000001"},
            format="json",
        )
        self.assertEqual(response.status_code, 400)

    def test_service_upsert_is_idempotent_for_duplicates(self):
        a1, created1 = submit_diagnostic_answer(
            student=self.student,
            attempt_id=self.attempt.id,
            question_id=self.q1.id,
            selected_option_id=self.option_q1.id,
            time_spent_seconds=5,
        )
        a2, created2 = submit_diagnostic_answer(
            student=self.student,
            attempt_id=self.attempt.id,
            question_id=self.q1.id,
            selected_option_id=self.option_q1.id,
            time_spent_seconds=8,
        )
        self.assertTrue(created1)
        self.assertFalse(created2)
        self.assertEqual(a1.id, a2.id)
        self.assertEqual(DiagnosticAnswer.objects.count(), 1)
        self.assertEqual(
            DiagnosticAttempt.objects.get(pk=self.attempt.id).status,
            DIAGNOSTIC_STATUS_IN_PROGRESS,
        )
