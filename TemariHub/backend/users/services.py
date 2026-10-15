from django.db import transaction
from django.utils import timezone

from authentication.exceptions import ServiceError
from curriculum.serializers import SubjectSerializer
from curriculum.services import resolve_selectable_subjects
from users.models import (
    LearningGoal,
    OnboardingStatus,
    StudentLearningGoal,
    StudentOnboarding,
    StudentProfile,
    StudentSelectedSubject,
)
from users.preferences import PROTECTED_ONBOARDING_FIELDS, validate_preferences


def ensure_student_records(user):
    """Create profile/onboarding rows and sync legacy ``User.onboarded_at``."""
    profile, _ = StudentProfile.objects.get_or_create(user=user)
    onboarding, _ = StudentOnboarding.objects.get_or_create(user=user)

    if user.onboarded_at is not None and onboarding.status != OnboardingStatus.COMPLETED:
        onboarding.status = OnboardingStatus.COMPLETED
        onboarding.completed_at = user.onboarded_at
        onboarding.save(update_fields=["status", "completed_at", "updated_at"])
    return profile, onboarding


def _split_full_name(full_name):
    cleaned = (full_name or "").strip()
    if not cleaned:
        return "", ""
    first, _, last = cleaned.partition(" ")
    return first[:100], last.strip()[:100]


def serialize_onboarding(user):
    profile, onboarding = ensure_student_records(user)
    subjects = [
        selection.subject
        for selection in user.selected_subjects.select_related("subject").order_by(
            "created_at"
        )
    ]
    goals = list(
        user.learning_goals.order_by("created_at").values_list("goal", flat=True)
    )
    return {
        "status": onboarding.status,
        "completed_at": onboarding.completed_at,
        "full_name": user.full_name,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "phone_number": user.phone_number,
        "phone_verified": user.phone_verified,
        "grade": user.grade,
        "stream": user.stream,
        "school": profile.school,
        "city": profile.city,
        "subjects": SubjectSerializer(subjects, many=True).data,
        "learning_goals": goals,
        "preferences": profile.preferences or {},
        "onboarded": user.onboarded,
    }


def _mark_in_progress(onboarding):
    if onboarding.status == OnboardingStatus.NOT_STARTED:
        onboarding.status = OnboardingStatus.IN_PROGRESS
        onboarding.save(update_fields=["status", "updated_at"])


def _replace_subjects(user, subjects):
    StudentSelectedSubject.objects.filter(user=user).delete()
    StudentSelectedSubject.objects.bulk_create(
        [
            StudentSelectedSubject(user=user, subject=subject)
            for subject in subjects
        ]
    )


def _replace_learning_goals(user, goals):
    StudentLearningGoal.objects.filter(user=user).delete()
    StudentLearningGoal.objects.bulk_create(
        [StudentLearningGoal(user=user, goal=goal) for goal in goals]
    )


