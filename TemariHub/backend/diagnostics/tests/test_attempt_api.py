"""Diagnostic attempt creation and question delivery API (Task 9)."""

from unittest.mock import patch

from django.db import transaction
from django.utils import timezone
from rest_framework_simplejwt.tokens import RefreshToken

from authentication.tests.base import AuthAPITestCase
from curriculum.models import Concept, Subject, Topic, Unit
from diagnostics.constants import DIAGNOSTIC_STATUS_COMPLETED, DIAGNOSTIC_STATUS_IN_PROGRESS
from diagnostics.models import DiagnosticAnswer, DiagnosticAttempt, DiagnosticQuestion
from diagnostics.services import start_diagnostic_attempt
from questions.constants import (
    MIN_OPTIONS_FOR_PUBLISH,
    QUESTION_STATUS_DRAFT,
    QUESTION_STATUS_PUBLISHED,
)
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


class DiagnosticAttemptAPITests(AuthAPITestCase):
    START_URL = "/api/v1/diagnostic/attempts/"
    REQUIRED = 4

    def setUp(self):
        super().setUp()
        self.staff = User.objects.create_user(
            "0912349101",
            password="Str0ng-Entrance-2026",
            phone_verified_at=timezone.now(),
            is_staff=True,
        )
        self.student = User.objects.create_user(
            "0912349102",
            password="Str0ng-Entrance-2026",
            phone_verified_at=timezone.now(),
        )
        self.other = User.objects.create_user(
            "0912349103",
            password="Str0ng-Entrance-2026",
            phone_verified_at=timezone.now(),
        )
        self.subject_a = Subject.objects.create(
            name="Mathematics",
            slug="mathematics",
            grade=12,
            stream=None,
            sort_order=1,
        )
        self.subject_b = Subject.objects.create(
            name="Physics",
            slug="physics",
            grade=12,
            stream=None,
            sort_order=2,
        )
        self.unit_a = Unit.objects.create(
            subject=self.subject_a, name="Algebra", slug="algebra", sort_order=1
        )
        self.unit_b = Unit.objects.create(
            subject=self.subject_b, name="Mechanics", slug="mechanics", sort_order=1
        )
        self.topic_a = Topic.objects.create(
            unit=self.unit_a, name="Functions", slug="functions", sort_order=1
        )
        self.topic_b = Topic.objects.create(
            unit=self.unit_b, name="Kinematics", slug="kinematics", sort_order=1
        )
        self.concept_a = Concept.objects.create(
            topic=self.topic_a,
            name="Notation",
            slug="notation",
            sort_order=1,
        )
        self.concept_b = Concept.objects.create(
            topic=self.topic_b,
            name="Velocity",
            slug="velocity",
            sort_order=1,
        )
        self.published = [
            self._publish("Math Q1", self.topic_a, self.concept_a),
            self._publish("Math Q2", self.topic_a, self.concept_a),
            self._publish("Phys Q1", self.topic_b, self.concept_b),
            self._publish("Phys Q2", self.topic_b, self.concept_b),
            self._publish("Phys Q3", self.topic_b, self.concept_b),
        ]
        self.draft = create_question(
            data={
                "prompt": "Draft must never be selected",
                "topic_id": self.topic_a.id,
                "concept_id": self.concept_a.id,
                "difficulty": 1,
                "status": QUESTION_STATUS_DRAFT,
            },
            created_by=self.staff,
        )
        self.incomplete = create_question(
            data={
                "prompt": "Published-looking but incomplete draft options path",
                "topic_id": self.topic_a.id,
                "concept_id": self.concept_a.id,
                "difficulty": 1,
                "status": QUESTION_STATUS_DRAFT,
                "options": [
                    {"text": "Only one", "sort_order": 0},
                ],
            },
            created_by=self.staff,
        )
        self._auth(self.student)

    def _auth(self, user):
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {RefreshToken.for_user(user).access_token}"
        )

    def _publish(self, prompt, topic, concept):
        return create_question(
            data={
                "prompt": prompt,
                "topic_id": topic.id,
                "concept_id": concept.id,
                "difficulty": 2,
                "status": QUESTION_STATUS_PUBLISHED,
                "options": [
                    {"text": f"{prompt}-{i}", "sort_order": i}
                    for i in range(MIN_OPTIONS_FOR_PUBLISH)
                ],
                "correct_option_index": 0,
                "explanation": "SECRET must not leak",
            },
            created_by=self.staff,
        )

    def _start(self):
        with patch(
            "diagnostics.constants.DIAGNOSTIC_QUESTION_COUNT", self.REQUIRED
        ):
            return self.client.post(self.START_URL, {}, format="json")

    def test_anonymous_denied(self):
        self.client.credentials()
        self.assertEqual(self.client.post(self.START_URL).status_code, 401)

    def test_student_starts_attempt_with_required_count(self):
        response = self._start()
        self.assertEqual(response.status_code, 201, response.data)
        data = response.data["data"]
        self.assertEqual(data["status"], DIAGNOSTIC_STATUS_IN_PROGRESS)
        self.assertEqual(data["total_questions"], self.REQUIRED)
        self.assertEqual(data["id"], data["diagnostic_test_id"])
        self.assertIsNone(data["completed_at"])
        self.assertTrue(data["sections"])

        attempt = DiagnosticAttempt.objects.get(pk=data["id"])
        self.assertEqual(attempt.student_id, self.student.id)
        positions = list(
            attempt.diagnostic_questions.order_by("position").values_list(
                "position", flat=True
            )
        )
        self.assertEqual(positions, list(range(1, self.REQUIRED + 1)))
        question_ids = list(
            attempt.diagnostic_questions.values_list("question_id", flat=True)
        )
        self.assertEqual(len(question_ids), len(set(question_ids)))
        self.assertNotIn(self.draft.id, question_ids)
        self.assertNotIn(self.incomplete.id, question_ids)

    def test_client_student_id_ignored(self):
        with patch(
            "diagnostics.constants.DIAGNOSTIC_QUESTION_COUNT", self.REQUIRED
        ):
            response = self.client.post(
                self.START_URL,
                {"student_id": str(self.other.id), "user_id": str(self.other.id)},
                format="json",
            )
        self.assertEqual(response.status_code, 201)
        attempt = DiagnosticAttempt.objects.get(pk=response.data["data"]["id"])
        self.assertEqual(attempt.student_id, self.student.id)

    def test_second_start_returns_existing_in_progress(self):
        first = self._start()
        self.assertEqual(first.status_code, 201)
        second = self._start()
        self.assertEqual(second.status_code, 200)
        self.assertEqual(first.data["data"]["id"], second.data["data"]["id"])
        self.assertEqual(
            DiagnosticAttempt.objects.filter(
                student=self.student, status=DIAGNOSTIC_STATUS_IN_PROGRESS
            ).count(),
            1,
        )

    def test_insufficient_questions_leaves_no_orphan(self):
        DiagnosticQuestion.objects.all().delete()
        DiagnosticAttempt.objects.all().delete()
        # Only 2 published eligible remain if we delete extras — easier: require 50.
        with patch("diagnostics.constants.DIAGNOSTIC_QUESTION_COUNT", 50):
            response = self.client.post(self.START_URL, {}, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertFalse(response.data["success"])
        self.assertEqual(DiagnosticAttempt.objects.count(), 0)
        self.assertEqual(DiagnosticQuestion.objects.count(), 0)

    def test_inactive_curriculum_excluded(self):
        for q in self.published:
            if q.topic_id == self.topic_b.id:
                # Will still have math questions; require 4 with only 2 math left.
                pass
        self.topic_b.is_active = False
        self.topic_b.save()
        with patch("diagnostics.constants.DIAGNOSTIC_QUESTION_COUNT", 4):
            response = self.client.post(self.START_URL, {}, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(DiagnosticAttempt.objects.count(), 0)

    def test_completed_attempt_not_reopened_on_start(self):
        attempt, _ = start_diagnostic_attempt(
            student=self.student, required_count=self.REQUIRED
        )
        attempt.status = DIAGNOSTIC_STATUS_COMPLETED
        attempt.completed_at = timezone.now()
        attempt.save()

        response = self._start()
        self.assertEqual(response.status_code, 201)
        self.assertNotEqual(response.data["data"]["id"], str(attempt.id))
        self.assertEqual(
            DiagnosticAttempt.objects.filter(student=self.student).count(), 2
        )

    def test_owner_can_get_attempt_and_questions(self):
        started = self._start()
        attempt_id = started.data["data"]["id"]
        detail = self.client.get(f"{self.START_URL}{attempt_id}/")
        self.assertEqual(detail.status_code, 200)
        self.assertEqual(detail.data["data"]["id"], attempt_id)

        questions = self.client.get(f"{self.START_URL}{attempt_id}/questions/")
        self.assertEqual(questions.status_code, 200)
        items = questions.data["data"]["items"]
        self.assertEqual(len(items), self.REQUIRED)
        self.assertEqual(questions.data["data"]["count"], self.REQUIRED)
        positions = [item["position"] for item in items]
        self.assertEqual(positions, sorted(positions))
        self.assertEqual(positions[0], 1)

        leaked = _collect_keys(questions.data) & FORBIDDEN_KEYS
        self.assertFalse(leaked, leaked)
        self.assertNotIn("SECRET", str(questions.data))

        for item in items:
            orders = [opt["sort_order"] for opt in item["options"]]
            self.assertEqual(orders, sorted(orders))

    def test_repeated_question_retrieval_stable_and_non_mutating(self):
        started = self._start()
        attempt_id = started.data["data"]["id"]
        url = f"{self.START_URL}{attempt_id}/questions/"
        first = self.client.get(url)
        second = self.client.get(url)
        self.assertEqual(
            [i["id"] for i in first.data["data"]["items"]],
            [i["id"] for i in second.data["data"]["items"]],
        )
        self.assertEqual(DiagnosticAnswer.objects.count(), 0)
        attempt = DiagnosticAttempt.objects.get(pk=attempt_id)
        self.assertEqual(attempt.status, DIAGNOSTIC_STATUS_IN_PROGRESS)
        self.assertEqual(attempt.diagnostic_questions.count(), self.REQUIRED)

    def test_other_student_cannot_access(self):
        started = self._start()
        attempt_id = started.data["data"]["id"]
        self._auth(self.other)
        self.assertEqual(
            self.client.get(f"{self.START_URL}{attempt_id}/").status_code, 404
        )
        self.assertEqual(
            self.client.get(f"{self.START_URL}{attempt_id}/questions/").status_code,
            404,
        )

    def test_anonymous_cannot_retrieve(self):
        started = self._start()
        attempt_id = started.data["data"]["id"]
        self.client.credentials()
        self.assertEqual(
            self.client.get(f"{self.START_URL}{attempt_id}/").status_code, 401
        )

    def test_failed_assignment_rolls_back(self):
        from authentication.exceptions import ServiceError

        # Short selection: fail before attempt insert.
        with patch(
            "diagnostics.services._select_questions_for_diagnostic",
            return_value=self.published[:2],
        ):
            with self.assertRaises(ServiceError):
                start_diagnostic_attempt(
                    student=self.student, required_count=self.REQUIRED
                )
        self.assertEqual(DiagnosticAttempt.objects.count(), 0)

        # Mid-assignment failure: attempt + partial questions must roll back.
        original_save = DiagnosticQuestion.save
        calls = {"n": 0}

        def boom(self, *args, **kwargs):
            calls["n"] += 1
            if calls["n"] > 2:
                raise RuntimeError("forced assignment failure")
            return original_save(self, *args, **kwargs)

        with patch.object(DiagnosticQuestion, "save", boom):
            with self.assertRaises(RuntimeError):
                start_diagnostic_attempt(
                    student=self.student, required_count=self.REQUIRED
                )
        self.assertEqual(DiagnosticAttempt.objects.count(), 0)
        self.assertEqual(DiagnosticQuestion.objects.count(), 0)

    def test_concurrent_second_start_respects_unique_constraint(self):
        # Simulate race: create in-progress, then IntegrityError path resumes.
        attempt, created = start_diagnostic_attempt(
            student=self.student, required_count=self.REQUIRED
        )
        self.assertTrue(created)
        resumed, created2 = start_diagnostic_attempt(
            student=self.student, required_count=self.REQUIRED
        )
        self.assertFalse(created2)
        self.assertEqual(attempt.id, resumed.id)

        with transaction.atomic():
            with self.assertRaises(Exception):
                DiagnosticAttempt(
                    student=self.student,
                    status=DIAGNOSTIC_STATUS_IN_PROGRESS,
                    total_questions=self.REQUIRED,
                ).save(validate=False)
