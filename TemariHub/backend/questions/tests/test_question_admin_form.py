from django.contrib.admin.sites import AdminSite
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.test import RequestFactory, TestCase

from curriculum.models import Concept, Subject, Topic, Unit
from questions.admin import QuestionAdmin, QuestionAdminForm
from questions.constants import (
    MIN_OPTIONS_FOR_PUBLISH,
    QUESTION_STATUS_DRAFT,
    QUESTION_STATUS_PUBLISHED,
)
from questions.models import Question, QuestionOption

User = get_user_model()


class QuestionAdminFormTests(TestCase):
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
        topic = Topic.objects.create(
            unit=unit, name="Quadratics", slug="quadratics", sort_order=1
        )
        concept = Concept.objects.create(
            topic=topic, name="Discriminant", slug="discriminant", sort_order=1
        )
        self.question = Question.objects.create(
            prompt="Admin workflow question?",
            topic=topic,
            concept=concept,
            difficulty=2,
        )
        self.options = [
            QuestionOption.objects.create(
                question=self.question,
                text=f"Choice {i}",
                sort_order=i,
            )
            for i in range(MIN_OPTIONS_FOR_PUBLISH)
        ]
        self.staff = User.objects.create_user(
            "0912346099",
            password="Str0ng-Entrance-2026",
            is_staff=True,
        )
        self.site = AdminSite()
        self.admin = QuestionAdmin(Question, self.site)
        self.factory = RequestFactory()

    def test_form_limits_correct_option_queryset_to_own_options(self):
        other = Question.objects.create(
            prompt="Other",
            topic=self.question.topic,
            concept=self.question.concept,
            difficulty=1,
        )
        QuestionOption.objects.create(question=other, text="Foreign", sort_order=0)
        form = QuestionAdminForm(instance=self.question)
        ids = set(form.fields["correct_option"].queryset.values_list("id", flat=True))
        self.assertEqual(ids, {opt.id for opt in self.options})

    def test_save_related_publishes_when_valid(self):
        request = self.factory.post("/admin/questions/question/")
        request.user = self.staff
        form = QuestionAdminForm(
            data={
                "prompt": self.question.prompt,
                "question_type": self.question.question_type,
                "status": QUESTION_STATUS_PUBLISHED,
                "topic": str(self.question.topic_id),
                "concept": str(self.question.concept_id),
                "difficulty": self.question.difficulty,
                "estimated_time_seconds": "",
                "source": "",
                "exam_year": "",
                "explanation": "Because.",
                "correct_option": str(self.options[0].id),
                "created_by": "",
            },
            instance=self.question,
        )
        self.assertTrue(form.is_valid(), form.errors)
        obj = form.save(commit=False)
        self.admin.save_model(request, obj, form, change=True)
        self.admin.save_related(request, form, formsets=[], change=True)
        self.question.refresh_from_db()
        self.assertEqual(self.question.status, QUESTION_STATUS_PUBLISHED)
        self.assertEqual(self.question.correct_option_id, self.options[0].id)

    def test_save_related_rejects_publish_without_correct_option(self):
        request = self.factory.post("/admin/questions/question/")
        request.user = self.staff
        form = QuestionAdminForm(
            data={
                "prompt": self.question.prompt,
                "question_type": self.question.question_type,
                "status": QUESTION_STATUS_PUBLISHED,
                "topic": str(self.question.topic_id),
                "concept": str(self.question.concept_id),
                "difficulty": self.question.difficulty,
                "estimated_time_seconds": "",
                "source": "",
                "exam_year": "",
                "explanation": "",
                "correct_option": "",
                "created_by": "",
            },
            instance=self.question,
        )
        self.assertTrue(form.is_valid(), form.errors)
        obj = form.save(commit=False)
        self.admin.save_model(request, obj, form, change=True)
        with self.assertRaises(ValidationError):
            self.admin.save_related(request, form, formsets=[], change=True)
        self.question.refresh_from_db()
        self.assertEqual(self.question.status, QUESTION_STATUS_DRAFT)
