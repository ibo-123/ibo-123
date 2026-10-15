from django.test import TestCase
from django.utils import timezone

from curriculum.models import Subject, Topic, Unit
from learning_path.constants import (
    ACTIVITY_PRACTICE,
    ACTIVITY_STUDY_TOPIC,
    PATH_STATUS_COMPLETED,
    PATH_STATUS_IN_PROGRESS,
    PATH_STATUS_NOT_STARTED,
    PATH_STATUS_UNAVAILABLE,
)
from learning_path.models import LearningPathItem, PathItemStatus
from learning_path.services import (
    compute_learning_path_snapshot,
    ensure_learning_path,
    sync_learning_path_items,
)
from mastery.services import upsert_topic_mastery
from users.models import StudentSelectedSubject, User


class LearningPathSnapshotTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            "0912345901",
            password="Str0ng-Entrance-2026",
            phone_verified_at=timezone.now(),
        )
        self.other = User.objects.create_user(
            "0912345902",
            password="Str0ng-Entrance-2026",
            phone_verified_at=timezone.now(),
        )
        self.math = Subject.objects.create(
            name="Mathematics", slug="mathematics", grade=12, stream=None, sort_order=1
        )
        self.physics = Subject.objects.create(
            name="Physics", slug="physics", grade=12, stream="natural_science", sort_order=2
        )
        math_unit = Unit.objects.create(subject=self.math, name="Algebra", slug="algebra")
        phys_unit = Unit.objects.create(
            subject=self.physics, name="Mechanics", slug="mechanics"
        )
        self.topic_quad = Topic.objects.create(
            unit=math_unit, name="Quadratics", slug="quadratics", sort_order=1
        )
        self.topic_trig = Topic.objects.create(
            unit=math_unit, name="Trigonometry", slug="trigonometry", sort_order=2
        )
        self.topic_force = Topic.objects.create(
            unit=phys_unit, name="Forces", slug="forces", sort_order=1
        )

    def _select(self, user, *subjects):
        for subject in subjects:
            StudentSelectedSubject.objects.get_or_create(user=user, subject=subject)

    def _seed_mastery(self, user, topic, score, attempted=5):
        upsert_topic_mastery(
            user=user,
            topic=topic,
            mastery_score=score,
            questions_attempted=attempted,
            questions_correct=int(round(attempted * float(score) / 100)),
            accuracy_pct=score,
        )

    def test_new_learner_without_selected_subjects_is_unavailable(self):
        snap = compute_learning_path_snapshot(self.user)
        self.assertFalse(snap["available"])
        self.assertIsNone(snap["current_topic"])
        self.assertIsNone(snap["recommended_activity"])
        self.assertEqual(snap["path_status"], PATH_STATUS_UNAVAILABLE)
        self.assertIsNone(snap["progress"])
        self.assertIsNone(snap["detail"])

    def test_enrolled_learner_not_started_gets_lowest_mastery_topic(self):
        self._select(self.user, self.math, self.physics)
        snap = compute_learning_path_snapshot(self.user)
        self.assertTrue(snap["available"])
        self.assertEqual(snap["path_status"], PATH_STATUS_NOT_STARTED)
        self.assertEqual(snap["progress"], 0.0)
        self.assertEqual(snap["total_topics"], 3)
        self.assertEqual(snap["completed_topics"], 0)
        # No mastery → all tied at null; deterministic by name then id.
        self.assertEqual(snap["current_topic"]["name"], "Forces")
        self.assertEqual(snap["recommended_activity"]["type"], ACTIVITY_STUDY_TOPIC)
        self.assertEqual(snap["recommended_activity"]["reason"], "never_practiced")

    def test_in_progress_item_is_preferred_as_current_topic(self):
        self._select(self.user, self.math, self.physics)
        path = sync_learning_path_items(self.user)
        force_item = path.items.get(topic=self.topic_force)
        trig_item = path.items.get(topic=self.topic_trig)
        force_item.status = PathItemStatus.RECOMMENDED
        force_item.save(update_fields=["status", "updated_at"])
        trig_item.status = PathItemStatus.IN_PROGRESS
        trig_item.reason = "in_progress"
        trig_item.save(update_fields=["status", "reason", "updated_at"])

        snap = compute_learning_path_snapshot(self.user, sync=True)
        self.assertEqual(snap["current_topic"]["name"], "Trigonometry")
        self.assertEqual(snap["current_topic"]["status"], PathItemStatus.IN_PROGRESS)
        self.assertEqual(snap["path_status"], PATH_STATUS_IN_PROGRESS)

    def test_practiced_below_strong_recommends_practice(self):
        self._select(self.user, self.math)
        self._seed_mastery(self.user, self.topic_quad, 50, attempted=8)
        self._seed_mastery(self.user, self.topic_trig, 90, attempted=8)
        snap = compute_learning_path_snapshot(self.user)
        self.assertEqual(snap["current_topic"]["name"], "Quadratics")
        self.assertEqual(snap["recommended_activity"]["type"], ACTIVITY_PRACTICE)
        self.assertEqual(snap["recommended_activity"]["reason"], "below_strong_mastery")
        self.assertEqual(snap["completed_topics"], 1)
        self.assertEqual(snap["progress"], 50.0)

    def test_completed_topic_is_not_recommended_again(self):
        self._select(self.user, self.math)
        self._seed_mastery(self.user, self.topic_quad, 85, attempted=10)
        self._seed_mastery(self.user, self.topic_trig, 40, attempted=10)
        snap = compute_learning_path_snapshot(self.user)
        self.assertEqual(snap["current_topic"]["name"], "Trigonometry")
        self.assertNotEqual(snap["current_topic"]["name"], "Quadratics")
        self.assertEqual(snap["recommended_activity"]["topic_name"], "Trigonometry")

    def test_mastery_ascending_recommendation_order(self):
        self._select(self.user, self.math, self.physics)
        self._seed_mastery(self.user, self.topic_quad, 70, attempted=5)
        self._seed_mastery(self.user, self.topic_trig, 20, attempted=5)
        self._seed_mastery(self.user, self.topic_force, 55, attempted=5)
        snap = compute_learning_path_snapshot(self.user)
        self.assertEqual(snap["current_topic"]["name"], "Trigonometry")
        self.assertEqual(snap["current_topic"]["mastery"], 20.0)

    def test_completed_path_has_no_next_activity(self):
        self._select(self.user, self.math)
        self._seed_mastery(self.user, self.topic_quad, 90, attempted=5)
        self._seed_mastery(self.user, self.topic_trig, 88, attempted=5)
        snap = compute_learning_path_snapshot(self.user)
        self.assertEqual(snap["path_status"], PATH_STATUS_COMPLETED)
        self.assertEqual(snap["progress"], 100.0)
        self.assertIsNone(snap["current_topic"])
        self.assertIsNone(snap["recommended_activity"])

    def test_empty_path_progress_is_null(self):
        ensure_learning_path(self.user)
        snap = compute_learning_path_snapshot(self.user, sync=False)
        self.assertFalse(snap["available"])
        self.assertIsNone(snap["progress"])
        self.assertEqual(snap["path_status"], PATH_STATUS_UNAVAILABLE)

    def test_other_student_mastery_does_not_affect_path(self):
        self._select(self.user, self.math)
        self._select(self.other, self.math)
        self._seed_mastery(self.other, self.topic_quad, 10, attempted=20)
        self._seed_mastery(self.user, self.topic_quad, 95, attempted=5)
        self._seed_mastery(self.user, self.topic_trig, 30, attempted=5)
        snap = compute_learning_path_snapshot(self.user)
        self.assertEqual(snap["current_topic"]["name"], "Trigonometry")
        self.assertEqual(snap["current_topic"]["mastery"], 30.0)

    def test_does_not_emit_review_prerequisite_activity(self):
        self._select(self.user, self.math, self.physics)
        self._seed_mastery(self.user, self.topic_force, 5, attempted=5)
        snap = compute_learning_path_snapshot(self.user)
        activity = snap["recommended_activity"]
        self.assertIsNotNone(activity)
        self.assertNotEqual(activity["type"], "review_prerequisite")
        self.assertIn(activity["type"], {ACTIVITY_STUDY_TOPIC, ACTIVITY_PRACTICE})

    def test_sync_removes_topics_outside_selected_subjects(self):
        self._select(self.user, self.math, self.physics)
        path = sync_learning_path_items(self.user)
        self.assertEqual(path.items.count(), 3)
        StudentSelectedSubject.objects.filter(user=self.user, subject=self.physics).delete()
        sync_learning_path_items(self.user, path=path)
        remaining = set(path.items.values_list("topic_id", flat=True))
        self.assertEqual(remaining, {self.topic_quad.id, self.topic_trig.id})
        self.assertFalse(
            LearningPathItem.objects.filter(
                learning_path=path, topic=self.topic_force
            ).exists()
        )
