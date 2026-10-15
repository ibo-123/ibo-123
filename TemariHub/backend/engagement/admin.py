from django.contrib import admin

from engagement.models import LearningActivityEvent


@admin.register(LearningActivityEvent)
class LearningActivityEventAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "activity_type",
        "title",
        "status",
        "activity_date",
        "occurred_at",
    )
    list_filter = ("activity_type", "status", "activity_date")
    search_fields = ("user__phone_number", "title", "topic__name")
    readonly_fields = (
        "id",
        "user",
        "topic",
        "activity_type",
        "title",
        "status",
        "occurred_at",
        "activity_date",
        "created_at",
    )
    ordering = ("-occurred_at",)

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
