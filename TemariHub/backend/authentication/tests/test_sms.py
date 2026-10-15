from unittest.mock import MagicMock, patch

from django.contrib import admin
from django.test import override_settings
from django.test.client import RequestFactory

from authentication.models import OTPPurpose, SMSLanguage, SMSMessage, SMSStatus
from authentication.sms import (
    AMHARIC_SMS_LIMIT,
    ENGLISH_SMS_LIMIT,
    SMSValidationError,
    build_otp_message,
    contains_amharic,
    detect_sms_language,
    get_sms_provider,
    validate_sms_length,
)
from authentication.tests.base import AuthAPITestCase


@override_settings(SMS_PROVIDER="console", DEBUG=True, SMS_API_KEY="")
class SMSCharacterLimitTests(AuthAPITestCase):
    def test_english_within_limit_is_allowed(self):
        text = "A" * ENGLISH_SMS_LIMIT
        language, length = validate_sms_length(text)
        self.assertEqual(language, SMSLanguage.ENGLISH)
        self.assertEqual(length, ENGLISH_SMS_LIMIT)

    def test_english_over_limit_is_rejected(self):
        with self.assertRaises(SMSValidationError) as ctx:
            validate_sms_length("A" * (ENGLISH_SMS_LIMIT + 1))
        self.assertIn("160", str(ctx.exception))

    def test_amharic_within_limit_is_allowed(self):
        # U+1200 is Ethiopic syllable ha
        text = "\u1200" * AMHARIC_SMS_LIMIT
        language, length = validate_sms_length(text)
        self.assertEqual(language, SMSLanguage.AMHARIC)
        self.assertEqual(length, AMHARIC_SMS_LIMIT)
        self.assertTrue(contains_amharic(text))

    def test_amharic_over_limit_is_rejected(self):
        with self.assertRaises(SMSValidationError) as ctx:
            validate_sms_length("\u1200" * (AMHARIC_SMS_LIMIT + 1))
        self.assertIn("70", str(ctx.exception))

    def test_default_english_otp_template_fits_limit(self):
        message = build_otp_message("123456", OTPPurpose.LOGIN)
        language, length = validate_sms_length(message)
        self.assertEqual(language, SMSLanguage.ENGLISH)
        self.assertLessEqual(length, ENGLISH_SMS_LIMIT)


