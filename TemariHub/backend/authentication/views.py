from rest_framework import status
from rest_framework.views import APIView

from authentication.exceptions import ServiceError
from authentication.permissions import AllowAny, IsAuthenticated
from authentication.serializers import (
    AppleAuthSerializer,
    ChangePasswordSerializer,
    CurrentUserSerializer,
    ForgotPasswordSerializer,
    GoogleAuthSerializer,
    LogoutSerializer,
    OnboardingSerializer,
    PasswordLoginSerializer,
    PasswordResetSerializer,
    PasswordResetVerifyOTPSerializer,
    PhoneAuthUserSerializer,
    ProfileUpdateSerializer,
    RefreshTokenSerializer,
    RegisterSerializer,
    RequestOTPSerializer,
    TwoFactorCodeSerializer,
    TwoFactorDisableSerializer,
    TwoFactorLoginSerializer,
    VerifyOTPSerializer,
)
from authentication.services import (
    FORGOT_PASSWORD_MESSAGE,
    authenticate_apple,
    authenticate_google,
    change_password,
    complete_onboarding,
    confirm_two_factor,
    disable_two_factor,
    login_with_password,
    login_with_two_factor,
    logout_user,
    refresh_access_token,
    register_user,
    request_otp,
    request_password_reset,
    reset_password,
    setup_two_factor,
    update_profile,
    verify_otp,
    verify_password_reset_otp,
)
from authentication.throttles import (
    OTPRequestThrottle,
    OTPVerifyThrottle,
    PasswordAuthThrottle,
    SocialAuthThrottle,
    TwoFactorThrottle,
)
from core.api.responses import error_response, success_response


def _error(exc):
    return error_response(
        message=exc.message,
        errors=exc.errors,
        status_code=exc.status_code,
    )


def _login_response(result, user_serializer=CurrentUserSerializer):
    """Render a complete_login() result in the common response format.

    Non-2FA logins return tokens. Accounts with 2FA enabled receive a
    short-lived challenge instead and must finish at /auth/2fa/login/.
    """
    data = {
        "user": user_serializer(result["user"]).data,
        "requires_2fa": result["requires_2fa"],
    }
    if result["requires_2fa"]:
        data["two_factor_token"] = result["two_factor_token"]
        data["expires_in"] = result["expires_in"]
        return success_response(
            data=data,
            message="Two-factor authentication required",
        )
    data["tokens"] = result["tokens"]
    return success_response(data=data, message="Authentication successful")


class RequestOTPView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [OTPRequestThrottle]

    def post(self, request):
        serializer = RequestOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            payload = request_otp(serializer.validated_data["phone_number"])
        except ServiceError as exc:
            return _error(exc)
        return success_response(data=payload, message="OTP sent successfully")


class VerifyOTPView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [OTPVerifyThrottle]

    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            result = verify_otp(
                serializer.validated_data["phone_number"],
                serializer.validated_data["otp"],
            )
        except ServiceError as exc:
            return _error(exc)
        return _login_response(result, user_serializer=PhoneAuthUserSerializer)


class TokenRefreshView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RefreshTokenSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            payload = refresh_access_token(serializer.validated_data["refresh"])
        except ServiceError as exc:
            return _error(exc)
        return success_response(data=payload, message="Token refreshed successfully")


