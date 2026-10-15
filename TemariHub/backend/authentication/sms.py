"""SMS delivery for TemariHub OTP flows.

Providers never log OTPs or API keys. Delivery attempts are recorded in
``SMSMessage`` without storing message bodies that contain OTPs.
"""
import logging
import re

import requests
from django.conf import settings
from django.utils import timezone

from users.phone import mask_phone

logger = logging.getLogger(__name__)

# Ethiopic Unicode block (includes Amharic)
_ETHIOPIC_RE = re.compile(r"[\u1200-\u137F]")

ENGLISH_SMS_LIMIT = 160
AMHARIC_SMS_LIMIT = 70

SELEDA_SMS_URL = "https://sms.seleda.et/api/v1/sms/send/"


class SMSDeliveryError(Exception):
    """Safe, user-facing delivery failure. Never includes credentials or OTP."""


class SMSValidationError(SMSDeliveryError):
    """Raised when a message violates character limits before provider calls."""


def contains_amharic(text):
    return bool(_ETHIOPIC_RE.search(text or ""))


def detect_sms_language(text):
    from authentication.models import SMSLanguage

    if contains_amharic(text):
        return SMSLanguage.AMHARIC
    return SMSLanguage.ENGLISH


def sms_character_limit(language):
    from authentication.models import SMSLanguage

    if language == SMSLanguage.AMHARIC:
        return AMHARIC_SMS_LIMIT
    return ENGLISH_SMS_LIMIT


def validate_sms_length(text):
    """Enforce Seleda English/Amharic limits. Never silently truncate."""
    from authentication.models import SMSLanguage

    language = detect_sms_language(text)
    limit = sms_character_limit(language)
    length = len(text)
    if length > limit:
        label = "Amharic" if language == SMSLanguage.AMHARIC else "English"
        raise SMSValidationError(
            f"{label} SMS exceeds the {limit}-character limit ({length} characters)."
        )
    return language, length


