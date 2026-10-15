from django.core.exceptions import ValidationError
from django.test import TestCase

from curriculum.models import Concept, Subject, Topic, Unit
from questions.constants import (
    QUESTION_STATUS_DRAFT,
    QUESTION_STATUS_PUBLISHED,
    QUESTION_TYPE_MCQ_SINGLE,
)
from questions.models import Question, QuestionOption


class QuestionModelTests(TestCase):
    def setUp(self):
        self.subject = Subject.objects.create(
            name="Mathematics",
            slug="mathematics",
            grade=12,
            stream=None,
            sort_order=1,
        )
        self.unit = Unit.objects.create(
            subject=self.subject,
            name="Algebra",
            slug="algebra",
            sort_order=1,
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

    def test_create_draft_question_with_valid_curriculum_links(self):
        question = Question.objects.create(
            prompt="What is the discriminant of x^2 - 5x + 6 = 0?",
            topic=self.topic,
            concept=self.concept,
            difficulty=3,
            estimated_time_seconds=60,
            source="Entrance Exam",
            exam_year=2025,
            explanation="b^2 - 4ac = 1",
        )
        self.assertEqual(question.status, QUESTION_STATUS_DRAFT)
        self.assertEqual(question.question_type, QUESTION_TYPE_MCQ_SINGLE)
        self.assertEqual(question.subject.id, self.subject.id)
        self.assertEqual(question.unit.id, self.unit.id)

    def test_concept_must_belong_to_topic(self):
        with self.assertRaises(ValidationError) as ctx:
            Question.objects.create(
                prompt="Invalid hierarchy",
                topic=self.topic,
                concept=self.other_concept,
                difficulty=2,
            )
        self.assertIn("concept", ctx.exception.message_dict)

    def test_difficulty_out_of_range_rejected(self):
        with self.assertRaises(ValidationError):
            Question.objects.create(
                prompt="Too hard",
                topic=self.topic,
                concept=self.concept,
                difficulty=9,
            )

    def test_published_status_persists(self):
        question = Question.objects.create(
            prompt="Published prompt",
            topic=self.topic,
            concept=self.concept,
            difficulty=1,
            status=QUESTION_STATUS_DRAFT,
        )
        options = [
            QuestionOption.objects.create(
                question=question, text=f"Opt {i}", sort_order=i
            )
            for i in range(4)
        ]
        question.correct_option = options[0]
        question.status = QUESTION_STATUS_PUBLISHED
        question.save()
        question.refresh_from_db()
        self.assertEqual(question.status, QUESTION_STATUS_PUBLISHED)

    def test_subject_filter_via_topic_unit_subject(self):
        question = Question.objects.create(
            prompt="Math Q",
            topic=self.topic,
            concept=self.concept,
            difficulty=2,
            status=QUESTION_STATUS_DRAFT,
        )
        options = [
            QuestionOption.objects.create(
                question=question, text=f"Opt {i}", sort_order=i
            )
            for i in range(4)
        ]
        question.correct_option = options[0]
        question.status = QUESTION_STATUS_PUBLISHED
        question.save()
        qs = Question.objects.filter(
            status=QUESTION_STATUS_PUBLISHED,
            topic__unit__subject=self.subject,
        )
        self.assertEqual(qs.count(), 1)
