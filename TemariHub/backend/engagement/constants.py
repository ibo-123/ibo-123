"""V1 engagement vocabulary for streak and recent-activity aggregation.

Qualifying learning activity (V1)
---------------------------------
Until dedicated practice/diagnostic session history exists, a qualifying
event is a completed mastery write for a topic:

- Emitted from ``mastery.services.upsert_topic_mastery`` when
  ``questions_attempted > 0``.
- Stored as ``LearningActivityEvent`` with ``type=practice`` and
  ``status=completed``.
- Calendar day = ``occurred_at`` converted to the project ``TIME_ZONE``
  (UTC with ``USE_TZ=True``).

Non-qualifying (never counted):
- Auth / profile / onboarding writes
- Mastery rows with ``questions_attempted == 0``
- Login, page views, or fabricated browse events

Multiple qualifying events on the same calendar day count as one streak day.
One feed entry is kept per (user, topic, activity_date) for practice events.
"""

ACTIVITY_TYPE_PRACTICE = "practice"
ACTIVITY_STATUS_COMPLETED = "completed"

# Dashboard recent-activity window when no other convention exists.
RECENT_ACTIVITY_LIMIT = 10
