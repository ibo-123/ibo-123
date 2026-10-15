from rest_framework import serializers

from users.models import GRADE_CHOICES, LearningGoal, Stream
from users.preferences import PROTECTED_ONBOARDING_FIELDS, StudyFrequency


class StudentOnboardingUpdateSerializer(serializers.Serializer):
    """Progressive onboarding PATCH body. Every field is optional."""

    full_name = serializers.CharField(required=False, allow_blank=True, max_length=201)
    first_name = serializers.CharField(required=False, allow_blank=True, max_length=100)
    last_name = serializers.CharField(required=False, allow_blank=True, max_length=100)
    grade = serializers.ChoiceField(choices=GRADE_CHOICES, required=False)
    stream = serializers.ChoiceField(choices=Stream.choices, required=False)
    school = serializers.CharField(required=False, allow_blank=True, max_length=200)
    city = serializers.CharField(required=False, allow_blank=True, max_length=120)
    subject_ids = serializers.ListField(
        child=serializers.UUIDField(),
        allow_empty=True,
        required=False,
    )
    learning_goals = serializers.ListField(
        child=serializers.ChoiceField(choices=LearningGoal.choices),
        allow_empty=True,
        required=False,
    )
    preferences = serializers.DictField(required=False)

    def validate(self, attrs):
        incoming = set(self.initial_data)
        protected = sorted(PROTECTED_ONBOARDING_FIELDS & incoming)
        if protected:
            raise serializers.ValidationError(
                {name: "This field cannot be set by the client." for name in protected}
            )
        unknown = sorted(incoming - set(self.fields))
        if unknown:
            raise serializers.ValidationError(
                {name: "Unknown field." for name in unknown}
            )
        if not attrs:
            raise serializers.ValidationError("Provide at least one field to update.")
        return attrs


class StudentOnboardingCompleteSerializer(StudentOnboardingUpdateSerializer):
    """Optional final-step payload accepted by the completion endpoint."""

    def validate(self, attrs):
        incoming = set(self.initial_data)
        protected = sorted(PROTECTED_ONBOARDING_FIELDS & incoming)
        if protected:
            raise serializers.ValidationError(
                {name: "This field cannot be set by the client." for name in protected}
            )
        unknown = sorted(incoming - set(self.fields))
        if unknown:
            raise serializers.ValidationError(
                {name: "Unknown field." for name in unknown}
            )
        # Empty body is allowed for completion of already-saved progress.
        return attrs


class PreferenceChoicesSerializer(serializers.Serializer):
    """Documentation helper for OpenAPI-style preference examples."""

    daily_study_minutes = serializers.IntegerField(required=False, min_value=5, max_value=480)
    study_frequency = serializers.ChoiceField(
        choices=StudyFrequency.choices, required=False
    )
    preferred_difficulty = serializers.IntegerField(
        required=False, min_value=1, max_value=5
    )
