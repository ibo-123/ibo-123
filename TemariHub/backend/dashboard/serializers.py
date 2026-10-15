from rest_framework import serializers


class SubjectRefSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    name = serializers.CharField()
    slug = serializers.CharField()
    grade = serializers.IntegerField(allow_null=True)
    stream = serializers.CharField(allow_null=True)


class SubjectSummarySerializer(SubjectRefSerializer):
    mastery = serializers.FloatField(allow_null=True)
    accuracy = serializers.FloatField(allow_null=True)
    available = serializers.BooleanField()


class OverviewSerializer(serializers.Serializer):
    full_name = serializers.CharField(allow_null=True, allow_blank=True)
    grade = serializers.IntegerField(allow_null=True)
    stream = serializers.CharField(allow_null=True, allow_blank=True)
    onboarded = serializers.BooleanField()
    onboarding_status = serializers.CharField()
    learning_goals = serializers.ListField(child=serializers.CharField())
    selected_subjects = SubjectRefSerializer(many=True)
    subject_summaries = SubjectSummarySerializer(many=True)
    # null = unavailable (no eligible TopicMastery rows); 0.0 = genuine zero.
    overall_progress = serializers.FloatField(allow_null=True)
    strongest_subject = SubjectSummarySerializer(allow_null=True)
    weakest_subject = SubjectSummarySerializer(allow_null=True)


class TopicPerformanceItemSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    name = serializers.CharField()
    subject_id = serializers.UUIDField()
    subject_name = serializers.CharField()
    mastery = serializers.FloatField()
    mastery_band = serializers.CharField()
    accuracy = serializers.FloatField(allow_null=True)


class TopicPerformanceSerializer(serializers.Serializer):
    strong_topics = TopicPerformanceItemSerializer(many=True)
    weak_topics = TopicPerformanceItemSerializer(many=True)
    available = serializers.BooleanField()


class CurrentLearningSerializer(serializers.Serializer):
    current_topic = serializers.DictField(allow_null=True)
    recommended_activity = serializers.DictField(allow_null=True)
    available = serializers.BooleanField()


class EngagementSerializer(serializers.Serializer):
    streak = serializers.IntegerField(allow_null=True)
    recent_activity = serializers.ListField(child=serializers.DictField(), allow_empty=True)
    available = serializers.BooleanField()


class FeatureStatusSerializer(serializers.Serializer):
    status = serializers.CharField()
    completed = serializers.BooleanField(required=False)
    sessions_count = serializers.IntegerField(allow_null=True, required=False)
    progress = serializers.FloatField(allow_null=True, required=False)
    detail = serializers.DictField(allow_null=True, required=False)


class LearningStatusSerializer(serializers.Serializer):
    diagnostic = FeatureStatusSerializer()
    practice = FeatureStatusSerializer()
    learning_path = FeatureStatusSerializer()


class DataAvailabilitySerializer(serializers.Serializer):
    onboarding = serializers.BooleanField()
    profile = serializers.BooleanField()
    selected_subjects = serializers.BooleanField()
    mastery = serializers.BooleanField()
    topic_performance = serializers.BooleanField()
    recommendations = serializers.BooleanField()
    streak = serializers.BooleanField()
    recent_activity = serializers.BooleanField()
    diagnostic = serializers.BooleanField()
    practice = serializers.BooleanField()
    learning_path = serializers.BooleanField()


class ProfileContextSerializer(serializers.Serializer):
    school = serializers.CharField(allow_null=True, allow_blank=True)
    city = serializers.CharField(allow_null=True, allow_blank=True)
    preferences = serializers.DictField()


class DashboardSerializer(serializers.Serializer):
    """Read-only response contract for GET /api/v1/dashboard/me/."""

    overview = OverviewSerializer()
    topic_performance = TopicPerformanceSerializer()
    current_learning = CurrentLearningSerializer()
    engagement = EngagementSerializer()
    learning_status = LearningStatusSerializer()
    data_availability = DataAvailabilitySerializer()
    profile_context = ProfileContextSerializer()
