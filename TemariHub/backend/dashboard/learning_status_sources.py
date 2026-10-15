"""Diagnostic and practice status adapters for the student dashboard.

Missing domain dependency (V1)
------------------------------
The ``diagnostics`` app provides persistence models (Task 8), but diagnostic
start/answer/complete APIs and dashboard wiring are not implemented yet. There
is also **no** ``practice`` session app. Until those services ship, the dashboard
must not invent parallel diagnostic tests, practice sessions, scores, or
completion rules. Both feature areas therefore return the established
``unavailable`` contract:

- ``learning_status.diagnostic.status == "unavailable"``
- ``learning_status.practice.status == "unavailable"``
- ``data_availability.diagnostic`` / ``.practice`` == ``False``

This differs from an empty history once the domains exist:

- Diagnostic with no attempt → expected ``not_started`` (not ``unavailable``)
- Practice with no sessions → expected ``status`` reflecting empty history and
  ``sessions_count: 0`` (not ``unavailable``)

When real services land, replace the bodies of these helpers with calls into
those domains (scoped to ``request.user``) and keep the dashboard as a thin
aggregation layer.
"""

DIAGNOSTIC_STATUS_UNAVAILABLE = "unavailable"
PRACTICE_STATUS_UNAVAILABLE = "unavailable"

# Planned lifecycle vocabulary from the API contract / Phase 4 dashboard schema.
# Used only after the assessment domain exists — not emitted while unavailable.
DIAGNOSTIC_STATUS_NOT_STARTED = "not_started"
DIAGNOSTIC_STATUS_IN_PROGRESS = "in_progress"
DIAGNOSTIC_STATUS_COMPLETED = "completed"


def get_diagnostic_status(user):
    """Return diagnostic status for the authenticated student.

    Currently always unavailable until diagnostic APIs are wired to
    ``diagnostics`` models. ``user`` is accepted so the call site stays ready
    for a real ownership-scoped lookup.
    """
    _ = user
    return {
        "status": DIAGNOSTIC_STATUS_UNAVAILABLE,
        "completed": False,
        "detail": None,
    }


def get_practice_status(user):
    """Return practice activity summary for the authenticated student.

    Currently always unavailable: no practice-session models or services exist
    to aggregate. When the practice domain ships, this should return session
    counts / recent items from that domain — never fabricate sessions here.
    """
    _ = user
    return {
        "status": PRACTICE_STATUS_UNAVAILABLE,
        "sessions_count": None,
        "detail": None,
    }


def diagnostic_data_available(payload) -> bool:
    return payload.get("status") != DIAGNOSTIC_STATUS_UNAVAILABLE


def practice_data_available(payload) -> bool:
    return payload.get("status") != PRACTICE_STATUS_UNAVAILABLE