@override_settings(
    SMS_PROVIDER="seleda",
    SMS_API_KEY="test-seleda-key",
    DEBUG=True,
)
class SeledaSMSProviderTests(AuthAPITestCase):
    def setUp(self):
        super().setUp()
        self.provider = get_sms_provider()

    @patch("authentication.sms.requests.post")
    def test_successful_send_records_sent_sms(self, mock_post):
        mock_post.return_value = MagicMock(
            ok=True,
            status_code=200,
            json=lambda: {"id": "msg-42"},
        )

        with patch("authentication.services.generate_otp", return_value="740296"):
            response = self.client.post(
                "/api/v1/auth/phone/send-otp/",
                {"phone_number": "0912345678"},
                format="json",
            )

        self.assertEqual(response.status_code, 200)
        self.assertNotIn("740296", str(response.data))
        self.assertNotIn("otp", response.data["data"])
        self.assertNotIn("test-seleda-key", str(response.data))

        record = SMSMessage.objects.get()
        self.assertEqual(record.status, SMSStatus.SENT)
        self.assertEqual(record.provider, "seleda")
        self.assertEqual(record.recipient, "+251912345678")
        self.assertEqual(record.provider_message_id, "msg-42")
        self.assertEqual(record.language, SMSLanguage.ENGLISH)
        self.assertIsNotNone(record.sent_at)
        self.assertNotIn("740296", record.error_message)
        # Model fields must never hold the OTP or API key.
        for value in (
            record.recipient,
            record.purpose,
            record.status,
            record.language,
            record.provider,
            record.provider_message_id,
            record.error_message,
        ):
            self.assertNotIn("740296", str(value))
            self.assertNotIn("test-seleda-key", str(value))

        mock_post.assert_called_once()
        kwargs = mock_post.call_args.kwargs
        self.assertEqual(
            kwargs["headers"]["Authorization"],
            "Api-Key test-seleda-key",
        )
        self.assertIn("740296", kwargs["json"]["message"])
        self.assertEqual(kwargs["json"]["recipient"], "+251912345678")

    @patch("authentication.sms.requests.post")
    def test_non_2xx_records_failed_sms_and_returns_safe_error(self, mock_post):
        mock_post.return_value = MagicMock(ok=False, status_code=502, text="upstream")

        with patch("authentication.services.generate_otp", return_value="740296"):
            response = self.client.post(
                "/api/v1/auth/phone/send-otp/",
                {"phone_number": "0912345678"},
                format="json",
            )

        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.data["message"], "Unable to send OTP. Try again later.")
        self.assertNotIn("740296", str(response.data))
        self.assertNotIn("test-seleda-key", str(response.data))
        self.assertNotIn("upstream", str(response.data))

        record = SMSMessage.objects.get()
        self.assertEqual(record.status, SMSStatus.FAILED)
        self.assertIn("502", record.error_message)
        self.assertNotIn("740296", record.error_message)
        self.assertIsNone(record.sent_at)

    @patch("authentication.sms.requests.post", side_effect=ConnectionError("down"))
    def test_provider_exception_records_failed_sms(self, _mock_post):
        with patch("authentication.services.generate_otp", return_value="740296"):
            response = self.client.post(
                "/api/v1/auth/phone/send-otp/",
                {"phone_number": "0912345678"},
                format="json",
            )

        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.data["message"], "Unable to send OTP. Try again later.")
        self.assertNotIn("down", str(response.data))
        record = SMSMessage.objects.get()
        self.assertEqual(record.status, SMSStatus.FAILED)
        self.assertEqual(record.error_message, "SMS provider request failed.")

    @override_settings(
        SMS_OTP_TEMPLATE="{otp}" + ("X" * 200),
        SMS_PROVIDER="seleda",
        SMS_API_KEY="test-seleda-key",
    )
    @patch("authentication.sms.requests.post")
    def test_overlong_template_is_rejected_before_provider_call(self, mock_post):
        with patch("authentication.services.generate_otp", return_value="740296"):
            response = self.client.post(
                "/api/v1/auth/phone/send-otp/",
                {"phone_number": "0912345678"},
                format="json",
            )

        self.assertEqual(response.status_code, 400)
        self.assertIn("160", response.data["message"])
        mock_post.assert_not_called()
        self.assertEqual(SMSMessage.objects.count(), 0)

    def test_dashboard_counts_use_smsmessage_as_source_of_truth(self):
        SMSMessage.objects.create(
            recipient="+251911111111",
            purpose=OTPPurpose.LOGIN,
            status=SMSStatus.SENT,
            character_count=40,
            language=SMSLanguage.ENGLISH,
            provider="seleda",
            sent_at=None,
        )
        SMSMessage.objects.create(
            recipient="+251922222222",
            purpose=OTPPurpose.PASSWORD_RESET,
            status=SMSStatus.FAILED,
            character_count=40,
            language=SMSLanguage.ENGLISH,
            provider="seleda",
            error_message="SMS provider returned HTTP 500.",
        )
        counts = SMSMessage.dashboard_counts()
        self.assertEqual(counts, {"total": 2, "sent": 1, "failed": 1})

    def test_admin_index_exposes_sms_counts(self):
        from django.contrib.auth.models import AnonymousUser

        SMSMessage.objects.create(
            recipient="+251911111111",
            purpose=OTPPurpose.LOGIN,
            status=SMSStatus.SENT,
            character_count=40,
            language=SMSLanguage.ENGLISH,
            provider="console",
        )
        request = RequestFactory().get("/admin/")
        request.user = AnonymousUser()
        context = admin.site.each_context(request)
        self.assertEqual(context["sms_stats"]["sent"], 1)
        self.assertEqual(context["sms_stats"]["total"], 1)

    def test_detect_language_for_mixed_content_is_amharic(self):
        self.assertEqual(
            detect_sms_language("Code \u1200"),
            SMSLanguage.AMHARIC,
        )
