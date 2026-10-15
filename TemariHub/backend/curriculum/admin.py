from django.contrib import admin

from curriculum.models import Concept, Subject, Topic, Unit


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "slug",
        "grade",
        "stream",
        "is_active",
        "sort_order",
        "updated_at",
    )
    list_filter = ("grade", "stream", "is_active")
    search_fields = ("name", "slug")
    ordering = ("grade", "sort_order", "name")
    prepopulated_fields = {"slug": ("name",)}


class TopicInline(admin.TabularInline):
    model = Topic
    extra = 0
    fields = ("name", "slug", "sort_order", "is_active", "estimated_study_minutes")
    prepopulated_fields = {"slug": ("name",)}


class ConceptInline(admin.TabularInline):
    model = Concept
    extra = 0
    fields = ("name", "slug", "sort_order", "is_active")
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Unit)
class UnitAdmin(admin.ModelAdmin):
    list_display = ("name", "subject", "sort_order", "is_active", "updated_at")
    list_filter = ("is_active", "subject__grade", "subject__stream")
    search_fields = ("name", "slug", "subject__name")
    autocomplete_fields = ("subject",)
    prepopulated_fields = {"slug": ("name",)}
    inlines = [TopicInline]


@admin.register(Topic)
class TopicAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "unit",
        "sort_order",
        "is_active",
        "estimated_study_minutes",
        "updated_at",
    )
    list_filter = ("is_active", "unit__subject__grade")
    search_fields = ("name", "slug", "unit__name", "unit__subject__name")
    autocomplete_fields = ("unit",)
    prepopulated_fields = {"slug": ("name",)}
    inlines = [ConceptInline]


@admin.register(Concept)
class ConceptAdmin(admin.ModelAdmin):
    list_display = ("name", "topic", "sort_order", "is_active", "updated_at")
    list_filter = ("is_active", "topic__unit__subject__grade")
    search_fields = ("name", "slug", "topic__name", "topic__unit__subject__name")
    autocomplete_fields = ("topic",)
    prepopulated_fields = {"slug": ("name",)}