def build_otp_message(otp, purpose):
    """Render the OTP SMS from the configured template.

    The template must keep English messages ≤160 and Amharic ≤70 characters
    including a full OTP and expiry minutes.
    """
    minutes = max(1, int(settings.OTP_EXPIRY_SECONDS) // 60)
    template = settings.SMS_OTP_TEMPLATE
    try:
        message = template.format(otp=otp, minutes=minutes, purpose=purpose)
    except (KeyError, ValueError) as exc:
        raise SMSDeliveryError("SMS message template is misconfigured.") from exc
    return message


def _safe_provider_error(response=None, exception=None):
    """Map provider failures to a short message safe for storage and clients."""
    if exception is not None:
        return "SMS provider request failed."
    if response is not None:
        return f"SMS provider returned HTTP {response.status_code}."
    return "SMS delivery failed."


def _extract_provider_message_id(payload):
    if not isinstance(payload, dict):
        return ""
    for key in ("id", "message_id", "messageId", "uuid", "sid"):
        value = payload.get(key)
        if value is not None and str(value).strip():
            return str(value)[:128]
    data = payload.get("data")
    if isinstance(data, dict):
        return _extract_provider_message_id(data)
    return ""


def record_sms(
    *,
    recipient,
    purpose,
    status,
    character_count,
    language,
    provider,
    provider_message_id="",
    error_message="",
    sent_at=None,
):
    from authentication.models import SMSMessage

    return SMSMessage.objects.create(
        recipient=recipient,
        purpose=purpose,
        status=status,
        character_count=character_count,
        language=language,
        provider=provider,
        provider_message_id=provider_message_id or "",
        error_message=(error_message or "")[:255],
        sent_at=sent_at,
    )


class BaseSMSProvider:
    provider_name = "base"

    def send_otp(self, phone_number, otp, purpose):
        raise NotImplementedError

    def _dispatch(self, phone_number, otp, purpose):
        from authentication.models import SMSStatus

        message = build_otp_message(otp, purpose)
        language, character_count = validate_sms_length(message)
        try:
            provider_message_id = self._send_message(phone_number, message)
        except SMSValidationError:
            raise
        except SMSDeliveryError as exc:
            record_sms(
                recipient=phone_number,
                purpose=purpose,
                status=SMSStatus.FAILED,
                character_count=character_count,
                language=language,
                provider=self.provider_name,
                error_message=str(exc),
            )
            raise
        except Exception as exc:
            logger.exception(
                "Unexpected SMS failure for %s via %s.",
                mask_phone(phone_number),
                self.provider_name,
            )
            record_sms(
                recipient=phone_number,
                purpose=purpose,
                status=SMSStatus.FAILED,
                character_count=character_count,
                language=language,
                provider=self.provider_name,
                error_message=_safe_provider_error(exception=exc),
            )
            raise SMSDeliveryError("Unable to send OTP. Try again later.") from exc

        record_sms(
            recipient=phone_number,
            purpose=purpose,
            status=SMSStatus.SENT,
            character_count=character_count,
            language=language,
            provider=self.provider_name,
            provider_message_id=provider_message_id or "",
            sent_at=timezone.now(),
        )
        return True

    def _send_message(self, phone_number, message):
        raise NotImplementedError


class ConsoleSMSProvider(BaseSMSProvider):
    """Development provider. Never writes the OTP value to logs."""

    provider_name = "console"

    def send_otp(self, phone_number, otp, purpose):
        if not settings.DEBUG:
            raise SMSDeliveryError(
                "Console SMS provider cannot be used when DEBUG is False."
            )
        return self._dispatch(phone_number, otp, purpose)

    def _send_message(self, phone_number, message):
        language, length = validate_sms_length(message)
        logger.info(
            "Development SMS provider accepted an OTP dispatch for %s "
            "(%s chars, %s).",
            mask_phone(phone_number),
            length,
            language,
        )
        return ""


class SeledaSMSProvider(BaseSMSProvider):
    """Production SMS via https://sms.seleda.et/api/v1/sms/send/."""

    provider_name = "seleda"

    def send_otp(self, phone_number, otp, purpose):
        if not settings.SMS_API_KEY:
            raise SMSDeliveryError("SMS provider credentials are not configured.")
        return self._dispatch(phone_number, otp, purpose)

    def _send_message(self, phone_number, message):
        # SMS_API_KEY is the Seleda API token. Do not log headers or the body.
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": f"Api-Key {settings.SMS_API_KEY}",
        }
        body = {
            "message": message,
            "recipient": phone_number,
        }
        try:
            response = requests.post(
                SELEDA_SMS_URL,
                json=body,
                headers=headers,
                timeout=settings.SMS_REQUEST_TIMEOUT_SECONDS,
            )
        except requests.RequestException as exc:
            logger.exception(
                "Seleda SMS transport error for %s.",
                mask_phone(phone_number),
            )
            raise SMSDeliveryError(_safe_provider_error(exception=exc)) from exc

        if not response.ok:
            logger.warning(
                "Seleda SMS rejected delivery for %s with HTTP %s.",
                mask_phone(phone_number),
                response.status_code,
            )
            raise SMSDeliveryError(_safe_provider_error(response=response))

        try:
            payload = response.json()
        except ValueError:
            payload = None
        return _extract_provider_message_id(payload)


class UnsupportedSMSProvider(BaseSMSProvider):
    def __init__(self, name):
        self.name = name
        self.provider_name = name

    def send_otp(self, phone_number, otp, purpose):
        if not settings.SMS_API_KEY:
            raise SMSDeliveryError("SMS provider credentials are not configured.")
        raise SMSDeliveryError(f"SMS provider '{self.name}' is not implemented.")


def get_sms_provider():
    name = (settings.SMS_PROVIDER or "").strip().lower()
    if name == "console":
        if not settings.DEBUG:
            raise SMSDeliveryError(
                "Console SMS provider cannot be used when DEBUG is False."
            )
        return ConsoleSMSProvider()
    if name == "seleda":
        return SeledaSMSProvider()
    if name in ("", "none"):
        raise SMSDeliveryError("SMS provider is not configured.")
    return UnsupportedSMSProvider(name)
