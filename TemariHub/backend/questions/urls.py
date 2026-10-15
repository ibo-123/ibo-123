from django.urls import path

from questions.views import QuestionDetailView, QuestionListCreateView

urlpatterns = [
    path(
        "",
        QuestionListCreateView.as_view(),
        name="question-list-create",
    ),
    path(
        "<uuid:question_id>/",
        QuestionDetailView.as_view(),
        name="question-detail",
    ),
]
