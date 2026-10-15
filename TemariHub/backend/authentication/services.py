import logging
import secrets
from datetime import timedelta

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import check_password, make_password
from django.core import signing
from django.db import IntegrityError, transaction
from django.utils import timezone
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.settings import api_settings
from rest_framework_simplejwt.token_blacklist.models import (
    BlacklistedToken,
    OutstandingToken,
)
from rest_framework_simplejwt.tokens import RefreshToken

from authentication import totp
from authentication.exceptions import ServiceError
from authentication.models import (
    OneTimeToken,
    OneTimeTokenPurpose,
    OTPPurpose,
    OTPVerification,
    SocialAccount,
    SocialProvider,
    TwoFactorDevice,
)
from authentication.sms import SMSDeliveryError, SMSValidationError, get_sms_provider
from authentication.social import (
    SocialTokenError,
    verify_apple_id_token,
    verify_google_id_token,
)
from users.managers import UserManager
from users.phone import mask_phone, normalize_ethiopian_phone

logger = logging.getLogger(__name__)
User = get_user_model()

INVALID_CREDENTIALS = "Invalid phone number or password."
PHONE_NOT_VERIFIED = "Verify your phone number before logging in with a password."
INVALID_2FA_CODE = "Invalid authentication code."


def generate_otp(length):
    return "".join(str(secrets.randbelow(10)) for _ in range(length))


def issue_tokens(user):
    refresh = RefreshToken.for_user(user)
    user.last_login = timezone.now()
    user.save(update_fields=["last_login"])
    return {
        "access": str(refresh.access_token),
        "refresh": str(refresh),
    }


def revoke_refresh_tokens(user):
    """Blacklist every outstanding refresh token for the user."""
    for outstanding in OutstandingToken.objects.filter(user=user):
        BlacklistedToken.objects.get_or_create(token=outstanding)


def _mark_phone_verified(user):
    if user.phone_number and user.phone_verified_at is None:
        user.phone_verified_at = timezone.now()
        user.save(update_fields=["phone_verified_at", "updated_at"])


# --- one-time signed credentials ------------------------------------------

_ONE_TIME_SALT = "authentication.one-time-token"


def _one_time_lifetime(purpose):
    if purpose == OneTimeTokenPurpose.TWO_FACTOR_LOGIN:
        return settings.TWO_FACTOR_CHALLENGE_LIFETIME_SECONDS
    return settings.PASSWORD_RESET_TOKEN_LIFETIME_SECONDS


def issue_one_time_token(user, purpose):
    lifetime = _one_time_lifetime(purpose)
    record = OneTimeToken.objects.create(
        user=user,
        purpose=purpose,
        expires_at=timezone.now() + timedelta(seconds=lifetime),
    )
    value = signing.dumps(
        {"id": str(record.id), "purpose": purpose, "user": str(user.id)},
        salt=_ONE_TIME_SALT,
    )
    return value, lifetime


def consume_one_time_token(value, purpose, error_message):
    """Validate a signed one-time credential and mark it used atomically."""
    invalid = ServiceError(error_message, errors={"token": error_message})
    try:
        payload = signing.loads(
            value,
            salt=_ONE_TIME_SALT,
            max_age=_one_time_lifetime(purpose),
        )
    except signing.BadSignature as exc:  # includes SignatureExpired
        raise invalid from exc
    if not isinstance(payload, dict) or payload.get("purpose") != purpose:
        raise invalid

    with transaction.atomic():
        record = (
            OneTimeToken.objects.select_for_update()
            .select_related("user")
            .filter(id=payload.get("id"), purpose=purpose)
            .first()
        )
        if record is None or str(record.user_id) != payload.get("user"):
            raise invalid
        if not record.is_usable:
            raise invalid
        record.used_at = timezone.now()
        record.save(update_fields=["used_at"])
    if not record.user.is_active:
        raise ServiceError("This account is disabled.", status_code=403)
    return record.user


def complete_login(user):
    """Finish a first-factor login, issuing tokens or a 2FA challenge."""
    if user.two_factor_enabled:
        challenge, lifetime = issue_one_time_token(
            user, OneTimeTokenPurpose.TWO_FACTOR_LOGIN
        )
        return {
            "user": user,
            "requires_2fa": True,
            "two_factor_token": challenge,
            "expires_in": lifetime,
        }
    return {"user": user, "requires_2fa": False, "tokens": issue_tokens(user)}


