import uuid

from django.conf import settings
from django.db import models
from django.utils import timezone


class OTPPurpose(models.TextChoices):
    LOGIN = "LOGIN", "Login"
    SIGNUP = "SIGNUP", "Signup"
    PASSWORD_RESET = "PASSWORD_RESET", "Password reset"
    PHONE_VERIFICATION = "PHONE_VERIFICATION", "Phone verification"


class OTPVerification(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    phone_number = models.CharField(max_length=20)
    otp_hash = models.CharField(max_length=255)
    purpose = models.CharField(
        max_length=32,
        choices=OTPPurpose.choices,
        default=OTPPurpose.LOGIN,
    )
    attempts = models.PositiveSmallIntegerField(default=0)
    expires_at = models.DateTimeField()
    verified_at = models.DateTimeField(null=True, blank=True)
    invalidated_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(
                fields=["phone_number", "purpose", "created_at"],
                name="otp_phone_purpose_idx",
            )
        ]

    def __str__(self):
        return f"{self.purpose} OTP for {self.phone_number}"


class SocialProvider(models.TextChoices):
    GOOGLE = "google", "Google"
    APPLE = "apple", "Apple"


class SocialAccount(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="social_accounts",
    )
    provider = models.CharField(max_length=32, choices=SocialProvider.choices)
    provider_user_id = models.CharField(max_length=255)
    email = models.EmailField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["provider", "provider_user_id"],
                name="uniq_social_provider_uid",
            )
        ]

    def __str__(self):
        return f"{self.provider}:{self.provider_user_id}"


class TwoFactorDevice(models.Model):
    """A TOTP authenticator bound to one user.

    The shared secret is stored encrypted (see authentication.totp). 2FA is
    only active once ``confirmed_at`` is set by a successful code check.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="two_factor_device",
    )
    encrypted_secret = models.TextField()
    confirmed_at = models.DateTimeField(null=True, blank=True)
    last_used_step = models.BigIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def is_enabled(self):
        return self.confirmed_at is not None

    def __str__(self):
        state = "enabled" if self.is_enabled else "pending"
        return f"TOTP device for {self.user_id} ({state})"


class OneTimeTokenPurpose(models.TextChoices):
    TWO_FACTOR_LOGIN = "TWO_FACTOR_LOGIN", "Two-factor login challenge"
    PASSWORD_RESET = "PASSWORD_RESET", "Password reset"


class OneTimeToken(models.Model):
    """Server-side record behind short-lived signed credentials.

    The client receives a signed value that references this row. The row makes
    the credential single-use and lets it be tied to one user and purpose.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="one_time_tokens",
    )
    purpose = models.CharField(max_length=32, choices=OneTimeTokenPurpose.choices)
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "purpose"], name="ott_user_purpose_idx"),
        ]

    @property
    def is_usable(self):
        return self.used_at is None and self.expires_at > timezone.now()

    def __str__(self):
        return f"{self.purpose} token for {self.user_id}"


class SMSLanguage(models.TextChoices):
    ENGLISH = "english", "English"
    AMHARIC = "amharic", "Amharic"


class SMSStatus(models.TextChoices):
    SENT = "SENT", "Sent"
    FAILED = "FAILED", "Failed"


class SMSMessage(models.Model):
    """Audit record for outbound SMS. The OTP body is never stored."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recipient = models.CharField(max_length=20)
    purpose = models.CharField(
        max_length=32,
        choices=OTPPurpose.choices,
        default=OTPPurpose.LOGIN,
    )
    status = models.CharField(max_length=16, choices=SMSStatus.choices)
    character_count = models.PositiveSmallIntegerField()
    language = models.CharField(max_length=16, choices=SMSLanguage.choices)
    provider = models.CharField(max_length=32)
    provider_message_id = models.CharField(max_length=128, blank=True, default="")
    error_message = models.CharField(max_length=255, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    sent_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status", "created_at"], name="sms_status_created_idx"),
            models.Index(fields=["purpose", "created_at"], name="sms_purpose_created_idx"),
        ]

    def __str__(self):
        return f"{self.status} SMS to {self.recipient} ({self.purpose})"

    @classmethod
    def dashboard_counts(cls):
        return {
            "total": cls.objects.count(),
            "sent": cls.objects.filter(status=SMSStatus.SENT).count(),
            "failed": cls.objects.filter(status=SMSStatus.FAILED).count(),
        }
