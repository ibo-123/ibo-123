import jwt
import requests
from django.conf import settings
from google.auth.exceptions import GoogleAuthError
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from jwt import PyJWKClient
from jwt.exceptions import PyJWKClientError, PyJWTError


APPLE_ISSUER = "https://appleid.apple.com"
APPLE_JWKS_URL = "https://appleid.apple.com/auth/keys"
GOOGLE_ISSUERS = {"accounts.google.com", "https://accounts.google.com"}


class SocialTokenError(Exception):
    def __init__(self, message, status_code=401):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def _client_ids(value):
    return [item.strip() for item in (value or "").split(",") if item.strip()]


def _verified(value):
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.lower() == "true"
    return False


def _claim_text(value):
    if isinstance(value, str):
        return value.strip()
    return ""


def verify_google_id_token(token):
    """Validate a Google identity token with Google's official verifier."""
    audiences = _client_ids(settings.GOOGLE_CLIENT_ID)
    if not audiences:
        raise SocialTokenError(
            "Google authentication is not configured.",
            status_code=503,
        )
    if not isinstance(token, str) or not token.strip():
        raise SocialTokenError("Invalid Google identity token.")

    try:
        identity = id_token.verify_oauth2_token(
            token.strip(),
            google_requests.Request(),
        )
    except ValueError as exc:
        raise SocialTokenError("Invalid Google identity token.") from exc
    except (GoogleAuthError, requests.RequestException) as exc:
        raise SocialTokenError(
            "Unable to validate Google identity token.",
            status_code=503,
        ) from exc

    if identity.get("iss") not in GOOGLE_ISSUERS:
        raise SocialTokenError("Invalid Google identity token.")
    if identity.get("aud") not in audiences:
        raise SocialTokenError("Invalid Google identity token.")

    subject = identity.get("sub")
    if not subject:
        raise SocialTokenError("Invalid Google identity token.")

    email_verified = _verified(identity.get("email_verified"))
    email = identity.get("email") if email_verified else None
    if not isinstance(email, str) or not email.strip():
        email = None

    return {
        "sub": str(subject),
        "email": email,
        "email_verified": email_verified,
        "first_name": _claim_text(identity.get("given_name"))[:100],
        "last_name": _claim_text(identity.get("family_name"))[:100],
    }


def verify_apple_id_token(token):
    """Validate an Apple identity token against Apple's published signing keys."""
    audiences = _client_ids(settings.APPLE_CLIENT_ID)
    if not audiences:
        raise SocialTokenError(
            "Apple authentication is not configured.",
            status_code=503,
        )
    if not isinstance(token, str) or not token.strip():
        raise SocialTokenError("Invalid Apple identity token.")

    try:
        signing_key = PyJWKClient(APPLE_JWKS_URL).get_signing_key_from_jwt(token.strip())
        identity = jwt.decode(
            token.strip(),
            signing_key.key,
            algorithms=["RS256"],
            audience=audiences,
            issuer=APPLE_ISSUER,
        )
    except PyJWKClientError as exc:
        raise SocialTokenError(
            "Unable to validate Apple identity token.",
            status_code=503,
        ) from exc
    except PyJWTError as exc:
        raise SocialTokenError("Invalid Apple identity token.") from exc

    subject = identity.get("sub")
    if not subject:
        raise SocialTokenError("Invalid Apple identity token.")

    email_verified = _verified(identity.get("email_verified"))
    email = identity.get("email") if email_verified else None
    if not isinstance(email, str) or not email.strip():
        email = None

    return {
        "sub": str(subject),
        "email": email,
        "email_verified": email_verified,
        "first_name": "",
        "last_name": "",
    }
