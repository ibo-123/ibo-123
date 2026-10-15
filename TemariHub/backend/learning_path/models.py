import uuid

from django.conf import settings
from django.db import models


class PathItemStatus(models.TextChoices):
    """Statuses from API contract §28.

    V1 never assigns ``locked`` — prerequisite locking is out of scope.
    """

    LOCKED = "locked", "Locked"
    RECOMMENDED = "recommended", "Recommended"
    IN_PROGRESS = "in_progress", "In progress"
    COMPLETED = "completed", "Completed"
    SKIPPED = "skipped", "Skipped"


class LearningPath(models.Model):
    """Per-student learning path. Items are the sequenced topics to study."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="learning_path",
    )
    title = models.CharField(max_length=200, blank=True, default="")
    generated_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self):
        return f"Learning path for {self.user_id}"


class LearningPathItem(models.Model):
    """One curriculum topic on a student's learning path."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    learning_path = models.ForeignKey(
        LearningPath,
        on_delete=models.CASCADE,
        related_name="items",
    )
    topic = models.ForeignKey(
        "curriculum.Topic",
        on_delete=models.CASCADE,
        related_name="learning_path_items",
    )
    status = models.CharField(
        max_length=32,
        choices=PathItemStatus.choices,
        default=PathItemStatus.RECOMMENDED,
    )
    # Stable curriculum order within the path (subject → unit → topic).
    sort_order = models.PositiveIntegerField(default=0)
    # Recommendation priority among incomplete items (1 = highest). Null when completed.
    priority = models.PositiveIntegerField(null=True, blank=True)
    reason = models.CharField(max_length=64, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["sort_order", "id"]
        constraints = [
            models.UniqueConstraint(
                fields=["learning_path", "topic"],
                name="uniq_learning_path_topic",
            ),
        ]
        indexes = [
            models.Index(
                fields=["learning_path", "status"],
                name="lp_item_path_status_idx",
            ),
        ]

    def __str__(self):
        return f"{self.status} item {self.topic_id} on path {self.learning_path_id}"
