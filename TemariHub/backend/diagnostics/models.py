"""Diagnostic assessment persistence (Task 8 — models only).

Responsibilities
----------------
``DiagnosticAttempt`` — one student assessment session (``diagnostic_test_id``
in the API contract). Multiple completed attempts are allowed for history;
at most one ``in_progress`` attempt per student (partial unique constraint).

``DiagnosticQuestion`` — immutable assignment of a bank question to an attempt
at a stable ``position``. Question rows are ``PROTECT``-ed so history survives
bank edits/unpublish; admins should unpublish rather than delete referenced
questions.

``DiagnosticAnswer`` — at most one answer row per assigned question
(``OneToOne``). ``selected_option`` may be null while unanswered; scoring
(later) treats unanswered as incorrect. Correctness is **not** stored — it is
derived from ``Question.correct_option`` at results time (live bank answer).
Historical answer-key drift if a question is later edited is an accepted V1
limitation unless a future task adds snapshots.

Cross-table rule (application-enforced): ``selected_option.question_id`` must
equal ``diagnostic_question.question_id``. PostgreSQL cannot express that with
a simple FK.
"""

import uuid
from decimal import Decimal

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.db.models import Q
from django.utils import timezone

from diagnostics.constants import (
    DIAGNOSTIC_QUESTION_COUNT,
    DIAGNOSTIC_STATUS_CHOICES,
    DIAGNOSTIC_STATUS_COMPLETED,
    DIAGNOSTIC_STATUS_IN_PROGRESS,
)


