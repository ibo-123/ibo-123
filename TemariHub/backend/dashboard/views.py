from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from core.api.responses import success_response
from dashboard.serializers import DashboardSerializer
from dashboard.services import build_dashboard


class StudentDashboardView(APIView):
    """Authenticated student dashboard aggregator.

    ``GET /api/v1/dashboard/me/``
        Auth: Bearer JWT required.
        Scope: always ``request.user`` — no student id parameter is accepted.
        Returns the five dashboard feature areas plus ``data_availability``
        flags describing which domains currently have real data sources.

    Real sources today:
        - overview identity: User, StudentOnboarding, selected subjects, goals
        - overview mastery fields + topic_performance: ``mastery`` app
          (``TopicMastery`` via ``compute_student_mastery_snapshot``)
        - current_learning + learning_path progress: ``learning_path`` app
          (``compute_learning_path_snapshot`` — V1, no prerequisite locks)
        - engagement streak + recent activity: ``engagement`` app
          (``compute_engagement_snapshot``)
        - profile_context: StudentProfile

    Unavailable until later domains ship (returned as null / empty / status
    ``unavailable``, never fabricated — see ``learning_status_sources``):
        - diagnostic assessment status (no assessment domain yet)
        - practice session activity (no practice domain yet)

    Status codes: 200 success, 401 unauthenticated.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        payload = build_dashboard(request.user)
        data = DashboardSerializer(payload).data
        return success_response(
            data=data,
            message="Dashboard retrieved successfully",
        )
