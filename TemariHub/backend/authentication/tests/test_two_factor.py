from datetime import timedelta
from unittest.mock import patch

import pyotp
from django.utils import timezone
from rest_framework_simplejwt.tokens import RefreshToken

from authentication import totp
from authentication.models import OneTimeToken, TwoFactorDevice
from authentication.tests.base import AuthAPITestCase
from users.models import User

PASSWORD = "Str0ng-Entrance-2026"


def code_for(secret, offset_steps=0):
    moment = timezone.now().timestamp() + offset_steps * totp.TOTP_STEP_SECONDS
    return pyotp.TOTP(secret).at(moment)


class TwoFactorTestCase(AuthAPITestCase):
    def setUp(self):
        super().setUp()
        self.user = User.objects.create_user(
            "0912345678", password=PASSWORD, phone_verified_at=timezone.now()
        )
        self.authenticate_as(self.user)

    def authenticate_as(self, user):
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {RefreshToken.for_user(user).access_token}"
        )

    def setup(self):
        response = self.client.post("/api/v1/auth/2fa/setup/", format="json")
        self.assertEqual(response.status_code, 200)
        return response.data["data"]

    def verify(self, code):
        return self.client.post("/api/v1/auth/2fa/verify/", {"code": code}, format="json")

    def enable(self):
        secret = self.setup()["secret"]
        response = self.verify(code_for(secret))
        self.assertEqual(response.status_code, 200)
        # Enrolment consumed the current time step. Pretend time moved on so
        # the rest of the test can use a fresh code without sleeping 30s.
        TwoFactorDevice.objects.filter(user__in=User.objects.all()).update(last_used_step=0)
        return secret

    def password_login(self):
        return self.client.post(
            "/api/v1/auth/login/",
            {"phone_number": "0912345678", "password": PASSWORD},
            format="json",
        )

    def two_factor_login(self, token, code):
        return self.client.post(
            "/api/v1/auth/2fa/login/",
            {"two_factor_token": token, "code": code},
            format="json",
        )


class TwoFactorSetupTests(TwoFactorTestCase):
    def test_setup_returns_provisioning_data_without_enabling(self):
        data = self.setup()

        self.assertTrue(data["secret"])
        self.assertTrue(data["otpauth_url"].startswith("otpauth://totp/TemariHub"))
        self.assertIn("secret=" + data["secret"], data["otpauth_url"])
        self.assertEqual(data["issuer"], "TemariHub")
        device = TwoFactorDevice.objects.get(user=self.user)
        self.assertFalse(device.is_enabled)
        self.assertNotIn(data["secret"], device.encrypted_secret)
        self.assertEqual(totp.decrypt_secret(device.encrypted_secret), data["secret"])
        self.user.refresh_from_db()
        self.assertFalse(self.user.two_factor_enabled)

    def test_setup_requires_authentication(self):
        self.client.credentials()

        response = self.client.post("/api/v1/auth/2fa/setup/", format="json")

        self.assertEqual(response.status_code, 401)

    def test_repeating_setup_replaces_the_pending_secret(self):
        first = self.setup()["secret"]
        second = self.setup()["secret"]

        self.assertNotEqual(first, second)
        self.assertEqual(TwoFactorDevice.objects.count(), 1)
        self.assertEqual(self.verify(code_for(first)).status_code, 400)
        self.assertEqual(self.verify(code_for(second)).status_code, 200)

    def test_setup_is_refused_while_enabled(self):
        self.enable()

        response = self.client.post("/api/v1/auth/2fa/setup/", format="json")

        self.assertEqual(response.status_code, 400)
        self.assertFalse(response.data["success"])

    def test_verify_with_correct_code_enables_2fa(self):
        secret = self.setup()["secret"]

        response = self.verify(code_for(secret))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["data"], {"enabled": True})
        self.assertNotIn("secret", str(response.data))
        self.user.refresh_from_db()
        self.assertTrue(self.user.two_factor_enabled)
        me = self.client.get("/api/v1/auth/me/")
        self.assertTrue(me.data["data"]["two_factor_enabled"])

    def test_verify_with_wrong_code_fails(self):
        secret = self.setup()["secret"]
        wrong = "000000" if code_for(secret) != "000000" else "111111"

        response = self.verify(wrong)

        self.assertEqual(response.status_code, 400)
        self.assertIn("code", response.data["errors"])
        self.assertFalse(TwoFactorDevice.objects.get().is_enabled)

    def test_verify_without_setup_fails(self):
        response = self.verify("123456")

        self.assertEqual(response.status_code, 400)

    def test_verify_rejects_a_replayed_code(self):
        secret = self.setup()["secret"]
        code = code_for(secret)

        first = self.verify(code)
        replay = self.verify(code)

        self.assertEqual(first.status_code, 200)
        self.assertEqual(replay.status_code, 400)
        self.assertTrue(TwoFactorDevice.objects.get().is_enabled)

    def test_verify_rejects_malformed_codes(self):
        self.setup()

        response = self.verify("12ab")

        self.assertEqual(response.status_code, 400)
        self.assertIn("code", response.data["errors"])


