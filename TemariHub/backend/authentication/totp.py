"""TOTP helpers (RFC 6238) built on pyotp.

Secrets are encrypted at rest with Fernet. The key is derived from
``TOTP_ENCRYPTION_KEY`` when set, otherwise from ``SECRET_KEY``. Rotating
either value invalidates every stored secret, so treat them as long-lived.
Nothing in this module logs secrets or codes.
"""
import base64
import hashlib
import hmac
import time

import pyotp
from cryptography.fernet import Fernet, InvalidToken
from django.conf import settings

TOTP_STEP_SECONDS = 30
TOTP_DIGITS = 6
# Accept one step either side of "now" to absorb clock drift.
TOTP_VALID_WINDOW = 1


class TOTPSecretError(Exception):
    pass


def _fernet():
    source = settings.TOTP_ENCRYPTION_KEY or settings.SECRET_KEY
    digest = hashlib.sha256(source.encode("utf-8")).digest()
    return Fernet(base64.urlsafe_b64encode(digest))


def generate_secret():
    return pyotp.random_base32()


def encrypt_secret(secret):
    return _fernet().encrypt(secret.encode("utf-8")).decode("utf-8")


def decrypt_secret(encrypted_secret):
    try:
        return _fernet().decrypt(encrypted_secret.encode("utf-8")).decode("utf-8")
    except (InvalidToken, ValueError) as exc:
        raise TOTPSecretError("Stored TOTP secret cannot be decrypted.") from exc


def provisioning_uri(secret, account_name):
    return pyotp.TOTP(secret, digits=TOTP_DIGITS, interval=TOTP_STEP_SECONDS).provisioning_uri(
        name=account_name,
        issuer_name=settings.TOTP_ISSUER,
    )


def current_step(now=None):
    now = time.time() if now is None else now
    return int(now // TOTP_STEP_SECONDS)


def matching_step(secret, code, now=None):
    """Return the time step the code is valid for, or None.

    Steps are returned so callers can refuse a code that was already used
    (RFC 6238 §5.2 replay protection).
    """
    if not isinstance(code, str) or len(code) != TOTP_DIGITS or not code.isdigit():
        return None
    totp = pyotp.TOTP(secret, digits=TOTP_DIGITS, interval=TOTP_STEP_SECONDS)
    now = time.time() if now is None else now
    base_step = current_step(now)
    for offset in range(-TOTP_VALID_WINDOW, TOTP_VALID_WINDOW + 1):
        step = base_step + offset
        expected = totp.at(step * TOTP_STEP_SECONDS)
        if hmac.compare_digest(expected, code):
            return step
    return None
