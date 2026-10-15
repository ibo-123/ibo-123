from django.core.management import call_command
from django.test import TestCase

from curriculum.models import Subject, Topic, Unit
from curriculum.services import selectable_subjects_queryset
from users.models import Stream


class SeedCurriculumCommandTests(TestCase):
    def test_seed_curriculum_creates_expected_grade_12_subjects(self):
        call_command("seed_curriculum")

        subjects = Subject.objects.filter(grade=12, is_active=True).order_by(
            "sort_order", "name"
        )
        names = list(subjects.values_list("name", flat=True))
        self.assertEqual(
            names,
            [
                "Mathematics",
                "English",
                "Physics",
                "Chemistry",
                "Biology",
                "Economics",
                "Geography",
                "History",
            ],
        )

        math = Subject.objects.get(slug="mathematics", grade=12, stream__isnull=True)
        english = Subject.objects.get(slug="english", grade=12, stream__isnull=True)
        self.assertIsNone(math.stream)
        self.assertIsNone(english.stream)
        self.assertEqual(
            Subject.objects.get(slug="physics", grade=12).stream,
            Stream.NATURAL_SCIENCE,
        )
        self.assertEqual(
            Subject.objects.get(slug="history", grade=12).stream,
            Stream.SOCIAL_SCIENCE,
        )

    def test_seed_curriculum_is_idempotent(self):
        call_command("seed_curriculum")
        counts = (
            Subject.objects.count(),
            Unit.objects.count(),
            Topic.objects.count(),
        )
        self.assertGreater(counts[0], 0)
        self.assertGreater(counts[1], 0)
        self.assertGreater(counts[2], 0)

        call_command("seed_curriculum")
        self.assertEqual(
            (
                Subject.objects.count(),
                Unit.objects.count(),
                Topic.objects.count(),
            ),
            counts,
        )

    def test_natural_and_social_science_filtering(self):
        call_command("seed_curriculum")

        natural = set(
            selectable_subjects_queryset(12, Stream.NATURAL_SCIENCE).values_list(
                "slug", flat=True
            )
        )
        social = set(
            selectable_subjects_queryset(12, Stream.SOCIAL_SCIENCE).values_list(
                "slug", flat=True
            )
        )

        self.assertEqual(
            natural,
            {"mathematics", "english", "physics", "chemistry", "biology"},
        )
        self.assertEqual(
            social,
            {"mathematics", "english", "economics", "geography", "history"},
        )
        self.assertTrue({"mathematics", "english"} <= (natural & social))

    def test_subject_unit_topic_hierarchy(self):
        call_command("seed_curriculum")

        for subject in Subject.objects.filter(grade=12, is_active=True):
            units = list(subject.units.filter(is_active=True).order_by("sort_order"))
            self.assertGreaterEqual(len(units), 3, msg=subject.name)
            self.assertEqual(
                [unit.sort_order for unit in units[:3]],
                [1, 2, 3],
            )
            for unit in units:
                topics = list(unit.topics.filter(is_active=True).order_by("sort_order"))
                self.assertGreaterEqual(len(topics), 3, msg=f"{subject.name}/{unit.name}")
                self.assertEqual(
                    [topic.sort_order for topic in topics[:3]],
                    [1, 2, 3],
                )
                for topic in topics:
                    self.assertIn(topic.estimated_study_minutes, {30, 45, 60})
                    self.assertEqual(topic.unit_id, unit.id)
