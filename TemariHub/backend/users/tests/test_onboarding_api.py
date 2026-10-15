import uuid

from django.utils import timezone
from rest_framework_simplejwt.tokens import RefreshToken

from authentication.tests.base import AuthAPITestCase
from curriculum.models import Subject
from users.models import (
    LearningGoal,
    OnboardingStatus,
    StudentOnboarding,
    StudentSelectedSubject,
    User,
)


class StudentOnboardingAPITests(AuthAPITestCase):
    ONBOARDING_URL = "/api/v1/students/me/onboarding/"
    COMPLETE_URL = "/api/v1/students/me/onboarding/complete/"

    def setUp(self):
        super().setUp()
        self.user = User.objects.create_user(
            "0912345678",
            password="Str0ng-Entrance-2026",
            phone_verified_at=timezone.now(),
            first_name="Selam",
            last_name="Bekele",
        )
        self.other = User.objects.create_user(
            "0912345679",
            password="Str0ng-Entrance-2026",
            phone_verified_at=timezone.now(),
        )
        self.math = Subject.objects.create(
            name="Mathematics",
            slug="mathematics",
            grade=12,
            stream="natural_science",
            sort_order=1,
        )
        self.physics = Subject.objects.create(
            name="Physics",
            slug="physics",
            grade=12,
            stream="natural_science",
            sort_order=2,
        )
        self.history = Subject.objects.create(
            name="History",
            slug="history",
            grade=12,
            stream="social_science",
            sort_order=1,
        )
        self.inactive = Subject.objects.create(
            name="Inactive",
            slug="inactive",
            grade=12,
            stream="natural_science",
            is_active=False,
        )
        self._auth(self.user)

    def _auth(self, user):
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {RefreshToken.for_user(user).access_token}"
        )

    def _fill_required(self):
        return self.client.patch(
            self.ONBOARDING_URL,
            {
                "full_name": "Selam Bekele",
                "grade": 12,
                "stream": "natural_science",
                "school": "Addis Ababa Secondary",
                "city": "Addis Ababa",
                "subject_ids": [str(self.math.id), str(self.physics.id)],
                "learning_goals": [LearningGoal.ENTRANCE_EXAM_PREP],
                "preferences": {
                    "daily_study_minutes": 60,
                    "study_frequency": "daily",
                    "preferred_difficulty": 3,
                },
            },
            format="json",
        )

    def test_unauthenticated_requests_are_rejected(self):
        self.client.credentials()
        for method, url in (
            ("get", self.ONBOARDING_URL),
            ("patch", self.ONBOARDING_URL),
            ("post", self.COMPLETE_URL),
        ):
            response = getattr(self.client, method)(url, {}, format="json")
            self.assertEqual(response.status_code, 401, msg=url)

    def test_get_onboarding_creates_records_for_current_user_only(self):
        response = self.client.get(self.ONBOARDING_URL)
        self.assertEqual(response.status_code, 200)
        data = response.data["data"]
        self.assertEqual(data["status"], OnboardingStatus.NOT_STARTED)
        self.assertEqual(data["full_name"], "Selam Bekele")
        self.assertTrue(data["phone_verified"])
        self.assertEqual(data["subjects"], [])
        self.assertTrue(StudentOnboarding.objects.filter(user=self.user).exists())
        self.assertFalse(StudentOnboarding.objects.filter(user=self.other).exists())

    def test_patch_progressively_saves_academic_and_profile_fields(self):
        response = self.client.patch(
            self.ONBOARDING_URL,
            {
                "grade": 12,
                "stream": "natural_science",
                "school": "Bole Secondary",
                "city": "Addis Ababa",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        data = response.data["data"]
        self.assertEqual(data["grade"], 12)
        self.assertEqual(data["stream"], "natural_science")
        self.assertEqual(data["school"], "Bole Secondary")
        self.assertEqual(data["city"], "Addis Ababa")
        self.assertEqual(data["status"], OnboardingStatus.IN_PROGRESS)
        self.assertFalse(data["onboarded"])

    def test_invalid_grade_and_stream_are_rejected(self):
        bad_grade = self.client.patch(
            self.ONBOARDING_URL, {"grade": 13}, format="json"
        )
        bad_stream = self.client.patch(
            self.ONBOARDING_URL, {"stream": "arts"}, format="json"
        )
        self.assertEqual(bad_grade.status_code, 400)
        self.assertEqual(bad_stream.status_code, 400)

    def test_subject_selection_validates_curriculum_and_track(self):
        self.client.patch(
            self.ONBOARDING_URL,
            {"grade": 12, "stream": "natural_science"},
            format="json",
        )
        ok = self.client.patch(
            self.ONBOARDING_URL,
            {"subject_ids": [str(self.math.id), str(self.math.id), str(self.physics.id)]},
            format="json",
        )
        self.assertEqual(ok.status_code, 200)
        self.assertEqual(len(ok.data["data"]["subjects"]), 2)

        wrong_stream = self.client.patch(
            self.ONBOARDING_URL,
            {"subject_ids": [str(self.history.id)]},
            format="json",
        )
        missing = self.client.patch(
            self.ONBOARDING_URL,
            {"subject_ids": [str(uuid.uuid4())]},
            format="json",
        )
        inactive = self.client.patch(
            self.ONBOARDING_URL,
            {"subject_ids": [str(self.inactive.id)]},
            format="json",
        )
        for response in (wrong_stream, missing, inactive):
            self.assertEqual(response.status_code, 400)
            self.assertIn("subject_ids", response.data["errors"])

    def test_subject_selection_requires_grade_and_stream(self):
        response = self.client.patch(
            self.ONBOARDING_URL,
            {"subject_ids": [str(self.math.id)]},
            format="json",
        )
        self.assertEqual(response.status_code, 400)

    def test_updating_and_removing_subjects(self):
        self.client.patch(
            self.ONBOARDING_URL,
            {
                "grade": 12,
                "stream": "natural_science",
                "subject_ids": [str(self.math.id), str(self.physics.id)],
            },
            format="json",
        )
        updated = self.client.patch(
            self.ONBOARDING_URL,
            {"subject_ids": [str(self.physics.id)]},
            format="json",
        )
        self.assertEqual(updated.status_code, 200)
        ids = [item["id"] for item in updated.data["data"]["subjects"]]
        self.assertEqual(ids, [str(self.physics.id)])
        self.assertEqual(StudentSelectedSubject.objects.filter(user=self.user).count(), 1)

        cleared = self.client.patch(
            self.ONBOARDING_URL, {"subject_ids": []}, format="json"
        )
        self.assertEqual(cleared.status_code, 200)
        self.assertEqual(cleared.data["data"]["subjects"], [])

    def test_learning_goals_and_preferences_validation(self):
        goals_ok = self.client.patch(
            self.ONBOARDING_URL,
            {
                "learning_goals": [
                    LearningGoal.ENTRANCE_EXAM_PREP,
                    LearningGoal.BUILD_STUDY_HABIT,
                ]
            },
            format="json",
        )
        self.assertEqual(goals_ok.status_code, 200)
        self.assertEqual(len(goals_ok.data["data"]["learning_goals"]), 2)

        goals_bad = self.client.patch(
            self.ONBOARDING_URL,
            {"learning_goals": ["win_lottery"]},
            format="json",
        )
        self.assertEqual(goals_bad.status_code, 400)

        prefs_ok = self.client.patch(
            self.ONBOARDING_URL,
            {"preferences": {"daily_study_minutes": 45, "study_frequency": "weekdays"}},
            format="json",
        )
        self.assertEqual(prefs_ok.status_code, 200)
        self.assertEqual(prefs_ok.data["data"]["preferences"]["daily_study_minutes"], 45)

        prefs_partial = self.client.patch(
            self.ONBOARDING_URL,
            {"preferences": {"preferred_difficulty": 2}},
            format="json",
        )
        self.assertEqual(prefs_partial.status_code, 200)
        prefs = prefs_partial.data["data"]["preferences"]
        self.assertEqual(prefs["daily_study_minutes"], 45)
        self.assertEqual(prefs["preferred_difficulty"], 2)

        prefs_bad = self.client.patch(
            self.ONBOARDING_URL,
            {"preferences": {"daily_study_minutes": 1, "unknown_key": True}},
            format="json",
        )
        self.assertEqual(prefs_bad.status_code, 400)

    def test_protected_fields_cannot_be_mass_assigned(self):
        response = self.client.patch(
            self.ONBOARDING_URL,
            {
                "status": OnboardingStatus.COMPLETED,
                "completed_at": "2026-01-01T00:00:00Z",
                "phone_verified_at": "2026-01-01T00:00:00Z",
                "grade": 12,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.user.refresh_from_db()
        self.assertIsNone(self.user.onboarded_at)

    def test_complete_valid_onboarding(self):
        self.assertEqual(self._fill_required().status_code, 200)
        response = self.client.post(self.COMPLETE_URL, {}, format="json")
        self.assertEqual(response.status_code, 200)
        data = response.data["data"]
        self.assertEqual(data["status"], OnboardingStatus.COMPLETED)
        self.assertTrue(data["onboarded"])
        self.assertIsNotNone(data["completed_at"])
        self.user.refresh_from_db()
        self.assertIsNotNone(self.user.onboarded_at)

    def test_complete_fails_when_required_fields_missing(self):
        response = self.client.post(self.COMPLETE_URL, {}, format="json")
        self.assertEqual(response.status_code, 400)
        errors = response.data["errors"]
        self.assertIn("grade", errors)
        self.assertIn("stream", errors)
        self.assertIn("subject_ids", errors)
        self.assertIn("learning_goals", errors)
        self.assertIn("preferences", errors)

    def test_complete_fails_when_phone_unverified(self):
        self.user.phone_verified_at = None
        self.user.save(update_fields=["phone_verified_at"])
        self._fill_required()
        response = self.client.post(self.COMPLETE_URL, {}, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("phone_verified", response.data["errors"])

    def test_complete_fails_for_invalid_subject_after_stream_change(self):
        self._fill_required()
        self.client.patch(
            self.ONBOARDING_URL,
            {"stream": "social_science"},
            format="json",
        )
        response = self.client.post(self.COMPLETE_URL, {}, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("subject_ids", response.data["errors"])

    def test_complete_is_idempotent(self):
        self._fill_required()
        first = self.client.post(self.COMPLETE_URL, {}, format="json")
        completed_at = first.data["data"]["completed_at"]
        second = self.client.post(self.COMPLETE_URL, {}, format="json")
        self.assertEqual(second.status_code, 200)
        self.assertEqual(second.data["data"]["completed_at"], completed_at)
        self.assertEqual(second.data["data"]["status"], OnboardingStatus.COMPLETED)

    def test_patch_does_not_mark_completed(self):
        self._fill_required()
        self.user.refresh_from_db()
        self.assertIsNone(self.user.onboarded_at)
        onboarding = StudentOnboarding.objects.get(user=self.user)
        self.assertEqual(onboarding.status, OnboardingStatus.IN_PROGRESS)
