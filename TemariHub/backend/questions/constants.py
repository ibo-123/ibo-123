"""V1 question-bank vocabulary.

Question type
-------------
V1 supports single-correct multiple-choice only (``mcq_single``).

Publication
-----------
``draft`` — admin-only; excluded from student APIs and diagnostic selection.
``published`` — eligible for student retrieval and diagnostic selection when
active curriculum parents are also active.

Inactive curriculum
-------------------
Publishing requires the linked topic, its unit, its subject, and the concept
to be ``is_active=True``. Inactive parents do not block draft saves; they
block publication. Future student/diagnostic querysets will also exclude
inactive curriculum (separate from this write-path rule).

Options / correct answer
------------------------
V1 published MCQs require exactly ``MIN_OPTIONS_FOR_PUBLISH`` options (4) and
exactly one authoritative ``Question.correct_option`` FK. Options do **not**
carry client-controlled ``is_correct`` flags. Deleting any option on a
published question is rejected so the four-option invariant cannot drift.

Field bounds
------------
- Difficulty: integer ``DIFFICULTY_MIN``–``DIFFICULTY_MAX`` (1–5).
- ``estimated_time_seconds``: null (optional) or ≥ 1. No contract max.
- ``exam_year``: null/blank allowed; when set, ``EXAM_YEAR_MIN``–``EXAM_YEAR_MAX``
  at the DB layer; ``clean()`` also rejects years after ``current_year + 1``.
- ``source``: optional; blank/whitespace stored as empty string.

Explanation
-----------
``Question.explanation`` is privileged feedback. Student serializers must not
expose it until after a completed diagnostic (later tasks).

Integrity limitations
---------------------
Cross-table publication rules and correct-option ownership cannot be expressed
as a single PostgreSQL CHECK. Supported write paths (``Model.save``, Admin
``save_related``, option ``delete``) call ``full_clean`` / explicit checks.
Bulk ``QuerySet.update()`` bypasses those paths and must not be used for
status or answer mutations.
"""

QUESTION_TYPE_MCQ_SINGLE = "mcq_single"

QUESTION_TYPE_CHOICES = (
    (QUESTION_TYPE_MCQ_SINGLE, "Single-correct multiple choice"),
)

QUESTION_STATUS_DRAFT = "draft"
QUESTION_STATUS_PUBLISHED = "published"

QUESTION_STATUS_CHOICES = (
    (QUESTION_STATUS_DRAFT, "Draft"),
    (QUESTION_STATUS_PUBLISHED, "Published"),
)

# Inclusive difficulty range used by the API contract examples (1–5).
DIFFICULTY_MIN = 1
DIFFICULTY_MAX = 5

# Preferred V1 MCQ option count for publication (contract examples use 4-ish choices).
MIN_OPTIONS_FOR_PUBLISH = 4

# Optional exam-year bounds (contract shows values like 2025; no hard catalog).
EXAM_YEAR_MIN = 1990
# Hard DB ceiling; application clean() also caps at current calendar year + 1.
EXAM_YEAR_MAX = 2100
