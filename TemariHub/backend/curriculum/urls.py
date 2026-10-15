from django.urls import path

from curriculum.views import (
    SubjectListView,
    SubjectUnitListView,
    TopicDetailView,
    UnitTopicListView,
)

urlpatterns = [
    path("subjects/", SubjectListView.as_view(), name="curriculum-subjects"),
    path(
        "subjects/<uuid:subject_id>/units/",
        SubjectUnitListView.as_view(),
        name="curriculum-subject-units",
    ),
    path(
        "units/<uuid:unit_id>/topics/",
        UnitTopicListView.as_view(),
        name="curriculum-unit-topics",
    ),
    path(
        "topics/<uuid:topic_id>/",
        TopicDetailView.as_view(),
        name="curriculum-topic-detail",
    ),
]
