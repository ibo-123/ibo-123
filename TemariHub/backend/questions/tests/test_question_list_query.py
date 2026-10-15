"""Filter, search, ordering, and pagination for GET /api/v1/questions/."""

import uuid

from django.utils import timezone
from rest_framework_simplejwt.tokens import RefreshToken

from authentication.tests.base import AuthAPITestCase
from curriculum.models import Concept, Subject, Topic, Unit
from questions.constants import (
    MIN_OPTIONS_FOR_PUBLISH,
    QUESTION_STATUS_DRAFT,
    QUESTION_STATUS_PUBLISHED,
    QUESTION_TYPE_MCQ_SINGLE,
)
from questions.query import ORDERING_ALLOWLIST, SEARCH_MAX_LENGTH
from questions.services import create_question
from users.models import User

FORBIDDEN_ANSWER_KEYS = {
    "correct_option",
    "correct_option_id",
    "correct_option_index",
    "is_correct",
    "explanation",
}


def _collect_keys(payload):
    keys = set()
    if isinstance(payload, dict):
        keys.update(payload.keys())
        for value in payload.values():
            keys.update(_collect_keys(value))
    elif isinstance(payload, list):
        for item in payload:
            keys.update(_collect_keys(item))
    return keys


class QuestionListQueryTests(AuthAPITestCase):
    URL = "/api/v1/questions/"

    def setUp(self):
        super().setUp()
        self.staff = User.objects.create_user(
            "0912347301",
            password="Str0ng-Entrance-2026",
            phone_verified_at=timezone.now(),
            is_staff=True,
        )
        self.student = User.objects.create_user(
            "0912347302",
            password="Str0ng-Entrance-2026",
            phone_verified_at=timezone.now(),
            is_staff=False,
        )

        self.subject = Subject.objects.create(
            name="Mathematics",
            slug="mathematics",
            grade=12,
            stream=None,
            sort_order=1,
        )
        self.other_subject = Subject.objects.create(
            name="Physics",
            slug="physics",
            grade=12,
            stream=None,
            sort_order=2,
        )
        self.unit = Unit.objects.create(
            subject=self.subject, name="Algebra", slug="algebra", sort_order=1
        )
        self.other_unit = Unit.objects.create(
            subject=self.other_subject,
            name="Mechanics",
            slug="mechanics",
            sort_order=1,
        )
        self.topic = Topic.objects.create(
            unit=self.unit,
            name="Quadratic Equations",
            slug="quadratic-equations",
            sort_order=1,
        )
        self.other_topic = Topic.objects.create(
            unit=self.other_unit,
            name="Kinematics",
            slug="kinematics",
            sort_order=1,
        )
        self.concept = Concept.objects.create(
            topic=self.topic,
            name="Discriminant",
            slug="discriminant",
            sort_order=1,
        )
        self.other_concept = Concept.objects.create(
            topic=self.other_topic,
            name="Velocity",
            slug="velocity",
            sort_order=1,
        )

        self.q_easy = self._publish(
            prompt="Easy algebra question about roots",
            difficulty=1,
            exam_year=2023,
            source="Workbook A",
            explanation="SECRET easy",
        )
        self.q_hard = self._publish(
            prompt="Hard algebra question about graphs",
            difficulty=5,
            exam_year=2024,
            source="Entrance Exam",
            explanation="SECRET hard",
        )
        self.q_physics = self._publish(
            prompt="Physics motion question",
            difficulty=3,
            exam_year=2024,
            source="Entrance Exam",
            topic=self.other_topic,
            concept=self.other_concept,
            explanation="SECRET physics",
        )
        self.draft = create_question(
            data={
                "prompt": "Draft should stay hidden from students",
                "topic_id": self.topic.id,
                "concept_id": self.concept.id,
                "difficulty": 2,
                "status": QUESTION_STATUS_DRAFT,
                "source": "Hidden Draft Source",
                "exam_year": 2020,
            },
            created_by=self.staff,
        )
        self._auth(self.student)

    def _auth(self, user):
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {RefreshToken.for_user(user).access_token}"
        )

    def _four_options(self):
        return [
            {"text": f"Choice {i}", "sort_order": i}
            for i in range(MIN_OPTIONS_FOR_PUBLISH)
        ]

    def _publish(self, *, prompt, difficulty, topic=None, concept=None, **extra):
        topic = topic or self.topic
        concept = concept or self.concept
        return create_question(
            data={
                "prompt": prompt,
                "topic_id": topic.id,
                "concept_id": concept.id,
                "difficulty": difficulty,
                "status": QUESTION_STATUS_PUBLISHED,
                "options": self._four_options(),
                "correct_option_index": 0,
                **extra,
            },
            created_by=self.staff,
        )

    def _ids(self, response):
        return [item["id"] for item in response.data["data"]["items"]]

    # --- Filtering ---

    def test_filter_by_subject_unit_topic_concept(self):
        by_subject = self.client.get(self.URL, {"subject_id": str(self.subject.id)})
        self.assertEqual(by_subject.status_code, 200)
        ids = set(self._ids(by_subject))
        self.assertEqual(ids, {str(self.q_easy.id), str(self.q_hard.id)})

        by_unit = self.client.get(self.URL, {"unit_id": str(self.unit.id)})
        self.assertEqual(set(self._ids(by_unit)), ids)

        by_topic = self.client.get(self.URL, {"topic_id": str(self.topic.id)})
        self.assertEqual(set(self._ids(by_topic)), ids)

        by_concept = self.client.get(self.URL, {"concept_id": str(self.concept.id)})
        self.assertEqual(set(self._ids(by_concept)), ids)

        physics = self.client.get(
            self.URL, {"subject_id": str(self.other_subject.id)}
        )
        self.assertEqual(self._ids(physics), [str(self.q_physics.id)])

    def test_filter_by_difficulty_type_exam_year_source(self):
        hard = self.client.get(self.URL, {"difficulty": 5})
        self.assertEqual(self._ids(hard), [str(self.q_hard.id)])

        mcq = self.client.get(self.URL, {"question_type": QUESTION_TYPE_MCQ_SINGLE})
        self.assertEqual(mcq.status_code, 200)
        self.assertEqual(mcq.data["data"]["total"], 3)

        year = self.client.get(self.URL, {"exam_year": 2023})
        self.assertEqual(self._ids(year), [str(self.q_easy.id)])

        source = self.client.get(self.URL, {"source": "entrance exam"})
        self.assertEqual(source.status_code, 200)
        self.assertEqual(
            set(self._ids(source)),
            {str(self.q_hard.id), str(self.q_physics.id)},
        )

    def test_reject_invalid_filters(self):
        bad_uuid = self.client.get(self.URL, {"subject_id": "not-a-uuid"})
        self.assertEqual(bad_uuid.status_code, 400)
        self.assertIn("subject_id", bad_uuid.data["errors"])

        bad_diff = self.client.get(self.URL, {"difficulty": 9})
        self.assertEqual(bad_diff.status_code, 400)
        self.assertIn("difficulty", bad_diff.data["errors"])

        bad_type = self.client.get(self.URL, {"question_type": "essay"})
        self.assertEqual(bad_type.status_code, 400)
        self.assertIn("question_type", bad_type.data["errors"])

    def test_reject_contradictory_curriculum_filters(self):
        response = self.client.get(
            self.URL,
            {
                "subject_id": str(self.subject.id),
                "unit_id": str(self.other_unit.id),
            },
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("unit_id", response.data["errors"])

        response = self.client.get(
            self.URL,
            {
                "unit_id": str(self.unit.id),
                "topic_id": str(self.other_topic.id),
            },
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("topic_id", response.data["errors"])

        response = self.client.get(
            self.URL,
            {
                "topic_id": str(self.topic.id),
                "concept_id": str(self.other_concept.id),
            },
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("concept_id", response.data["errors"])

    def test_student_cannot_see_drafts_via_filters_or_status(self):
        listing = self.client.get(self.URL, {"difficulty": 2})
        self.assertEqual(listing.status_code, 200)
        self.assertNotIn(str(self.draft.id), self._ids(listing))
        self.assertEqual(listing.data["data"]["total"], 0)

        status_filter = self.client.get(self.URL, {"status": QUESTION_STATUS_DRAFT})
        self.assertEqual(status_filter.status_code, 400)
        self.assertIn("status", status_filter.data["errors"])
        # Ensure error does not enumerate draft content.
        blob = str(status_filter.data).lower()
        self.assertNotIn("draft should stay hidden", blob)

    def test_inactive_curriculum_excluded_even_when_filtered(self):
        self.topic.is_active = False
        self.topic.save()
        response = self.client.get(self.URL, {"topic_id": str(self.topic.id)})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["data"]["items"], [])
        self.assertEqual(response.data["data"]["total"], 0)

        self.topic.is_active = True
        self.topic.save()
        self.concept.is_active = False
        self.concept.save()
        response = self.client.get(
            self.URL, {"concept_id": str(self.concept.id)}
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["data"]["total"], 0)

    def test_staff_status_filter_works(self):
        self._auth(self.staff)
        drafts = self.client.get(self.URL, {"status": QUESTION_STATUS_DRAFT})
        self.assertEqual(drafts.status_code, 200)
        self.assertEqual(self._ids(drafts), [str(self.draft.id)])
        self.assertIn("explanation", drafts.data["data"]["items"][0])

        published = self.client.get(
            self.URL, {"status": QUESTION_STATUS_PUBLISHED}
        )
        self.assertEqual(published.data["data"]["total"], 3)

    # --- Search and ordering ---

    def test_search_prompt_and_no_answer_leak(self):
        response = self.client.get(self.URL, {"search": "  graphs  "})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(self._ids(response), [str(self.q_hard.id)])
        keys = _collect_keys(response.data)
        self.assertFalse(keys & FORBIDDEN_ANSWER_KEYS)
        self.assertNotIn("SECRET", str(response.data))

    def test_search_source_case_insensitive(self):
        response = self.client.get(self.URL, {"search": "workbook"})
        self.assertEqual(self._ids(response), [str(self.q_easy.id)])

    def test_search_rejects_excessively_long_term(self):
        response = self.client.get(
            self.URL, {"search": "x" * (SEARCH_MAX_LENGTH + 1)}
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("search", response.data["errors"])

    def test_search_no_duplicates(self):
        # Prompt and source both match the same question once.
        self.q_hard.source = "graphs workbook"
        self.q_hard.save(update_fields=["source"])
        response = self.client.get(self.URL, {"search": "graphs"})
        self.assertEqual(response.status_code, 200)
        ids = self._ids(response)
        self.assertEqual(len(ids), len(set(ids)))
        self.assertEqual(ids.count(str(self.q_hard.id)), 1)

    def test_supported_ordering_fields(self):
        for field in sorted(ORDERING_ALLOWLIST):
            response = self.client.get(self.URL, {"ordering": field})
            self.assertEqual(
                response.status_code,
                200,
                f"ordering={field} failed: {response.data}",
            )
            self.assertEqual(len(self._ids(response)), 3)

        asc = self.client.get(self.URL, {"ordering": "difficulty"})
        self.assertEqual(
            self._ids(asc),
            [str(self.q_easy.id), str(self.q_physics.id), str(self.q_hard.id)],
        )
        desc = self.client.get(self.URL, {"ordering": "-difficulty"})
        self.assertEqual(
            self._ids(desc),
            [str(self.q_hard.id), str(self.q_physics.id), str(self.q_easy.id)],
        )

    def test_unsupported_ordering_rejected(self):
        response = self.client.get(self.URL, {"ordering": "explanation"})
        self.assertEqual(response.status_code, 400)
        self.assertIn("ordering", response.data["errors"])

        response = self.client.get(self.URL, {"ordering": "topic__name"})
        self.assertEqual(response.status_code, 400)

    def test_stable_ordering_on_ties(self):
        # Same difficulty → secondary order by id.
        twin = self._publish(
            prompt="Another medium question",
            difficulty=3,
            exam_year=2021,
            source="Twin",
        )
        response = self.client.get(
            self.URL, {"difficulty": 3, "ordering": "difficulty"}
        )
        self.assertEqual(response.status_code, 200)
        ids = self._ids(response)
        expected = sorted(
            [str(self.q_physics.id), str(twin.id)],
            key=lambda x: uuid.UUID(x),
        )
        self.assertEqual(ids, expected)

    # --- Pagination ---

    def test_default_pagination_metadata(self):
        response = self.client.get(self.URL)
        self.assertEqual(response.status_code, 200)
        data = response.data["data"]
        self.assertEqual(data["page"], 1)
        self.assertEqual(data["page_size"], 20)
        self.assertEqual(data["total"], 3)
        self.assertEqual(len(data["items"]), 3)

    def test_custom_page_and_page_size(self):
        response = self.client.get(
            self.URL, {"page": 1, "page_size": 2, "ordering": "difficulty"}
        )
        self.assertEqual(response.status_code, 200)
        data = response.data["data"]
        self.assertEqual(data["page"], 1)
        self.assertEqual(data["page_size"], 2)
        self.assertEqual(data["total"], 3)
        self.assertEqual(len(data["items"]), 2)

        page2 = self.client.get(
            self.URL, {"page": 2, "page_size": 2, "ordering": "difficulty"}
        )
        self.assertEqual(len(page2.data["data"]["items"]), 1)
        self.assertEqual(page2.data["data"]["page"], 2)

    def test_max_page_size_enforced(self):
        response = self.client.get(self.URL, {"page_size": 101})
        self.assertEqual(response.status_code, 400)
        self.assertIn("page_size", response.data["errors"])

    def test_invalid_page_rejected(self):
        response = self.client.get(self.URL, {"page": 0})
        self.assertEqual(response.status_code, 400)
        self.assertIn("page", response.data["errors"])

        response = self.client.get(self.URL, {"page": "abc"})
        self.assertEqual(response.status_code, 400)

    def test_page_beyond_last_returns_empty_items(self):
        response = self.client.get(self.URL, {"page": 99, "page_size": 20})
        self.assertEqual(response.status_code, 200)
        data = response.data["data"]
        self.assertEqual(data["items"], [])
        self.assertEqual(data["total"], 3)
        self.assertEqual(data["page"], 99)

    def test_student_and_staff_serializers_on_paginated_list(self):
        student = self.client.get(self.URL, {"page_size": 1})
        self.assertEqual(student.status_code, 200)
        item = student.data["data"]["items"][0]
        self.assertIn("topic", item)
        self.assertNotIn("correct_option_id", item)
        self.assertNotIn("explanation", item)
        self.assertNotIn("status", item)

        self._auth(self.staff)
        staff = self.client.get(self.URL, {"page_size": 1, "status": "draft"})
        self.assertEqual(staff.status_code, 200)
        staff_item = staff.data["data"]["items"][0]
        self.assertIn("correct_option_id", staff_item)
        self.assertIn("status", staff_item)

    # --- Regression ---

    def test_anonymous_denied(self):
        self.client.credentials()
        self.assertEqual(self.client.get(self.URL).status_code, 401)

    def test_student_write_still_forbidden(self):
        self.assertEqual(
            self.client.post(
                self.URL,
                {
                    "prompt": "Nope",
                    "topic_id": str(self.topic.id),
                    "concept_id": str(self.concept.id),
                    "difficulty": 1,
                },
                format="json",
            ).status_code,
            403,
        )
