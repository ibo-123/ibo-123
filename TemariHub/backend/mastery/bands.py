"""Mastery band helpers — single source for score → band mapping."""

from decimal import Decimal

from mastery.constants import (
    BAND_DEVELOPING_MAX,
    BAND_NEEDS_ATTENTION_MAX,
    BAND_PROFICIENT_MAX,
    BAND_STRONG_MIN,
)


class MasteryBand:
    NEEDS_ATTENTION = "needs_attention"
    DEVELOPING = "developing"
    PROFICIENT = "proficient"
    STRONG = "strong"


def mastery_band(score) -> str:
    """Return the V1 band label for a 0–100 mastery score.

    Boundaries (inclusive upper edges except strong which starts at 80):
    0–39 needs_attention, 40–59 developing, 60–79 proficient, 80–100 strong.
    """
    value = Decimal(str(score))
    if value <= BAND_NEEDS_ATTENTION_MAX:
        return MasteryBand.NEEDS_ATTENTION
    if value <= BAND_DEVELOPING_MAX:
        return MasteryBand.DEVELOPING
    if value <= BAND_PROFICIENT_MAX:
        return MasteryBand.PROFICIENT
    if value >= BAND_STRONG_MIN:
        return MasteryBand.STRONG
    # Unreachable for well-formed scores; keep deterministic.
    return MasteryBand.DEVELOPING
