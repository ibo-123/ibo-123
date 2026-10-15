from django.test import TestCase
from django.utils import timezone

from curriculum.models import Subject, Topic, Unit
from mastery.constants import MIN_OBSERVATIONS_FOR_RANKING
from mastery.services import compute_student_mastery_snapshot, upsert_topic_mastery
from users.models import User


class MasteryAggregationTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            "0912345701",
            password="Str0ng-Entrance-2026",
            phone_verified_at=timezone.now(),
        )
        self.other = User.objects.create_user(
            "0912345702",
            password="Str0ng-Entrance-2026",
            phone_verified_at=timezone.now(),
        )
        self.math = Subject.objects.create(
            name="Mathematics", slug="mathematics", grade=12, stream=None, sort_order=1
        )
        self.physics = Subject.objects.create(
            name="Physics", slug="physics", grade=12, stream="natural_science", sort_order=2
        )
        self.chemistry = Subject.objects.create(
            name="Chemistry", slug="chemistry", grade=12, stream="natural_science", sort_order=3
        )
        self.math_unit = Unit.objects.create(subject=self.math, name="Algebra", slug="algebra")
        self.physics_unit = Unit.objects.create(
            subject=self.physics, name="Mechanics", slug="mechanics"
        )
        self.chem_unit = Unit.objects.create(
            subject=self.chemistry, name="Stoichiometry", slug="stoichiometry"
        )
        self.topic_quad = Topic.objects.create(
            unit=self.math_unit, name="Quadratics", slug="quadratics"
        )
        self.topic_trig = Topic.objects.create(
            unit=self.math_unit, name="Trigonometry", slug="trigonometry"
        )
        self.topic_force = Topic.objects.create(
            unit=self.physics_unit, name="Forces", slug="forces"
        )
        self.topic_eq = Topic.objects.create(
            unit=self.chem_unit, name="Equilibrium", slug="equilibrium"
        )
        self.topic_kinetics = Topic.objects.create(
            unit=self.chem_unit, name="Kinetics", slug="kinetics"
        )

    def _seed(self, user, topic, score, attempted=5, correct=None, accuracy=None):
        if correct is None:
            correct = int(round(attempted * float(score) / 100))
        if accuracy is None:
            accuracy = score
        return upsert_topic_mastery(
            user=user,
            topic=topic,
            mastery_score=score,
            questions_attempted=attempted,
            questions_correct=correct,
            accuracy_pct=accuracy,
        )

    def test_no_mastery_records_returns_unavailable(self):
        snap = compute_student_mastery_snapshot(
            self.user, selected_subjects=[self.math, self.physics]
        )
        self.assertIsNone(snap["overall_progress"])
        self.assertIsNone(snap["strongest_subject"])
        self.assertIsNone(snap["weakest_subject"])
        self.assertEqual(snap["strong_topics"], [])
        self.assertEqual(snap["weak_topics"], [])
        self.assertFalse(snap["available"])
        for summary in snap["subject_summaries"]:
            self.assertFalse(summary["available"])
            self.assertIsNone(summary["mastery"])

    def test_insufficient_observations_excluded_from_ranking(self):
        self._seed(self.user, self.topic_quad, 90, attempted=MIN_OBSERVATIONS_FOR_RANKING - 1)
        self._seed(self.user, self.topic_force, 20, attempted=MIN_OBSERVATIONS_FOR_RANKING - 1)
        snap = compute_student_mastery_snapshot(
            self.user, selected_subjects=[self.math, self.physics]
        )
        self.assertIsNone(snap["overall_progress"])
        self.assertFalse(snap["available"])
        self.assertEqual(snap["strong_topics"], [])
        self.assertEqual(snap["weak_topics"], [])

    def test_normal_aggregation_progress_subjects_and_topics(self):
        self._seed(self.user, self.topic_quad, 90, attempted=10, correct=9, accuracy=90)
        self._seed(self.user, self.topic_trig, 80, attempted=10, correct=8, accuracy=80)
        self._seed(self.user, self.topic_force, 30, attempted=10, correct=3, accuracy=30)
        self._seed(self.user, self.topic_eq, 35, attempted=10, correct=4, accuracy=35)

        snap = compute_student_mastery_snapshot(
            self.user, selected_subjects=[self.math, self.physics, self.chemistry]
        )

        # Mean of 90, 80, 30, 35 = 58.75 → 58.8
        self.assertEqual(snap["overall_progress"], 58.8)
        self.assertTrue(snap["available"])
        self.assertEqual(snap["strongest_subject"]["id"], self.math.id)
        self.assertEqual(snap["strongest_subject"]["mastery"], 85.0)
        self.assertEqual(snap["weakest_subject"]["id"], self.physics.id)
        self.assertEqual(snap["weakest_subject"]["mastery"], 30.0)

        strong_ids = [t["id"] for t in snap["strong_topics"]]
        weak_ids = [t["id"] for t in snap["weak_topics"]]
        self.assertEqual(strong_ids, [self.topic_quad.id, self.topic_trig.id])
        self.assertEqual(set(weak_ids), {self.topic_force.id, self.topic_eq.id})
        self.assertEqual(snap["strong_topics"][0]["mastery_band"], "strong")
        self.assertEqual(snap["weak_topics"][0]["mastery_band"], "needs_attention")

    def test_zero_mastery_is_distinct_from_unavailable(self):
        self._seed(self.user, self.topic_force, 0, attempted=5, correct=0, accuracy=0)
        snap = compute_student_mastery_snapshot(
            self.user, selected_subjects=[self.physics]
        )
        self.assertEqual(snap["overall_progress"], 0.0)
        self.assertTrue(snap["available"])
        self.assertEqual(snap["strongest_subject"]["mastery"], 0.0)
        self.assertIsNone(snap["weakest_subject"])  # only one eligible subject
        self.assertEqual(len(snap["weak_topics"]), 1)
        self.assertEqual(snap["weak_topics"][0]["mastery"], 0.0)

    def test_threshold_boundaries_for_strong_and_weak_topics(self):
        boundary_strong = Topic.objects.create(
            unit=self.math_unit, name="Boundary Strong", slug="boundary-strong"
        )
        just_below_strong = Topic.objects.create(
            unit=self.math_unit, name="Just Below Strong", slug="just-below-strong"
        )
        boundary_weak = Topic.objects.create(
            unit=self.physics_unit, name="Boundary Weak", slug="boundary-weak"
        )
        just_above_weak = Topic.objects.create(
            unit=self.physics_unit, name="Just Above Weak", slug="just-above-weak"
        )
        self._seed(self.user, boundary_strong, 80, attempted=5)
        self._seed(self.user, just_below_strong, 79.99, attempted=5)
        self._seed(self.user, boundary_weak, 39, attempted=5)
        self._seed(self.user, just_above_weak, 39.01, attempted=5)

        snap = compute_student_mastery_snapshot(
            self.user, selected_subjects=[self.math, self.physics]
        )
        strong_ids = {t["id"] for t in snap["strong_topics"]}
        weak_ids = {t["id"] for t in snap["weak_topics"]}
        self.assertIn(boundary_strong.id, strong_ids)
        self.assertNotIn(just_below_strong.id, strong_ids)
        self.assertIn(boundary_weak.id, weak_ids)
        self.assertNotIn(just_above_weak.id, weak_ids)

    def test_tied_subjects_break_by_name_then_id(self):
        self._seed(self.user, self.topic_quad, 50, attempted=5)
        self._seed(self.user, self.topic_force, 50, attempted=5)
        self._seed(self.user, self.topic_eq, 50, attempted=5)

        snap = compute_student_mastery_snapshot(
            self.user, selected_subjects=[self.math, self.physics, self.chemistry]
        )
        # All mastery 50: strongest → name ASC (Chemistry); weakest → name DESC (Physics)
        self.assertEqual(snap["strongest_subject"]["name"], "Chemistry")
        self.assertEqual(snap["weakest_subject"]["name"], "Physics")

    def test_tied_topics_are_ordered_deterministically(self):
        a = Topic.objects.create(unit=self.math_unit, name="Alpha Topic", slug="alpha-topic")
        b = Topic.objects.create(unit=self.math_unit, name="Beta Topic", slug="beta-topic")
        self._seed(self.user, a, 85, attempted=5)
        self._seed(self.user, b, 85, attempted=5)
        self._seed(self.user, self.topic_force, 20, attempted=5)
        c = Topic.objects.create(unit=self.physics_unit, name="A Weak", slug="a-weak")
        d = Topic.objects.create(unit=self.physics_unit, name="B Weak", slug="b-weak")
        self._seed(self.user, c, 20, attempted=5)
        self._seed(self.user, d, 20, attempted=5)

        snap = compute_student_mastery_snapshot(
            self.user, selected_subjects=[self.math, self.physics]
        )
        strong_names = [t["name"] for t in snap["strong_topics"]]
        weak_names = [t["name"] for t in snap["weak_topics"]]
        self.assertEqual(strong_names[:2], ["Alpha Topic", "Beta Topic"])
        # Weak sorted by mastery ASC then name; all 20 → name order
        self.assertEqual(weak_names, ["A Weak", "B Weak", "Forces"])

    def test_other_student_data_does_not_affect_snapshot(self):
        self._seed(self.other, self.topic_quad, 95, attempted=20)
        self._seed(self.other, self.topic_force, 10, attempted=20)
        snap = compute_student_mastery_snapshot(
            self.user, selected_subjects=[self.math, self.physics]
        )
        self.assertIsNone(snap["overall_progress"])
        self.assertFalse(snap["available"])

        self._seed(self.user, self.topic_quad, 70, attempted=5)
        snap = compute_student_mastery_snapshot(
            self.user, selected_subjects=[self.math, self.physics]
        )
        self.assertEqual(snap["overall_progress"], 70.0)
        self.assertEqual(snap["strongest_subject"]["id"], self.math.id)
        self.assertNotEqual(snap["strongest_subject"]["mastery"], 95.0)

    def test_unattempted_topic_is_not_classified_weak(self):
        self._seed(self.user, self.topic_quad, 85, attempted=5)
        # topic_force exists in curriculum but has no mastery row
        snap = compute_student_mastery_snapshot(
            self.user, selected_subjects=[self.math, self.physics]
        )
        weak_ids = {t["id"] for t in snap["weak_topics"]}
        self.assertNotIn(self.topic_force.id, weak_ids)
        self.assertEqual(len(snap["strong_topics"]), 1)
