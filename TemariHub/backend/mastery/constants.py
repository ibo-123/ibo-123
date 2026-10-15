"""Central mastery thresholds and eligibility rules.

Bands follow ``docs/api-contract.md`` §22.4 (V1). Dashboard strong/weak
topic classification and subject ranking reuse these constants so there is
exactly one mastery interpretation in the backend.
"""

from decimal import Decimal

# Algorithm version stamped on TopicMastery rows. Bump when the scoring
# formula that *writes* mastery_score changes; aggregation always reads
# stored scores and does not re-derive them from raw attempts.
MASTERY_ALGORITHM_VERSION = "v1"

# Inclusive score bands (0–100), from API contract §22.4.
BAND_NEEDS_ATTENTION_MAX = Decimal("39")
BAND_DEVELOPING_MAX = Decimal("59")
BAND_PROFICIENT_MAX = Decimal("79")
BAND_STRONG_MIN = Decimal("80")

# Topic classification thresholds used by the dashboard.
STRONG_TOPIC_MIN = BAND_STRONG_MIN  # mastery_score >= 80 → strong
WEAK_TOPIC_MAX = BAND_NEEDS_ATTENTION_MAX  # mastery_score <= 39 → weak

# Minimum stored observations before a topic (and therefore its subject)
# may be ranked or classified. Topics with fewer attempts are treated as
# insufficient history — not as demonstrated weak topics.
MIN_OBSERVATIONS_FOR_RANKING = 3

# Overall progress / subject mastery are reported to one decimal place.
SCORE_DECIMAL_PLACES = 1
