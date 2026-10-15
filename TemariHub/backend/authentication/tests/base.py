from django.core.cache import cache
from django.test import TestCase, override_settings
from rest_framework.test import APIClient


@override_settings(
    PASSWORD_HASHERS=["django.contrib.auth.hashers.MD5PasswordHasher"],
    DEBUG=True,
    SMS_PROVIDER="console",
    # Phase 2 gate: rotation must be on regardless of the host env_file.
    SIMPLE_JWT={
        "ACCESS_TOKEN_LIFETIME": __import__("datetime").timedelta(minutes=30),
        "REFRESH_TOKEN_LIFETIME": __import__("datetime").timedelta(days=7),
        "ROTATE_REFRESH_TOKENS": True,
        "BLACKLIST_AFTER_ROTATION": True,
        "UPDATE_LAST_LOGIN": False,
        "ALGORITHM": "HS256",
        "SIGNING_KEY": "test-signing-key-for-auth-suite",
        "AUTH_HEADER_TYPES": ("Bearer",),
        "USER_ID_FIELD": "id",
        "USER_ID_CLAIM": "user_id",
    },
)
class AuthAPITestCase(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()
