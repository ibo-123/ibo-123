"""Diagnostic attempt vocabulary (V1).

Statuses map to dashboard expectations once wired (later task):
``not_started`` (no row) → ``in_progress`` → ``completed``.

``abandoned`` / ``expired`` are not part of the V1 API contract and are not
modeled here.
"""

DIAGNOSTIC_STATUS_IN_PROGRESS = "in_progress"
DIAGNOSTIC_STATUS_COMPLETED = "completed"

DIAGNOSTIC_STATUS_CHOICES = (
    (DIAGNOSTIC_STATUS_IN_PROGRESS, "In progress"),
    (DIAGNOSTIC_STATUS_COMPLETED, "Completed"),
)

# Contract §15: V1 diagnostic length.
DIAGNOSTIC_QUESTION_COUNT = 100

# Upper bound for per-question time_spent_seconds on answer submit (24 hours).
DIAGNOSTIC_MAX_TIME_SPENT_SECONDS = 24 * 60 * 60
