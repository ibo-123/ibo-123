from django.core.exceptions import ValidationError
from django.test import TestCase

from curriculum.models import Concept, Subject, Topic, Unit
from questions.constants import (
    MIN_OPTIONS_FOR_PUBLISH,
    QUESTION_STATUS_DRAFT,
    QUESTION_STATUS_PUBLISHED,
)
from questions.models import Question, QuestionOption


class QuestionOptionAndAnswerTests(TestCase):
    def setUp(self):
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
            unit=unit,
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
        self.question = Question.objects.create(
            prompt="What is the discriminant of x^2 - 5x + 6 = 0?",
            topic=self.topic,
            concept=self.concept,
            difficulty=3,
            explanation="b^2 - 4ac = 1",
        )
        self.other = Question.objects.create(
            prompt="Other question",
            topic=self.topic,
            concept=self.concept,
            difficulty=2,
        )

    def _add_options(self, question, texts=None):
        texts = texts or [f"Option {i}" for i in range(1, MIN_OPTIONS_FOR_PUBLISH + 1)]
        options = []
        for index, text in enumerate(texts):
            options.append(
                QuestionOption.objects.create(
                    question=question,
                    text=text,
                    sort_order=index,
                )
            )
        return options

    def test_create_valid_options(self):
        options = self._add_options(self.question)
        self.assertEqual(self.question.options.count(), MIN_OPTIONS_FOR_PUBLISH)
        self.assertEqual(options[0].question_id, self.question.id)

    def test_blank_option_text_rejected(self):
        with self.assertRaises(ValidationError) as ctx:
            QuestionOption.objects.create(
                question=self.question,
                text="   ",
                sort_order=0,
            )
        self.assertIn("text", ctx.exception.message_dict)

    def test_options_ordered_deterministically(self):
        b = QuestionOption.objects.create(
            question=self.question, text="B", sort_order=2
        )
        a = QuestionOption.objects.create(
            question=self.question, text="A", sort_order=0
        )
        c = QuestionOption.objects.create(
            question=self.question, text="C", sort_order=1
        )
        ordered = list(self.question.options_in_order())
        self.assertEqual([opt.text for opt in ordered], ["A", "C", "B"])
        self.assertEqual(ordered[0], a)
        self.assertEqual(ordered[1], c)
        self.assertEqual(ordered[2], b)

    def test_correct_option_same_question_accepted(self):
        options = self._add_options(self.question)
        self.question.correct_option = options[1]
        self.question.status = QUESTION_STATUS_PUBLISHED
        self.question.save()
        self.question.refresh_from_db()
        self.assertEqual(self.question.correct_option_id, options[1].id)
        self.assertEqual(self.question.status, QUESTION_STATUS_PUBLISHED)

    def test_correct_option_from_other_question_rejected(self):
        foreign = QuestionOption.objects.create(
            question=self.other, text="Foreign", sort_order=0
        )
        self.question.correct_option = foreign
        with self.assertRaises(ValidationError) as ctx:
            self.question.save()
        self.assertIn("correct_option", ctx.exception.message_dict)

    def test_publish_without_correct_answer_rejected(self):
        self._add_options(self.question)
        self.question.status = QUESTION_STATUS_PUBLISHED
        with self.assertRaises(ValidationError) as ctx:
            self.question.save()
        self.assertIn("correct_option", ctx.exception.message_dict)

    def test_publish_with_insufficient_options_rejected(self):
        options = self._add_options(self.question, texts=["A", "B", "C"])
        self.question.correct_option = options[0]
        self.question.status = QUESTION_STATUS_PUBLISHED
        with self.assertRaises(ValidationError) as ctx:
            self.question.save()
        self.assertIn("status", ctx.exception.message_dict)

    def test_publish_with_too_many_options_rejected(self):
        options = self._add_options(
            self.question, texts=["A", "B", "C", "D", "E"]
        )
        self.question.correct_option = options[0]
        self.question.status = QUESTION_STATUS_PUBLISHED
        with self.assertRaises(ValidationError) as ctx:
            self.question.save()
        self.assertIn("status", ctx.exception.message_dict)

    def test_draft_lifecycle_then_publish(self):
        self.assertEqual(self.question.status, QUESTION_STATUS_DRAFT)
        options = self._add_options(self.question)
        self.question.correct_option = options[0]
        self.question.status = QUESTION_STATUS_PUBLISHED
        self.question.save()
        self.question.refresh_from_db()
        self.assertEqual(self.question.status, QUESTION_STATUS_PUBLISHED)
        self.assertEqual(self.question.explanation, "b^2 - 4ac = 1")

    def test_delete_correct_option_on_published_rejected(self):
        options = self._add_options(self.question)
        self.question.correct_option = options[0]
        self.question.status = QUESTION_STATUS_PUBLISHED
        self.question.save()
        with self.assertRaises(ValidationError):
            options[0].delete()
        self.question.refresh_from_db()
        self.assertEqual(self.question.correct_option_id, options[0].id)

    def test_delete_non_correct_option_on_published_rejected(self):
        options = self._add_options(self.question)
        self.question.correct_option = options[0]
        self.question.status = QUESTION_STATUS_PUBLISHED
        self.question.save()
        with self.assertRaises(ValidationError):
            options[2].delete()
        self.assertEqual(self.question.options.count(), MIN_OPTIONS_FOR_PUBLISH)

    def test_delete_correct_option_on_draft_clears_reference(self):
        options = self._add_options(self.question)
        self.question.correct_option = options[0]
        self.question.save()
        options[0].delete()
        self.question.refresh_from_db()
        self.assertIsNone(self.question.correct_option_id)
        self.assertEqual(self.question.options.count(), MIN_OPTIONS_FOR_PUBLISH - 1)

    def test_options_do_not_store_is_correct_field(self):
        option = QuestionOption.objects.create(
            question=self.question, text="Only text", sort_order=0
        )
        field_names = {f.name for f in QuestionOption._meta.get_fields()}
        self.assertNotIn("is_correct", field_names)
        self.assertTrue(hasattr(option, "text"))
