from rest_framework import serializers

from questions.constants import (
    DIFFICULTY_MAX,
    DIFFICULTY_MIN,
    EXAM_YEAR_MAX,
    EXAM_YEAR_MIN,
    QUESTION_STATUS_CHOICES,
    QUESTION_TYPE_CHOICES,
    QUESTION_TYPE_MCQ_SINGLE,
)


class AdminQuestionOptionWriteSerializer(serializers.Serializer):
    id = serializers.UUIDField(required=False)
    text = serializers.CharField(max_length=500, allow_blank=False)
    sort_order = serializers.IntegerField(required=False, min_value=0, default=0)
    # Explicitly rejected if clients send contract-style is_correct.
    is_correct = serializers.BooleanField(required=False)

    def validate(self, attrs):
        if "is_correct" in attrs:
            raise serializers.ValidationError(
                {
                    "is_correct": (
                        "Do not send is_correct. Use correct_option_id or "
                        "correct_option_index."
                    )
                }
            )
        return attrs


class AdminQuestionWriteSerializer(serializers.Serializer):
    prompt = serializers.CharField(required=False, allow_blank=False)
    question_type = serializers.ChoiceField(
        choices=QUESTION_TYPE_CHOICES,
        required=False,
        default=QUESTION_TYPE_MCQ_SINGLE,
    )
    status = serializers.ChoiceField(choices=QUESTION_STATUS_CHOICES, required=False)
    topic_id = serializers.UUIDField(required=False)
    concept_id = serializers.UUIDField(required=False)
    difficulty = serializers.IntegerField(
        required=False,
        min_value=DIFFICULTY_MIN,
        max_value=DIFFICULTY_MAX,
    )
    estimated_time_seconds = serializers.IntegerField(
        required=False,
        allow_null=True,
        min_value=1,
    )
    source = serializers.CharField(
        required=False, allow_blank=True, max_length=255, default=""
    )
    exam_year = serializers.IntegerField(
        required=False,
        allow_null=True,
        min_value=EXAM_YEAR_MIN,
        max_value=EXAM_YEAR_MAX,
    )
    explanation = serializers.CharField(
        required=False, allow_blank=True, default=""
    )
    options = AdminQuestionOptionWriteSerializer(many=True, required=False)
    correct_option_id = serializers.UUIDField(required=False, allow_null=True)
    correct_option_index = serializers.IntegerField(
        required=False, allow_null=True, min_value=0
    )

    def validate(self, attrs):
        if (
            attrs.get("correct_option_id") is not None
            and attrs.get("correct_option_index") is not None
        ):
            raise serializers.ValidationError(
                {
                    "correct_option_id": [
                        "Provide only one of correct_option_id or correct_option_index."
                    ]
                }
            )
        return attrs


class AdminQuestionCreateSerializer(AdminQuestionWriteSerializer):
    prompt = serializers.CharField(required=True, allow_blank=False)
    topic_id = serializers.UUIDField(required=True)
    concept_id = serializers.UUIDField(required=True)
    difficulty = serializers.IntegerField(
        required=True,
        min_value=DIFFICULTY_MIN,
        max_value=DIFFICULTY_MAX,
    )


class StudentQuestionOptionSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    text = serializers.CharField()
    sort_order = serializers.IntegerField()


class StudentCurriculumRefSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    name = serializers.CharField()
    slug = serializers.CharField()


class StudentQuestionSerializer(serializers.Serializer):
    """Read-only student question contract — no answer keys or explanations."""

    id = serializers.UUIDField()
    prompt = serializers.CharField()
    question_type = serializers.CharField()
    difficulty = serializers.IntegerField()
    estimated_time_seconds = serializers.IntegerField(allow_null=True)
    subject = StudentCurriculumRefSerializer()
    unit = StudentCurriculumRefSerializer()
    topic = StudentCurriculumRefSerializer()
    concept = StudentCurriculumRefSerializer()
    options = StudentQuestionOptionSerializer(many=True)
