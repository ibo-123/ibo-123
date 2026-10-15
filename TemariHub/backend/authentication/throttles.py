from rest_framework.throttling import SimpleRateThrottle


class ClientIPRateThrottle(SimpleRateThrottle):
    """Throttle abusive clients by IP without requiring Redis."""

    def get_cache_key(self, request, view):
        return self.cache_format % {
            "scope": self.scope,
            "ident": self.get_ident(request),
        }


class OTPRequestThrottle(ClientIPRateThrottle):
    scope = "otp_request"


class OTPVerifyThrottle(ClientIPRateThrottle):
    scope = "otp_verify"


class SocialAuthThrottle(ClientIPRateThrottle):
    scope = "social_auth"


class PasswordAuthThrottle(ClientIPRateThrottle):
    """Register, password login, and password reset confirmation."""

    scope = "password_auth"


class TwoFactorThrottle(ClientIPRateThrottle):
    scope = "two_factor"
