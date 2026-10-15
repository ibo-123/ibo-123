from django.contrib import admin

from diagnostics.models import DiagnosticAnswer, DiagnosticAttempt, DiagnosticQuestion


class DiagnosticQuestionInline(admin.TabularInline):
    model = DiagnosticQuestion
    extra = 0
    fields = ("id", "position", "question", "created_at")
    readonly_fields = ("id", "created_at")
    raw_id_fields = ("question",)
    ordering = ("position",)
    show_change_link = True


class DiagnosticAnswerInline(admin.StackedInline):
    model = DiagnosticAnswer
    extra = 0
    max_num = 1
    fields = (
        "id",
        "selected_option",
        "time_spent_seconds",
        "answered_at",
        "created_at",
        "updated_at",
    )
    readonly_fields = ("id", "created_at", "updated_at")
    raw_id_fields = ("selected_option",)
    can_delete = False


@admin.register(DiagnosticAttempt)
class DiagnosticAttemptAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "student",
        "status",
        "started_at",
        "completed_at",
        "total_questions",
        "overall_score_pct",
    )
    list_filter = ("status",)
    search_fields = (
        "id",
        "student__phone_number",
        "student__email",
    )
    readonly_fields = ("id", "created_at", "updated_at")
    raw_id_fields = ("student",)
    inlines = [DiagnosticQuestionInline]
    ordering = ("-started_at",)


@admin.register(DiagnosticQuestion)
class DiagnosticQuestionAdmin(admin.ModelAdmin):
    list_display = ("id", "attempt", "position", "question", "created_at")
    list_filter = ("attempt__status",)
    search_fields = ("id", "attempt__id", "question__id", "question__prompt")
    readonly_fields = ("id", "created_at")
    raw_id_fields = ("attempt", "question")
    inlines = [DiagnosticAnswerInline]
    ordering = ("attempt", "position")


@admin.register(DiagnosticAnswer)
class DiagnosticAnswerAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "diagnostic_question",
        "selected_option",
        "time_spent_seconds",
        "answered_at",
        "updated_at",
    )
    search_fields = (
        "id",
        "diagnostic_question__id",
        "diagnostic_question__attempt__id",
    )
    readonly_fields = ("id", "created_at", "updated_at")
    raw_id_fields = ("diagnostic_question", "selected_option")
    ordering = ("-updated_at",)
