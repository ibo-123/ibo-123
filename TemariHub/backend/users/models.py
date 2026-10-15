import uuid

from django.conf import settings
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from django.db.models import Q
from django.utils import timezone

from users.managers import UserManager
from users.phone import normalize_ethiopian_phone, validate_ethiopian_phone_number


class Stream(models.TextChoices):
    NATURAL_SCIENCE = "natural_science", "Natural science"
    SOCIAL_SCIENCE = "social_science", "Social science"


GRADE_CHOICES = [(grade, f"Grade {grade}") for grade in (9, 10, 11, 12)]


class OnboardingStatus(models.TextChoices):
    NOT_STARTED = "NOT_STARTED", "Not started"
    IN_PROGRESS = "IN_PROGRESS", "In progress"
    COMPLETED = "COMPLETED", "Completed"


class LearningGoal(models.TextChoices):
    """Catalog of onboarding learning goals. Extend by adding new members."""

    ENTRANCE_EXAM_PREP = "entrance_exam_prep", "Prepare for the entrance exam"
    IMPROVE_WEAK_SUBJECTS = "improve_weak_subjects", "Improve weak subjects"
    BUILD_STUDY_HABIT = "build_study_habit", "Build a consistent study habit"
    CATCH_UP = "catch_up", "Catch up on missed topics"
    EXPLORE_INTERESTS = "explore_interests", "Explore subject interests"


class User(AbstractBaseUser, PermissionsMixin):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    phone_number = models.CharField(
        max_length=20,
        unique=True,
        null=True,
        blank=True,
        validators=[validate_ethiopian_phone_number],
    )

    email = models.EmailField(
        unique=True,
        null=True,
        blank=True,
    )

    first_name = models.CharField(
        max_length=100,
        blank=True,
    )
    objects = UserManager()

    last_name = models.CharField(
        max_length=100,
        blank=True,
    )

    grade = models.PositiveSmallIntegerField(
        choices=GRADE_CHOICES,
        null=True,
        blank=True,
    )
    stream = models.CharField(
        max_length=32,
        choices=Stream.choices,
        null=True,
        blank=True,
    )

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    phone_verified_at = models.DateTimeField(null=True, blank=True)
    onboarded_at = models.DateTimeField(null=True, blank=True)

    date_joined = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = "phone_number"

    REQUIRED_FIELDS = []

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    @property
    def phone_verified(self):
        return bool(self.phone_number) and self.phone_verified_at is not None

    @property
    def onboarded(self):
        return self.onboarded_at is not None

    @property
    def two_factor_enabled(self):
        device = getattr(self, "two_factor_device", None)
        return device is not None and device.is_enabled

    def save(self, *args, **kwargs):
        if self.phone_number:
            self.phone_number = normalize_ethiopian_phone(self.phone_number)
        else:
            self.phone_number = None
        super().save(*args, **kwargs)

    def __str__(self):
        return self.phone_number or self.email or str(self.id)


class StudentProfile(models.Model):
    """Extended student profile fields that do not belong on the auth User.

    Personal identity (name, phone, verification) and core academic track
    (grade, stream) remain on ``User`` so existing authentication stays intact.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="student_profile",
    )
    school = models.CharField(max_length=200, blank=True, default="")
    city = models.CharField(max_length=120, blank=True, default="")
    # Controlled preference keys are validated in users.preferences.
    # Example: {"daily_study_minutes": 45, "study_frequency": "daily", "preferred_difficulty": 3}.
    preferences = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Profile for {self.user_id}"


class StudentOnboarding(models.Model):
    """Tracks onboarding progress for a student account."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="student_onboarding",
    )
    status = models.CharField(
        max_length=20,
        choices=OnboardingStatus.choices,
        default=OnboardingStatus.NOT_STARTED,
    )
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status"], name="stud_onboard_status_idx"),
        ]
        constraints = [
            models.CheckConstraint(
                check=(
                    (
                        Q(status=OnboardingStatus.COMPLETED)
                        & Q(completed_at__isnull=False)
                    )
                    | (
                        ~Q(status=OnboardingStatus.COMPLETED)
                        & Q(completed_at__isnull=True)
                    )
                ),
                name="onboarding_completed_at_matches_status",
            ),
        ]

    def __str__(self):
        return f"Onboarding {self.status} for {self.user_id}"


class StudentSelectedSubject(models.Model):
    """Subjects a student chose during (or after) onboarding.

    References ``curriculum.Subject`` so curriculum names/slugs are never
    duplicated on the student side.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="selected_subjects",
    )
    subject = models.ForeignKey(
        "curriculum.Subject",
        on_delete=models.CASCADE,
        related_name="student_selections",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "subject"],
                name="uniq_student_selected_subject",
            ),
        ]
        indexes = [
            models.Index(fields=["user", "created_at"], name="stud_sel_subj_user_idx"),
        ]

    def __str__(self):
        return f"{self.user_id} → {self.subject_id}"


class StudentLearningGoal(models.Model):
    """A learning goal selected by a student. Goals are enum-backed for now."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="learning_goals",
    )
    goal = models.CharField(max_length=64, choices=LearningGoal.choices)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "goal"],
                name="uniq_student_learning_goal",
            ),
        ]
        indexes = [
            models.Index(fields=["user"], name="stud_learning_goal_user_idx"),
        ]

    def __str__(self):
        return f"{self.user_id}: {self.goal}"
