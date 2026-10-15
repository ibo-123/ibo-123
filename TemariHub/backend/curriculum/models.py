import uuid

from django.db import models
from django.db.models import Q

from users.models import GRADE_CHOICES, Stream


class Subject(models.Model):
    """A curriculum subject for a grade (and optionally a stream).

    Subjects are seeded/managed as data — not hardcoded in application logic.
    ``stream`` is null when the subject applies to both natural and social science.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=120)
    slug = models.SlugField(max_length=140)
    grade = models.PositiveSmallIntegerField(choices=GRADE_CHOICES)
    stream = models.CharField(
        max_length=32,
        choices=Stream.choices,
        null=True,
        blank=True,
        help_text="Leave blank when the subject applies to both streams.",
    )
    is_active = models.BooleanField(default=True)
    sort_order = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["grade", "sort_order", "name"]
        constraints = [
            models.UniqueConstraint(
                fields=["slug", "grade", "stream"],
                condition=Q(stream__isnull=False),
                name="uniq_subject_slug_grade_stream",
            ),
            models.UniqueConstraint(
                fields=["slug", "grade"],
                condition=Q(stream__isnull=True),
                name="uniq_subject_slug_grade_both",
            ),
            models.UniqueConstraint(
                fields=["name", "grade", "stream"],
                condition=Q(stream__isnull=False),
                name="uniq_subject_name_grade_stream",
            ),
            models.UniqueConstraint(
                fields=["name", "grade"],
                condition=Q(stream__isnull=True),
                name="uniq_subject_name_grade_both",
            ),
        ]
        indexes = [
            models.Index(
                fields=["grade", "stream", "is_active"],
                name="subj_grade_stream_active_idx",
            ),
        ]

    def __str__(self):
        stream_label = self.stream or "both"
        return f"{self.name} (G{self.grade}, {stream_label})"

    def matches_track(self, grade, stream):
        """Return True when this subject is selectable for the given track."""
        if not self.is_active:
            return False
        if grade is None or self.grade != grade:
            return False
        if self.stream is None:
            return True
        return stream is not None and self.stream == stream


class Unit(models.Model):
    """A unit within a subject. Content hierarchy: Subject → Unit → Topic."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    subject = models.ForeignKey(
        Subject,
        on_delete=models.CASCADE,
        related_name="units",
    )
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220)
    sort_order = models.PositiveSmallIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["sort_order", "name"]
        constraints = [
            models.UniqueConstraint(
                fields=["subject", "slug"],
                name="uniq_unit_subject_slug",
            ),
        ]
        indexes = [
            models.Index(
                fields=["subject", "is_active", "sort_order"],
                name="unit_subject_active_idx",
            ),
        ]

    def __str__(self):
        return f"{self.name} ({self.subject_id})"


class Topic(models.Model):
    """A topic within a unit. Content hierarchy: Subject → Unit → Topic → Concept."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    unit = models.ForeignKey(
        Unit,
        on_delete=models.CASCADE,
        related_name="topics",
    )
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220)
    sort_order = models.PositiveSmallIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    estimated_study_minutes = models.PositiveIntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["sort_order", "name"]
        constraints = [
            models.UniqueConstraint(
                fields=["unit", "slug"],
                name="uniq_topic_unit_slug",
            ),
        ]
        indexes = [
            models.Index(
                fields=["unit", "is_active", "sort_order"],
                name="topic_unit_active_idx",
            ),
        ]

    def __str__(self):
        return f"{self.name} ({self.unit_id})"


class Concept(models.Model):
    """A concept within a topic.

    Questions and diagnostics reference concepts for fine-grained performance.
    Concepts never cross topic boundaries — ``topic`` is the sole parent.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    topic = models.ForeignKey(
        Topic,
        on_delete=models.CASCADE,
        related_name="concepts",
    )
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220)
    sort_order = models.PositiveSmallIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["sort_order", "name"]
        constraints = [
            models.UniqueConstraint(
                fields=["topic", "slug"],
                name="uniq_concept_topic_slug",
            ),
        ]
        indexes = [
            models.Index(
                fields=["topic", "is_active", "sort_order"],
                name="concept_topic_active_idx",
            ),
        ]

    def __str__(self):
        return f"{self.name} ({self.topic_id})"
