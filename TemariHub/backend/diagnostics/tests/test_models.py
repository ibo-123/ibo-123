"""Model / constraint tests for the diagnostics foundation (Task 8)."""

from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.test import TestCase
from django.utils import timezone

from authentication.exceptions import ServiceError
from curriculum.models import Concept, Subject, Topic, Unit
from diagnostics.constants import (
    DIAGNOSTIC_STATUS_COMPLETED,
    DIAGNOSTIC_STATUS_IN_PROGRESS,
)
from diagnostics.models import DiagnosticAnswer, DiagnosticAttempt, DiagnosticQuestion
from questions.constants import (
    MIN_OPTIONS_FOR_PUBLISH,
    QUESTION_STATUS_PUBLISHED,
)
from questions.models import Question, QuestionOption
from questions.services import create_question, delete_question
from users.models import User


class DiagnosticModelTests(TestCase):
    def setUp(self):
        self.student = User.objects.create_user(
            "0912348101",
            password="Str0ng-Entrance-2026",
            phone_verified_at=timezone.now(),
        )
        self.other_student = User.objects.create_user(
            "0912348102",
            password="Str0ng-Entrance-2026",
            phone_verified_at=timezone.now(),
        )
        self.staff = User.objects.create_user(
            "0912348103",
            password="Str0ng-Entrance-2026",
            phone_verified_at=timezone.now(),
            is_staff=True,
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
            name="Functions",
            slug="functions",
            sort_order=1,
        )
        self.concept = Concept.objects.create(
            topic=self.topic,
            name="Function Notation",
            slug="function-notation",
            sort_order=1,
        )
        self.q1 = self._make_question("Prompt one?")
        self.q2 = self._make_question("Prompt two?")

    def _make_question(self, prompt):
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
            },
            created_by=self.staff,
        )

    def _start_attempt(self, student=None):
        return DiagnosticAttempt.objects.create(
            student=student or self.student,
            status=DIAGNOSTIC_STATUS_IN_PROGRESS,
            total_questions=2,
        )

    def test_attempt_belongs_to_student(self):
        attempt = self._start_attempt()
        self.assertEqual(attempt.student_id, self.student.id)
        self.assertEqual(self.student.diagnostic_attempts.count(), 1)

    def test_diagnostic_question_belongs_to_attempt(self):
        attempt = self._start_attempt()
        dq = DiagnosticQuestion.objects.create(
            attempt=attempt, question=self.q1, position=1
        )
        self.assertEqual(dq.attempt_id, attempt.id)
        self.assertEqual(attempt.diagnostic_questions.count(), 1)

    def test_answer_belongs_to_diagnostic_question(self):
        attempt = self._start_attempt()
        dq = DiagnosticQuestion.objects.create(
            attempt=attempt, question=self.q1, position=1
        )
        option = self.q1.options_in_order()[0]
        answer = DiagnosticAnswer.objects.create(
            diagnostic_question=dq,
            selected_option=option,
            answered_at=timezone.now(),
            time_spent_seconds=30,
        )
        self.assertEqual(answer.diagnostic_question_id, dq.id)
        self.assertEqual(dq.answer.id, answer.id)

    def test_cross_question_option_rejected(self):
        attempt = self._start_attempt()
        dq = DiagnosticQuestion.objects.create(
            attempt=attempt, question=self.q1, position=1
        )
        foreign_option = self.q2.options_in_order()[0]
        with self.assertRaises(ValidationError) as ctx:
            DiagnosticAnswer.objects.create(
                diagnostic_question=dq,
                selected_option=foreign_option,
                answered_at=timezone.now(),
            )
        self.assertIn("selected_option", ctx.exception.message_dict)

    def test_duplicate_position_rejected(self):
        attempt = self._start_attempt()
        DiagnosticQuestion.objects.create(
            attempt=attempt, question=self.q1, position=1
        )
        # Application path (full_clean) and DB constraint both reject duplicates.
        with self.assertRaises(ValidationError):
            DiagnosticQuestion.objects.create(
                attempt=attempt, question=self.q2, position=1
            )
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                DiagnosticQuestion(
                    attempt=attempt, question=self.q2, position=1
                ).save(validate=False)

    def test_duplicate_question_in_attempt_rejected(self):
        attempt = self._start_attempt()
        DiagnosticQuestion.objects.create(
            attempt=attempt, question=self.q1, position=1
        )
        with self.assertRaises(ValidationError):
            DiagnosticQuestion.objects.create(
                attempt=attempt, question=self.q1, position=2
            )
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                DiagnosticQuestion(
                    attempt=attempt, question=self.q1, position=2
                ).save(validate=False)

    def test_one_in_progress_per_student(self):
        self._start_attempt()
        with self.assertRaises(ValidationError):
            DiagnosticAttempt.objects.create(
                student=self.student,
                status=DIAGNOSTIC_STATUS_IN_PROGRESS,
            )
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                DiagnosticAttempt(
                    student=self.student,
                    status=DIAGNOSTIC_STATUS_IN_PROGRESS,
                ).save(validate=False)

    def test_multiple_completed_attempts_allowed(self):
        first = self._start_attempt()
        first.status = DIAGNOSTIC_STATUS_COMPLETED
        first.completed_at = timezone.now()
        first.overall_score_pct = Decimal("50.00")
        first.save()

        done_at = timezone.now()
        second = DiagnosticAttempt.objects.create(
            student=self.student,
            status=DIAGNOSTIC_STATUS_COMPLETED,
            started_at=done_at,
            completed_at=done_at,
            overall_score_pct=Decimal("70.00"),
        )
        self.assertEqual(
            DiagnosticAttempt.objects.filter(
                student=self.student, status=DIAGNOSTIC_STATUS_COMPLETED
            ).count(),
            2,
        )
        self.assertEqual(second.student_id, self.student.id)

    def test_invalid_status_rejected_by_choices_and_check(self):
        attempt = DiagnosticAttempt(
            student=self.student,
            status="abandoned",
        )
        with self.assertRaises(ValidationError):
            attempt.save()

    def test_completed_without_timestamp_rejected(self):
        attempt = DiagnosticAttempt(
            student=self.student,
            status=DIAGNOSTIC_STATUS_COMPLETED,
            completed_at=None,
        )
        with self.assertRaises(ValidationError):
            attempt.save()

    def test_in_progress_with_score_rejected(self):
        attempt = DiagnosticAttempt(
            student=self.student,
            status=DIAGNOSTIC_STATUS_IN_PROGRESS,
            overall_score_pct=Decimal("10.00"),
        )
        with self.assertRaises(ValidationError):
            attempt.save()

    def test_unanswered_answer_allowed(self):
        attempt = self._start_attempt()
        dq = DiagnosticQuestion.objects.create(
            attempt=attempt, question=self.q1, position=1
        )
        answer = DiagnosticAnswer.objects.create(diagnostic_question=dq)
        self.assertIsNone(answer.selected_option_id)
        self.assertIsNone(answer.answered_at)

    def test_answered_requires_timestamp_and_option_pairing(self):
        attempt = self._start_attempt()
        dq = DiagnosticQuestion.objects.create(
            attempt=attempt, question=self.q1, position=1
        )
        option = self.q1.options_in_order()[0]
        with self.assertRaises(ValidationError):
            DiagnosticAnswer.objects.create(
                diagnostic_question=dq,
                selected_option=option,
                answered_at=None,
            )

    def test_delete_referenced_question_blocked_by_service(self):
        attempt = self._start_attempt()
        DiagnosticQuestion.objects.create(
            attempt=attempt, question=self.q1, position=1
        )
        with self.assertRaises(ServiceError) as ctx:
            delete_question(question=self.q1)
        self.assertEqual(ctx.exception.status_code, 409)
        self.assertTrue(Question.objects.filter(pk=self.q1.pk).exists())
        self.assertTrue(DiagnosticAttempt.objects.filter(pk=attempt.pk).exists())

    def test_delete_referenced_option_protected(self):
        from django.db.models.deletion import ProtectedError

        from questions.constants import QUESTION_STATUS_DRAFT

        draft = create_question(
            data={
                "prompt": "Draft for option protect",
                "topic_id": self.topic.id,
                "concept_id": self.concept.id,
                "difficulty": 1,
                "status": QUESTION_STATUS_DRAFT,
                "options": [
                    {"text": f"D{i}", "sort_order": i}
                    for i in range(MIN_OPTIONS_FOR_PUBLISH)
                ],
                "correct_option_index": 0,
            },
            created_by=self.staff,
        )
        attempt = self._start_attempt()
        dq = DiagnosticQuestion.objects.create(
            attempt=attempt, question=draft, position=1
        )
        option = draft.options_in_order()[1]
        DiagnosticAnswer.objects.create(
            diagnostic_question=dq,
            selected_option=option,
            answered_at=timezone.now(),
        )
        with self.assertRaises(ProtectedError):
            option.delete()
        self.assertTrue(QuestionOption.objects.filter(pk=option.pk).exists())
        self.assertTrue(DiagnosticAnswer.objects.filter(diagnostic_question=dq).exists())

    def test_unreferenced_question_still_deletable(self):
        delete_question(question=self.q2)
        self.assertFalse(Question.objects.filter(pk=self.q2.pk).exists())

    def test_deleting_student_cascades_attempts_not_questions(self):
        attempt = self._start_attempt()
        DiagnosticQuestion.objects.create(
            attempt=attempt, question=self.q1, position=1
        )
        student_id = self.student.id
        self.student.delete()
        self.assertFalse(
            DiagnosticAttempt.objects.filter(student_id=student_id).exists()
        )
        self.assertTrue(Question.objects.filter(pk=self.q1.pk).exists())
