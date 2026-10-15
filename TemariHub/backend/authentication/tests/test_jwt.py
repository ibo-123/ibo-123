from unittest.mock import patch

from django.conf import settings
from django.test import override_settings
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken

from authentication.tests.base import AuthAPITestCase


class JWTTests(AuthAPITestCase):
    def authenticate(self, phone="0912345678", otp="123456"):
        with patch("authentication.services.generate_otp", return_value=otp):
            requested = self.client.post(
                "/api/v1/auth/phone/request-otp/",
                {"phone_number": phone},
                format="json",
            )
        self.assertEqual(requested.status_code, 200)
        verified = self.client.post(
            "/api/v1/auth/phone/verify-otp/",
            {"phone_number": phone, "otp": otp},
            format="json",
        )
        self.assertEqual(verified.status_code, 200)
        return verified.data["data"]

    def test_login_returns_access_and_refresh_tokens(self):
        payload = self.authenticate()

        self.assertEqual(payload["user"]["phone_number"], "+251912345678")
        self.assertEqual(payload["user"]["first_name"], "")
        self.assertEqual(payload["user"]["last_name"], "")
        self.assertTrue(payload["tokens"]["access"])
        self.assertTrue(payload["tokens"]["refresh"])

    def test_me_requires_authentication(self):
        response = self.client.get("/api/v1/auth/me/")

        self.assertEqual(response.status_code, 401)
        self.assertFalse(response.data["success"])

    def test_valid_jwt_can_read_the_current_user(self):
        payload = self.authenticate()
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {payload['tokens']['access']}")

        response = self.client.get("/api/v1/auth/me/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["message"], "User retrieved successfully")
        self.assertEqual(response.data["data"]["id"], payload["user"]["id"])
        self.assertEqual(response.data["data"]["phone_number"], "+251912345678")
        self.assertIsNone(response.data["data"]["email"])

    def test_invalid_jwt_is_rejected(self):
        self.client.credentials(HTTP_AUTHORIZATION="Bearer not-a-token")

        response = self.client.get("/api/v1/auth/me/")

        self.assertEqual(response.status_code, 401)
        self.assertFalse(response.data["success"])

    def test_refresh_returns_a_new_access_token(self):
        payload = self.authenticate()
        old_refresh = payload["tokens"]["refresh"]

        response = self.client.post(
            "/api/v1/auth/token/refresh/",
            {"refresh": old_refresh},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["message"], "Token refreshed successfully")
        self.assertIn("access", response.data["data"])
        # Rotation is enabled by default for the Phase 2 gate.
        self.assertIn("refresh", response.data["data"])
        self.assertNotEqual(response.data["data"]["refresh"], old_refresh)
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {response.data['data']['access']}"
        )
        me = self.client.get("/api/v1/auth/me/")
        self.assertEqual(me.status_code, 200)
        reused = self.client.post(
            "/api/v1/auth/token/refresh/",
            {"refresh": old_refresh},
            format="json",
        )
        self.assertEqual(reused.status_code, 401)

    def test_logout_blacklists_the_refresh_token(self):
        payload = self.authenticate()

        logout = self.client.post(
            "/api/v1/auth/logout/",
            {"refresh": payload["tokens"]["refresh"]},
            format="json",
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {payload['tokens']['access']}")
        me = self.client.get("/api/v1/auth/me/")
        refresh = self.client.post(
            "/api/v1/auth/token/refresh/",
            {"refresh": payload["tokens"]["refresh"]},
            format="json",
        )

        self.assertEqual(logout.status_code, 200)
        self.assertTrue(logout.data["success"])
        self.assertIsNone(logout.data["data"])
        self.assertEqual(logout.data["message"], "Logout successful")
        self.assertEqual(BlacklistedToken.objects.count(), 1)
        self.assertEqual(me.status_code, 200)
        self.assertEqual(refresh.status_code, 401)

    def test_refresh_rotation_rejects_old_token_and_accepts_new_token(self):
        payload = self.authenticate()
        refresh_a = payload["tokens"]["refresh"]

        first = self.client.post(
            "/api/v1/auth/refresh/",
            {"refresh": refresh_a},
            format="json",
        )
        self.assertEqual(first.status_code, 200)
        refresh_b = first.data["data"]["refresh"]
        self.assertNotEqual(refresh_b, refresh_a)

        old_rejected = self.client.post(
            "/api/v1/auth/token/refresh/",
            {"refresh": refresh_a},
            format="json",
        )
        new_accepted = self.client.post(
            "/api/v1/auth/token/refresh/",
            {"refresh": refresh_b},
            format="json",
        )

        self.assertEqual(old_rejected.status_code, 401)
        self.assertEqual(new_accepted.status_code, 200)
        self.assertIn("access", new_accepted.data["data"])
        self.assertIn("refresh", new_accepted.data["data"])

    def test_invalid_refresh_token_fails(self):
        response = self.client.post(
            "/api/v1/auth/token/refresh/",
            {"refresh": "not-a-valid-token"},
            format="json",
        )

        self.assertEqual(response.status_code, 401)
        self.assertFalse(response.data["success"])

    def test_expired_refresh_token_fails(self):
        from datetime import timedelta

        from rest_framework_simplejwt.tokens import RefreshToken

        payload = self.authenticate()
        from users.models import User

        user = User.objects.get(id=payload["user"]["id"])
        with override_settings(
            SIMPLE_JWT={
                **settings.SIMPLE_JWT,
                "REFRESH_TOKEN_LIFETIME": timedelta(seconds=-1),
            }
        ):
            # Lifetime is read when the token is created.
            expired = RefreshToken.for_user(user)
            expired.set_exp(lifetime=timedelta(seconds=-1))

        response = self.client.post(
            "/api/v1/auth/token/refresh/",
            {"refresh": str(expired)},
            format="json",
        )
        self.assertEqual(response.status_code, 401)
