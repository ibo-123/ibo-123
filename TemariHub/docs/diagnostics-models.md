# Diagnostic data model (Task 8)

Models from Task 8. APIs: §15.1 start/detail/questions, §15.2 answer submit, §15.3 complete/score (`POST /api/v1/diagnostic/attempts/{id}/complete/`).

## Models

| Model | Role |
|-------|------|
| `DiagnosticAttempt` | One student diagnostic session (`diagnostic_test_id` in the API contract) |
| `DiagnosticQuestion` | Question assigned to an attempt at a stable 1-based `position` |
| `DiagnosticAnswer` | At most one answer per assigned question (`OneToOne`) |

## Attempt lifecycle

| Status | Meaning | `completed_at` | `overall_score_pct` |
|--------|---------|----------------|---------------------|
| `in_progress` | Started; answers may be recorded later | must be null | must be null |
| `completed` | Finished via complete API | required | required after Task 11 scoring |

Dashboard vocabulary once wired (not in this task): no rows → `not_started`; active row → `in_progress`; finished → `completed`.

**Multiple completed attempts are allowed** (history). **At most one `in_progress` attempt per student** (partial unique constraint). Concurrent second starts should return conflict in a later API task (409).

V1 length: `DIAGNOSTIC_QUESTION_COUNT = 100` (stored on each attempt as `total_questions`).

## Historical integrity / deletion

- `DiagnosticQuestion.question` → `PROTECT`
- `DiagnosticAnswer.selected_option` → `PROTECT`
- `delete_question()` returns **409** when diagnostic history references the question
- Prefer **unpublishing** questions that should leave the live bank rather than deleting them
- Student user deletion **cascades** attempts (and thus assignments/answers) but **does not** delete bank questions

## Constraints

**Database**

- Valid attempt statuses
- `status` ↔ `completed_at` consistency
- Score null while `in_progress`
- One `in_progress` attempt per student
- Unique `(attempt, position)` and `(attempt, question)`
- Non-negative `time_spent_seconds` when set

**Application (`full_clean` via `save(validate=True)`)**

- `selected_option` must belong to the assigned question (cannot be a plain FK CHECK)
- `selected_option` and `answered_at` must be set together when answering
- Unanswered rows may exist with both null; **completion scoring treats unanswered as incorrect**

**Limitation:** Django `QuerySet.update()` / bulk paths bypass `save()`/`full_clean()`. Supported writers must use model `save()` or dedicated services (future tasks).

## Correctness storage

Correctness is **not** denormalized on `DiagnosticAnswer`. Results derive from `Question.correct_option` at scoring time. If a bank question’s correct option is edited after an attempt, historical results may shift — accepted V1 tradeoff unless a later task adds snapshots.

## Contract notes / ambiguities

- Contract base path is `/diagnostic` with `POST /diagnostic/start`; live API will use `/api/v1/...` and the `{success,message,data}` envelope (same as other domains). Exact route naming is deferred to the attempt-creation API task.
- Contract does not define attempt status strings; this model aligns with dashboard notes (`in_progress` / `completed`).
- Contract does not forbid retries; multiple completed attempts are allowed.
- `time_spent_seconds` on answers matches the contract answer payload (capped at 86400s on submit).
- Answer changes are allowed until completion; one `DiagnosticAnswer` per assigned question.
- Completion scoring: `overall_score_pct = ROUND_HALF_UP(100 * correct / assigned, 2)`; unanswered = incorrect; uses live `Question.correct_option`.
- Mastery upsert / strong-weak topic ranking / dashboard diagnostic status / results GET remain deferred.
- Contract sketch `POST /diagnostic/{id}/complete` is implemented as `POST /api/v1/diagnostic/attempts/{id}/complete/`.

## Admin

Models are registered under Django Admin for inspection. Admin is not a student-facing API and may show IDs useful for support; it must not be used as a substitute for the future student diagnostic endpoints.
