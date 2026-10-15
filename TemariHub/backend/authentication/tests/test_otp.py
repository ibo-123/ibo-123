from datetime import timedelta
from unittest.mock import patch

from django.contrib.auth.hashers import check_password
from django.test import override_settings
from django.utils import timezone

from authentication.models import OTPVerification
from authentication.services import generate_otp
from authentication.sms import SMSDeliveryError
from authentication.tests.base import AuthAPITestCase
from users.models import User


class OTPRequestTests(AuthAPITestCase):
    @patch("authentication.services.generate_otp", return_value="123456")
    def test_otp_request_succeeds_without_returning_the_otp(self, _generate_otp):
        response = self.client.post(
            "/api/v1/auth/phone/request-otp/",
            {"phone_number": "0912345678"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["success"])
        self.assertEqual(response.data["message"], "OTP sent successfully")
        self.assertEqual(response.data["data"]["phone_number"], "+251912345678")
        self.assertEqual(response.data["data"]["expires_in"], 300)
        self.assertNotIn("otp", response.data["data"])
        self.assertNotIn("debug_otp", response.data["data"])

        record = OTPVerification.objects.get()
        self.assertNotEqual(record.otp_hash, "123456")
        self.assertNotIn("123456", record.otp_hash)
        self.assertTrue(check_password("123456", record.otp_hash))

    @patch("authentication.services.generate_otp", return_value="123456")
    @override_settings(DEBUG=True, OTP_DEBUG=True)
    def test_debug_otp_is_returned_only_when_explicitly_enabled(self, _generate_otp):
        response = self.client.post(
            "/api/v1/auth/phone/request-otp/",
            {"phone_number": "+251912345678"},
            format="json",
        )

        self.assertEqual(response.data["data"]["debug_otp"], "123456")

    @patch("authentication.services.generate_otp", return_value="123456")
    @override_settings(DEBUG=False, OTP_DEBUG=True, SMS_PROVIDER="console")
    def test_debug_flag_does_not_expose_otp_when_debug_is_off(self, _generate_otp):
        response = self.client.post(
            "/api/v1/auth/phone/request-otp/",
            {"phone_number": "0912345678"},
            format="json",
        )

        self.assertEqual(response.status_code, 503)
        self.assertNotIn("otp", response.data.get("data", {}) or {})
        self.assertNotIn("debug_otp", response.data.get("data", {}) or {})
        self.assertFalse(
            OTPVerification.objects.filter(invalidated_at__isnull=True).exists()
        )

    def test_invalid_phone_number_is_rejected(self):
        response = self.client.post(
            "/api/v1/auth/phone/request-otp/",
            {"phone_number": "12345"},
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertFalse(response.data["success"])
        self.assertIn("phone_number", response.data["errors"])
        self.assertEqual(OTPVerification.objects.count(), 0)

    @patch("authentication.services.generate_otp", side_effect=["111111", "222222"])
    def test_new_otp_invalidates_the_previous_otp(self, _generate_otp):
        self.client.post(
            "/api/v1/auth/phone/request-otp/",
            {"phone_number": "0912345678"},
            format="json",
        )
        self.client.post(
            "/api/v1/auth/phone/request-otp/",
            {"phone_number": "+251912345678"},
            format="json",
        )

        stale = self.client.post(
            "/api/v1/auth/phone/verify-otp/",
            {"phone_number": "0912345678", "otp": "111111"},
            format="json",
        )
        current = self.client.post(
            "/api/v1/auth/phone/verify-otp/",
            {"phone_number": "+251912345678", "otp": "222222"},
            format="json",
        )

        self.assertEqual(stale.status_code, 400)
        self.assertEqual(current.status_code, 200)
        self.assertEqual(User.objects.count(), 1)

    @patch("authentication.services.generate_otp", return_value="123456")
    @override_settings(OTP_REQUEST_LIMIT=2)
    def test_phone_number_rate_limit(self, _generate_otp):
        for _ in range(2):
            response = self.client.post(
                "/api/v1/auth/phone/request-otp/",
                {"phone_number": "0912345678"},
                format="json",
            )
            self.assertEqual(response.status_code, 200)

        blocked = self.client.post(
            "/api/v1/auth/phone/request-otp/",
            {"phone_number": "+251912345678"},
            format="json",
        )
        other_phone = self.client.post(
            "/api/v1/auth/phone/request-otp/",
            {"phone_number": "0911111111"},
            format="json",
        )

        self.assertEqual(blocked.status_code, 429)
        self.assertFalse(blocked.data["success"])
        self.assertEqual(other_phone.status_code, 200)

    @patch("authentication.services.generate_otp", return_value="123456")
    def test_ip_rate_limit(self, _generate_otp):
        # DRF copies throttle rates onto the throttle class at import time,
        # so the limit is set on the class for this test and then restored.
        from authentication.throttles import OTPRequestThrottle

        OTPRequestThrottle.rate = "1/min"
        try:
            first = self.client.post(
                "/api/v1/auth/phone/request-otp/",
                {"phone_number": "0912345678"},
                format="json",
            )
            second = self.client.post(
                "/api/v1/auth/phone/request-otp/",
                {"phone_number": "0922222222"},
                format="json",
            )
        finally:
            del OTPRequestThrottle.rate

        self.assertEqual(first.status_code, 200)
        self.assertEqual(second.status_code, 429)
        self.assertFalse(second.data["success"])

    @patch("authentication.services.get_sms_provider")
    @patch("authentication.services.generate_otp", return_value="123456")
    def test_delivery_failure_does_not_leave_a_usable_otp(self, _generate_otp, get_provider):
        get_provider.return_value.send_otp.side_effect = SMSDeliveryError("down")

        response = self.client.post(
            "/api/v1/auth/phone/request-otp/",
            {"phone_number": "0912345678"},
            format="json",
        )

        self.assertEqual(response.status_code, 503)
        record = OTPVerification.objects.get()
        self.assertIsNotNone(record.invalidated_at)

    @patch("authentication.services.secrets.randbelow", return_value=7)
    def test_otp_generation_uses_the_secrets_module(self, mock_randbelow):
        self.assertEqual(generate_otp(6), "777777")
        self.assertEqual(mock_randbelow.call_count, 6)


class OTPVerificationTests(AuthAPITestCase):
    def _request(self, otp="123456"):
        with patch("authentication.services.generate_otp", return_value=otp):
            response = self.client.post(
                "/api/v1/auth/phone/request-otp/",
                {"phone_number": "0912345678"},
                format="json",
            )
        self.assertEqual(response.status_code, 200)
        return response

    def test_wrong_otp_fails(self):
        self._request()

        response = self.client.post(
            "/api/v1/auth/phone/verify-otp/",
            {"phone_number": "+251912345678", "otp": "000000"},
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertFalse(response.data["success"])
        self.assertEqual(User.objects.count(), 0)
        self.assertEqual(OTPVerification.objects.get().attempts, 1)

    def test_otp_expires(self):
        self._request()
        OTPVerification.objects.update(expires_at=timezone.now() - timedelta(seconds=1))

        response = self.client.post(
            "/api/v1/auth/phone/verify-otp/",
            {"phone_number": "0912345678", "otp": "123456"},
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["message"], "OTP has expired.")
        self.assertEqual(User.objects.count(), 0)

    @override_settings(OTP_MAX_ATTEMPTS=3)
    def test_too_many_attempts_fail(self):
        self._request()
        for _ in range(2):
            response = self.client.post(
                "/api/v1/auth/phone/verify-otp/",
                {"phone_number": "0912345678", "otp": "000000"},
                format="json",
            )
            self.assertEqual(response.status_code, 400)

        locked = self.client.post(
            "/api/v1/auth/phone/verify-otp/",
            {"phone_number": "0912345678", "otp": "000000"},
            format="json",
        )
        correct_after_lock = self.client.post(
            "/api/v1/auth/phone/verify-otp/",
            {"phone_number": "0912345678", "otp": "123456"},
            format="json",
        )

        self.assertEqual(locked.status_code, 429)
        self.assertFalse(locked.data["success"])
        self.assertEqual(correct_after_lock.status_code, 400)
        self.assertEqual(User.objects.count(), 0)

    def test_successful_verification_invalidates_the_otp(self):
        self._request()
        first = self.client.post(
            "/api/v1/auth/phone/verify-otp/",
            {"phone_number": "0912345678", "otp": "123456"},
            format="json",
        )
        second = self.client.post(
            "/api/v1/auth/phone/verify-otp/",
            {"phone_number": "+251912345678", "otp": "123456"},
            format="json",
        )

        self.assertEqual(first.status_code, 200)
        self.assertIsNotNone(OTPVerification.objects.get().verified_at)
        self.assertEqual(second.status_code, 400)
        self.assertEqual(User.objects.count(), 1)

    def test_same_person_is_not_duplicated_across_phone_formats(self):
        self._request()
        self.client.post(
            "/api/v1/auth/phone/verify-otp/",
            {"phone_number": "0912345678", "otp": "123456"},
            format="json",
        )
        self._request("654321")
        self.client.post(
            "/api/v1/auth/phone/verify-otp/",
            {"phone_number": "+251912345678", "otp": "654321"},
            format="json",
        )

        self.assertEqual(User.objects.count(), 1)
        self.assertEqual(User.objects.get().phone_number, "+251912345678")
