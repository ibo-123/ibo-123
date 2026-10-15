from django.urls import path

from authentication.views import (
    AppleAuthView,
    ChangePasswordView,
    ForgotPasswordView,
    GoogleAuthView,
    LogoutView,
    MeView,
    OnboardingView,
    PasswordLoginView,
    PasswordResetVerifyOTPView,
    PasswordResetView,
    RegisterView,
    RequestOTPView,
    TokenRefreshView,
    TwoFactorDisableView,
    TwoFactorLoginView,
    TwoFactorSetupView,
    TwoFactorVerifyView,
    VerifyOTPView,
)

# Canonical routes. Every route keeps the project's trailing-slash convention.
urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", PasswordLoginView.as_view(), name="login"),
    path("phone/request-otp/", RequestOTPView.as_view(), name="request-otp"),
    path("phone/verify-otp/", VerifyOTPView.as_view(), name="verify-otp"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("google/", GoogleAuthView.as_view(), name="google-auth"),
    path("apple/", AppleAuthView.as_view(), name="apple-auth"),
    path("me/", MeView.as_view(), name="me"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("password/forgot/", ForgotPasswordView.as_view(), name="password-forgot"),
    path(
        "password/verify-otp/",
        PasswordResetVerifyOTPView.as_view(),
        name="password-verify-otp",
    ),
    path("password/reset/", PasswordResetView.as_view(), name="password-reset"),
    path("change-password/", ChangePasswordView.as_view(), name="change-password"),
    path("2fa/setup/", TwoFactorSetupView.as_view(), name="2fa-setup"),
    path("2fa/verify/", TwoFactorVerifyView.as_view(), name="2fa-verify"),
    path("2fa/login/", TwoFactorLoginView.as_view(), name="2fa-login"),
    path("2fa/disable/", TwoFactorDisableView.as_view(), name="2fa-disable"),
    path("onboarding/", OnboardingView.as_view(), name="onboarding"),
]

# Aliases matching docs/api-contract.md, which the mobile client follows.
# They share the views above; the canonical names remain the ones listed first.
urlpatterns += [
    path("phone/send-otp/", RequestOTPView.as_view(), name="request-otp-alias"),
    path("refresh/", TokenRefreshView.as_view(), name="token-refresh-alias"),
]
