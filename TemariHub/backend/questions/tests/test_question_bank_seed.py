"""Tests for seed_question_bank and validate_question_bank."""

from io import StringIO

from django.core.management import call_command
from django.test import TestCase
from django.utils import timezone

from curriculum.models import Concept, Subject, Topic, Unit
from questions.constants import (
    MIN_OPTIONS_FOR_PUBLISH,
    QUESTION_STATUS_DRAFT,
    QUESTION_STATUS_PUBLISHED,
)
from questions.models import Question
from questions.seed_data.constants import (
    ELIGIBLE_TARGET,
    question_id_for_seed_key,
    source_for_seed_key,
)
from questions.seeding import seed_question_bank
from questions.services import create_question, student_eligible_question_queryset
from questions.validation_report import build_question_bank_report
from users.models import User


def _mini_blueprints(topic_slug="sets-and-intervals"):
    return [
        {
            "seed_key": "test.math.sets.001",
            "subject_slug": "mathematics",
            "unit_slug": "algebra",
            "topic_slug": topic_slug,
            "concept_slug": "set-membership",
            "concept_name": "Set Membership",
            "prompt": "Which number is an element of {2, 4, 6}?",
            "options": ["4", "1", "3", "5"],
            "correct_index": 0,
            "difficulty": 2,
            "explanation": "4 is listed in the set.",
            "estimated_time_seconds": 45,
        },
        {
            "seed_key": "test.math.sets.002",
            "subject_slug": "mathematics",
            "unit_slug": "algebra",
            "topic_slug": topic_slug,
            "concept_slug": "set-membership",
            "concept_name": "Set Membership",
            "prompt": "The empty set contains how many elements?",
            "options": ["0", "1", "2", "infinitely many"],
            "correct_index": 0,
            "difficulty": 1,
            "explanation": "By definition the empty set has no elements.",
            "estimated_time_seconds": 30,
        },
    ]


class QuestionBankSeedTests(TestCase):
    def setUp(self):
        self.staff = User.objects.create_user(
            "0912347401",
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
            name="Sets and Intervals",
            slug="sets-and-intervals",
            sort_order=1,
        )

    def test_seed_twice_is_idempotent(self):
        first = seed_question_bank(blueprints=_mini_blueprints())
        self.assertEqual(first.created, 2)
        self.assertEqual(first.failed, 0)
        self.assertEqual(Question.objects.count(), 2)
        self.assertEqual(Concept.objects.count(), 1)

        second = seed_question_bank(blueprints=_mini_blueprints())
        self.assertEqual(second.created, 0)
        self.assertEqual(second.updated, 0)
        self.assertEqual(second.skipped, 2)
        self.assertEqual(Question.objects.count(), 2)

        qid = question_id_for_seed_key("test.math.sets.001")
        question = Question.objects.get(pk=qid)
        self.assertEqual(question.status, QUESTION_STATUS_PUBLISHED)
        self.assertEqual(question.options.count(), MIN_OPTIONS_FOR_PUBLISH)
        self.assertEqual(question.correct_option.question_id, question.id)
        self.assertEqual(question.source, source_for_seed_key("test.math.sets.001"))

    def test_manual_questions_untouched(self):
        concept = Concept.objects.create(
            topic=self.topic, name="Manual", slug="manual", sort_order=1
        )
        manual = create_question(
            data={
                "prompt": "Manually authored question stays put",
                "topic_id": self.topic.id,
                "concept_id": concept.id,
                "difficulty": 3,
                "status": QUESTION_STATUS_PUBLISHED,
                "options": [
                    {"text": f"M{i}", "sort_order": i}
                    for i in range(MIN_OPTIONS_FOR_PUBLISH)
                ],
                "correct_option_index": 1,
                "source": "Manual Author",
            },
            created_by=self.staff,
        )
        seed_question_bank(blueprints=_mini_blueprints())
        seed_question_bank(blueprints=_mini_blueprints())
        manual.refresh_from_db()
        self.assertEqual(manual.prompt, "Manually authored question stays put")
        self.assertEqual(manual.source, "Manual Author")
        self.assertEqual(Question.objects.count(), 3)

    def test_dry_run_persists_nothing(self):
        stats = seed_question_bank(blueprints=_mini_blueprints(), dry_run=True)
        self.assertEqual(stats.created, 2)
        self.assertEqual(Question.objects.count(), 0)
        self.assertEqual(Concept.objects.count(), 0)

    def test_seeded_questions_are_valid_and_eligible(self):
        seed_question_bank(blueprints=_mini_blueprints())
        for question in Question.objects.all():
            self.assertEqual(question.status, QUESTION_STATUS_PUBLISHED)
            options = list(question.options_in_order())
            self.assertEqual(len(options), 4)
            texts = [o.text for o in options]
            self.assertEqual(len(texts), len(set(texts)))
            self.assertIsNotNone(question.correct_option_id)
            self.assertEqual(question.correct_option.question_id, question.id)
            self.assertEqual(question.concept.topic_id, question.topic_id)
            self.assertTrue(1 <= question.difficulty <= 5)
        self.assertEqual(student_eligible_question_queryset().count(), 2)

    def test_missing_topic_is_reported(self):
        stats = seed_question_bank(
            blueprints=_mini_blueprints(topic_slug="does-not-exist")
        )
        self.assertEqual(stats.created, 0)
        self.assertEqual(stats.failed, 2)
        self.assertTrue(stats.missing_topics)
        self.assertEqual(Question.objects.count(), 0)


