"""Shared constants for the TemariHub practice question-bank seed."""

import uuid

# Deterministic UUIDs for seeded questions (never collide with random admin UUIDs).
SEED_NAMESPACE = uuid.UUID("a1b2c3d4-e5f6-7890-abcd-ef1234567890")

# Explicit practice attribution — not official exam material.
PRACTICE_SOURCE = "TemariHub Practice Seed"

# Marker stored in source so operators can identify seed-owned rows.
# Format: ``TemariHub Practice Seed|<seed_key>``
SOURCE_PREFIX = f"{PRACTICE_SOURCE}|"

ELIGIBLE_TARGET = 100


def question_id_for_seed_key(seed_key: str) -> uuid.UUID:
    return uuid.uuid5(SEED_NAMESPACE, f"question:{seed_key}")


def concept_id_for_seed_key(seed_key: str) -> uuid.UUID:
    return uuid.uuid5(SEED_NAMESPACE, f"concept:{seed_key}")


def source_for_seed_key(seed_key: str) -> str:
    return f"{SOURCE_PREFIX}{seed_key}"
