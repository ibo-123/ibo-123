"""V1 learning-path vocabulary shared by services and the dashboard.

Prerequisite-based locking is intentionally out of scope for V1 — topics are
eligible from path status and completion only. See the revised V1 policy.
"""

from mastery.constants import BAND_STRONG_MIN, SCORE_DECIMAL_PLACES

# Re-export so learning-path callers share the mastery Strong threshold.
TOPIC_COMPLETE_MASTERY_MIN = BAND_STRONG_MIN  # Decimal("80")
PROGRESS_DECIMAL_PLACES = SCORE_DECIMAL_PLACES

# Activity types from API contract §26. V1 only emits study_topic / practice.
ACTIVITY_STUDY_TOPIC = "study_topic"
ACTIVITY_PRACTICE = "practice"
ACTIVITY_REVIEW_PREREQUISITE = "review_prerequisite"

# Path-level status values returned on the dashboard learning_status block.
PATH_STATUS_UNAVAILABLE = "unavailable"
PATH_STATUS_NOT_STARTED = "not_started"
PATH_STATUS_IN_PROGRESS = "in_progress"
PATH_STATUS_COMPLETED = "completed"
