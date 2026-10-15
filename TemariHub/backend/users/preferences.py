"""Initial learning preferences collected during onboarding.

Only product-required keys are accepted. Unknown keys are rejected so the
frontend cannot invent uncontrolled preference shapes.
"""

from django.db import models


class StudyFrequency(models.TextChoices):
    DAILY = "daily", "Daily"
    WEEKDAYS = "weekdays", "Weekdays"
    WEEKENDS = "weekends", "Weekends"
    FEW_TIMES_WEEK = "few_times_week", "A few times per week"


PROTECTED_ONBOARDING_FIELDS = frozenset(
    {
        "status",
        "completed_at",
        "onboarded_at",
        "phone_verified",
        "phone_verified_at",
        "phone_number",
        "is_staff",
        "is_superuser",
        "password",
        "id",
    }
)

ALLOWED_PREFERENCE_KEYS = frozenset(
    {
        "daily_study_minutes",
        "study_frequency",
        "preferred_difficulty",
    }
)

REQUIRED_PREFERENCE_KEYS_FOR_COMPLETION = frozenset(
    {
        "daily_study_minutes",
        "study_frequency",
    }
)

MIN_DAILY_STUDY_MINUTES = 5
MAX_DAILY_STUDY_MINUTES = 480
MIN_DIFFICULTY = 1
MAX_DIFFICULTY = 5


def validate_preferences(raw, *, require_completion_keys=False):
    """Validate and normalize a preferences mapping.

    Unknown keys are rejected. When ``require_completion_keys`` is True, the
    required completion keys must be present in ``raw`` (the merged final map).
    """
    if raw is None:
        raw = {}
    if not isinstance(raw, dict):
        raise ValueError({"preferences": "Preferences must be an object."})

    unknown = sorted(set(raw) - ALLOWED_PREFERENCE_KEYS)
    if unknown:
        raise ValueError(
            {
                "preferences": (
                    "Unsupported preference keys: " + ", ".join(unknown)
                )
            }
        )

    cleaned = {}
    errors = {}

    if "daily_study_minutes" in raw:
        value = raw["daily_study_minutes"]
        if not isinstance(value, int) or isinstance(value, bool):
            errors["daily_study_minutes"] = "Must be an integer number of minutes."
        elif not MIN_DAILY_STUDY_MINUTES <= value <= MAX_DAILY_STUDY_MINUTES:
            errors["daily_study_minutes"] = (
                f"Must be between {MIN_DAILY_STUDY_MINUTES} and "
                f"{MAX_DAILY_STUDY_MINUTES}."
            )
        else:
            cleaned["daily_study_minutes"] = value

    if "study_frequency" in raw:
        value = raw["study_frequency"]
        valid = {choice.value for choice in StudyFrequency}
        if value not in valid:
            errors["study_frequency"] = (
                "Must be one of: " + ", ".join(sorted(valid)) + "."
            )
        else:
            cleaned["study_frequency"] = value

    if "preferred_difficulty" in raw:
        value = raw["preferred_difficulty"]
        if not isinstance(value, int) or isinstance(value, bool):
            errors["preferred_difficulty"] = "Must be an integer difficulty level."
        elif not MIN_DIFFICULTY <= value <= MAX_DIFFICULTY:
            errors["preferred_difficulty"] = (
                f"Must be between {MIN_DIFFICULTY} and {MAX_DIFFICULTY}."
            )
        else:
            cleaned["preferred_difficulty"] = value

    if errors:
        raise ValueError({"preferences": errors})

    if require_completion_keys:
        missing = sorted(
            key
            for key in REQUIRED_PREFERENCE_KEYS_FOR_COMPLETION
            if key not in cleaned
        )
        if missing:
            raise ValueError(
                {
                    "preferences": (
                        "Missing required preferences: " + ", ".join(missing)
                    )
                }
            )

    return cleaned
