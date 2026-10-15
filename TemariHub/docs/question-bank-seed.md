# Question bank seed and readiness

TemariHub ships two management commands for local/dev databases:

```bash
python manage.py seed_curriculum
python manage.py seed_question_bank
python manage.py validate_question_bank
```

In Docker:

```bash
docker exec temarihub-backend python manage.py seed_curriculum
docker exec temarihub-backend python manage.py seed_question_bank
docker exec temarihub-backend python manage.py validate_question_bank
```

Dry-run (no persisted writes):

```bash
python manage.py seed_question_bank --dry-run
```

## What the seed creates

- **Practice MCQs only**, sourced as `TemariHub Practice Seed|<seed_key>`.
- Content is **not** official entrance-exam material and does not invent exam years.
- Each blueprint references Grade 12 curriculum by `subject_slug` / `unit_slug` / `topic_slug`.
- Because `seed_curriculum` creates subjects, units, and topics **but not concepts**, `seed_question_bank` upserts the concepts required by each blueprint under the matching topic.
- Questions are assembled as drafts with four options and a `correct_option`, then published through the same `create_question` / `update_question` validation paths as the admin API.

## Idempotency

- Each blueprint has a stable `seed_key`.
- Question primary keys are deterministic: `uuid5(SEED_NAMESPACE, "question:<seed_key>")`.
- Re-running the command **skips** unchanged seed-owned rows, **updates** seed-owned rows when blueprint content changes, and **never deletes** questions.
- Manually authored questions use random UUIDs and different sources; the seeder does not match or overwrite them.

## Eligible vs published

`validate_question_bank` reports both:

| Metric | Meaning |
|--------|---------|
| Published | `status=published` |
| Eligible published | Student-visible via `student_eligible_question_queryset()` — published **and** topic, unit, subject, and concept are all `is_active` |

**100 published rows does not imply 100 eligible rows.** Inactive curriculum parents exclude published questions from student retrieval and from the eligible total used for the readiness target (`ELIGIBLE_TARGET = 100`).

## Interpreting validation

The validation command is **read-only**. It reports:

- totals (all / published / draft / eligible)
- whether the 100-eligible target is met
- published rows with wrong option counts or missing `correct_option`
- published rows on inactive curriculum
- concept/topic mismatches
- eligible distribution by subject and difficulty

## Typical workflow

1. `seed_curriculum` — ensure Grade 12 subjects/units/topics exist.
2. `seed_question_bank` — create concepts + ≥100 practice questions.
3. `validate_question_bank` — confirm `eligible_published >= 100`.
4. Re-run seed anytime; it is safe and idempotent.
