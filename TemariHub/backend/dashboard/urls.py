from django.urls import path

from dashboard.views import StudentDashboardView

urlpatterns = [
    path("me/", StudentDashboardView.as_view(), name="student-dashboard"),
]
