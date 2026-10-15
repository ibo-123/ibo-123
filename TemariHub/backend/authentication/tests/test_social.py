from unittest.mock import patch

from django.test import override_settings

from authentication.models import SocialAccount, SocialProvider
from authentication.social import SocialTokenError, verify_apple_id_token, verify_google_id_token
from authentication.tests.base import AuthAPITestCase
from users.models import User


GOOGLE_CLAIMS = {
    "sub": "google-user-1",
    "email": "student@example.com",
    "email_verified": True,
    "first_name": "Abebe",
    "last_name": "Kebede",
}

APPLE_CLAIMS = {
    "sub": "apple-user-1",
    "email": "student@privaterelay.appleid.com",
    "email_verified": True,
    "first_name": "",
    "last_name": "",
}


class GoogleAuthTests(AuthAPITestCase):
    @patch("authentication.services.verify_google_id_token", return_value=GOOGLE_CLAIMS)
    def test_google_login_creates_a_user_and_issues_tokens(self, mock_verify):
        response = self.client.post(
            "/api/v1/auth/google/",
            {
                "id_token": "google-token",
                "email": "attacker@example.com",
                "user_id": "forged-user",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["data"]["user"]["email"], "student@example.com")
        self.assertIsNone(response.data["data"]["user"]["phone_number"])
        self.assertEqual(response.data["data"]["user"]["first_name"], "Abebe")
        self.assertTrue(response.data["data"]["tokens"]["access"])
        mock_verify.assert_called_once_with("google-token")
        self.assertEqual(User.objects.count(), 1)
        self.assertEqual(SocialAccount.objects.get().provider, SocialProvider.GOOGLE)

    @patch("authentication.services.verify_google_id_token", return_value=GOOGLE_CLAIMS)
    def test_google_login_reuses_the_same_provider_identity(self, _mock_verify):
        first = self.client.post(
            "/api/v1/auth/google/",
            {"id_token": "google-token"},
            format="json",
        )
        second = self.client.post(
            "/api/v1/auth/google/",
            {"id_token": "google-token"},
            format="json",
        )

        self.assertEqual(first.data["data"]["user"]["id"], second.data["data"]["user"]["id"])
        self.assertEqual(User.objects.count(), 1)
        self.assertEqual(SocialAccount.objects.count(), 1)

    @patch(
        "authentication.services.verify_google_id_token",
        side_effect=SocialTokenError("Invalid Google identity token."),
    )
    def test_invalid_google_token_does_not_create_a_user(self, _mock_verify):
        response = self.client.post(
            "/api/v1/auth/google/",
            {"id_token": "bad-token", "email": "attacker@example.com"},
            format="json",
        )

        self.assertEqual(response.status_code, 401)
        self.assertFalse(response.data["success"])
        self.assertEqual(User.objects.count(), 0)
        self.assertEqual(SocialAccount.objects.count(), 0)

    @override_settings(GOOGLE_CLIENT_ID="")
    def test_google_is_rejected_when_unconfigured(self):
        response = self.client.post(
            "/api/v1/auth/google/",
            {"id_token": "google-token"},
            format="json",
        )

        self.assertEqual(response.status_code, 503)
        self.assertFalse(response.data["success"])
        self.assertEqual(User.objects.count(), 0)

    @patch("authentication.social.id_token.verify_oauth2_token")
    @override_settings(GOOGLE_CLIENT_ID="temarihub-client")
    def test_google_verifier_checks_audience_and_ignores_unverified_email(self, mock_verify):
        mock_verify.return_value = {
            "iss": "accounts.google.com",
            "aud": "temarihub-client",
            "sub": "google-sub",
            "email": "unverified@example.com",
            "email_verified": False,
            "given_name": "Abebe",
            "family_name": "Kebede",
        }

        claims = verify_google_id_token("signed-token")

        mock_verify.assert_called_once()
        self.assertEqual(mock_verify.call_args.args[0], "signed-token")
        self.assertIsNone(claims["email"])
        self.assertEqual(claims["sub"], "google-sub")

    @patch("authentication.social.id_token.verify_oauth2_token")
    @override_settings(GOOGLE_CLIENT_ID="temarihub-client")
    def test_google_verifier_rejects_a_different_audience(self, mock_verify):
        mock_verify.return_value = {
            "iss": "https://accounts.google.com",
            "aud": "some-other-client",
            "sub": "google-sub",
            "email": "student@example.com",
            "email_verified": True,
        }

        with self.assertRaises(SocialTokenError):
            verify_google_id_token("signed-token")


class AppleAuthTests(AuthAPITestCase):
    @patch("authentication.services.verify_apple_id_token", return_value=APPLE_CLAIMS)
    def test_apple_login_creates_a_user_from_the_verified_token(self, mock_verify):
        response = self.client.post(
            "/api/v1/auth/apple/",
            {
                "id_token": "apple-token",
                "email": "attacker@example.com",
                "user_id": "forged-user",
                "name": "Forged Name",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.data["data"]["user"]["email"],
            "student@privaterelay.appleid.com",
        )
        self.assertEqual(response.data["data"]["user"]["first_name"], "")
        self.assertTrue(response.data["data"]["tokens"]["refresh"])
        mock_verify.assert_called_once_with("apple-token")
        self.assertEqual(SocialAccount.objects.get().provider, SocialProvider.APPLE)

    @patch("authentication.services.verify_apple_id_token", return_value=APPLE_CLAIMS)
    def test_apple_login_reuses_the_same_provider_identity(self, _mock_verify):
        first = self.client.post(
            "/api/v1/auth/apple/",
            {"id_token": "apple-token"},
            format="json",
        )
        second = self.client.post(
            "/api/v1/auth/apple/",
            {"id_token": "apple-token"},
            format="json",
        )

        self.assertEqual(first.data["data"]["user"]["id"], second.data["data"]["user"]["id"])
        self.assertEqual(User.objects.count(), 1)

    @patch(
        "authentication.services.verify_apple_id_token",
        side_effect=SocialTokenError("Invalid Apple identity token."),
    )
    def test_invalid_apple_token_does_not_create_a_user(self, _mock_verify):
        response = self.client.post(
            "/api/v1/auth/apple/",
            {"id_token": "bad-token"},
            format="json",
        )

        self.assertEqual(response.status_code, 401)
        self.assertEqual(User.objects.count(), 0)

    @override_settings(APPLE_CLIENT_ID="")
    def test_apple_is_rejected_when_unconfigured(self):
        response = self.client.post(
            "/api/v1/auth/apple/",
            {"id_token": "apple-token"},
            format="json",
        )

        self.assertEqual(response.status_code, 503)
        self.assertEqual(User.objects.count(), 0)

    @patch("authentication.social.jwt.decode")
    @patch("authentication.social.PyJWKClient")
    @override_settings(APPLE_CLIENT_ID="com.temarihub.app")
    def test_apple_verifier_uses_apple_signing_keys(self, mock_jwk_client, mock_decode):
        mock_jwk_client.return_value.get_signing_key_from_jwt.return_value.key = "public-key"
        mock_decode.return_value = {
            "sub": "apple-sub",
            "email": "hidden@privaterelay.appleid.com",
            "email_verified": "true",
        }

        claims = verify_apple_id_token("apple-token")

        mock_jwk_client.assert_called_once_with("https://appleid.apple.com/auth/keys")
        self.assertEqual(mock_decode.call_args.kwargs["algorithms"], ["RS256"])
        self.assertEqual(mock_decode.call_args.kwargs["audience"], ["com.temarihub.app"])
        self.assertEqual(mock_decode.call_args.kwargs["issuer"], "https://appleid.apple.com")
        self.assertEqual(claims["sub"], "apple-sub")
        self.assertEqual(claims["email"], "hidden@privaterelay.appleid.com")

    @patch("authentication.services.verify_google_id_token")
    @patch("authentication.services.verify_apple_id_token")
    def test_same_provider_user_id_is_separate_per_provider(self, mock_apple, mock_google):
        mock_google.return_value = {
            "sub": "shared-subject",
            "email": "google@example.com",
            "email_verified": True,
            "first_name": "",
            "last_name": "",
        }
        mock_apple.return_value = {
            "sub": "shared-subject",
            "email": "apple@example.com",
            "email_verified": True,
            "first_name": "",
            "last_name": "",
        }

        self.client.post("/api/v1/auth/google/", {"id_token": "g"}, format="json")
        self.client.post("/api/v1/auth/apple/", {"id_token": "a"}, format="json")

        self.assertEqual(User.objects.count(), 2)
        self.assertEqual(SocialAccount.objects.count(), 2)