def request_otp(phone_number, purpose=OTPPurpose.LOGIN):
    phone_number = normalize_ethiopian_phone(phone_number)
    window_start = timezone.now() - timedelta(seconds=settings.OTP_REQUEST_WINDOW_SECONDS)
    recent_requests = OTPVerification.objects.filter(
        phone_number=phone_number,
        purpose=purpose,
        created_at__gte=window_start,
    ).count()
    if recent_requests >= settings.OTP_REQUEST_LIMIT:
        raise ServiceError(
            "Too many OTP requests. Try again later.",
            errors={"phone_number": "Rate limit exceeded."},
            status_code=429,
        )

    otp = generate_otp(settings.OTP_LENGTH)
    expires_at = timezone.now() + timedelta(seconds=settings.OTP_EXPIRY_SECONDS)
    now = timezone.now()
    with transaction.atomic():
        OTPVerification.objects.filter(
            phone_number=phone_number,
            purpose=purpose,
            verified_at__isnull=True,
            invalidated_at__isnull=True,
        ).update(invalidated_at=now)
        record = OTPVerification.objects.create(
            phone_number=phone_number,
            otp_hash=make_password(otp),
            purpose=purpose,
            expires_at=expires_at,
        )

    try:
        get_sms_provider().send_otp(phone_number, otp, purpose)
    except SMSValidationError as exc:
        record.invalidated_at = timezone.now()
        record.save(update_fields=["invalidated_at", "updated_at"])
        logger.warning(
            "OTP SMS rejected before send for %s: length validation failed.",
            mask_phone(phone_number),
        )
        raise ServiceError(str(exc), status_code=400) from exc
    except SMSDeliveryError as exc:
        record.invalidated_at = timezone.now()
        record.save(update_fields=["invalidated_at", "updated_at"])
        logger.warning("OTP delivery failed for %s.", mask_phone(phone_number))
        raise ServiceError(
            "Unable to send OTP. Try again later.",
            status_code=503,
        ) from exc

    payload = {
        "phone_number": phone_number,
        "expires_in": settings.OTP_EXPIRY_SECONDS,
    }
    if settings.DEBUG and settings.OTP_DEBUG:
        payload["debug_otp"] = otp
    return payload


def _check_otp(phone_number, otp, purpose):
    """Validate the active OTP for a phone/purpose inside a transaction.

    Returns the locked OTP record on success. Failure cases are recorded
    (attempt counter, lockout) before the matching ServiceError is returned.
    Callers must run this inside ``transaction.atomic()``.
    """
    record = (
        OTPVerification.objects.select_for_update()
        .filter(
            phone_number=phone_number,
            purpose=purpose,
            verified_at__isnull=True,
            invalidated_at__isnull=True,
        )
        .order_by("-created_at")
        .first()
    )
    if record is None:
        return None, ServiceError(
            "OTP not found. Request a new OTP.",
            errors={"otp": "OTP not found. Request a new OTP."},
        )
    if record.expires_at <= timezone.now():
        return None, ServiceError(
            "OTP has expired.",
            errors={"otp": "OTP has expired."},
        )
    if record.attempts >= settings.OTP_MAX_ATTEMPTS:
        record.invalidated_at = timezone.now()
        record.save(update_fields=["invalidated_at", "updated_at"])
        return None, ServiceError(
            "Too many invalid attempts. Request a new OTP.",
            errors={"otp": "Too many invalid attempts. Request a new OTP."},
            status_code=429,
        )
    if not check_password(otp, record.otp_hash):
        record.attempts += 1
        update_fields = ["attempts", "updated_at"]
        if record.attempts >= settings.OTP_MAX_ATTEMPTS:
            record.invalidated_at = timezone.now()
            update_fields.append("invalidated_at")
        record.save(update_fields=update_fields)
        if record.invalidated_at:
            return None, ServiceError(
                "Too many invalid attempts. Request a new OTP.",
                errors={"otp": "Too many invalid attempts. Request a new OTP."},
                status_code=429,
            )
        return None, ServiceError(
            "Invalid OTP.",
            errors={"otp": "Invalid OTP."},
        )
    return record, None


