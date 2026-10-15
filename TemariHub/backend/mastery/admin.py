from django.contrib import admin

from mastery.models import TopicMastery


@admin.register(TopicMastery)
class TopicMasteryAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "topic",
        "mastery_score",
        "questions_attempted",
        "accuracy_pct",
        "algorithm_version",
        "updated_at",
    )
    list_filter = ("algorithm_version",)
    search_fields = (
        "user__phone_number",
        "user__email",
        "topic__name",
        "topic__slug",
    )
    readonly_fields = ("id", "created_at", "updated_at")
    raw_id_fields = ("user", "topic")