class LogoutView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LogoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            logout_user(serializer.validated_data["refresh"], request.user)
        except ServiceError as exc:
            return _error(exc)
        return success_response(data=None, message="Logout successful")


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return success_response(
            data=CurrentUserSerializer(request.user).data,
            message="User retrieved successfully",
        )

    def patch(self, request):
        serializer = ProfileUpdateSerializer(
            request.user, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        user = update_profile(request.user, **serializer.validated_data)
        return success_response(
            data=CurrentUserSerializer(user).data,
            message="Profile updated successfully",
        )


class GoogleAuthView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [SocialAuthThrottle]

    def post(self, request):
        serializer = GoogleAuthSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            result = authenticate_google(serializer.validated_data["id_token"])
        except ServiceError as exc:
            return _error(exc)
        return _login_response(result)


class AppleAuthView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [SocialAuthThrottle]

    def post(self, request):
        serializer = AppleAuthSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            result = authenticate_apple(serializer.validated_data["id_token"])
        except ServiceError as exc:
            return _error(exc)
        return _login_response(result)


class RegisterView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [PasswordAuthThrottle]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            user = register_user(**serializer.validated_data)
        except ServiceError as exc:
            return _error(exc)
        return success_response(
            data=CurrentUserSerializer(user).data,
            message="Registration successful. Verify your phone number to continue.",
            status_code=status.HTTP_201_CREATED,
        )


class PasswordLoginView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [PasswordAuthThrottle]

    def post(self, request):
        serializer = PasswordLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            result = login_with_password(
                serializer.validated_data["phone_number"],
                serializer.validated_data["password"],
            )
        except ServiceError as exc:
            return _error(exc)
        return _login_response(result)


class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [OTPRequestThrottle]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = request_password_reset(serializer.validated_data["phone_number"])
        return success_response(data=payload, message=FORGOT_PASSWORD_MESSAGE)


class PasswordResetVerifyOTPView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [OTPVerifyThrottle]

    def post(self, request):
        serializer = PasswordResetVerifyOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            payload = verify_password_reset_otp(
                serializer.validated_data["phone_number"],
                serializer.validated_data["otp"],
            )
        except ServiceError as exc:
            return _error(exc)
        return success_response(data=payload, message="OTP verified successfully")


class PasswordResetView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [PasswordAuthThrottle]

    def post(self, request):
        serializer = PasswordResetSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            reset_password(
                serializer.validated_data["reset_token"],
                serializer.validated_data["new_password"],
            )
        except ServiceError as exc:
            return _error(exc)
        return success_response(data=None, message="Password reset successfully")


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data, context={"user": request.user}
        )
        serializer.is_valid(raise_exception=True)
        try:
            result = change_password(
                request.user,
                serializer.validated_data["old_password"],
                serializer.validated_data["new_password"],
            )
        except ServiceError as exc:
            return _error(exc)
        return success_response(
            data={"tokens": result["tokens"]},
            message="Password changed successfully",
        )


class TwoFactorSetupView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [TwoFactorThrottle]

    def post(self, request):
        try:
            payload = setup_two_factor(request.user)
        except ServiceError as exc:
            return _error(exc)
        return success_response(
            data=payload,
            message="Scan the code with your authenticator app, then verify it.",
        )


class TwoFactorVerifyView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [TwoFactorThrottle]

    def post(self, request):
        serializer = TwoFactorCodeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            payload = confirm_two_factor(request.user, serializer.validated_data["code"])
        except ServiceError as exc:
            return _error(exc)
        return success_response(
            data=payload, message="Two-factor authentication enabled"
        )


class TwoFactorLoginView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [TwoFactorThrottle]

    def post(self, request):
        serializer = TwoFactorLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            result = login_with_two_factor(
                serializer.validated_data["two_factor_token"],
                serializer.validated_data["code"],
            )
        except ServiceError as exc:
            return _error(exc)
        return success_response(
            data={
                "user": CurrentUserSerializer(result["user"]).data,
                "tokens": result["tokens"],
            },
            message="Authentication successful",
        )


class TwoFactorDisableView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [TwoFactorThrottle]

    def post(self, request):
        serializer = TwoFactorDisableSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            payload = disable_two_factor(
                request.user,
                serializer.validated_data["code"],
                serializer.validated_data.get("password"),
            )
        except ServiceError as exc:
            return _error(exc)
        return success_response(
            data=payload, message="Two-factor authentication disabled"
        )


class OnboardingView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = OnboardingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = complete_onboarding(
            request.user,
            serializer.validated_data["grade"],
            serializer.validated_data["stream"],
        )
        return success_response(
            data={
                "onboarded": user.onboarded,
                "grade": user.grade,
                "stream": user.stream,
                "user": CurrentUserSerializer(user).data,
            },
            message="Onboarding completed",
        )