def verify_otp(phone_number, otp, purpose=OTPPurpose.LOGIN):
    phone_number = normalize_ethiopian_phone(phone_number)
    failure = None
    result = None
    with transaction.atomic():
        record, failure = _check_otp(phone_number, otp, purpose)
        if record is not None:
            user = User.objects.filter(phone_number=phone_number).first()
            if user is None:
                user = User.objects.create_user(phone_number=phone_number)
            if not user.is_active:
                failure = ServiceError("This account is disabled.", status_code=403)
            else:
                record.verified_at = timezone.now()
                record.save(update_fields=["verified_at", "updated_at"])
                _mark_phone_verified(user)
                result = complete_login(user)

    if failure is not None:
        raise failure
    return result


def refresh_access_token(refresh_token):
    try:
        token = RefreshToken(refresh_token)
    except TokenError as exc:
        raise ServiceError(
            "Invalid or expired refresh token.",
            errors={"refresh": "Invalid or expired refresh token."},
            status_code=401,
        ) from exc

    data = {"access": str(token.access_token)}
    # Read Django settings directly. SimpleJWT caches its settings object at
    # import time, so env-driven rotation must be checked from Django itself.
    jwt_settings = settings.SIMPLE_JWT
    if jwt_settings.get("ROTATE_REFRESH_TOKENS"):
        try:
            if jwt_settings.get("BLACKLIST_AFTER_ROTATION", True):
                token.blacklist()
            token.set_jti()
            token.set_exp()
            token.set_iat()
        except TokenError as exc:
            raise ServiceError(
                "Invalid or expired refresh token.",
                errors={"refresh": "Invalid or expired refresh token."},
                status_code=401,
            ) from exc
        data["refresh"] = str(token)
    return data


def logout_user(refresh_token, user=None):
    try:
        token = RefreshToken(refresh_token)
        if user is not None and getattr(user, "is_authenticated", False):
            token_user_id = str(token.get(api_settings.USER_ID_CLAIM))
            if token_user_id != str(user.id):
                raise ServiceError(
                    "Refresh token does not belong to the authenticated user.",
                    errors={"refresh": "Refresh token does not belong to the authenticated user."},
                    status_code=401,
                )
        token.blacklist()
    except TokenError as exc:
        raise ServiceError(
            "Invalid or expired refresh token.",
            errors={"refresh": "Invalid or expired refresh token."},
            status_code=401,
        ) from exc


def _social_user(provider, claims):
    provider_user_id = claims["sub"]
    email = claims.get("email") or None
    first_name = (claims.get("first_name") or "")[:100]
    last_name = (claims.get("last_name") or "")[:100]

    with transaction.atomic():
        account = (
            SocialAccount.objects.select_for_update()
            .select_related("user")
            .filter(provider=provider, provider_user_id=provider_user_id)
            .first()
        )
        if account is not None:
            user = account.user
            if not user.is_active:
                raise ServiceError("This account is disabled.", status_code=403)
            if email and account.email != email:
                account.email = email
                account.save(update_fields=["email", "updated_at"])
            if email and not user.email:
                taken = User.objects.filter(email__iexact=email).exclude(pk=user.pk).exists()
                if not taken:
                    user.email = UserManager.normalize_email(email)
                    user.save(update_fields=["email", "updated_at"])
            return user

        user = User.objects.filter(email__iexact=email).first() if email else None
        if user is None:
            user = User.objects.create_social_user(
                email=email,
                first_name=first_name,
                last_name=last_name,
            )
        elif not user.is_active:
            raise ServiceError("This account is disabled.", status_code=403)
        else:
            changed = []
            if first_name and not user.first_name:
                user.first_name = first_name
                changed.append("first_name")
            if last_name and not user.last_name:
                user.last_name = last_name
                changed.append("last_name")
            if changed:
                changed.append("updated_at")
                user.save(update_fields=changed)

        try:
            with transaction.atomic():
                SocialAccount.objects.create(
                    user=user,
                    provider=provider,
                    provider_user_id=provider_user_id,
                    email=email,
                )
        except IntegrityError:
            account = SocialAccount.objects.select_related("user").get(
                provider=provider,
                provider_user_id=provider_user_id,
            )
            user = account.user
            if not user.is_active:
                raise ServiceError("This account is disabled.", status_code=403)
        return user


