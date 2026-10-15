"""Diagnostic attempt creation, question delivery, and answer submission.

Completion, scoring, and mastery updates are intentionally not implemented.
"""

from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from authentication.exceptions import ServiceError
from core.api.responses import error_response, success_response
from diagnostics import constants as diagnostic_constants
from diagnostics.serializers import (
    DiagnosticAnswerResponseSerializer,
    DiagnosticAnswerWriteSerializer,
    DiagnosticAttemptQuestionSerializer,
    DiagnosticAttemptSerializer,
    DiagnosticCompleteWriteSerializer,
    DiagnosticCompletionSerializer,
)
from diagnostics.services import (
    complete_diagnostic_attempt,
    get_student_attempt,
    list_attempt_questions,
    serialize_answer,
    serialize_attempt,
    serialize_completion_result,
    start_diagnostic_attempt,
    submit_diagnostic_answer,
)


def _error(exc: ServiceError):
    return error_response(
        message=exc.message,
        errors=exc.errors,
        status_code=exc.status_code,
    )


class DiagnosticAttemptStartView(APIView):
    """``POST /api/v1/diagnostic/attempts/`` — start or resume in-progress."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Ignore any client-supplied student_id / user_id body fields.
        try:
            attempt, created = start_diagnostic_attempt(
                student=request.user,
                required_count=diagnostic_constants.DIAGNOSTIC_QUESTION_COUNT,
            )
        except ServiceError as exc:
            return _error(exc)
        data = DiagnosticAttemptSerializer(serialize_attempt(attempt)).data
        if created:
            return success_response(
                data=data,
                message="Diagnostic attempt started successfully",
                status_code=201,
            )
        return success_response(
            data=data,
            message="Existing in-progress diagnostic attempt returned",
            status_code=200,
        )


class DiagnosticAttemptDetailView(APIView):
    """``GET /api/v1/diagnostic/attempts/{attempt_id}/``."""

    permission_classes = [IsAuthenticated]

    def get(self, request, attempt_id):
        try:
            attempt = get_student_attempt(
                student=request.user, attempt_id=attempt_id
            )
        except ServiceError as exc:
            return _error(exc)
        data = DiagnosticAttemptSerializer(serialize_attempt(attempt)).data
        return success_response(
            data=data,
            message="Diagnostic attempt retrieved successfully",
        )


class DiagnosticAttemptQuestionsView(APIView):
    """``GET /api/v1/diagnostic/attempts/{attempt_id}/questions/``."""

    permission_classes = [IsAuthenticated]

    def get(self, request, attempt_id):
        try:
            attempt = get_student_attempt(
                student=request.user, attempt_id=attempt_id
            )
        except ServiceError as exc:
            return _error(exc)
        raw = list_attempt_questions(attempt=attempt)
        items = DiagnosticAttemptQuestionSerializer(raw, many=True).data
        return success_response(
            data={
                "attempt_id": str(attempt.id),
                "items": items,
                "count": len(items),
            },
            message="Diagnostic questions retrieved successfully",
        )


class DiagnosticAnswerSubmitView(APIView):
    """``PUT .../attempts/{id}/questions/{question_id}/answer/``."""

    permission_classes = [IsAuthenticated]

    def put(self, request, attempt_id, question_id):
        serializer = DiagnosticAnswerWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        try:
            answer, created = submit_diagnostic_answer(
                student=request.user,
                attempt_id=attempt_id,
                question_id=question_id,
                selected_option_id=data["selected_option_id"],
                time_spent_seconds=data.get("time_spent_seconds"),
            )
        except ServiceError as exc:
            return _error(exc)
        payload = DiagnosticAnswerResponseSerializer(serialize_answer(answer)).data
        return success_response(
            data=payload,
            message=(
                "Diagnostic answer recorded successfully"
                if created
                else "Diagnostic answer updated successfully"
            ),
            status_code=201 if created else 200,
        )


class DiagnosticAttemptCompleteView(APIView):
    """``POST /api/v1/diagnostic/attempts/{attempt_id}/complete/``."""

    permission_classes = [IsAuthenticated]

    def post(self, request, attempt_id):
        serializer = DiagnosticCompleteWriteSerializer(data=request.data or {})
        serializer.is_valid(raise_exception=True)
        try:
            attempt, scoring, newly_completed = complete_diagnostic_attempt(
                student=request.user,
                attempt_id=attempt_id,
            )
        except ServiceError as exc:
            return _error(exc)
        payload = DiagnosticCompletionSerializer(
            serialize_completion_result(attempt, scoring=scoring)
        ).data
        return success_response(
            data=payload,
            message=(
                "Diagnostic attempt completed successfully"
                if newly_completed
                else "Diagnostic attempt already completed"
            ),
            status_code=200,
        )
