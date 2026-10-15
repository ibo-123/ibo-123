from rest_framework.generics import get_object_or_404
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView

from core.api.responses import success_response
from curriculum.models import Subject, Topic, Unit
from curriculum.serializers import (
    SubjectQuerySerializer,
    SubjectSerializer,
    TopicDetailSerializer,
    TopicListSerializer,
    UnitSerializer,
)
from curriculum.services import selectable_subjects_queryset


class SubjectListView(APIView):
    """List active curriculum subjects.

    ``GET /api/v1/curriculum/subjects/?grade=&stream=``
        Public read. Optional ``grade`` / ``stream`` query filters.
        Stream-agnostic subjects (stream null) are included for a stream filter.
        Inactive subjects are omitted. 200 on success, 400 on invalid query.
    """

    permission_classes = [AllowAny]

    def get(self, request):
        query = SubjectQuerySerializer(data=request.query_params)
        query.is_valid(raise_exception=True)
        subjects = selectable_subjects_queryset(
            grade=query.validated_data.get("grade"),
            stream=query.validated_data.get("stream"),
        )
        return success_response(
            data={
                "items": SubjectSerializer(subjects, many=True).data,
                "count": subjects.count(),
            },
            message="Subjects retrieved successfully",
        )


class SubjectUnitListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, subject_id):
        subject = get_object_or_404(Subject, id=subject_id, is_active=True)
        units = subject.units.filter(is_active=True).order_by("sort_order", "name")
        return success_response(
            data={
                "subject": SubjectSerializer(subject).data,
                "items": UnitSerializer(units, many=True).data,
                "count": units.count(),
            },
            message="Units retrieved successfully",
        )


class UnitTopicListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, unit_id):
        unit = get_object_or_404(Unit, id=unit_id, is_active=True, subject__is_active=True)
        topics = unit.topics.filter(is_active=True).order_by("sort_order", "name")
        return success_response(
            data={
                "unit": UnitSerializer(unit).data,
                "items": TopicListSerializer(topics, many=True).data,
                "count": topics.count(),
            },
            message="Topics retrieved successfully",
        )


class TopicDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, topic_id):
        topic = get_object_or_404(
            Topic.objects.select_related("unit", "unit__subject").prefetch_related(
                "concepts"
            ),
            id=topic_id,
            is_active=True,
            unit__is_active=True,
            unit__subject__is_active=True,
        )
        return success_response(
            data=TopicDetailSerializer(topic).data,
            message="Topic retrieved successfully",
        )


# Authenticated alias kept for clients that prefer a protected browse surface.
class AuthenticatedSubjectListView(SubjectListView):
    permission_classes = [IsAuthenticated]