def _authenticate_social(provider, verifier, token):
    try:
        claims = verifier(token)
    except SocialTokenError as exc:
        raise ServiceError(exc.message, status_code=exc.status_code) from exc
    user = _social_user(provider, claims)
    return complete_login(user)


def authenticate_google(token):
    return _authenticate_social(SocialProvider.GOOGLE, verify_google_id_token, token)


def authenticate_apple(token):
    return _authenticate_social(SocialProvider.APPLE, verify_apple_id_token, token)


# --- registration and password login --------------------------------------


def register_user(phone_number, password, first_name="", last_name=""):
    """Create a password-capable account. Phone verification happens through
    the existing OTP endpoints; registration never sends an OTP itself."""
    phone_number = normalize_ethiopian_phone(phone_number)
    try:
        with transaction.atomic():
            user = User.objects.create_user(
                phone_number=phone_number,
                password=password,
                first_name=first_name,
                last_name=last_name,
            )
    except IntegrityError as exc:
        raise ServiceError(
            "Request failed.",
            errors={"phone_number": ["A user with this phone number already exists."]},
        ) from exc
    return user


def login_with_password(phone_number, password):
    phone_number = normalize_ethiopian_phone(phone_number)
    user = User.objects.filter(phone_number=phone_number).first()
    if user is None:
        # Run a hash check anyway so timing does not reveal account existence.
        User().set_password(password)
        raise ServiceError(INVALID_CREDENTIALS, status_code=401)
    if not user.check_password(password):
        raise ServiceError(INVALID_CREDENTIALS, status_code=401)
    if not user.is_active:
        raise ServiceError("This account is disabled.", status_code=403)
    if not user.phone_verified:
        raise ServiceError(
            PHONE_NOT_VERIFIED,
            errors={"phone_number": PHONE_NOT_VERIFIED},
            status_code=403,
        )
    return complete_login(user)


# --- two-factor authentication -------------------------------------------


def _device_for(user, for_update=False):
    queryset = TwoFactorDevice.objects.all()
    if for_update:
        queryset = queryset.select_for_update()
    return queryset.filter(user=user).first()


def _verify_device_code(device, code):
    """Check a TOTP code against the device and lock out replayed codes."""
    try:
        secret = totp.decrypt_secret(device.encrypted_secret)
    except totp.TOTPSecretError as exc:
        raise ServiceError(
            "Two-factor authentication is unavailable. Contact support.",
            status_code=503,
        ) from exc
    step = totp.matching_step(secret, code)
    if step is None or step <= device.last_used_step:
        raise ServiceError(INVALID_2FA_CODE, errors={"code": INVALID_2FA_CODE})
    device.last_used_step = step
    return step


def setup_two_factor(user):
    with transaction.atomic():
        device = _device_for(user, for_update=True)
        if device is not None and device.is_enabled:
            raise ServiceError(
                "Two-factor authentication is already enabled. Disable it first.",
                errors={"two_factor": "Already enabled."},
            )
        secret = totp.generate_secret()
        encrypted = totp.encrypt_secret(secret)
        if device is None:
            TwoFactorDevice.objects.create(user=user, encrypted_secret=encrypted)
        else:
            device.encrypted_secret = encrypted
            device.last_used_step = 0
            device.save(update_fields=["encrypted_secret", "last_used_step", "updated_at"])
    account_name = user.phone_number or user.email or str(user.id)
    return {
        "secret": secret,
        "otpauth_url": totp.provisioning_uri(secret, account_name),
        "issuer": settings.TOTP_ISSUER,
        "account_name": account_name,
    }


def confirm_two_factor(user, code):
    with transaction.atomic():
        device = _device_for(user, for_update=True)
        if device is None:
            raise ServiceError(
                "Two-factor setup has not been started.",
                errors={"code": "Run two-factor setup first."},
            )
        _verify_device_code(device, code)
        update_fields = ["last_used_step", "updated_at"]
        if not device.is_enabled:
            device.confirmed_at = timezone.now()
            update_fields.append("confirmed_at")
        device.save(update_fields=update_fields)
    return {"enabled": True}


def login_with_two_factor(challenge, code):
    user = consume_one_time_token(
        challenge,
        OneTimeTokenPurpose.TWO_FACTOR_LOGIN,
        "Invalid or expired two-factor challenge.",
    )
    with transaction.atomic():
        device = _device_for(user, for_update=True)
        if device is None or not device.is_enabled:
            raise ServiceError(
                "Two-factor authentication is not enabled for this account.",
                status_code=400,
            )
        _verify_device_code(device, code)
        device.save(update_fields=["last_used_step", "updated_at"])
    return {"user": user, "tokens": issue_tokens(user)}