class QuestionBankValidateCommandTests(TestCase):
    def setUp(self):
        self.staff = User.objects.create_user(
            "0912347402",
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
            name="Sets and Intervals",
            slug="sets-and-intervals",
            sort_order=1,
        )

    def test_validation_counts_and_read_only(self):
        seed_question_bank(blueprints=_mini_blueprints())
        concept = Concept.objects.get(slug="set-membership")
        create_question(
            data={
                "prompt": "Draft only",
                "topic_id": self.topic.id,
                "concept_id": concept.id,
                "difficulty": 2,
                "status": QUESTION_STATUS_DRAFT,
            },
            created_by=self.staff,
        )

        before = list(Question.objects.order_by("id").values_list("id", "status", "updated_at"))
        report = build_question_bank_report()
        after = list(Question.objects.order_by("id").values_list("id", "status", "updated_at"))

        self.assertEqual(before, after)
        self.assertEqual(report["total_questions"], 3)
        self.assertEqual(report["published"], 2)
        self.assertEqual(report["drafts"], 1)
        self.assertEqual(report["eligible_published"], 2)
        self.assertEqual(report["eligible_by_subject"]["Mathematics"], 2)
        self.assertFalse(report["eligible_target_met"])
        self.assertEqual(report["eligible_target"], ELIGIBLE_TARGET)

        self.topic.is_active = False
        self.topic.save()
        report2 = build_question_bank_report()
        self.assertEqual(report2["eligible_published"], 0)
        self.assertEqual(report2["published_on_inactive_curriculum"], 2)

    def test_validate_command_output(self):
        seed_question_bank(blueprints=_mini_blueprints())
        out = StringIO()
        err = StringIO()
        call_command("validate_question_bank", stdout=out, stderr=err)
        text = out.getvalue()
        self.assertIn("Eligible published", text)
        self.assertIn("NOT MET", err.getvalue() + text)

    def test_seed_command_dry_run(self):
        from unittest.mock import patch

        out = StringIO()
        with patch(
            "questions.seeding.get_question_blueprints",
            return_value=_mini_blueprints(),
        ):
            call_command("seed_question_bank", "--dry-run", stdout=out)
        self.assertEqual(Question.objects.count(), 0)
        self.assertEqual(Concept.objects.count(), 0)
        self.assertIn("Dry-run", out.getvalue())
