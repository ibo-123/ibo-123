from django.contrib.auth import get_user_model
from django.contrib.auth import password_validation
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from users.models import GRADE_CHOICES, Stream
from users.phone import InvalidPhoneNumber, normalize_ethiopian_phone

User = get_user_model()


def _canonical_phone(value):
    try:
        return normalize_ethiopian_phone(value)
    except InvalidPhoneNumber as exc:
        raise serializers.ValidationError(str(exc)) from exc


def _validate_password_strength(password, user=None):
    try:
        password_validation.validate_password(password, user=user)
    except DjangoValidationError as exc:
        raise serializers.ValidationError(list(exc.messages)) from exc
    return password


def _validate_numeric_code(value, length=6):
    code = value.strip()
    if len(code) != length or not code.isdigit():
        raise serializers.ValidationError(f"Code must be {length} digits.")
    return code


class RequestOTPSerializer(serializers.Serializer):
    phone_number = serializers.CharField()

    def validate_phone_number(self, value):
        return _canonical_phone(value)


class VerifyOTPSerializer(serializers.Serializer):
    phone_number = serializers.CharField()
    otp = serializers.CharField(min_length=4, max_length=10)

    def validate_phone_number(self, value):
        return _canonical_phone(value)

    def validate_otp(self, value):
        otp = value.strip()
        if not otp.isdigit():
            raise serializers.ValidationError("OTP must contain only digits.")
        return otp


class RefreshTokenSerializer(serializers.Serializer):
    refresh = serializers.CharField()


class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField()


class GoogleAuthSerializer(serializers.Serializer):
    id_token = serializers.CharField()

    def validate_id_token(self, value):
        token = value.strip()
        if not token:
            raise serializers.ValidationError("Identity token is required.")
        return token


class AppleAuthSerializer(serializers.Serializer):
    id_token = serializers.CharField()

    def validate_id_token(self, value):
        token = value.strip()
        if not token:
            raise serializers.ValidationError("Identity token is required.")
        return token


class PhoneAuthUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "phone_number", "first_name", "last_name")


class CurrentUserSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    phone_verified = serializers.BooleanField(read_only=True)
    two_factor_enabled = serializers.BooleanField(read_only=True)
    onboarded = serializers.BooleanField(read_only=True)

    class Meta:
        model = User
        fields = (
            "id",
            "phone_number",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "grade",
            "stream",
            "phone_verified",
            "two_factor_enabled",
            "onboarded",
        )
        read_only_fields = fields


class RegisterSerializer(serializers.Serializer):
    phone_number = serializers.CharField()
    password = serializers.CharField(write_only=True, trim_whitespace=False)
    password_confirm = serializers.CharField(write_only=True, trim_whitespace=False)
    first_name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    # Contract-friendly alias; split into first/last when those are absent.
    full_name = serializers.CharField(max_length=201, required=False, allow_blank=True)

    def validate_phone_number(self, value):
        phone = _canonical_phone(value)
        if User.objects.filter(phone_number=phone).exists():
            raise serializers.ValidationError(
                "A user with this phone number already exists."
            )
        return phone

    def validate(self, attrs):
        if attrs["password"] != attrs.pop("password_confirm"):
            raise serializers.ValidationError(
                {"password_confirm": "Passwords do not match."}
            )
        full_name = attrs.pop("full_name", "").strip()
        if full_name and not attrs.get("first_name") and not attrs.get("last_name"):
            first, _, last = full_name.partition(" ")
            attrs["first_name"] = first[:100]
            attrs["last_name"] = last.strip()[:100]
        attrs.setdefault("first_name", "")
        attrs.setdefault("last_name", "")
        candidate = User(
            phone_number=attrs["phone_number"],
            first_name=attrs["first_name"],
            last_name=attrs["last_name"],
        )
        try:
            _validate_password_strength(attrs["password"], user=candidate)
        except serializers.ValidationError as exc:
            raise serializers.ValidationError({"password": exc.detail}) from exc
        return attrs


class PasswordLoginSerializer(serializers.Serializer):
    phone_number = serializers.CharField()
    password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate_phone_number(self, value):
        return _canonical_phone(value)


class ForgotPasswordSerializer(serializers.Serializer):
    phone_number = serializers.CharField()

    def validate_phone_number(self, value):
        return _canonical_phone(value)


class PasswordResetVerifyOTPSerializer(VerifyOTPSerializer):
    pass


class PasswordResetSerializer(serializers.Serializer):
    reset_token = serializers.CharField()
    new_password = serializers.CharField(write_only=True, trim_whitespace=False)
    new_password_confirm = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate(self, attrs):
        if attrs["new_password"] != attrs.pop("new_password_confirm"):
            raise serializers.ValidationError(
                {"new_password_confirm": "Passwords do not match."}
            )
        try:
            _validate_password_strength(attrs["new_password"])
        except serializers.ValidationError as exc:
            raise serializers.ValidationError({"new_password": exc.detail}) from exc
        return attrs


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True, required=False, trim_whitespace=False)
    # Alias used by the API contract document.
    current_password = serializers.CharField(write_only=True, required=False, trim_whitespace=False)
    new_password = serializers.CharField(write_only=True, trim_whitespace=False)
    new_password_confirm = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate(self, attrs):
        old_password = attrs.pop("old_password", None) or attrs.pop("current_password", None)
        attrs.pop("current_password", None)
        if not old_password:
            raise serializers.ValidationError({"old_password": "This field is required."})
        attrs["old_password"] = old_password
        if attrs["new_password"] != attrs.pop("new_password_confirm"):
            raise serializers.ValidationError(
                {"new_password_confirm": "Passwords do not match."}
            )
        try:
            _validate_password_strength(attrs["new_password"], user=self.context.get("user"))
        except serializers.ValidationError as exc:
            raise serializers.ValidationError({"new_password": exc.detail}) from exc
        return attrs


class ProfileUpdateSerializer(serializers.ModelSerializer):
    """Writable subset of the profile. Anything else is rejected explicitly
    so clients cannot assume protected fields were applied."""

    class Meta:
        model = User
        fields = ("first_name", "last_name", "grade", "stream")
        extra_kwargs = {
            "first_name": {"required": False},
            "last_name": {"required": False},
            "grade": {"required": False, "allow_null": True},
            "stream": {"required": False, "allow_null": True},
        }

    def validate(self, attrs):
        unknown = sorted(set(self.initial_data) - set(self.fields))
        if unknown:
            raise serializers.ValidationError(
                {name: "This field cannot be updated here." for name in unknown}
            )
        if not attrs:
            raise serializers.ValidationError("Provide at least one field to update.")
        return attrs


class OnboardingSerializer(serializers.Serializer):
    grade = serializers.ChoiceField(choices=GRADE_CHOICES)
    stream = serializers.ChoiceField(choices=Stream.choices)


class TwoFactorCodeSerializer(serializers.Serializer):
    code = serializers.CharField()

    def validate_code(self, value):
        return _validate_numeric_code(value)


class TwoFactorLoginSerializer(TwoFactorCodeSerializer):
    two_factor_token = serializers.CharField()


class TwoFactorDisableSerializer(TwoFactorCodeSerializer):
    password = serializers.CharField(write_only=True, required=False, trim_whitespace=False)
