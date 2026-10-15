from django import forms
from django.contrib import admin
from django.core.exceptions import ValidationError

from questions.constants import QUESTION_STATUS_DRAFT, QUESTION_STATUS_PUBLISHED
from questions.models import Question, QuestionOption


class QuestionOptionInline(admin.TabularInline):
    model = QuestionOption
    extra = 4
    fields = ("text", "sort_order", "id")
    readonly_fields = ("id",)
    ordering = ("sort_order", "id")
    show_change_link = True


class QuestionAdminForm(forms.ModelForm):
    class Meta:
        model = Question
        fields = "__all__"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Limit correct-option choices to this question's options (empty on add).
        if self.instance and self.instance.pk:
            self.fields["correct_option"].queryset = self.instance.options.order_by(
                "sort_order", "id"
            )
        else:
            self.fields["correct_option"].queryset = QuestionOption.objects.none()
            self.fields["correct_option"].help_text = (
                "Save the draft with options first, then select the correct "
                "option and publish."
            )

    def _post_clean(self):
        """Defer publication invariants until Admin ``save_related``.

        Inline options are not persisted until after the parent form validates.
        ``construct_instance`` would set ``status=published`` before options
        exist, so we skip publication checks here and re-validate in
        ``QuestionAdmin.save_related``.
        """
        self.instance._skip_publication_validation = True
        try:
            super()._post_clean()
        finally:
            self.instance._skip_publication_validation = False


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    form = QuestionAdminForm
    list_display = (
        "id",
        "short_prompt",
        "status",
        "difficulty",
        "topic",
        "concept",
        "correct_option",
        "exam_year",
        "updated_at",
    )
    list_filter = ("status", "difficulty", "exam_year", "question_type")
    search_fields = (
        "prompt",
        "source",
        "explanation",
        "topic__name",
        "concept__name",
        "topic__unit__subject__name",
    )
    autocomplete_fields = ("topic", "concept", "created_by")
    readonly_fields = ("id", "created_at", "updated_at")
    ordering = ("-created_at",)
    inlines = [QuestionOptionInline]
    fieldsets = (
        (
            None,
            {
                "fields": (
                    "id",
                    "prompt",
                    "question_type",
                    "status",
                    "difficulty",
                    "estimated_time_seconds",
                    "source",
                    "exam_year",
                )
            },
        ),
        (
            "Curriculum",
            {"fields": ("topic", "concept")},
        ),
        (
            "Answer (privileged)",
            {
                "fields": ("correct_option", "explanation"),
                "description": (
                    "Correct option and explanation are never exposed to "
                    "students until after a completed diagnostic."
                ),
            },
        ),
        (
            "Meta",
            {"fields": ("created_by", "created_at", "updated_at")},
        ),
    )

    def save_model(self, request, obj, form, change):
        """Persist parent as draft first when publishing so inlines can land."""
        self._intended_status = form.cleaned_data.get("status", obj.status)
        if self._intended_status == QUESTION_STATUS_PUBLISHED:
            obj.status = QUESTION_STATUS_DRAFT
        obj.save()

    def save_related(self, request, form, formsets, change):
        super().save_related(request, form, formsets, change)
        obj = form.instance
        intended = getattr(self, "_intended_status", obj.status)
        correct = form.cleaned_data.get("correct_option")
        if correct is not None:
            obj.correct_option = correct
        elif "correct_option" in form.cleaned_data:
            obj.correct_option = None
        obj.status = intended
        try:
            obj.full_clean()
        except ValidationError as exc:
            obj.status = QUESTION_STATUS_DRAFT
            obj.save(
                validate=False,
                update_fields=["status", "correct_option", "updated_at"],
            )
            raise ValidationError(
                exc.message_dict if hasattr(exc, "message_dict") else exc
            ) from exc
        obj.save()

    @admin.display(description="Prompt")
    def short_prompt(self, obj):
        text = obj.prompt or ""
        return text if len(text) <= 72 else f"{text[:69]}..."


@admin.register(QuestionOption)
class QuestionOptionAdmin(admin.ModelAdmin):
    list_display = ("id", "short_text", "question", "sort_order", "updated_at")
    list_filter = ("question__status",)
    search_fields = ("text", "question__prompt", "question__id")
    autocomplete_fields = ("question",)
    readonly_fields = ("id", "created_at", "updated_at")
    ordering = ("question", "sort_order", "id")

    @admin.display(description="Text")
    def short_text(self, obj):
        text = obj.text or ""
        return text if len(text) <= 72 else f"{text[:69]}..."
