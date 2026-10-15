from django.contrib import admin

from learning_path.models import LearningPath, LearningPathItem


class LearningPathItemInline(admin.TabularInline):
    model = LearningPathItem
    extra = 0
    fields = ("topic", "status", "sort_order", "priority", "reason")
    readonly_fields = ("topic", "sort_order", "priority", "reason")
    show_change_link = True


@admin.register(LearningPath)
class LearningPathAdmin(admin.ModelAdmin):
    list_display = ("user", "title", "generated_at", "updated_at")
    search_fields = ("user__phone_number", "user__email", "title")
    readonly_fields = ("id", "user", "generated_at", "created_at", "updated_at")
    inlines = [LearningPathItemInline]


@admin.register(LearningPathItem)
class LearningPathItemAdmin(admin.ModelAdmin):
    list_display = (
        "learning_path",
        "topic",
        "status",
        "sort_order",
        "priority",
        "updated_at",
    )
    list_filter = ("status",)
    search_fields = ("topic__name", "learning_path__user__phone_number")
    readonly_fields = (
        "id",
        "learning_path",
        "topic",
        "created_at",
        "updated_at",
    )
