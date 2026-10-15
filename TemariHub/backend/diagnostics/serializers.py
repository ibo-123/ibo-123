"""Serializers for diagnostic attempt APIs."""

from rest_framework import serializers

from diagnostics.constants import DIAGNOSTIC_MAX_TIME_SPENT_SECONDS
from questions.serializers import StudentQuestionSerializer


class DiagnosticSectionSerializer(serializers.Serializer):
    subject_id = serializers.UUIDField()
    subject_name = serializers.CharField()
    question_count = serializers.IntegerField()


class DiagnosticSubjectScoreSerializer(serializers.Serializer):
    subject_id = serializers.UUIDField()
    subject_name = serializers.CharField()
    question_count = serializers.IntegerField()
    correct_count = serializers.IntegerField()
    score_pct = serializers.DecimalField(max_digits=5, decimal_places=2)


class DiagnosticAttemptSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    diagnostic_test_id = serializers.UUIDField()
    status = serializers.CharField()
    started_at = serializers.DateTimeField()
    completed_at = serializers.DateTimeField(allow_null=True)
    total_questions = serializers.IntegerField()
    overall_score_pct = serializers.DecimalField(
        max_digits=5, decimal_places=2, allow_null=True, required=False
    )
    sections = DiagnosticSectionSerializer(many=True)


class DiagnosticCompleteWriteSerializer(serializers.Serializer):
    """Empty body; reject client-supplied score / identity fields."""

    overall_score_pct = serializers.FloatField(required=False)
    student_id = serializers.UUIDField(required=False)
    completed_at = serializers.DateTimeField(required=False)
    status = serializers.CharField(required=False)
    is_correct = serializers.BooleanField(required=False)

    def validate(self, attrs):
        errors = {}
        for forbidden in (
            "overall_score_pct",
            "student_id",
            "completed_at",
            "status",
            "is_correct",
            "score",
        ):
            if forbidden in self.initial_data:
                errors[forbidden] = ["This field is not accepted."]
        if errors:
            raise serializers.ValidationError(errors)
        return attrs


class DiagnosticCompletionSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    diagnostic_test_id = serializers.UUIDField()
    status = serializers.CharField()
    started_at = serializers.DateTimeField()
    completed_at = serializers.DateTimeField(allow_null=True)
    total_questions = serializers.IntegerField()
    questions_answered = serializers.IntegerField()
    questions_correct = serializers.IntegerField()
    overall_score_pct = serializers.DecimalField(max_digits=5, decimal_places=2)
    subjects = DiagnosticSubjectScoreSerializer(many=True)
    strong_topics = serializers.ListField(child=serializers.DictField(), allow_empty=True)
    weak_topics = serializers.ListField(child=serializers.DictField(), allow_empty=True)
    sections = DiagnosticSectionSerializer(many=True)


class DiagnosticAttemptQuestionSerializer(StudentQuestionSerializer):
    """Student-safe question plus stable attempt position."""

    position = serializers.IntegerField()


class DiagnosticAnswerWriteSerializer(serializers.Serializer):
    """Accept selected option (+ optional time). Reject server-owned fields."""

    selected_option_id = serializers.UUIDField(required=False)
    # Contract §15.2 alias for the same value.
    selected_choice_id = serializers.UUIDField(required=False)
    time_spent_seconds = serializers.IntegerField(
        required=False,
        allow_null=True,
        min_value=0,
        max_value=DIAGNOSTIC_MAX_TIME_SPENT_SECONDS,
    )
    # Explicitly rejected if clients send privileged / server-owned fields.
    is_correct = serializers.BooleanField(required=False)
    student_id = serializers.UUIDField(required=False)
    score = serializers.FloatField(required=False)
    explanation = serializers.CharField(required=False)

    def validate(self, attrs):
        errors = {}
        for forbidden in ("is_correct", "student_id", "score", "explanation"):
            if forbidden in self.initial_data:
                errors[forbidden] = ["This field is not accepted."]
        option_id = attrs.get("selected_option_id") or attrs.get("selected_choice_id")
        if option_id is None:
            errors["selected_option_id"] = [
                "Provide selected_option_id (or selected_choice_id)."
            ]
        else:
            attrs["selected_option_id"] = option_id
        if errors:
            raise serializers.ValidationError(errors)
        return attrs


class DiagnosticAnswerResponseSerializer(serializers.Serializer):
    attempt_id = serializers.UUIDField()
    question_id = serializers.UUIDField()
    position = serializers.IntegerField()
    selected_option_id = serializers.UUIDField(allow_null=True)
    time_spent_seconds = serializers.IntegerField(allow_null=True)
    answered_at = serializers.DateTimeField(allow_null=True)
