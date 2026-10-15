from django.db import IntegrityError
from django.test import TestCase

from curriculum.models import Concept, Subject, Topic, Unit


class ConceptModelTests(TestCase):
    def setUp(self):
        self.subject = Subject.objects.create(
            name="Mathematics",
            slug="mathematics",
            grade=12,
            stream=None,
            sort_order=1,
        )
        self.unit = Unit.objects.create(
            subject=self.subject,
            name="Algebra",
            slug="algebra",
            sort_order=1,
        )
        self.topic = Topic.objects.create(
            unit=self.unit,
            name="Quadratic Equations",
            slug="quadratic-equations",
            sort_order=1,
        )
        self.other_topic = Topic.objects.create(
            unit=self.unit,
            name="Linear Equations",
            slug="linear-equations",
            sort_order=2,
        )

    def test_concept_belongs_to_topic(self):
        concept = Concept.objects.create(
            topic=self.topic,
            name="Discriminant",
            slug="discriminant",
            sort_order=1,
        )
        self.assertEqual(concept.topic_id, self.topic.id)
        self.assertEqual(self.topic.concepts.count(), 1)
        self.assertEqual(concept.topic.unit_id, self.unit.id)
        self.assertEqual(concept.topic.unit.subject_id, self.subject.id)

    def test_slug_unique_per_topic(self):
        Concept.objects.create(
            topic=self.topic,
            name="Discriminant",
            slug="discriminant",
        )
        with self.assertRaises(IntegrityError):
            Concept.objects.create(
                topic=self.topic,
                name="Discriminant Again",
                slug="discriminant",
            )

    def test_same_slug_allowed_on_different_topics(self):
        Concept.objects.create(
            topic=self.topic,
            name="Discriminant",
            slug="discriminant",
        )
        other = Concept.objects.create(
            topic=self.other_topic,
            name="Discriminant",
            slug="discriminant",
        )
        self.assertEqual(other.slug, "discriminant")
        self.assertEqual(Concept.objects.filter(slug="discriminant").count(), 2)

    def test_inactive_concepts_excluded_from_topic_detail_payload(self):
        Concept.objects.create(
            topic=self.topic,
            name="Active Concept",
            slug="active-concept",
            is_active=True,
        )
        Concept.objects.create(
            topic=self.topic,
            name="Retired Concept",
            slug="retired-concept",
            is_active=False,
        )
        from curriculum.serializers import TopicDetailSerializer

        payload = TopicDetailSerializer(self.topic).data
        names = {item["name"] for item in payload["concepts"]}
        self.assertIn("Active Concept", names)
        self.assertNotIn("Retired Concept", names)