class TwoFactorLoginTests(TwoFactorTestCase):
    def test_password_login_returns_a_challenge_instead_of_tokens(self):
        self.enable()

        response = self.password_login()

        self.assertEqual(response.status_code, 200)
        data = response.data["data"]
        self.assertTrue(data["requires_2fa"])
        self.assertTrue(data["two_factor_token"])
        self.assertEqual(data["expires_in"], 300)
        self.assertNotIn("tokens", data)

    def test_challenge_and_code_issue_tokens(self):
        secret = self.enable()
        token = self.password_login().data["data"]["two_factor_token"]

        response = self.two_factor_login(token, code_for(secret, offset_steps=1))

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["data"]["tokens"]["access"])
        self.assertEqual(response.data["data"]["user"]["id"], str(self.user.id))
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {response.data['data']['tokens']['access']}"
        )
        self.assertEqual(self.client.get("/api/v1/auth/me/").status_code, 200)

    def test_invalid_challenge_is_rejected(self):
        secret = self.enable()

        response = self.two_factor_login("forged-challenge", code_for(secret))

        self.assertEqual(response.status_code, 400)
        self.assertFalse(response.data["success"])
        self.assertNotIn("tokens", response.data.get("data") or {})

    def test_raw_user_id_is_not_accepted_as_a_challenge(self):
        secret = self.enable()

        response = self.two_factor_login(str(self.user.id), code_for(secret))

        self.assertEqual(response.status_code, 400)

    def test_expired_challenge_is_rejected(self):
        secret = self.enable()
        token = self.password_login().data["data"]["two_factor_token"]
        OneTimeToken.objects.update(expires_at=timezone.now() - timedelta(seconds=1))

        response = self.two_factor_login(token, code_for(secret))

        self.assertEqual(response.status_code, 400)

    def test_reused_challenge_is_rejected(self):
        secret = self.enable()
        token = self.password_login().data["data"]["two_factor_token"]

        first = self.two_factor_login(token, code_for(secret))
        second = self.two_factor_login(token, code_for(secret, offset_steps=1))

        self.assertEqual(first.status_code, 200)
        self.assertEqual(second.status_code, 400)

    def test_invalid_totp_is_rejected_and_burns_the_challenge(self):
        secret = self.enable()
        token = self.password_login().data["data"]["two_factor_token"]
        wrong = "000000" if code_for(secret) != "000000" else "111111"

        response = self.two_factor_login(token, wrong)
        retry = self.two_factor_login(token, code_for(secret))

        self.assertEqual(response.status_code, 400)
        self.assertEqual(retry.status_code, 400)

    def test_challenge_is_bound_to_its_user(self):
        secret = self.enable()
        token = self.password_login().data["data"]["two_factor_token"]
        other = User.objects.create_user("0911111111", phone_verified_at=timezone.now())
        OneTimeToken.objects.update(user=other)

        response = self.two_factor_login(token, code_for(secret))

        self.assertEqual(response.status_code, 400)

    def test_phone_otp_login_also_requires_the_second_factor(self):
        secret = self.enable()
        with patch("authentication.services.generate_otp", return_value="123456"):
            self.client.post(
                "/api/v1/auth/phone/request-otp/", {"phone_number": "0912345678"}, format="json"
            )
        response = self.client.post(
            "/api/v1/auth/phone/verify-otp/",
            {"phone_number": "0912345678", "otp": "123456"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["data"]["requires_2fa"])
        self.assertNotIn("tokens", response.data["data"])
        finished = self.two_factor_login(
            response.data["data"]["two_factor_token"], code_for(secret)
        )
        self.assertEqual(finished.status_code, 200)

    def test_two_factor_login_fails_after_2fa_was_disabled(self):
        secret = self.enable()
        token = self.password_login().data["data"]["two_factor_token"]
        TwoFactorDevice.objects.all().delete()

        response = self.two_factor_login(token, code_for(secret))

        self.assertEqual(response.status_code, 400)


class TwoFactorDisableTests(TwoFactorTestCase):
    def disable(self, code, password=PASSWORD):
        payload = {"code": code}
        if password is not None:
            payload["password"] = password
        return self.client.post("/api/v1/auth/2fa/disable/", payload, format="json")

    def test_disable_with_password_and_code(self):
        secret = self.enable()

        response = self.disable(code_for(secret, offset_steps=1))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["data"], {"enabled": False})
        self.assertFalse(TwoFactorDevice.objects.exists())
        login = self.password_login()
        self.assertFalse(login.data["data"]["requires_2fa"])
        self.assertIn("tokens", login.data["data"])

    def test_invalid_password_keeps_2fa_enabled(self):
        secret = self.enable()

        response = self.disable(code_for(secret, offset_steps=1), password="wrong")

        self.assertEqual(response.status_code, 401)
        self.assertIn("password", response.data["errors"])
        self.assertTrue(TwoFactorDevice.objects.get().is_enabled)

    def test_missing_password_is_rejected_for_password_accounts(self):
        secret = self.enable()

        response = self.disable(code_for(secret, offset_steps=1), password=None)

        self.assertEqual(response.status_code, 401)
        self.assertTrue(TwoFactorDevice.objects.get().is_enabled)

    def test_invalid_totp_keeps_2fa_enabled(self):
        secret = self.enable()
        wrong = "000000" if code_for(secret, 1) != "000000" else "111111"

        response = self.disable(wrong)

        self.assertEqual(response.status_code, 400)
        self.assertIn("code", response.data["errors"])
        self.assertTrue(TwoFactorDevice.objects.get().is_enabled)

    def test_disable_when_not_enabled_fails(self):
        response = self.disable("123456")

        self.assertEqual(response.status_code, 400)

    def test_disable_requires_authentication(self):
        self.client.credentials()

        response = self.disable("123456")

        self.assertEqual(response.status_code, 401)

    def test_otp_only_account_disables_with_code_alone(self):
        otp_user = User.objects.create_user("0911111111", phone_verified_at=timezone.now())
        self.authenticate_as(otp_user)
        secret = self.enable()

        response = self.disable(code_for(secret, offset_steps=1), password=None)

        self.assertEqual(response.status_code, 200)
        self.assertFalse(TwoFactorDevice.objects.filter(user=otp_user).exists())


class TOTPHelperTests(AuthAPITestCase):
    def test_secret_round_trips_through_encryption(self):
        secret = totp.generate_secret()

        encrypted = totp.encrypt_secret(secret)

        self.assertNotIn(secret, encrypted)
        self.assertEqual(totp.decrypt_secret(encrypted), secret)

    def test_matching_step_accepts_drift_and_rejects_garbage(self):
        secret = totp.generate_secret()
        now = timezone.now().timestamp()

        self.assertEqual(totp.matching_step(secret, code_for(secret), now), totp.current_step(now))
        self.assertIsNotNone(totp.matching_step(secret, code_for(secret, 1), now))
        self.assertIsNotNone(totp.matching_step(secret, code_for(secret, -1), now))
        self.assertIsNone(totp.matching_step(secret, code_for(secret, 5), now))
        self.assertIsNone(totp.matching_step(secret, "abc", now))
        self.assertIsNone(totp.matching_step(secret, None, now))
