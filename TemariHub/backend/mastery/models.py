import uuid
from decimal import Decimal

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from mastery.constants import MASTERY_ALGORITHM_VERSION


class TopicMastery(models.Model):
    """Per-student mastery snapshot for one curriculum topic.

    Diagnostic and practice domains (when implemented) write this row.
    Dashboard and analytics read it — they never invent a second score.
    ``questions_attempted`` is the eligibility signal for ranking.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="topic_masteries",
    )
    topic = models.ForeignKey(
        "curriculum.Topic",
        on_delete=models.CASCADE,
        related_name="masteries",
    )
    mastery_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0")), MaxValueValidator(Decimal("100"))],
        help_text="Stored mastery on a 0–100 scale (algorithm-versioned).",
    )
    questions_attempted = models.PositiveIntegerField(default=0)
    questions_correct = models.PositiveIntegerField(default=0)
    accuracy_pct = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal("0")), MaxValueValidator(Decimal("100"))],
    )
    algorithm_version = models.CharField(
        max_length=16,
        default=MASTERY_ALGORITHM_VERSION,
    )
    last_practiced_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "topic"],
                name="uniq_topic_mastery_user_topic",
            ),
        ]
        indexes = [
            models.Index(
                fields=["user", "questions_attempted"],
                name="tm_user_attempts_idx",
            ),
        ]

    def __str__(self):
        return f"Mastery {self.mastery_score} for {self.user_id} / {self.topic_id}"
