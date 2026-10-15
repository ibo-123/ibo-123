import re

from django.core.exceptions import ValidationError


class InvalidPhoneNumber(ValueError):
    """Raised when a value is not a valid Ethiopian phone number."""


_SEPARATORS = re.compile(r"[\s\-().]+")


def normalize_ethiopian_phone(value):
    """Return the canonical +251XXXXXXXXX form for an Ethiopian number.

    Accepted inputs are local numbers such as 0912345678, country-code
    numbers such as 251912345678, and E.164 numbers such as +251912345678.
    Invalid values are rejected rather than coerced into a valid number.
    """
    if not isinstance(value, str):
        raise InvalidPhoneNumber("A valid Ethiopian phone number is required.")

    raw = value.strip()
    if not raw or re.search(r"[A-Za-z]", raw):
        raise InvalidPhoneNumber("A valid Ethiopian phone number is required.")

    cleaned = _SEPARATORS.sub("", raw)
    if cleaned.startswith("+"):
        digits = cleaned[1:]
        if not re.fullmatch(r"[0-9]+", digits) or not digits.startswith("251"):
            raise InvalidPhoneNumber("Only Ethiopian phone numbers are supported.")
        national = digits[3:]
    elif re.fullmatch(r"251[0-9]{9}", cleaned):
        national = cleaned[3:]
    elif re.fullmatch(r"0[0-9]{9}", cleaned):
        national = cleaned[1:]
    else:
        raise InvalidPhoneNumber("A valid Ethiopian phone number is required.")

    if not re.fullmatch(r"[79][0-9]{8}", national):
        raise InvalidPhoneNumber("A valid Ethiopian phone number is required.")

    return f"+251{national}"


def validate_ethiopian_phone_number(value):
    if not value:
        return
    try:
        normalize_ethiopian_phone(value)
    except InvalidPhoneNumber as exc:
        raise ValidationError(str(exc)) from exc


def mask_phone(phone_number):
    if not phone_number or len(phone_number) < 6:
        return "***"
    return f"{phone_number[:5]}******{phone_number[-2:]}"