def disable_two_factor(user, code, password=None):
    with transaction.atomic():
        device = _device_for(user, for_update=True)
        if device is None or not device.is_enabled:
            raise ServiceError(
                "Two-factor authentication is not enabled.",
                errors={"two_factor": "Not enabled."},
            )
        if user.has_usable_password():
            if not password or not user.check_password(password):
                raise ServiceError(
                    "Invalid password.",
                    errors={"password": "Invalid password."},
                    status_code=401,
                )
        _verify_device_code(device, code)
        device.delete()
    return {"enabled": False}


# --- password recovery and change -----------------------------------------

FORGOT_PASSWORD_MESSAGE = (
    "If an account exists for this phone number, a password reset OTP has been sent."
)


def request_password_reset(phone_number):
    """Send a reset OTP when the account exists. The response is identical
    either way so the endpoint cannot be used to enumerate accounts."""
    phone_number = normalize_ethiopian_phone(phone_number)
    user = User.objects.filter(phone_number=phone_number, is_active=True).first()
    if user is not None:
        try:
            request_otp(phone_number, OTPPurpose.PASSWORD_RESET)
        except ServiceError as exc:
            logger.warning(
                "Password reset OTP not sent for %s: %s",
                mask_phone(phone_number),
                exc.message,
            )
    return {
        "phone_number": phone_number,
        "expires_in": settings.OTP_EXPIRY_SECONDS,
    }


def verify_password_reset_otp(phone_number, otp):
    phone_number = normalize_ethiopian_phone(phone_number)
    with transaction.atomic():
        record, failure = _check_otp(phone_number, otp, OTPPurpose.PASSWORD_RESET)
        if failure is not None:
            raise failure
        user = User.objects.filter(phone_number=phone_number, is_active=True).first()
        if user is None:
            raise ServiceError(
                "OTP not found. Request a new OTP.",
                errors={"otp": "OTP not found. Request a new OTP."},
            )
        record.verified_at = timezone.now()
        record.save(update_fields=["verified_at", "updated_at"])
        _mark_phone_verified(user)
        reset_token, lifetime = issue_one_time_token(
            user, OneTimeTokenPurpose.PASSWORD_RESET
        )
    return {"verified": True, "reset_token": reset_token, "expires_in": lifetime}


def reset_password(reset_token, new_password):
    user = consume_one_time_token(
        reset_token,
        OneTimeTokenPurpose.PASSWORD_RESET,
        "Invalid or expired reset token.",
    )
    with transaction.atomic():
        user.set_password(new_password)
        user.save(update_fields=["password", "updated_at"])
        OneTimeToken.objects.filter(
            user=user,
            purpose=OneTimeTokenPurpose.PASSWORD_RESET,
            used_at__isnull=True,
        ).update(used_at=timezone.now())
        revoke_refresh_tokens(user)
    return {"user": user}


def change_password(user, old_password, new_password):
    if not user.has_usable_password() or not user.check_password(old_password):
        raise ServiceError(
            "Current password is incorrect.",
            errors={"old_password": "Current password is incorrect."},
        )
    if user.check_password(new_password):
        raise ServiceError(
            "New password must differ from the current password.",
            errors={"new_password": "New password must differ from the current password."},
        )
    with transaction.atomic():
        user.set_password(new_password)
        user.save(update_fields=["password", "updated_at"])
        revoke_refresh_tokens(user)
        tokens = issue_tokens(user)
    return {"user": user, "tokens": tokens}


# --- profile and onboarding ----------------------------------------------


def update_profile(user, **fields):
    changed = []
    for name, value in fields.items():
        if getattr(user, name) != value:
            setattr(user, name, value)
            changed.append(name)
    if changed:
        changed.append("updated_at")
        user.save(update_fields=changed)
    return user


def complete_onboarding(user, grade, stream):
    user.grade = grade
    user.stream = stream
    update_fields = ["grade", "stream", "updated_at"]
    if user.onboarded_at is None:
        user.onboarded_at = timezone.now()
        update_fields.append("onboarded_at")
    user.save(update_fields=update_fields)
    return user
