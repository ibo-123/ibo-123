from rest_framework.generics import get_object_or_404
from rest_framework.views import APIView

from authentication.exceptions import ServiceError
from core.api.pagination import (
    paginate_queryset,
    pagination_payload,
    parse_page_params,
)
from core.api.responses import error_response, success_response
from questions.permissions import IsAuthenticatedReadOrAdminWrite
from questions.query import validate_and_apply_question_filters
from questions.serializers import (
    AdminQuestionCreateSerializer,
    AdminQuestionWriteSerializer,
    StudentQuestionSerializer,
)
from questions.services import (
    admin_question_queryset,
    create_question,
    delete_question,
    serialize_question_admin,
    serialize_question_student,
    student_eligible_question_queryset,
    update_question,
)


def _error(exc: ServiceError):
    return error_response(
        message=exc.message,
        errors=exc.errors,
        status_code=exc.status_code,
    )


def _is_staff(request) -> bool:
    return bool(request.user and request.user.is_authenticated and request.user.is_staff)


class QuestionListCreateView(APIView):
    """Question list/create with audience-specific read behavior.

    ``GET /api/v1/questions/``
        Auth: JWT required.
        Staff: all questions (admin serializer, includes answer keys).
        Students: eligible published questions only (student-safe serializer).
        Supports filters, search, ordering, and ``page`` / ``page_size``.

    ``POST /api/v1/questions/``
        Auth: JWT + staff. Nested create with options / correct answer.
    """

    permission_classes = [IsAuthenticatedReadOrAdminWrite]

    def get(self, request):
        staff = _is_staff(request)
        base_qs = (
            admin_question_queryset() if staff else student_eligible_question_queryset()
        )
        qs = validate_and_apply_question_filters(
            base_qs, request.query_params, is_staff=staff
        )
        page, page_size = parse_page_params(request.query_params)
        page_rows, total = paginate_queryset(qs, page=page, page_size=page_size)
        if staff:
            items = [serialize_question_admin(q) for q in page_rows]
        else:
            raw = [serialize_question_student(q) for q in page_rows]
            items = StudentQuestionSerializer(raw, many=True).data
        return success_response(
            data=pagination_payload(
                items=items, page=page, page_size=page_size, total=total
            ),
            message="Questions retrieved successfully",
        )

    def post(self, request):
        serializer = AdminQuestionCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            question = create_question(
                data=serializer.validated_data,
                created_by=request.user,
            )
        except ServiceError as exc:
            return _error(exc)
        return success_response(
            data=serialize_question_admin(question),
            message="Question created successfully",
            status_code=201,
        )


class QuestionDetailView(APIView):
    """Question retrieve / update / delete.

    ``GET /api/v1/questions/{question_id}/``
        Auth: JWT required.
        Staff: any question via admin queryset/serializer.
        Students: eligible published only; unavailable UUIDs → 404.

    ``PUT|PATCH|DELETE``
        Auth: JWT + staff.
    """

    permission_classes = [IsAuthenticatedReadOrAdminWrite]

    def get_object_for_read(self, request, question_id):
        if _is_staff(request):
            return get_object_or_404(admin_question_queryset(), pk=question_id)
        return get_object_or_404(student_eligible_question_queryset(), pk=question_id)

    def get_object_for_write(self, question_id):
        return get_object_or_404(admin_question_queryset(), pk=question_id)

    def get(self, request, question_id):
        question = self.get_object_for_read(request, question_id)
        if _is_staff(request):
            data = serialize_question_admin(question)
        else:
            data = StudentQuestionSerializer(serialize_question_student(question)).data
        return success_response(
            data=data,
            message="Question retrieved successfully",
        )

    def patch(self, request, question_id):
        question = self.get_object_for_write(question_id)
        serializer = AdminQuestionWriteSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        try:
            question = update_question(question=question, data=serializer.validated_data)
        except ServiceError as exc:
            return _error(exc)
        return success_response(
            data=serialize_question_admin(question),
            message="Question updated successfully",
        )

    def put(self, request, question_id):
        question = self.get_object_for_write(question_id)
        serializer = AdminQuestionCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            question = update_question(question=question, data=serializer.validated_data)
        except ServiceError as exc:
            return _error(exc)
        return success_response(
            data=serialize_question_admin(question),
            message="Question updated successfully",
        )

    def delete(self, request, question_id):
        question = self.get_object_for_write(question_id)
        try:
            delete_question(question=question)
        except ServiceError as exc:
            return _error(exc)
        return success_response(
            data=None,
            message="Question deleted successfully",
            status_code=200,
        )
