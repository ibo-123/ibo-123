from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.forms import AuthenticationForm, UserChangeForm, UserCreationForm
from django.core.exceptions import ValidationError

from users.models import (
    StudentLearningGoal,
    StudentOnboarding,
    StudentProfile,
    StudentSelectedSubject,
    User,
)
from users.phone import InvalidPhoneNumber, normalize_ethiopian_phone


def _canonical_phone(phone_number, required):
    if not phone_number:
        if required:
            raise ValidationError("A valid Ethiopian phone number is required.")
        return None
    try:
        return normalize_ethiopian_phone(phone_number)
    except InvalidPhoneNumber as exc:
        raise ValidationError(str(exc)) from exc


class TemariUserCreationForm(UserCreationForm):
    class Meta:
        model = User
        fields = ("phone_number", "email", "first_name", "last_name")

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["phone_number"].required = True

    def clean_phone_number(self):
        return _canonical_phone(self.cleaned_data.get("phone_number"), required=True)


class TemariUserChangeForm(UserChangeForm):
    class Meta:
        model = User
        fields = (
            "phone_number",
            "email",
            "first_name",
            "last_name",
            "is_active",
            "is_staff",
            "is_superuser",
            "groups",
            "user_permissions",
        )

    def clean_phone_number(self):
        return _canonical_phone(self.cleaned_data.get("phone_number"), required=False)


class AdminAuthenticationForm(AuthenticationForm):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["username"].label = "Phone number"


class UserAdmin(BaseUserAdmin):
    form = TemariUserChangeForm
    add_form = TemariUserCreationForm
    model = User
    ordering = ("phone_number",)
    list_display = (
        "phone_number",
        "email",
        "first_name",
        "last_name",
        "is_staff",
        "is_active",
    )
    list_filter = ("is_staff", "is_superuser", "is_active", "grade", "stream")
    search_fields = ("phone_number", "email", "first_name", "last_name")
    readonly_fields = ("last_login", "date_joined", "updated_at")
    filter_horizontal = ("groups", "user_permissions")
    fieldsets = (
        (None, {"fields": ("phone_number", "password")}),
        ("Personal info", {"fields": ("first_name", "last_name", "email")}),
        ("Learning profile", {"fields": ("grade", "stream", "onboarded_at")}),
        ("Verification", {"fields": ("phone_verified_at",)}),
        (
            "Permissions",
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                )
            },
        ),
        ("Important dates", {"fields": ("last_login", "date_joined", "updated_at")}),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "phone_number",
                    "email",
                    "first_name",
                    "last_name",
                    "password1",
                    "password2",
                    "is_staff",
                    "is_superuser",
                ),
            },
        ),
    )


admin.site.register(User, UserAdmin)
admin.site.login_form = AdminAuthenticationForm


@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "school", "city", "updated_at")
    search_fields = ("user__phone_number", "user__email", "school", "city")
    readonly_fields = ("id", "created_at", "updated_at")


@admin.register(StudentOnboarding)
class StudentOnboardingAdmin(admin.ModelAdmin):
    list_display = ("user", "status", "completed_at", "updated_at")
    list_filter = ("status",)
    search_fields = ("user__phone_number", "user__email")
    readonly_fields = ("id", "created_at", "updated_at")


@admin.register(StudentSelectedSubject)
class StudentSelectedSubjectAdmin(admin.ModelAdmin):
    list_display = ("user", "subject", "created_at")
    search_fields = ("user__phone_number", "user__email", "subject__name", "subject__slug")
    autocomplete_fields = ("user", "subject")


@admin.register(StudentLearningGoal)
class StudentLearningGoalAdmin(admin.ModelAdmin):
    list_display = ("user", "goal", "created_at")
    list_filter = ("goal",)
    search_fields = ("user__phone_number", "user__email")
    autocomplete_fields = ("user",)