@transaction.atomic
def update_onboarding(user, payload):
    """Apply a progressive onboarding PATCH. Does not complete onboarding."""
    protected = sorted(PROTECTED_ONBOARDING_FIELDS & set(payload))
    if protected:
        raise ServiceError(
            "Protected fields cannot be updated here.",
            errors={name: "This field cannot be set by the client." for name in protected},
            status_code=400,
        )

    profile, onboarding = ensure_student_records(user)

    if "full_name" in payload:
        first, last = _split_full_name(payload["full_name"])
        user.first_name = first
        user.last_name = last
    if "first_name" in payload:
        user.first_name = (payload["first_name"] or "")[:100]
    if "last_name" in payload:
        user.last_name = (payload["last_name"] or "")[:100]
    if "grade" in payload:
        user.grade = payload["grade"]
    if "stream" in payload:
        user.stream = payload["stream"]

    user_fields = set()
    if "full_name" in payload:
        user_fields.update({"first_name", "last_name"})
    for field in ("first_name", "last_name", "grade", "stream"):
        if field in payload:
            user_fields.add(field)
    if user_fields:
        user_fields.add("updated_at")
        user.save(update_fields=sorted(user_fields))

    profile_fields = []
    if "school" in payload:
        profile.school = (payload["school"] or "").strip()[:200]
        profile_fields.append("school")
    if "city" in payload:
        profile.city = (payload["city"] or "").strip()[:120]
        profile_fields.append("city")
    if "preferences" in payload:
        try:
            incoming = validate_preferences(payload["preferences"])
        except ValueError as exc:
            raise ServiceError(
                "Invalid preferences.",
                errors=exc.args[0] if exc.args else {"preferences": "Invalid."},
                status_code=400,
            ) from exc
        merged = dict(profile.preferences or {})
        merged.update(incoming)
        # Drop keys explicitly set to null by sending them? Not supported — omit to keep.
        profile.preferences = merged
        profile_fields.append("preferences")
    if profile_fields:
        profile_fields.append("updated_at")
        profile.save(update_fields=profile_fields)

    if "subject_ids" in payload:
        try:
            subjects = resolve_selectable_subjects(
                payload["subject_ids"],
                user.grade,
                user.stream,
            )
        except ValueError as exc:
            raise ServiceError(
                "Invalid subject selection.",
                errors=exc.args[0] if exc.args else {"subject_ids": "Invalid."},
                status_code=400,
            ) from exc
        _replace_subjects(user, subjects)

    if "learning_goals" in payload:
        goals = payload["learning_goals"]
        valid = {choice.value for choice in LearningGoal}
        invalid = [goal for goal in goals if goal not in valid]
        if invalid:
            raise ServiceError(
                "Invalid learning goals.",
                errors={
                    "learning_goals": (
                        "Invalid goal values: " + ", ".join(str(g) for g in invalid)
                    )
                },
                status_code=400,
            )
        # Deduplicate while preserving order.
        seen = set()
        unique_goals = []
        for goal in goals:
            if goal not in seen:
                seen.add(goal)
                unique_goals.append(goal)
        _replace_learning_goals(user, unique_goals)

    if onboarding.status != OnboardingStatus.COMPLETED:
        _mark_in_progress(onboarding)

    user.refresh_from_db()
    return serialize_onboarding(user)


def _completion_errors(user, profile):
    errors = {}
    if not user.full_name:
        errors["full_name"] = "Full name is required."
    if not user.phone_verified:
        errors["phone_verified"] = (
            "Verify your phone number before completing onboarding."
        )
    if user.grade is None:
        errors["grade"] = "Grade is required."
    if not user.stream:
        errors["stream"] = "Stream is required."
    if not user.selected_subjects.exists():
        errors["subject_ids"] = "Select at least one subject."
    else:
        # Re-validate selections against the final grade/stream.
        try:
            resolve_selectable_subjects(
                list(user.selected_subjects.values_list("subject_id", flat=True)),
                user.grade,
                user.stream,
            )
        except ValueError as exc:
            errors.update(exc.args[0] if exc.args else {"subject_ids": "Invalid."})
    if not user.learning_goals.exists():
        errors["learning_goals"] = "Select at least one learning goal."
    try:
        validate_preferences(
            profile.preferences or {},
            require_completion_keys=True,
        )
    except ValueError as exc:
        pref_errors = exc.args[0] if exc.args else {"preferences": "Invalid."}
        errors.update(pref_errors)
    return errors


@transaction.atomic
def complete_student_onboarding(user, payload=None):
    """Mark onboarding completed after validating required fields.

    Optional ``payload`` is applied first (same rules as PATCH) so the client
    can submit the final step and complete in one call. Idempotent when already
    completed and no conflicting payload is needed.
    """
    payload = payload or {}
    if payload:
        update_onboarding(user, payload)
        user.refresh_from_db()

    profile, onboarding = ensure_student_records(user)

    if onboarding.status == OnboardingStatus.COMPLETED and user.onboarded:
        return serialize_onboarding(user)

    errors = _completion_errors(user, profile)
    if errors:
        raise ServiceError(
            "Onboarding is incomplete.",
            errors=errors,
            status_code=400,
        )

    now = timezone.now()
    onboarding.status = OnboardingStatus.COMPLETED
    onboarding.completed_at = now
    onboarding.save(update_fields=["status", "completed_at", "updated_at"])

    if user.onboarded_at is None:
        user.onboarded_at = now
        user.save(update_fields=["onboarded_at", "updated_at"])

    return serialize_onboarding(user)
