import uuid

from django.conf import settings
from django.db import models

from engagement.constants import ACTIVITY_STATUS_COMPLETED, ACTIVITY_TYPE_PRACTICE


class LearningActivityEvent(models.Model):
    """Immutable-ish learning event used for streak and recent-activity feeds.

    V1 writers: ``mastery.services.upsert_topic_mastery`` (practice completions).
    Future diagnostic/practice session domains should emit through the same
    ``record_learning_activity`` helper so the dashboard stays a pure reader.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="learning_activity_events",
    )
    topic = models.ForeignKey(
        "curriculum.Topic",
        on_delete=models.CASCADE,
        related_name="learning_activity_events",
        null=True,
        blank=True,
    )
    activity_type = models.CharField(max_length=32, default=ACTIVITY_TYPE_PRACTICE)
    title = models.CharField(max_length=255)
    status = models.CharField(max_length=32, default=ACTIVITY_STATUS_COMPLETED)
    # Timezone-aware instant (UTC in API responses).
    occurred_at = models.DateTimeField()
    # Calendar day in project TIME_ZONE — used for streak day uniqueness.
    activity_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-occurred_at", "-created_at"]
        constraints = [
            # One practice completion per topic per calendar day for the student.
            models.UniqueConstraint(
                fields=["user", "topic", "activity_type", "activity_date"],
                name="uniq_engagement_user_topic_type_day",
            ),
        ]
        indexes = [
            models.Index(
                fields=["user", "activity_date"],
                name="eng_user_activity_date_idx",
            ),
            models.Index(
                fields=["user", "-occurred_at"],
                name="eng_user_occurred_idx",
            ),
        ]

    def __str__(self):
        return f"{self.activity_type} for {self.user_id} on {self.activity_date}"
