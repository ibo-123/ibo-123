from django.urls import path

from users.views import StudentOnboardingCompleteView, StudentOnboardingView

urlpatterns = [
    path(
        "me/onboarding/",
        StudentOnboardingView.as_view(),
        name="student-onboarding",
    ),
    path(
        "me/onboarding/complete/",
        StudentOnboardingCompleteView.as_view(),
        name="student-onboarding-complete",
    ),
]
