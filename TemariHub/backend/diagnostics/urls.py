from django.urls import path

from diagnostics.views import (
    DiagnosticAnswerSubmitView,
    DiagnosticAttemptCompleteView,
    DiagnosticAttemptDetailView,
    DiagnosticAttemptQuestionsView,
    DiagnosticAttemptStartView,
)

urlpatterns = [
    path(
        "attempts/",
        DiagnosticAttemptStartView.as_view(),
        name="diagnostic-attempt-start",
    ),
    path(
        "attempts/<uuid:attempt_id>/",
        DiagnosticAttemptDetailView.as_view(),
        name="diagnostic-attempt-detail",
    ),
    path(
        "attempts/<uuid:attempt_id>/questions/",
        DiagnosticAttemptQuestionsView.as_view(),
        name="diagnostic-attempt-questions",
    ),
    path(
        "attempts/<uuid:attempt_id>/questions/<uuid:question_id>/answer/",
        DiagnosticAnswerSubmitView.as_view(),
        name="diagnostic-answer-submit",
    ),
    path(
        "attempts/<uuid:attempt_id>/complete/",
        DiagnosticAttemptCompleteView.as_view(),
        name="diagnostic-attempt-complete",
    ),
]
