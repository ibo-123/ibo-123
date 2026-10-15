from django.utils import timezone

from authentication.tests.base import AuthAPITestCase
from users.models import User

PASSWORD = "Str0ng-Entrance-2026"
SENSITIVE_KEYS = {"password", "otp_hash", "encrypted_secret", "is_staff", "is_superuser"}


class RegistrationTests(AuthAPITestCase):
    def register(self, **overrides):
        payload = {
            "phone_number": "0912345678",
            "password": PASSWORD,
            "password_confirm": PASSWORD,
            "first_name": "Abebe",
            "last_name": "Kebede",
        }
        payload.update(overrides)
        return self.client.post("/api/v1/auth/register/", payload, format="json")

    def test_valid_registration(self):
        response = self.register()

        self.assertEqual(response.status_code, 201)
        self.assertTrue(response.data["success"])
        data = response.data["data"]
        self.assertEqual(data["phone_number"], "+251912345678")
        self.assertEqual(data["full_name"], "Abebe Kebede")
        self.assertFalse(data["phone_verified"])
        self.assertFalse(data["onboarded"])
        self.assertFalse(data["two_factor_enabled"])
        self.assertFalse(SENSITIVE_KEYS & set(data))
        user = User.objects.get()
        self.assertTrue(user.check_password(PASSWORD))
        self.assertNotEqual(user.password, PASSWORD)

    def test_full_name_is_split_when_names_are_absent(self):
        response = self.register(first_name="", last_name="", full_name="Hosama Adem Ali")

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["data"]["first_name"], "Hosama")
        self.assertEqual(response.data["data"]["last_name"], "Adem Ali")

    def test_duplicate_phone_is_rejected_across_formats(self):
        self.register()

        response = self.register(phone_number="+251912345678")

        self.assertEqual(response.status_code, 400)
        self.assertFalse(response.data["success"])
        self.assertIn("phone_number", response.data["errors"])
        self.assertEqual(User.objects.count(), 1)

    def test_invalid_phone_is_rejected(self):
        response = self.register(phone_number="12345")

        self.assertEqual(response.status_code, 400)
        self.assertIn("phone_number", response.data["errors"])
        self.assertEqual(User.objects.count(), 0)

    def test_weak_password_is_rejected(self):
        response = self.register(password="12345678", password_confirm="12345678")

        self.assertEqual(response.status_code, 400)
        self.assertIn("password", response.data["errors"])
        self.assertEqual(User.objects.count(), 0)

    def test_password_mismatch_is_rejected(self):
        response = self.register(password_confirm="Different-Pass-1")

        self.assertEqual(response.status_code, 400)
        self.assertIn("password_confirm", response.data["errors"])
        self.assertEqual(User.objects.count(), 0)

    def test_missing_fields_return_400(self):
        response = self.client.post("/api/v1/auth/register/", {}, format="json")

        self.assertEqual(response.status_code, 400)
        self.assertFalse(response.data["success"])


class PasswordLoginTests(AuthAPITestCase):
    def setUp(self):
        super().setUp()
        self.user = User.objects.create_user(
            "0912345678", password=PASSWORD, phone_verified_at=timezone.now()
        )

    def login(self, phone="0912345678", password=PASSWORD):
        return self.client.post(
            "/api/v1/auth/login/",
            {"phone_number": phone, "password": password},
            format="json",
        )

    def test_valid_credentials_return_tokens(self):
        response = self.login(phone="+251912345678")

        self.assertEqual(response.status_code, 200)
        data = response.data["data"]
        self.assertFalse(data["requires_2fa"])
        self.assertTrue(data["tokens"]["access"])
        self.assertTrue(data["tokens"]["refresh"])
        self.assertEqual(data["user"]["id"], str(self.user.id))
        self.assertFalse(SENSITIVE_KEYS & set(data["user"]))

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {data['tokens']['access']}")
        me = self.client.get("/api/v1/auth/me/")
        self.assertEqual(me.status_code, 200)

    def test_wrong_password_and_unknown_user_look_identical(self):
        wrong = self.login(password="not-the-password")
        unknown = self.login(phone="0911111111", password=PASSWORD)

        self.assertEqual(wrong.status_code, 401)
        self.assertEqual(unknown.status_code, 401)
        self.assertEqual(wrong.data, unknown.data)

    def test_unverified_phone_cannot_log_in_with_password(self):
        User.objects.filter(pk=self.user.pk).update(phone_verified_at=None)

        response = self.login()

        self.assertEqual(response.status_code, 403)
        self.assertFalse(response.data["success"])
        self.assertIn("phone_number", response.data["errors"])

    def test_disabled_account_is_rejected(self):
        User.objects.filter(pk=self.user.pk).update(is_active=False)

        response = self.login()

        self.assertEqual(response.status_code, 403)

    def test_invalid_phone_format_is_a_validation_error(self):
        response = self.login(phone="abc")

        self.assertEqual(response.status_code, 400)
        self.assertIn("phone_number", response.data["errors"])
