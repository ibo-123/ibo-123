"""Dashboard aggregation for the authenticated student.

Phase 4 overview identity fields come from users/onboarding/curriculum.
Mastery-backed fields are delegated to ``mastery.services``.
Current topic / next activity / path progress → ``learning_path.services``.
Streak / recent activity → ``engagement.services``.
Diagnostic / practice status come from ``dashboard.learning_status_sources``
(currently unavailable until those domains ship — see that module).
"""

from curriculum.serializers import SubjectSerializer
from dashboard.learning_status_sources import (
    diagnostic_data_available,
    get_diagnostic_status,
    get_practice_status,
    practice_data_available,
)
from engagement.services import compute_engagement_snapshot
from learning_path.services import compute_learning_path_snapshot
from mastery.services import compute_student_mastery_snapshot
from users.models import OnboardingStatus
from users.services import ensure_student_records


def _subject_ref(subject):
    data = SubjectSerializer(subject).data
    return {
        "id": data["id"],
        "name": data["name"],
        "slug": data["slug"],
        "grade": data["grade"],
        "stream": data["stream"],
    }


def build_dashboard(user):
    """Aggregate dashboard payload for ``user`` only.

    Ownership is enforced by callers passing ``request.user``; this function
    never accepts another student identifier.
    """
    profile, onboarding = ensure_student_records(user)

    selections = list(
        user.selected_subjects.select_related("subject")
        .order_by("created_at")
        .all()
    )
    subjects = [selection.subject for selection in selections]
    learning_goals = list(
        user.learning_goals.order_by("created_at").values_list("goal", flat=True)
    )

    mastery = compute_student_mastery_snapshot(user, selected_subjects=subjects)
    learning_path = compute_learning_path_snapshot(user)
    engagement = compute_engagement_snapshot(user)
    diagnostic = get_diagnostic_status(user)
    practice = get_practice_status(user)

    return {
        "overview": {
            "full_name": user.full_name or None,
            "grade": user.grade,
            "stream": user.stream,
            "onboarded": user.onboarded,
            "onboarding_status": onboarding.status,
            "learning_goals": learning_goals,
            "selected_subjects": [_subject_ref(subject) for subject in subjects],
            "subject_summaries": mastery["subject_summaries"],
            "overall_progress": mastery["overall_progress"],
            "strongest_subject": mastery["strongest_subject"],
            "weakest_subject": mastery["weakest_subject"],
        },
        "topic_performance": {
            "strong_topics": mastery["strong_topics"],
            "weak_topics": mastery["weak_topics"],
            "available": mastery["available"],
        },
        "current_learning": {
            "current_topic": learning_path["current_topic"],
            "recommended_activity": learning_path["recommended_activity"],
            "available": learning_path["available"],
        },
        "engagement": {
            "streak": engagement["streak"],
            "recent_activity": engagement["recent_activity"],
            "available": engagement["available"],
        },
        "learning_status": {
            "diagnostic": diagnostic,
            "practice": practice,
            "learning_path": {
                "status": learning_path["path_status"],
                "progress": learning_path["progress"],
                "detail": learning_path["detail"],
            },
        },
        "data_availability": {
            "onboarding": onboarding.status == OnboardingStatus.COMPLETED,
            "profile": True,
            "selected_subjects": bool(subjects),
            "mastery": mastery["available"],
            "topic_performance": mastery["available"],
            "recommendations": learning_path["recommended_activity"] is not None,
            "streak": engagement["available"],
            "recent_activity": engagement["available"],
            "diagnostic": diagnostic_data_available(diagnostic),
            "practice": practice_data_available(practice),
            "learning_path": learning_path["available"],
        },
        # Lightweight profile context used by the Today screen; no PII beyond
        # what /auth/me already exposes for the same student.
        "profile_context": {
            "school": profile.school or None,
            "city": profile.city or None,
            "preferences": profile.preferences or {},
        },
    }
