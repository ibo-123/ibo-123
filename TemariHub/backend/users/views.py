from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from authentication.exceptions import ServiceError
from core.api.responses import error_response, success_response
from users.serializers import (
    StudentOnboardingCompleteSerializer,
    StudentOnboardingUpdateSerializer,
)
from users.services import (
    complete_student_onboarding,
    serialize_onboarding,
    update_onboarding,
)


def _error(exc):
    return error_response(
        message=exc.message,
        errors=exc.errors,
        status_code=exc.status_code,
    )


class StudentOnboardingView(APIView):
    """Authenticated student onboarding read/update.

    ``GET /api/v1/students/me/onboarding/``
        Auth: Bearer JWT required.
        Returns current onboarding payload for ``request.user`` only
        (status, name, academic fields, subjects, goals, preferences).

    ``PATCH /api/v1/students/me/onboarding/``
        Auth: Bearer JWT required.
        Progressive save. All body fields optional. Accepted keys:
        full_name, first_name, last_name, grade, stream, school, city,
        subject_ids, learning_goals, preferences.
        Rejects protected keys (status, completed_at, phone verification, etc.).
        Does not mark onboarding completed.
        Status codes: 200 success, 400 validation, 401 unauthenticated.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        data = serialize_onboarding(request.user)
        return success_response(
            data=data,
            message="Onboarding retrieved successfully",
        )

    def patch(self, request):
        serializer = StudentOnboardingUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            data = update_onboarding(request.user, serializer.validated_data)
        except ServiceError as exc:
            return _error(exc)
        return success_response(
            data=data,
            message="Onboarding updated successfully",
        )


class StudentOnboardingCompleteView(APIView):
    """Complete student onboarding.

    ``POST /api/v1/students/me/onboarding/complete/``
        Auth: Bearer JWT required.
        Optional body uses the same fields as PATCH.
        Requires: full name, verified phone, grade, stream, ≥1 subject,
        ≥1 learning goal, required preferences (daily_study_minutes,
        study_frequency).
        Sets status=COMPLETED and completed_at; syncs User.onboarded_at.
        Idempotent when already completed.
        Status codes: 200 success, 400 incomplete/invalid, 401 unauthenticated.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = StudentOnboardingCompleteSerializer(data=request.data or {})
        serializer.is_valid(raise_exception=True)
        try:
            data = complete_student_onboarding(
                request.user,
                serializer.validated_data,
            )
        except ServiceError as exc:
            return _error(exc)
        return success_response(
            data=data,
            message="Onboarding completed successfully",
        )
