import uuid

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.db.models import Q
from django.utils import timezone

from questions.constants import (
    DIFFICULTY_MAX,
    DIFFICULTY_MIN,
    EXAM_YEAR_MAX,
    EXAM_YEAR_MIN,
    MIN_OPTIONS_FOR_PUBLISH,
    QUESTION_STATUS_CHOICES,
    QUESTION_STATUS_DRAFT,
    QUESTION_STATUS_PUBLISHED,
    QUESTION_TYPE_CHOICES,
    QUESTION_TYPE_MCQ_SINGLE,
)


class Question(models.Model):
    """Authoritative question-bank entry (V1 single-correct MCQ).

    Curriculum associations
    -----------------------
    ``topic`` and ``concept`` are required. ``concept`` must belong to
    ``topic`` (enforced in ``clean``). Subject and unit are derived from
    ``topic.unit.subject`` / ``topic.unit`` — never stored separately.

    Correct answer
    --------------
    ``correct_option`` is the single authoritative answer. It must reference a
    ``QuestionOption`` owned by this question. Options do not store
    ``is_correct`` — correctness is never a client-controlled per-option flag.

    Cross-table publication rules (option count + correct_option ownership +
    active curriculum) cannot be expressed as a single PostgreSQL CHECK; they
    are enforced in ``clean()`` / ``save()`` and Django Admin ``save_related``.

    Answer secrecy
    --------------
    ``explanation`` and ``correct_option`` are privileged. Student serializers
    (later tasks) must never expose them before the permitted lifecycle stage.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    prompt = models.TextField()
    question_type = models.CharField(
        max_length=32,
        choices=QUESTION_TYPE_CHOICES,
        default=QUESTION_TYPE_MCQ_SINGLE,
    )
    status = models.CharField(
        max_length=16,
        choices=QUESTION_STATUS_CHOICES,
        default=QUESTION_STATUS_DRAFT,
        db_index=True,
    )
    topic = models.ForeignKey(
        "curriculum.Topic",
        on_delete=models.PROTECT,
        related_name="questions",
    )
    concept = models.ForeignKey(
        "curriculum.Concept",
        on_delete=models.PROTECT,
        related_name="questions",
    )
    difficulty = models.PositiveSmallIntegerField(
        validators=[
            MinValueValidator(DIFFICULTY_MIN),
            MaxValueValidator(DIFFICULTY_MAX),
        ],
    )
    estimated_time_seconds = models.PositiveIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1)],
    )
    source = models.CharField(max_length=255, blank=True, default="")
    exam_year = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        validators=[
            MinValueValidator(EXAM_YEAR_MIN),
            MaxValueValidator(EXAM_YEAR_MAX),
        ],
    )
    # Privileged feedback — not public question content.
    explanation = models.TextField(blank=True, default="")
    correct_option = models.ForeignKey(
        "questions.QuestionOption",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+",
        help_text="Authoritative single correct choice for this MCQ.",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_questions",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(
                fields=["status", "difficulty"],
                name="q_status_difficulty_idx",
            ),
            models.Index(
                fields=["topic", "status"],
                name="q_topic_status_idx",
            ),
            models.Index(
                fields=["concept", "status"],
                name="q_concept_status_idx",
            ),
            models.Index(
                fields=["exam_year", "status"],
                name="q_exam_year_status_idx",
            ),
            models.Index(
                fields=["source", "status"],
                name="q_source_status_idx",
            ),
        ]
        constraints = [
            models.CheckConstraint(
                check=Q(difficulty__gte=DIFFICULTY_MIN)
                & Q(difficulty__lte=DIFFICULTY_MAX),
                name="q_difficulty_range_1_5",
            ),
            models.CheckConstraint(
                check=Q(estimated_time_seconds__isnull=True)
                | Q(estimated_time_seconds__gte=1),
                name="q_estimated_time_null_or_positive",
            ),
            models.CheckConstraint(
                check=Q(exam_year__isnull=True)
                | (
                    Q(exam_year__gte=EXAM_YEAR_MIN) & Q(exam_year__lte=EXAM_YEAR_MAX)
                ),
                name="q_exam_year_null_or_bounded",
            ),
            models.CheckConstraint(
                check=Q(status__in=[QUESTION_STATUS_DRAFT, QUESTION_STATUS_PUBLISHED]),
                name="q_status_draft_or_published",
            ),
            models.CheckConstraint(
                check=Q(question_type=QUESTION_TYPE_MCQ_SINGLE),
                name="q_type_mcq_single_only",
            ),
        ]

    def __str__(self):
        return f"Question {self.id} ({self.status})"

    @property
    def subject(self):
        return self.topic.unit.subject

    @property
    def unit(self):
        return self.topic.unit

    def options_in_order(self):
        """Return options in deterministic display order (fresh queryset)."""
        # Avoid stale prefetch caches after nested option writes in the same request.
        return QuestionOption.objects.filter(question_id=self.pk).order_by(
            "sort_order", "id"
        )

    def clean(self):
        super().clean()
        errors = {}

        if self.prompt is None or not str(self.prompt).strip():
            errors["prompt"] = "Prompt cannot be blank."

        if self.source is not None:
            self.source = str(self.source).strip()

        if self.exam_year is not None:
            max_allowed = timezone.now().year + 1
            if self.exam_year > max_allowed:
                errors["exam_year"] = (
                    f"Exam year cannot be after {max_allowed}."
                )
            if self.exam_year < EXAM_YEAR_MIN:
                errors["exam_year"] = (
                    f"Exam year must be {EXAM_YEAR_MIN} or later."
                )

        if (
            self.estimated_time_seconds is not None
            and self.estimated_time_seconds < 1
        ):
            errors["estimated_time_seconds"] = (
                "Estimated solving time must be at least 1 second when set."
            )

        if self.concept_id and self.topic_id and self.concept.topic_id != self.topic_id:
            errors["concept"] = (
                "Concept must belong to the selected topic "
                f"(concept topic={self.concept.topic_id}, "
                f"question topic={self.topic_id})."
            )

        if self.question_type != QUESTION_TYPE_MCQ_SINGLE:
            errors["question_type"] = (
                "V1 supports only single-correct multiple-choice "
                f"({QUESTION_TYPE_MCQ_SINGLE})."
            )

        if self.correct_option_id:
            correct = self.correct_option
            if correct.question_id != self.id:
                errors["correct_option"] = (
                    "Correct option must belong to this question."
                )

        # Admin form validation sets ``_skip_publication_validation`` so inline
        # options can be saved before publication rules run in save_related.
        if (
            self.status == QUESTION_STATUS_PUBLISHED
            and not getattr(self, "_skip_publication_validation", False)
        ):
            pub_errors = self._publication_errors()
            errors.update(pub_errors)

        if errors:
            raise ValidationError(errors)

    def _publication_errors(self) -> dict:
        """Validate publish-ready invariants (application-layer cross-table)."""
        errors = {}
        if not self.pk:
            errors["status"] = (
                "A question must be saved as a draft with options before "
                "it can be published."
            )
            return errors

        if self.prompt is None or not str(self.prompt).strip():
            errors["prompt"] = "Published questions require a non-empty prompt."

        if self.topic_id:
            topic = self.topic
            if not topic.is_active:
                errors["topic"] = "Cannot publish a question on an inactive topic."
            elif not topic.unit.is_active:
                errors["topic"] = "Cannot publish a question under an inactive unit."
            elif not topic.unit.subject.is_active:
                errors["topic"] = (
                    "Cannot publish a question under an inactive subject."
                )

        if self.concept_id and not self.concept.is_active:
            errors["concept"] = "Cannot publish a question on an inactive concept."

        # Count via table query — prefetch caches can be stale after nested writes.
        option_count = QuestionOption.objects.filter(question_id=self.pk).count()
        if option_count != MIN_OPTIONS_FOR_PUBLISH:
            errors["status"] = (
                f"Published questions require exactly {MIN_OPTIONS_FOR_PUBLISH} "
                f"options (found {option_count})."
            )

        if not self.correct_option_id:
            errors["correct_option"] = (
                "Published questions require a correct option."
            )
        elif self.correct_option.question_id != self.id:
            errors["correct_option"] = (
                "Correct option must belong to this question."
            )

        return errors

    def save(self, *args, validate=True, **kwargs):
        """Persist the question.

        ``validate=True`` (default) runs ``full_clean`` including publication
        rules when ``status=published``. Pass ``validate=False`` only for
        internal bookkeeping updates (e.g. clearing ``correct_option`` before
        deleting an option on a draft).
        """
        if self.prompt is not None:
            self.prompt = str(self.prompt).strip()
        if self.source is not None:
            self.source = str(self.source).strip()
        if validate:
            self.full_clean()
        return super().save(*args, **kwargs)


class QuestionOption(models.Model):
    """A single MCQ choice belonging to one question.

    Correctness is **not** stored on the option. The parent question's
    ``correct_option`` FK is the sole authoritative answer pointer.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    question = models.ForeignKey(
        Question,
        on_delete=models.CASCADE,
        related_name="options",
    )
    text = models.CharField(max_length=500)
    sort_order = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["sort_order", "id"]
        indexes = [
            models.Index(
                fields=["question", "sort_order"],
                name="qopt_question_sort_idx",
            ),
        ]
        constraints = [
            models.CheckConstraint(
                check=~Q(text=""),
                name="qopt_text_not_empty",
            ),
        ]

    def __str__(self):
        label = self.text if len(self.text) <= 40 else f"{self.text[:37]}..."
        return f"{label} ({self.question_id})"

    def clean(self):
        super().clean()
        if self.text is None or not str(self.text).strip():
            raise ValidationError({"text": "Option text cannot be blank."})

    def save(self, *args, validate=True, **kwargs):
        if self.text is not None:
            self.text = str(self.text).strip()
        if validate:
            self.full_clean()
        return super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        """Keep published questions at exactly four valid options.

        - Published question: deleting any option is rejected (would break the
          four-option publish invariant, and deleting the correct option would
          also null the answer via ``SET_NULL``).
        - Draft question: if this option is the correct answer, clear
          ``correct_option`` first, then delete.
        """
        question = self.question
        if question.status == QUESTION_STATUS_PUBLISHED:
            raise ValidationError(
                "Cannot delete options from a published question. "
                "Unpublish the question before changing its options."
            )
        if question.correct_option_id == self.pk:
            question.correct_option = None
            question.save(validate=False, update_fields=["correct_option", "updated_at"])
        return super().delete(*args, **kwargs)
