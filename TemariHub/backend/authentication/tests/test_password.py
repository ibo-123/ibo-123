from datetime import timedelta
from unittest.mock import patch

from django.utils import timezone
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken
from rest_framework_simplejwt.tokens import RefreshToken

from authentication.models import OneTimeToken, OTPPurpose, OTPVerification
from authentication.tests.base import AuthAPITestCase
from users.models import User

PASSWORD = "Str0ng-Entrance-2026"
NEW_PASSWORD = "An0ther-Secure-Pass!"


class ForgotPasswordTests(AuthAPITestCase):
    def setUp(self):
        super().setUp()
        self.user = User.objects.create_user(
            "0912345678", password=PASSWORD, phone_verified_at=timezone.now()
        )

    def forgot(self, phone="0912345678"):
        # 740296 does not appear inside the test phone number, so a leak would show.
        with patch("authentication.services.generate_otp", return_value="740296"):
            return self.client.post(
                "/api/v1/auth/password/forgot/",
                {"phone_number": phone},
                format="json",
            )

    def verify(self, otp="740296", phone="0912345678"):
        return self.client.post(
            "/api/v1/auth/password/verify-otp/",
            {"phone_number": phone, "otp": otp},
            format="json",
        )

    def reset(self, token, password=NEW_PASSWORD, confirm=None):
        return self.client.post(
            "/api/v1/auth/password/reset/",
            {
                "reset_token": token,
                "new_password": password,
                "new_password_confirm": confirm if confirm is not None else password,
            },
            format="json",
        )

    def test_request_reset_sends_a_hashed_reset_otp(self):
        response = self.forgot()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["data"]["expires_in"], 300)
        self.assertNotIn("740296", str(response.data))
        self.assertNotIn("debug_otp", response.data["data"])
        record = OTPVerification.objects.get()
        self.assertEqual(record.purpose, OTPPurpose.PASSWORD_RESET)
        self.assertNotIn("740296", record.otp_hash)

    def test_unknown_phone_gets_the_same_response_and_no_otp(self):
        known = self.forgot()
        unknown = self.forgot(phone="0911111111")

        self.assertEqual(unknown.status_code, 200)
        self.assertEqual(known.data["message"], unknown.data["message"])
        self.assertEqual(set(known.data["data"]), set(unknown.data["data"]))
        self.assertEqual(OTPVerification.objects.count(), 1)

    def test_invalid_phone_format_is_rejected(self):
        response = self.forgot(phone="12345")

        self.assertEqual(response.status_code, 400)
        self.assertIn("phone_number", response.data["errors"])

    def test_otp_verification_returns_a_reset_token_without_login_tokens(self):
        self.forgot()

        response = self.verify()

        self.assertEqual(response.status_code, 200)
        data = response.data["data"]
        self.assertTrue(data["verified"])
        self.assertTrue(data["reset_token"])
        self.assertEqual(data["expires_in"], 600)
        self.assertNotIn("access", data)
        self.assertNotIn("tokens", data)
        self.assertEqual(OneTimeToken.objects.count(), 1)

    def test_reset_otp_cannot_be_used_for_phone_login(self):
        self.forgot()

        response = self.client.post(
            "/api/v1/auth/phone/verify-otp/",
            {"phone_number": "0912345678", "otp": "740296"},
            format="json",
        )

        self.assertEqual(response.status_code, 400)

    def test_wrong_otp_fails(self):
        self.forgot()

        response = self.verify(otp="000000")

        self.assertEqual(response.status_code, 400)
        self.assertEqual(OneTimeToken.objects.count(), 0)

    def test_expired_otp_fails(self):
        self.forgot()
        OTPVerification.objects.update(expires_at=timezone.now() - timedelta(seconds=1))

        response = self.verify()

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["message"], "OTP has expired.")

    def test_reused_otp_fails(self):
        self.forgot()
        first = self.verify()
        second = self.verify()

        self.assertEqual(first.status_code, 200)
        self.assertEqual(second.status_code, 400)

    def test_reset_password_succeeds_and_revokes_refresh_tokens(self):
        old_refresh = RefreshToken.for_user(self.user)
        self.forgot()
        token = self.verify().data["data"]["reset_token"]

        response = self.reset(token)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["message"], "Password reset successfully")
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password(NEW_PASSWORD))
        self.assertEqual(BlacklistedToken.objects.count(), 1)
        refresh = self.client.post(
            "/api/v1/auth/token/refresh/", {"refresh": str(old_refresh)}, format="json"
        )
        self.assertEqual(refresh.status_code, 401)
        login = self.client.post(
            "/api/v1/auth/login/",
            {"phone_number": "0912345678", "password": NEW_PASSWORD},
            format="json",
        )
        self.assertEqual(login.status_code, 200)

    def test_invalid_reset_token_fails(self):
        response = self.reset("not-a-real-token")

        self.assertEqual(response.status_code, 400)
        self.assertFalse(response.data["success"])
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password(PASSWORD))

    def test_expired_reset_token_fails(self):
        self.forgot()
        token = self.verify().data["data"]["reset_token"]
        OneTimeToken.objects.update(expires_at=timezone.now() - timedelta(seconds=1))

        response = self.reset(token)

        self.assertEqual(response.status_code, 400)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password(PASSWORD))

    def test_reused_reset_token_fails(self):
        self.forgot()
        token = self.verify().data["data"]["reset_token"]
        first = self.reset(token)
        second = self.reset(token, password="Yet-An0ther-Pass!")

        self.assertEqual(first.status_code, 200)
        self.assertEqual(second.status_code, 400)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password(NEW_PASSWORD))

    def test_weak_password_does_not_consume_the_token(self):
        self.forgot()
        token = self.verify().data["data"]["reset_token"]

        weak = self.reset(token, password="12345678")
        mismatch = self.reset(token, confirm="Different-Pass-1")
        good = self.reset(token)

        self.assertEqual(weak.status_code, 400)
        self.assertIn("new_password", weak.data["errors"])
        self.assertEqual(mismatch.status_code, 400)
        self.assertIn("new_password_confirm", mismatch.data["errors"])
        self.assertEqual(good.status_code, 200)

    def test_reset_token_cannot_be_used_as_a_two_factor_challenge(self):
        self.forgot()
        token = self.verify().data["data"]["reset_token"]

        response = self.client.post(
            "/api/v1/auth/2fa/login/",
            {"two_factor_token": token, "code": "123456"},
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertTrue(OneTimeToken.objects.get().is_usable)


class ChangePasswordTests(AuthAPITestCase):
    def setUp(self):
        super().setUp()
        self.user = User.objects.create_user(
            "0912345678", password=PASSWORD, phone_verified_at=timezone.now()
        )
        self.refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.refresh.access_token}")

    def change(self, old=PASSWORD, new=NEW_PASSWORD, confirm=None, **extra):
        payload = {
            "old_password": old,
            "new_password": new,
            "new_password_confirm": confirm if confirm is not None else new,
        }
        payload.update(extra)
        return self.client.post("/api/v1/auth/change-password/", payload, format="json")

    def test_valid_change_rotates_sessions(self):
        response = self.change()

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["data"]["tokens"]["access"])
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password(NEW_PASSWORD))
        old = self.client.post(
            "/api/v1/auth/token/refresh/", {"refresh": str(self.refresh)}, format="json"
        )
        self.assertEqual(old.status_code, 401)
        new = self.client.post(
            "/api/v1/auth/token/refresh/",
            {"refresh": response.data["data"]["tokens"]["refresh"]},
            format="json",
        )
        self.assertEqual(new.status_code, 200)

    def test_contract_alias_current_password_is_accepted(self):
        response = self.client.post(
            "/api/v1/auth/change-password/",
            {
                "current_password": PASSWORD,
                "new_password": NEW_PASSWORD,
                "new_password_confirm": NEW_PASSWORD,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)

    def test_wrong_old_password_fails(self):
        response = self.change(old="wrong-password")

        self.assertEqual(response.status_code, 400)
        self.assertIn("old_password", response.data["errors"])
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password(PASSWORD))

    def test_weak_new_password_fails(self):
        response = self.change(new="12345678")

        self.assertEqual(response.status_code, 400)
        self.assertIn("new_password", response.data["errors"])

    def test_same_password_is_rejected(self):
        response = self.change(new=PASSWORD)

        self.assertEqual(response.status_code, 400)
        self.assertIn("new_password", response.data["errors"])

    def test_password_mismatch_fails(self):
        response = self.change(confirm="Different-Pass-1")

        self.assertEqual(response.status_code, 400)
        self.assertIn("new_password_confirm", response.data["errors"])

    def test_unauthenticated_request_is_rejected(self):
        self.client.credentials()

        response = self.change()

        self.assertEqual(response.status_code, 401)