class DiagnosticAttempt(models.Model):
    """One diagnostic assessment attempt for a student."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="diagnostic_attempts",
    )
    status = models.CharField(
        max_length=32,
        choices=DIAGNOSTIC_STATUS_CHOICES,
        default=DIAGNOSTIC_STATUS_IN_PROGRESS,
        db_index=True,
    )
    started_at = models.DateTimeField(default=timezone.now)
    completed_at = models.DateTimeField(null=True, blank=True)
    # Expected size for this attempt (contract V1 = 100). Stored so history
    # remains interpretable if the constant changes later.
    total_questions = models.PositiveSmallIntegerField(
        default=DIAGNOSTIC_QUESTION_COUNT,
        validators=[MinValueValidator(1)],
    )
    # Populated by the future complete/scoring task — nullable until then.
    overall_score_pct = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[
            MinValueValidator(Decimal("0")),
            MaxValueValidator(Decimal("100")),
        ],
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-started_at"]
        indexes = [
            models.Index(
                fields=["student", "-started_at"],
                name="diag_att_student_started_idx",
            ),
            models.Index(
                fields=["student", "status"],
                name="diag_att_student_status_idx",
            ),
        ]
        constraints = [
            models.CheckConstraint(
                check=Q(status__in=[
                    DIAGNOSTIC_STATUS_IN_PROGRESS,
                    DIAGNOSTIC_STATUS_COMPLETED,
                ]),
                name="diag_att_status_valid",
            ),
            models.CheckConstraint(
                check=(
                    Q(
                        status=DIAGNOSTIC_STATUS_COMPLETED,
                        completed_at__isnull=False,
                    )
                    | Q(
                        status=DIAGNOSTIC_STATUS_IN_PROGRESS,
                        completed_at__isnull=True,
                    )
                ),
                name="diag_att_status_ts_consistent",
            ),
            models.CheckConstraint(
                check=(
                    Q(status=DIAGNOSTIC_STATUS_IN_PROGRESS, overall_score_pct__isnull=True)
                    | Q(status=DIAGNOSTIC_STATUS_COMPLETED)
                ),
                name="diag_att_score_null_in_prog",
            ),
            models.UniqueConstraint(
                fields=["student"],
                condition=Q(status=DIAGNOSTIC_STATUS_IN_PROGRESS),
                name="uniq_diag_one_in_progress",
            ),
        ]

    def __str__(self):
        return f"DiagnosticAttempt {self.id} ({self.status})"

    def clean(self):
        super().clean()
        errors = {}
        if self.status == DIAGNOSTIC_STATUS_COMPLETED and self.completed_at is None:
            errors["completed_at"] = "Completed attempts require completed_at."
        if self.status == DIAGNOSTIC_STATUS_IN_PROGRESS and self.completed_at is not None:
            errors["completed_at"] = "In-progress attempts cannot have completed_at."
        if (
            self.status == DIAGNOSTIC_STATUS_IN_PROGRESS
            and self.overall_score_pct is not None
        ):
            errors["overall_score_pct"] = (
                "Score is only allowed on completed attempts."
            )
        if (
            self.completed_at is not None
            and self.started_at is not None
            and self.completed_at < self.started_at
        ):
            errors["completed_at"] = "completed_at cannot be before started_at."
        if errors:
            raise ValidationError(errors)

    def save(self, *args, validate=True, **kwargs):
        if validate:
            self.full_clean()
        return super().save(*args, **kwargs)


class DiagnosticQuestion(models.Model):
    """A question assigned to a diagnostic attempt at a fixed position."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    attempt = models.ForeignKey(
        DiagnosticAttempt,
        on_delete=models.CASCADE,
        related_name="diagnostic_questions",
    )
    question = models.ForeignKey(
        "questions.Question",
        on_delete=models.PROTECT,
        related_name="diagnostic_appearances",
    )
    position = models.PositiveIntegerField(
        validators=[MinValueValidator(1)],
        help_text="1-based order within the attempt.",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["attempt", "position"]
        constraints = [
            models.UniqueConstraint(
                fields=["attempt", "position"],
                name="uniq_diag_q_attempt_pos",
            ),
            models.UniqueConstraint(
                fields=["attempt", "question"],
                name="uniq_diag_q_attempt_question",
            ),
        ]
        indexes = [
            models.Index(
                fields=["attempt", "position"],
                name="diag_q_attempt_pos_idx",
            ),
        ]

    def __str__(self):
        return f"DiagQ pos={self.position} attempt={self.attempt_id}"

    def clean(self):
        super().clean()
        if self.position is not None and self.position < 1:
            raise ValidationError({"position": "Position must be >= 1."})

    def save(self, *args, validate=True, **kwargs):
        if validate:
            self.full_clean()
        return super().save(*args, **kwargs)


class DiagnosticAnswer(models.Model):
    """Student response for one assigned diagnostic question.

    Unanswered questions keep ``selected_option`` null until answered or until
    completion scoring treats null as incorrect (future task).
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    diagnostic_question = models.OneToOneField(
        DiagnosticQuestion,
        on_delete=models.CASCADE,
        related_name="answer",
    )
    selected_option = models.ForeignKey(
        "questions.QuestionOption",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="diagnostic_answer_selections",
    )
    time_spent_seconds = models.PositiveIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
    )
    answered_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(
                fields=["answered_at"],
                name="diag_ans_answered_at_idx",
            ),
        ]
        constraints = [
            models.CheckConstraint(
                check=Q(time_spent_seconds__isnull=True)
                | Q(time_spent_seconds__gte=0),
                name="diag_ans_time_null_or_ge0",
            ),
        ]

    def __str__(self):
        return f"DiagAnswer for {self.diagnostic_question_id}"

    def clean(self):
        super().clean()
        errors = {}
        if self.selected_option_id and self.diagnostic_question_id:
            dq = self.diagnostic_question
            if self.selected_option.question_id != dq.question_id:
                errors["selected_option"] = (
                    "Selected option must belong to the assigned question."
                )
        if self.selected_option_id and self.answered_at is None:
            # Application convention: answering sets answered_at.
            errors["answered_at"] = (
                "answered_at is required when selected_option is set."
            )
        if self.answered_at is not None and self.selected_option_id is None:
            errors["selected_option"] = (
                "selected_option is required when answered_at is set."
            )
        if errors:
            raise ValidationError(errors)

    def save(self, *args, validate=True, **kwargs):
        if validate:
            self.full_clean()
        return super().save(*args, **kwargs)
