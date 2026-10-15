from django.utils import timezone
from rest_framework_simplejwt.tokens import RefreshToken

from authentication.tests.base import AuthAPITestCase
from users.models import User

SENSITIVE_KEYS = {
    "password",
    "is_staff",
    "is_superuser",
    "encrypted_secret",
    "phone_verified_at",
    "onboarded_at",
    "groups",
    "user_permissions",
}


class ProfileTests(AuthAPITestCase):
    def setUp(self):
        super().setUp()
        self.user = User.objects.create_user(
            "0912345678", password="Str0ng-Entrance-2026", phone_verified_at=timezone.now()
        )
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {RefreshToken.for_user(self.user).access_token}"
        )

    def test_get_me_exposes_profile_flags_without_sensitive_fields(self):
        response = self.client.get("/api/v1/auth/me/")

        self.assertEqual(response.status_code, 200)
        data = response.data["data"]
        self.assertEqual(data["id"], str(self.user.id))
        self.assertEqual(data["phone_number"], "+251912345678")
        self.assertIsNone(data["email"])
        self.assertEqual(data["full_name"], "")
        self.assertIsNone(data["grade"])
        self.assertIsNone(data["stream"])
        self.assertTrue(data["phone_verified"])
        self.assertFalse(data["two_factor_enabled"])
        self.assertFalse(data["onboarded"])
        self.assertFalse(SENSITIVE_KEYS & set(data))

    def test_patch_me_updates_safe_fields(self):
        response = self.client.patch(
            "/api/v1/auth/me/",
            {"first_name": "Ibrahim", "last_name": "Kedir", "grade": 12},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["message"], "Profile updated successfully")
        self.assertEqual(response.data["data"]["full_name"], "Ibrahim Kedir")
        self.assertEqual(response.data["data"]["grade"], 12)
        self.assertFalse(response.data["data"]["onboarded"])
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, "Ibrahim")

    def test_patch_me_rejects_protected_fields(self):
        for field, value in (
            ("is_staff", True),
            ("is_superuser", True),
            ("password", "Hacked-Pass-123"),
            ("phone_verified_at", None),
            ("phone_number", "0911111111"),
            ("id", "00000000-0000-0000-0000-000000000000"),
            ("onboarded_at", "2026-01-01T00:00:00Z"),
        ):
            response = self.client.patch(
                "/api/v1/auth/me/",
                {"first_name": "Ibrahim", field: value},
                format="json",
            )
            self.assertEqual(response.status_code, 400, field)
            self.assertIn(field, response.data["errors"], field)

        self.user.refresh_from_db()
        self.assertFalse(self.user.is_staff)
        self.assertFalse(self.user.is_superuser)
        self.assertEqual(self.user.first_name, "")
        self.assertEqual(self.user.phone_number, "+251912345678")
        self.assertTrue(self.user.check_password("Str0ng-Entrance-2026"))

    def test_patch_me_validates_choices(self):
        response = self.client.patch(
            "/api/v1/auth/me/", {"grade": 7, "stream": "arts"}, format="json"
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("grade", response.data["errors"])
        self.assertIn("stream", response.data["errors"])

    def test_patch_me_requires_at_least_one_field(self):
        response = self.client.patch("/api/v1/auth/me/", {}, format="json")

        self.assertEqual(response.status_code, 400)

    def test_me_requires_authentication_for_both_methods(self):
        self.client.credentials()

        get = self.client.get("/api/v1/auth/me/")
        patch = self.client.patch("/api/v1/auth/me/", {"first_name": "X"}, format="json")

        self.assertEqual(get.status_code, 401)
        self.assertEqual(patch.status_code, 401)


class OnboardingTests(AuthAPITestCase):
    def setUp(self):
        super().setUp()
        self.user = User.objects.create_user("0912345678", phone_verified_at=timezone.now())
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {RefreshToken.for_user(self.user).access_token}"
        )

    def onboard(self, grade=12, stream="natural_science"):
        return self.client.post(
            "/api/v1/auth/onboarding/",
            {"grade": grade, "stream": stream},
            format="json",
        )

    def test_valid_onboarding(self):
        response = self.onboard()

        self.assertEqual(response.status_code, 200)
        data = response.data["data"]
        self.assertTrue(data["onboarded"])
        self.assertEqual(data["grade"], 12)
        self.assertEqual(data["stream"], "natural_science")
        self.assertTrue(data["user"]["onboarded"])
        self.user.refresh_from_db()
        self.assertIsNotNone(self.user.onboarded_at)

    def test_invalid_data_returns_400(self):
        bad_grade = self.onboard(grade=13)
        bad_stream = self.onboard(stream="arts")
        missing = self.client.post("/api/v1/auth/onboarding/", {}, format="json")

        self.assertEqual(bad_grade.status_code, 400)
        self.assertIn("grade", bad_grade.data["errors"])
        self.assertEqual(bad_stream.status_code, 400)
        self.assertIn("stream", bad_stream.data["errors"])
        self.assertEqual(missing.status_code, 400)
        self.user.refresh_from_db()
        self.assertFalse(self.user.onboarded)

    def test_unauthenticated_request_is_rejected(self):
        self.client.credentials()

        response = self.onboard()

        self.assertEqual(response.status_code, 401)

    def test_repeated_onboarding_updates_without_duplicating(self):
        first = self.onboard()
        self.user.refresh_from_db()
        first_time = self.user.onboarded_at

        second = self.onboard(grade=11, stream="social_science")
        self.user.refresh_from_db()

        self.assertEqual(first.status_code, 200)
        self.assertEqual(second.status_code, 200)
        self.assertEqual(self.user.grade, 11)
        self.assertEqual(self.user.stream, "social_science")
        self.assertEqual(self.user.onboarded_at, first_time)
        self.assertEqual(User.objects.count(), 1)
