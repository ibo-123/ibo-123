from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.test import TestCase
from django.utils import timezone

from curriculum.models import Concept, Subject, Topic, Unit
from questions.constants import (
    DIFFICULTY_MAX,
    DIFFICULTY_MIN,
    EXAM_YEAR_MIN,
    MIN_OPTIONS_FOR_PUBLISH,
    QUESTION_STATUS_DRAFT,
    QUESTION_STATUS_PUBLISHED,
)
from questions.models import Question, QuestionOption


class QuestionValidationTests(TestCase):
    def setUp(self):
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

    def _draft(self, **kwargs):
        defaults = {
            "prompt": "What is the discriminant?",
            "topic": self.topic,
            "concept": self.concept,
            "difficulty": 3,
        }
        defaults.update(kwargs)
        return Question.objects.create(**defaults)

    def _publish_ready(self, question):
        options = [
            QuestionOption.objects.create(
                question=question, text=f"Opt {i}", sort_order=i
            )
            for i in range(MIN_OPTIONS_FOR_PUBLISH)
        ]
        question.correct_option = options[0]
        question.status = QUESTION_STATUS_PUBLISHED
        question.save()
        return options

    def test_difficulty_boundaries_accepted(self):
        low = self._draft(difficulty=DIFFICULTY_MIN, prompt="Low")
        high = self._draft(difficulty=DIFFICULTY_MAX, prompt="High")
        self.assertEqual(low.difficulty, 1)
        self.assertEqual(high.difficulty, 5)

    def test_difficulty_below_min_rejected(self):
        with self.assertRaises(ValidationError) as ctx:
            self._draft(difficulty=0)
        self.assertIn("difficulty", ctx.exception.message_dict)

    def test_difficulty_above_max_rejected(self):
        with self.assertRaises(ValidationError) as ctx:
            self._draft(difficulty=6)
        self.assertIn("difficulty", ctx.exception.message_dict)

    def test_difficulty_db_check_constraint(self):
        question = self._draft()
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Question.objects.filter(pk=question.pk).update(difficulty=0)

    def test_estimated_time_zero_rejected(self):
        with self.assertRaises(ValidationError) as ctx:
            self._draft(estimated_time_seconds=0)
        self.assertIn("estimated_time_seconds", ctx.exception.message_dict)

    def test_estimated_time_null_allowed(self):
        question = self._draft(estimated_time_seconds=None)
        self.assertIsNone(question.estimated_time_seconds)

    def test_estimated_time_positive_accepted(self):
        question = self._draft(estimated_time_seconds=90)
        self.assertEqual(question.estimated_time_seconds, 90)

    def test_estimated_time_db_rejects_zero(self):
        question = self._draft()
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Question.objects.filter(pk=question.pk).update(
                    estimated_time_seconds=0
                )

    def test_exam_year_too_old_rejected(self):
        with self.assertRaises(ValidationError) as ctx:
            self._draft(exam_year=EXAM_YEAR_MIN - 1)
        self.assertIn("exam_year", ctx.exception.message_dict)

    def test_exam_year_too_far_future_rejected(self):
        with self.assertRaises(ValidationError) as ctx:
            self._draft(exam_year=timezone.now().year + 2)
        self.assertIn("exam_year", ctx.exception.message_dict)

    def test_exam_year_and_source_optional(self):
        question = self._draft(exam_year=None, source="")
        self.assertIsNone(question.exam_year)
        self.assertEqual(question.source, "")

    def test_source_whitespace_normalized(self):
        question = self._draft(source="  Entrance Exam  ")
        self.assertEqual(question.source, "Entrance Exam")

    def test_blank_prompt_rejected(self):
        with self.assertRaises(ValidationError) as ctx:
            self._draft(prompt="   ")
        self.assertIn("prompt", ctx.exception.message_dict)

    def test_concept_must_match_topic(self):
        with self.assertRaises(ValidationError) as ctx:
            self._draft(concept=self.other_concept)
        self.assertIn("concept", ctx.exception.message_dict)

    def test_draft_incomplete_ok(self):
        question = self._draft()
        self.assertEqual(question.status, QUESTION_STATUS_DRAFT)
        self.assertEqual(question.options.count(), 0)
        self.assertIsNone(question.correct_option_id)

    def test_publish_requires_active_curriculum(self):
        question = self._draft()
        options = [
            QuestionOption.objects.create(
                question=question, text=f"Opt {i}", sort_order=i
            )
            for i in range(MIN_OPTIONS_FOR_PUBLISH)
        ]
        question.correct_option = options[0]
        self.topic.is_active = False
        self.topic.save()
        question.status = QUESTION_STATUS_PUBLISHED
        with self.assertRaises(ValidationError) as ctx:
            question.save()
        self.assertIn("topic", ctx.exception.message_dict)

    def test_publish_requires_active_concept(self):
        question = self._draft()
        options = [
            QuestionOption.objects.create(
                question=question, text=f"Opt {i}", sort_order=i
            )
            for i in range(MIN_OPTIONS_FOR_PUBLISH)
        ]
        question.correct_option = options[0]
        self.concept.is_active = False
        self.concept.save()
        question.status = QUESTION_STATUS_PUBLISHED
        with self.assertRaises(ValidationError) as ctx:
            question.save()
        self.assertIn("concept", ctx.exception.message_dict)

    def test_valid_publication(self):
        question = self._draft(exam_year=2025, source="Entrance Exam")
        self._publish_ready(question)
        question.refresh_from_db()
        self.assertEqual(question.status, QUESTION_STATUS_PUBLISHED)

    def test_cannot_delete_any_option_from_published(self):
        question = self._draft()
        options = self._publish_ready(question)
        with self.assertRaises(ValidationError):
            options[1].delete()
        self.assertEqual(question.options.count(), MIN_OPTIONS_FOR_PUBLISH)

    def test_queryset_update_bypasses_validation_documented(self):
        """Bulk update skips save()/clean — callers must not use it for status."""
        question = self._draft()
        # This succeeds at the DB layer (status check allows published) but
        # leaves an incomplete published row — proving why services must use save().
        Question.objects.filter(pk=question.pk).update(status=QUESTION_STATUS_PUBLISHED)
        question.refresh_from_db()
        self.assertEqual(question.status, QUESTION_STATUS_PUBLISHED)
        with self.assertRaises(ValidationError):
            question.save()
