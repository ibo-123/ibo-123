from django.contrib import admin
from django.utils.html import format_html

from authentication.models import (
    OneTimeToken,
    OTPVerification,
    SMSMessage,
    SocialAccount,
    TwoFactorDevice,
)
from users.phone import mask_phone


@admin.register(OTPVerification)
class OTPVerificationAdmin(admin.ModelAdmin):
    list_display = (
        "masked_phone",
        "purpose",
        "attempts",
        "expires_at",
        "verified_at",
        "invalidated_at",
        "created_at",
    )
    list_filter = ("purpose",)
    search_fields = ("phone_number",)
    readonly_fields = (
        "id",
        "phone_number",
        "purpose",
        "attempts",
        "expires_at",
        "verified_at",
        "invalidated_at",
        "created_at",
        "updated_at",
    )
    exclude = ("otp_hash",)

    @admin.display(description="Phone")
    def masked_phone(self, obj):
        return mask_phone(obj.phone_number)

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False


@admin.register(SMSMessage)
class SMSMessageAdmin(admin.ModelAdmin):
    """SMS audit log. OTP bodies and API keys are never stored or shown."""

    change_list_template = "admin/authentication/smsmessage/change_list.html"
    list_display = (
        "masked_recipient",
        "purpose",
        "status",
        "language",
        "character_count",
        "provider",
        "created_at",
        "sent_at",
    )
    list_filter = ("status", "purpose", "language", "provider")
    search_fields = ("recipient", "provider_message_id", "error_message")
    readonly_fields = (
        "id",
        "recipient",
        "purpose",
        "status",
        "character_count",
        "language",
        "provider",
        "provider_message_id",
        "error_message",
        "created_at",
        "sent_at",
    )
    ordering = ("-created_at",)
    date_hierarchy = "created_at"

    @admin.display(description="Recipient")
    def masked_recipient(self, obj):
        return mask_phone(obj.recipient)

    def changelist_view(self, request, extra_context=None):
        extra_context = extra_context or {}
        counts = SMSMessage.dashboard_counts()
        extra_context["sms_stats"] = counts
        extra_context["sms_stats_html"] = format_html(
            "<strong>Total SMS:</strong> {} &nbsp;|&nbsp; "
            "<strong>Sent:</strong> {} &nbsp;|&nbsp; "
            "<strong>Failed:</strong> {}",
            counts["total"],
            counts["sent"],
            counts["failed"],
        )
        return super().changelist_view(request, extra_context=extra_context)

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False


@admin.register(TwoFactorDevice)
class TwoFactorDeviceAdmin(admin.ModelAdmin):
    """Secrets are never shown; staff can only inspect state or remove a device."""

    list_display = ("user", "is_enabled", "confirmed_at", "created_at")
    search_fields = ("user__phone_number", "user__email")
    fields = ("id", "user", "confirmed_at", "last_used_step", "created_at", "updated_at")
    readonly_fields = fields

    @admin.display(boolean=True)
    def is_enabled(self, obj):
        return obj.is_enabled

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False


@admin.register(OneTimeToken)
class OneTimeTokenAdmin(admin.ModelAdmin):
    list_display = ("user", "purpose", "expires_at", "used_at", "created_at")
    list_filter = ("purpose",)
    search_fields = ("user__phone_number", "user__email")
    readonly_fields = ("id", "user", "purpose", "expires_at", "used_at", "created_at")

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False


@admin.register(SocialAccount)
class SocialAccountAdmin(admin.ModelAdmin):
    list_display = ("provider", "provider_user_id", "email", "user", "created_at")
    list_filter = ("provider",)
    search_fields = ("provider_user_id", "email", "user__phone_number", "user__email")
    readonly_fields = (
        "id",
        "user",
        "provider",
        "provider_user_id",
        "email",
        "created_at",
        "updated_at",
    )

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
