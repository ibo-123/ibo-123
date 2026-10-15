from rest_framework import serializers

from curriculum.models import Concept, Subject, Topic, Unit
from users.models import GRADE_CHOICES, Stream


class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = (
            "id",
            "name",
            "slug",
            "grade",
            "stream",
            "sort_order",
        )
        read_only_fields = fields


class UnitSerializer(serializers.ModelSerializer):
    subject_id = serializers.UUIDField(source="subject.id", read_only=True)

    class Meta:
        model = Unit
        fields = (
            "id",
            "subject_id",
            "name",
            "slug",
            "sort_order",
        )
        read_only_fields = fields


class ConceptSerializer(serializers.ModelSerializer):
    topic_id = serializers.UUIDField(source="topic.id", read_only=True)

    class Meta:
        model = Concept
        fields = (
            "id",
            "topic_id",
            "name",
            "slug",
            "sort_order",
        )
        read_only_fields = fields


class TopicListSerializer(serializers.ModelSerializer):
    unit_id = serializers.UUIDField(source="unit.id", read_only=True)

    class Meta:
        model = Topic
        fields = (
            "id",
            "unit_id",
            "name",
            "slug",
            "sort_order",
            "estimated_study_minutes",
        )
        read_only_fields = fields


class TopicDetailSerializer(TopicListSerializer):
    subject_id = serializers.UUIDField(source="unit.subject_id", read_only=True)
    concepts = serializers.SerializerMethodField()

    class Meta(TopicListSerializer.Meta):
        fields = TopicListSerializer.Meta.fields + (
            "subject_id",
            "concepts",
            "is_active",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields

    def get_concepts(self, topic):
        concepts = topic.concepts.filter(is_active=True).order_by("sort_order", "name")
        return ConceptSerializer(concepts, many=True).data


class SubjectQuerySerializer(serializers.Serializer):
    grade = serializers.ChoiceField(choices=GRADE_CHOICES, required=False)
    stream = serializers.ChoiceField(choices=Stream.choices, required=False)
