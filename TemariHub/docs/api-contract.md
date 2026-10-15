# TemariHub — Complete API Contract V1

**Version:** 1.0
**Base URL:** `/api/v1`

**Backend:** Django + Django REST Framework
**Database:** PostgreSQL
**Vector Database:** PostgreSQL + pgvector
**AI:** OpenAI
**Authentication:** JWT + Phone OTP + Google Authenticator/TOTP + Apple Sign-In
**Transport:** HTTPS
**Data Format:** JSON

---

# 1. System Architecture

TemariHub is an adaptive learning platform.

The system does not use RAG merely as a document-search chatbot.

It continuously analyzes student activity and uses that information to determine what the student should learn next.

```text
                    STUDENT
                       │
                       ▼
          ┌────────────────────────┐
          │ Diagnostic / Practice  │
          │ Answers / Mistakes     │
          └───────────┬────────────┘
                      │
                      ▼
          ┌────────────────────────┐
          │ Student Analytics      │
          │ & Mastery Engine       │
          └───────────┬────────────┘
                      │
          ┌───────────┼──────────────┐
          ▼           ▼              ▼
      Subject      Topic/Concept   Performance
      Strength     Weakness        Trends
          │           │              │
          └───────────┼──────────────┘
                      ▼
          ┌────────────────────────┐
          │ Curriculum &           │
          │ Prerequisite Rules     │
          └───────────┬────────────┘
                      │
                      ▼
          ┌────────────────────────┐
          │ AI Adaptive Learning   │
          │ Path Decision Engine   │
          └───────────┬────────────┘
                      │
                      ▼
          ┌────────────────────────┐
          │ RAG Retrieval          │
          │ TemariHub Knowledge    │
          └───────────┬────────────┘
                      │
                      ▼
                 ┌─────────┐
                 │ OpenAI  │
                 └────┬────┘
                      │
          ┌───────────┴────────────┐
          ▼                        ▼
   Personalized Tutor       Learning Path
   Explanation              Recommendation
          │                        │
          └───────────┬────────────┘
                      ▼
                   STUDENT
                      │
                      ▼
                New Activity
                      │
                      └──────────► Analytics
```

---

# 2. Core Design Principle

The adaptive system follows:

```text
Observe
   ↓
Analyze
   ↓
Understand Student
   ↓
Identify Strengths / Weaknesses
   ↓
Check Prerequisites
   ↓
Generate / Update Learning Path
   ↓
Retrieve Relevant Knowledge
   ↓
Teach
   ↓
Practice
   ↓
Reassess
   ↓
Adapt Again
```

The learning path is therefore **dynamic**, not fixed.

---

# 3. API Conventions

## 3.1 Base URL

```text
/api/v1
```

---

## 3.2 Authentication Header

Protected endpoints require:

```http
Authorization: Bearer <access_token>
```

---

## 3.3 Public Endpoints

```text
POST /auth/register
POST /auth/login
POST /auth/phone/send-otp
POST /auth/phone/verify-otp
POST /auth/apple
POST /auth/refresh
```

---

## 3.4 IDs

All resource IDs use UUID strings.

---

## 3.5 Timestamps

All timestamps use ISO 8601 UTC.

Example:

```text
2026-10-02T18:30:00Z
```

---

## 3.6 Pagination

```text
?page=1&page_size=20
```

**Defaults (V1 question list and shared helpers):** `page` defaults to `1`; `page_size` defaults to `20`; maximum `page_size` is `100`. Invalid `page` / `page_size` values return `400` with the standard `{success,message,errors}` envelope. A valid `page` beyond the last page returns an empty `items` array with the correct `total`.

Response (inside the success envelope `data` object):

```json
{
  "items": [],
  "page": 1,
  "page_size": 20,
  "total": 100
}
```

---

## 3.7 Errors

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message"
  }
}
```

**Implementation note (V1 backend):** The live Django API preserves the established envelope `{ "success": true|false, "message": "...", "data"|"errors": ... }` used by authentication, onboarding, curriculum, and dashboard. Clients should treat that shape as authoritative for `/api/v1/*` until a coordinated migration to the `{ "error": { "code", "message" } }` sketch above. New question-bank and diagnostic endpoints follow the existing `{success, message, data|errors}` convention.

Common status codes:

```text
200 OK
201 Created
204 No Content
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Unprocessable Entity
429 Too Many Requests
500 Internal Server Error
```

---

# 4. Authentication

Base path:

```text
/auth
```

The primary student identifier is the **phone number**.

Phone numbers must be normalized and stored in E.164 format.

Example:

```text
+251912345678
```

---

## 4.1 Register

```http
POST /auth/register
```

### Request

```json
{
  "phone_number": "+251912345678",
  "password": "StrongPassword123!",
  "full_name": "Hosama Adem"
}
```

### Response

```json
{
  "id": "uuid",
  "phone_number": "+251912345678",
  "full_name": "Hosama Adem",
  "phone_verified": false,
  "onboarded": false
}
```

### Errors

```text
409 PHONE_TAKEN
400 INVALID_PHONE_NUMBER
400 WEAK_PASSWORD
```

---

# 5. Phone OTP

## 5.1 Send OTP

```http
POST /auth/phone/send-otp
```

### Request

```json
{
  "phone_number": "+251912345678"
}
```

### Response

```json
{
  "message": "OTP sent successfully",
  "expires_in": 300
}
```

Requirements:

* 6-digit OTP
* expiration
* rate limiting
* limited verification attempts
* secure OTP storage

---

## 5.2 Verify OTP

```http
POST /auth/phone/verify-otp
```

### Request

```json
{
  "phone_number": "+251912345678",
  "otp": "482913"
}
```

### Response

```json
{
  "access_token": "access-token",
  "refresh_token": "refresh-token",
  "token_type": "Bearer",
  "user": {
    "id": "uuid",
    "phone_number": "+251912345678",
    "full_name": "Hosama Adem",
    "phone_verified": true,
    "onboarded": false
  }
}
```

---

# 6. Password Login

```http
POST /auth/login
```

### Request

```json
{
  "phone_number": "+251912345678",
  "password": "StrongPassword123!"
}
```

### Response

```json
{
  "access_token": "access-token",
  "refresh_token": "refresh-token",
  "token_type": "Bearer",
  "requires_2fa": false
}
```

If 2FA is enabled:

```json
{
  "access_token": null,
  "refresh_token": null,
  "token_type": "Bearer",
  "requires_2fa": true,
  "two_factor_token": "temporary-token"
}
```

---

# 7. Google Authenticator / TOTP

Google Authenticator is used as a TOTP-based second authentication factor.

## 7.1 Setup

```http
POST /auth/2fa/setup
```

### Response

```json
{
  "secret": "BASE32_SECRET",
  "otpauth_url": "otpauth://totp/TemariHub:student",
  "qr_code": "data:image/png;base64,..."
}
```

---

## 7.2 Verify and Enable

```http
POST /auth/2fa/verify
```

### Request

```json
{
  "code": "482913"
}
```

### Response

```json
{
  "enabled": true
}
```

---

## 7.3 Verify During Login

```http
POST /auth/2fa/login
```

### Request

```json
{
  "two_factor_token": "temporary-token",
  "code": "482913"
}
```

### Response

```json
{
  "access_token": "access-token",
  "refresh_token": "refresh-token",
  "token_type": "Bearer"
}
```

---

## 7.4 Disable

```http
POST /auth/2fa/disable
```

### Request

```json
{
  "password": "StrongPassword123!",
  "code": "482913"
}
```

---

# 8. Apple Sign-In

```http
POST /auth/apple
```

### Request

```json
{
  "identity_token": "apple-identity-token",
  "authorization_code": "apple-authorization-code"
}
```

### Response

```json
{
  "access_token": "access-token",
  "refresh_token": "refresh-token",
  "token_type": "Bearer",
  "user": {
    "id": "uuid",
    "full_name": "Student Name",
    "onboarded": false
  }
}
```

Apple identity tokens must be validated by the backend.

---

# 9. Token Management

## 9.1 Refresh

```http
POST /auth/refresh
```

### Request

```json
{
  "refresh_token": "refresh-token"
}
```

### Response

```json
{
  "access_token": "new-access-token",
  "refresh_token": "new-refresh-token",
  "token_type": "Bearer"
}
```

Refresh token rotation is required.

---

## 9.2 Logout

```http
POST /auth/logout
```

### Request

```json
{
  "refresh_token": "refresh-token"
}
```
## Forgot Password API Contract

## 1. Request password reset OTP

POST /api/v1/auth/password/forgot

Request
```json {
  "phone_number": "+251912345678"
}```
Response — 200
{
  "message": "If an account exists for this phone number, a password reset OTP has been sent.",
  "expires_in": 300
}

For security, the response should be the same whether or not the phone number is registered, so attackers cannot discover which phone numbers have accounts.

Possible errors
400 INVALID_PHONE_NUMBER
429 TOO_MANY_REQUESTS
2. Verify password-reset OTP
POST /api/v1/auth/password/verify-otp
Request
{
  "phone_number": "+251912345678",
  "otp": "482913"
}
Response — 200
{
  "verified": true,
  "reset_token": "temporary-password-reset-token",
  "expires_in": 600
}

The reset_token should be short-lived and usable only for resetting the password.

Errors
400 INVALID_OTP
400 OTP_EXPIRED
429 TOO_MANY_ATTEMPTS
3. Reset Password
POST /api/v1/auth/password/reset
Request
{
  "reset_token": "temporary-password-reset-token",
  "new_password": "NewStrongPassword123!"
}
Response — 200
{
  "message": "Password reset successfully."
}
Errors
400 INVALID_RESET_TOKEN
400 RESET_TOKEN_EXPIRED
400 WEAK_PASSWORD
Complete Flow
Student
   │
   │ Forgot password
   ▼
POST /auth/password/forgot
   │
   ▼
SMS OTP
   │
   ▼
POST /auth/password/verify-otp
   │
   ▼
Temporary reset_token
   │
   ▼
POST /auth/password/reset
   │
   ▼
New password
   │
   ▼
Login normally
Final authentication section

Your /auth contract should therefore contain:

/auth
├── register
├── login
│
├── phone/send-otp
├── phone/verify-otp
│
├── password/forgot
├── password/verify-otp
├── password/reset
├── change-password
│
├── 2fa/setup
├── 2fa/verify
├── 2fa/login
├── 2fa/disable
│
├── apple
├── refresh
├── logout
├── me
└── onboarding
---

# 10. Current User

## 10.1 Get Current User

```http
GET /auth/me
```

### Response

```json
{
  "id": "uuid",
  "phone_number": "+251912345678",
  "full_name": "Hosama Adem",
  "grade": 12,
  "stream": "natural_science",
  "phone_verified": true,
  "two_factor_enabled": true,
  "onboarded": true
}
```

---

## 10.2 Update Profile

```http
PATCH /auth/me
```

### Request

```json
{
  "full_name": "Hosama Adem",
  "grade": 12,
  "stream": "natural_science"
}
```

---

# 11. Onboarding

```http
POST /auth/onboarding
```

### Request

```json
{
  "grade": 12,
  "stream": "natural_science"
}
```

### Response

```json
{
  "onboarded": true,
  "grade": 12,
  "stream": "natural_science"
}
```

---

# 12. Change Password

```http
POST /auth/change-password
```

### Request

```json
{
  "current_password": "OldPassword123!",
  "new_password": "NewPassword123!"
}
```

---

# 13. Curriculum

Base path:

```text
/curriculum
```

Hierarchy:

```text
Grade
 └── Stream
      └── Subject
           └── Unit
                └── Topic
                     └── Concept
```

---

## 13.1 Subjects

```http
GET /curriculum/subjects?grade=12&stream=natural_science
```

---

## 13.2 Subject Units

```http
GET /curriculum/subjects/{subject_id}/units
```

---

## 13.3 Unit Topics

```http
GET /curriculum/units/{unit_id}/topics
```

---

## 13.4 Topic Details

```http
GET /curriculum/topics/{topic_id}
```

### Response

```json
{
  "id": "uuid",
  "name": "Chemical Equilibrium",
  "unit_id": "uuid",
  "concepts": [],
  "prerequisites": [],
  "learning_objectives": [],
  "estimated_study_minutes": 120,
  "recommended_resources": [],
  "question_count": 45
}
```

---

## 13.5 Topic Prerequisites

```http
GET /curriculum/topics/{topic_id}/prerequisites
```

The backend can calculate transitive prerequisites when generating learning paths.

---

# 14. Question Bank

Base path:

```text
/questions
```

Question metadata:

```text
Subject
Unit
Topic
Concept
Difficulty
Source
Exam Year
Estimated Time
```

**V1 model notes (backend):**
- Curriculum hierarchy is `Subject → Unit → Topic → Concept`. Questions store FKs to `topic` and `concept`; subject/unit are derived from the topic.
- Question type V1: single-correct MCQ only (`mcq_single`).
- Publication: `draft` | `published`. Only `published` questions are student-visible or diagnostically selectable.
- Options live on `QuestionOption` (`text`, deterministic `sort_order`). Correctness is **not** stored per option; `Question.correct_option` is the sole authoritative answer FK and must belong to the same question.
- Published MCQs require exactly **4** options and a valid `correct_option`. Drafts may be incomplete while being authored.
- Field bounds: `difficulty` 1–5; `estimated_time_seconds` null or ≥ 1 (no contract max); `exam_year` null or 1990–2100 (also rejected if after current year + 1); `source` optional (whitespace trimmed).
- Publishing also requires a non-empty `prompt` and **active** topic, unit, subject, and concept. Inactive curriculum may exist on drafts but blocks publication. Student/diagnostic visibility will additionally filter inactive parents in later tasks.
- Deleting any option from a **published** question is rejected (unpublish first). Draft option deletion clears `correct_option` when needed.
- DB CHECK constraints cover difficulty, estimated time, exam year, status, question type, and non-empty option text. Cross-table publish rules remain application-enforced via `save()` / Admin `save_related` (not `QuerySet.update()`).
- `explanation` is privileged feedback (reuse `Question.explanation`). Student responses must never expose correct answers, correctness flags, or explanations until after a completed diagnostic.
- **Admin REST CRUD** is live at `/api/v1/questions/` (staff JWT for writes). Authenticated students may **GET** eligible published questions via the same paths using a student-safe serializer. List filtering, search, ordering, and `page` / `page_size` pagination are documented in §14.3.
- **Dev seed / readiness:** `python manage.py seed_question_bank` loads idempotent practice MCQs (≥100 eligible when Grade 12 curriculum is present). `python manage.py validate_question_bank` reports published vs student-eligible counts. See `docs/question-bank-seed.md`. Practice seed content is **not** official exam material.

---

## 14.1 Admin Create Question

**Staff only** (`IsAuthenticated` + `is_staff` / DRF `IsAdminUser`). JWT Bearer required.

```http
POST /api/v1/questions/
```

### Request

Correctness is **not** accepted via per-option `is_correct` (rejected). Use `correct_option_id` or `correct_option_index` (index into the same-request `options` array).

```json
{
  "topic_id": "uuid",
  "concept_id": "uuid",
  "prompt": "What is the value of x?",
  "question_type": "mcq_single",
  "status": "published",
  "options": [
    { "text": "2", "sort_order": 0 },
    { "text": "4", "sort_order": 1 },
    { "text": "6", "sort_order": 2 },
    { "text": "8", "sort_order": 3 }
  ],
  "correct_option_index": 1,
  "explanation": "The correct answer follows from...",
  "difficulty": 3,
  "estimated_time_seconds": 60,
  "source": "Entrance Exam",
  "exam_year": 2025
}
```

Drafts may omit `options` / correct answer. Nested writes are transactional.

### Response

Standard `{ success, message, data }` envelope. `data` includes admin fields: `options[]` with derived read-only `is_correct`, `correct_option_id`, `explanation`, curriculum ids, timestamps.

Errors: `401` unauthenticated, `403` non-staff, `400` validation (`errors` map).

---

## 14.2 Get / Update / Delete Question

```http
GET    /api/v1/questions/{question_id}/
PATCH  /api/v1/questions/{question_id}/
PUT    /api/v1/questions/{question_id}/
DELETE /api/v1/questions/{question_id}/
```

- **GET (student):** JWT required. Returns only **published** questions whose topic, unit, subject, and concept are all `is_active`. Unavailable UUIDs (draft, inactive curriculum) → `404`. Student payload never includes `correct_option*`, `is_correct`, or `explanation`.
- **GET (staff):** any question; admin serializer may include `correct_option_id`, `explanation`, and derived `is_correct`.
- **PATCH / PUT / DELETE:** staff only (`403` for students).
- **PATCH**: partial update. If `options` is sent, it is a full replacement set (match by `id` when present; create when absent; delete omitted — blocked while `published`).
- **PUT**: full update requiring create-required fields (`prompt`, `topic_id`, `concept_id`, `difficulty`).
- **DELETE**: hard-delete while no assessment history references exist. Questions referenced by `diagnostics.DiagnosticQuestion` return **`409`** (prefer unpublish). Option rows selected in diagnostic answers are DB-`PROTECT`ed.

Answer disclosure during diagnostics is handled only by the diagnostic results lifecycle — not by this general question GET.

### Student response shape (GET)

```json
{
  "id": "uuid",
  "prompt": "What is the value of x?",
  "question_type": "mcq_single",
  "difficulty": 3,
  "estimated_time_seconds": 60,
  "subject": { "id": "uuid", "name": "Mathematics", "slug": "mathematics" },
  "unit": { "id": "uuid", "name": "Algebra", "slug": "algebra" },
  "topic": { "id": "uuid", "name": "Quadratics", "slug": "quadratics" },
  "concept": { "id": "uuid", "name": "Discriminant", "slug": "discriminant" },
  "options": [
    { "id": "uuid", "text": "2", "sort_order": 0 },
    { "id": "uuid", "text": "4", "sort_order": 1 }
  ]
}
```

---

## 14.3 List Questions

```http
GET /api/v1/questions/
```

JWT required. Returns paginated `{ items, page, page_size, total }` inside the success envelope. Default ordering is newest first (`-created_at`), with question `id` as a stable secondary key.

### Role visibility

- **Students:** eligible **published** questions only (topic, unit, subject, and concept all `is_active`); student-safe serializer (no answer keys / explanations / `status`). Filters never expand visibility — drafts and inactive-curriculum questions stay excluded even when targeted by filter params.
- **Staff:** all questions (including drafts) with the admin serializer (may include `correct_option_id`, `explanation`, derived `is_correct`, `status`).

### Filters

| Parameter | Notes |
|-----------|--------|
| `subject_id` | UUID; filters via `topic.unit.subject` |
| `unit_id` | UUID; must belong to `subject_id` when both supplied |
| `topic_id` | UUID; must belong to `unit_id` / `subject_id` when supplied |
| `concept_id` | UUID; must belong to `topic_id` / `unit_id` / `subject_id` when supplied |
| `difficulty` | Integer 1–5 |
| `question_type` | V1: `mcq_single` only |
| `exam_year` | Integer |
| `source` | Exact match, case-insensitive (trimmed) |
| `status` | Staff only: `draft` \| `published`. Students receive `400` if supplied |

Contradictory curriculum combinations (e.g. a unit that does not belong to the given subject) return `400` with field errors — they do not silently return an empty or misleading list. Invalid UUIDs, out-of-range difficulty, and unsupported `question_type` / `status` / `ordering` values likewise return `400`.

### Search

```text
?search=<term>
```

Case-insensitive substring match on `prompt` and `source` only (trimmed). Maximum length **200** characters. Does **not** search explanations, correct answers, or other privileged fields. Results are de-duplicated when joins would otherwise repeat rows.

### Ordering

```text
?ordering=-created_at
```

Allowlist only (unsupported values → `400`):

- `difficulty` / `-difficulty`
- `exam_year` / `-exam_year`
- `created_at` / `-created_at`

Arbitrary ORM field paths (e.g. `topic__name`) are rejected. Ties are broken by `id` ascending.

### Pagination

```text
?page=1&page_size=20
```

- Default `page_size`: **20**
- Maximum `page_size`: **100**
- Page beyond the last page → empty `items`, same `total`

### Example

```http
GET /api/v1/questions/?subject_id=<uuid>&difficulty=3&page=1&page_size=20
```

```http
GET /api/v1/questions/?search=discriminant&ordering=difficulty&page=1&page_size=10
```

### Response shape

```json
{
  "success": true,
  "message": "Questions retrieved successfully",
  "data": {
    "items": [ /* student-safe or admin question objects */ ],
    "page": 1,
    "page_size": 20,
    "total": 42
  }
}
```

Errors: `401` unauthenticated, `403` on write for non-staff, `400` validation (`errors` map). Pagination metadata never exposes privileged answer fields.

---

# 15. Diagnostic

Base path:

```text
/diagnostic
```

The V1 diagnostic contains 100 questions distributed across relevant subjects.

**V1 backend foundation:** Persistence models live in the `diagnostics` app (`DiagnosticAttempt`, `DiagnosticQuestion`, `DiagnosticAnswer`). See `docs/diagnostics-models.md`.

**Implemented:** attempt start + question delivery (Task 9), answer submit (Task 10), and completion/scoring (Task 11) under `/api/v1/diagnostic/`. Mastery upserts, learning-path updates, results detail endpoint, and dashboard diagnostic status wiring are **not** implemented yet — the dashboard still reports diagnostic `unavailable`.

**Route note:** Contract sketch `POST /diagnostic/start` is implemented as `POST /api/v1/diagnostic/attempts/` (project `/api/v1` + `{success,message,data}` envelope). The attempt UUID is returned as both `id` and `diagnostic_test_id`.

---

## 15.1 Start

```http
POST /api/v1/diagnostic/attempts/
```

JWT required. Empty body (any client-supplied `student_id` is ignored — the attempt is always owned by `request.user`).

**Behavior**

- Requires at least **100** student-eligible, complete published questions (active curriculum; four options; `correct_option` set). Uses the question-bank eligibility queryset.
- Selects 100 questions with deterministic round-robin coverage across subjects (stable order by subject sort + question id).
- Persists `DiagnosticQuestion` rows with unique 1-based `position` values.
- If the student already has an **in-progress** attempt → **200** with that attempt (no second in-progress row).
- If fewer than 100 eligible questions → **400**; no orphan attempt is left.
- Concurrent creates that hit the one-in-progress unique constraint resume the existing attempt (or **409** if none can be loaded).

### Response `data`

```json
{
  "id": "uuid",
  "diagnostic_test_id": "uuid",
  "status": "in_progress",
  "started_at": "2026-10-02T18:30:00Z",
  "completed_at": null,
  "total_questions": 100,
  "sections": [
    {
      "subject_id": "uuid",
      "subject_name": "Mathematics",
      "question_count": 25
    }
  ]
}
```

Created → **201**; resumed in-progress → **200**. Errors: `401`, `400` (insufficient questions).

### Attempt detail

```http
GET /api/v1/diagnostic/attempts/{attempt_id}/
```

Same `data` shape as start. Ownership-scoped (**404** for other students' UUIDs).

### Assigned questions

```http
GET /api/v1/diagnostic/attempts/{attempt_id}/questions/
```

Returns student-safe questions in persisted `position` order (no correct answers / explanations). Does not create answers or mutate the attempt.

```json
{
  "attempt_id": "uuid",
  "items": [
    {
      "position": 1,
      "id": "uuid",
      "prompt": "...",
      "question_type": "mcq_single",
      "difficulty": 3,
      "options": [{ "id": "uuid", "text": "...", "sort_order": 0 }]
    }
  ],
  "count": 100
}
```

---

## 15.2 Answer

```http
PUT /api/v1/diagnostic/attempts/{attempt_id}/questions/{question_id}/answer/
```

JWT required. The question must be **assigned** to this attempt (bank membership alone is not enough). The attempt must belong to `request.user` and remain `in_progress`.

**Request body**

```json
{
  "selected_option_id": "uuid",
  "time_spent_seconds": 52
}
```

- `selected_option_id` required (contract alias `selected_choice_id` also accepted).
- `time_spent_seconds` optional; when set must be an integer from `0` to `86400` (24 hours).
- Client-supplied `student_id`, `is_correct`, `score`, and `explanation` are **rejected**.

**Answer-change policy:** While the attempt is `in_progress`, repeated `PUT`s **update** the single `DiagnosticAnswer` for that assigned question (OneToOne). No duplicate answer rows. Completing/scoring the diagnostic is **not** triggered.

### Response `data`

```json
{
  "attempt_id": "uuid",
  "question_id": "uuid",
  "position": 1,
  "selected_option_id": "uuid",
  "time_spent_seconds": 52,
  "answered_at": "2026-10-02T18:31:00Z"
}
```

Created → **201**; updated → **200**. Never includes correctness, correct-option ids, explanations, or scores.

Errors: `401` unauthenticated; `404` unknown/foreign attempt; `409` attempt not `in_progress`; `400` unassigned question, wrong option, invalid/missing fields.

---

## 15.3 Complete

```http
POST /api/v1/diagnostic/attempts/{attempt_id}/complete/
```

JWT required. Empty body (client-supplied `overall_score_pct`, `student_id`, `completed_at`, `status`, or `is_correct` are **rejected**).

**Behavior**

- Ownership-scoped; other students' attempts → **404**.
- Scores **only** questions assigned to the attempt.
- An answer is correct iff `selected_option_id == question.correct_option_id` (live bank key).
- **Unanswered** assigned questions (no answer row or null selection) count as **incorrect**.
- `overall_score_pct = round_half_up(100 * correct / total_assigned, 2)` on a 0–100 scale (`Decimal`, 2 places).
- Persists `status=completed`, `completed_at`, and `overall_score_pct` atomically (`select_for_update`).
- Repeated complete on an already-completed attempt → **200** with the **stored** score (no mutation / recalculation of `overall_score_pct`).
- Does **not** write topic mastery, learning-path, or dashboard status (deferred). `strong_topics` / `weak_topics` are empty arrays until that pipeline exists.

### Response `data`

```json
{
  "id": "uuid",
  "diagnostic_test_id": "uuid",
  "status": "completed",
  "started_at": "2026-10-02T18:30:00Z",
  "completed_at": "2026-10-02T19:10:00Z",
  "total_questions": 100,
  "questions_answered": 95,
  "questions_correct": 64,
  "overall_score_pct": "64.00",
  "subjects": [
    {
      "subject_id": "uuid",
      "subject_name": "Mathematics",
      "question_count": 25,
      "correct_count": 16,
      "score_pct": "64.00"
    }
  ],
  "strong_topics": [],
  "weak_topics": [],
  "sections": [{ "subject_id": "uuid", "subject_name": "Mathematics", "question_count": 25 }]
}
```

Never includes correct-option ids, explanations, or per-question correctness flags.

Errors: `401`; `404` unknown/foreign attempt; `400` rejected client fields / empty assignment; `409` if status cannot be completed.

---

## 15.4 Results (not implemented in Task 11)

```http
GET /diagnostic/{diagnostic_test_id}/results
```

---

# 16. Practice

Base path:

```text
/practice
```

The system records:

```text
Question
Subject
Unit
Topic
Concept
Difficulty
Correctness
Time Spent
Attempt Number
Source
Date
Repeated Mistakes
```

---

## 16.1 Create Session

```http
POST /practice/sessions
```

### Request

```json
{
  "subject_id": "uuid",
  "topic_id": "uuid",
  "difficulty": 3
}
```

At least one filter is required.

---

## 16.2 Answer

```http
POST /practice/sessions/{session_id}/answer
```

### Request

```json
{
  "question_id": "uuid",
  "selected_choice_id": "uuid",
  "time_spent_seconds": 75
}
```

### Response

```json
{
  "is_correct": false,
  "correct_choice_id": "uuid",
  "explanation": "The correct approach is...",
  "mistake_recorded": true
}
```

---

## 16.3 Complete

```http
POST /practice/sessions/{session_id}/complete
```

### Response

```json
{
  "questions_answered": 20,
  "correct": 13,
  "accuracy_pct": 65
}
```

---

## 16.4 Retry

```http
POST /practice/sessions/{session_id}/retry/{question_id}
```

---

# 17. Mistakes

Base path:

```text
/mistakes
```

## 17.1 Get Mistakes

```http
GET /mistakes/me?subject_id={id}&topic_id={id}&page=1
```

### Response

```json
{
  "items": [
    {
      "question_id": "uuid",
      "subject_id": "uuid",
      "topic_id": "uuid",
      "concept_id": "uuid",
      "attempt_count": 3,
      "incorrect_count": 3,
      "repeat_mistake": true,
      "last_attempted_at": "2026-10-02T18:30:00Z"
    }
  ]
}
```

---

## 17.2 Practice Mistakes

```http
POST /mistakes/practice
```

Creates a practice session from previous mistakes.

---

# 18. Student Analytics

Base path:

```text
/analytics
```

This is the **student understanding layer**.

It analyzes:

```text
Diagnostic
Practice
Accuracy
Difficulty
Time
Attempts
Recent Performance
Historical Performance
Trends
Repeated Mistakes
Subject Performance
Unit Performance
Topic Performance
Concept Performance
Prerequisites
Question Sources
Exam Years
```

---

## 18.1 Overall Analytics

```http
GET /analytics/me
```

### Response

```json
{
  "overall": {
    "mastery_score": 67,
    "accuracy_pct": 69,
    "questions_attempted": 420,
    "trend": "improving"
  },
  "strongest_subject": {
    "subject_id": "uuid",
    "subject_name": "Mathematics",
    "mastery_score": 82
  },
  "weakest_subject": {
    "subject_id": "uuid",
    "subject_name": "Chemistry",
    "mastery_score": 43
  },
  "strengths": [],
  "areas_needing_attention": []
}
```

---

# 19. Subject Analytics

```http
GET /analytics/me/subjects
```

### Response

```json
{
  "items": [
    {
      "subject_id": "uuid",
      "subject_name": "Mathematics",
      "mastery_score": 82,
      "mastery_band": "strong",
      "accuracy_pct": 84,
      "questions_attempted": 120,
      "recent_accuracy_pct": 89,
      "average_time_seconds": 48,
      "mistake_count": 12,
      "repeat_mistake_count": 2,
      "trend": "improving"
    }
  ]
}
```

---

# 20. Topic Analytics

```http
GET /analytics/me/topics
```

### Response

```json
{
  "items": [
    {
      "topic_id": "uuid",
      "topic_name": "Chemical Equilibrium",
      "subject_id": "uuid",
      "mastery_score": 38,
      "mastery_band": "needs_attention",
      "accuracy_pct": 41,
      "recent_accuracy_pct": 35,
      "questions_attempted": 35,
      "average_time_seconds": 91,
      "mistake_count": 14,
      "repeat_mistake_count": 5,
      "trend": "declining"
    }
  ]
}
```

---

# 21. Concept Analytics

```http
GET /analytics/me/topics/{topic_id}
```

### Response

```json
{
  "topic_id": "uuid",
  "topic_name": "Chemical Equilibrium",
  "mastery_score": 38,
  "concepts": [
    {
      "concept_id": "uuid",
      "concept_name": "Equilibrium Constant",
      "mastery_score": 29,
      "accuracy_pct": 31,
      "repeat_mistake_count": 4
    }
  ],
  "common_mistakes": [],
  "prerequisites": [],
  "trend": "declining"
}
```

---

# 22. Mastery

Base path:

```text
/mastery
```

Mastery must not be calculated from raw accuracy alone.

It can consider:

```text
Accuracy
Difficulty
Recency
Consistency
Repeated Mistakes
Concept Performance
Diagnostic Performance
Practice Performance
Time Efficiency
Prerequisite Readiness
Performance Trend
```

---

## 22.1 Overall Mastery

```http
GET /mastery/me
```

---

## 22.2 Subject Mastery

```http
GET /mastery/me/subjects
```

---

## 22.3 Topic Mastery

```http
GET /mastery/me/topics/{topic_id}
```

---

## 22.4 Mastery Bands

Initial V1:

```text
0-39    needs_attention
40-59   developing
60-79   proficient
80-100  strong
```

The thresholds should be configurable.

---

# 23. AI Adaptive Learning Path

Base path:

```text
/learning-path
```

This is one of the most important parts of TemariHub.

The learning path is **not simply generated from fixed curriculum order**.

It combines:

```text
Student Analytics
+
Mastery
+
Diagnostic Results
+
Practice Results
+
Mistakes
+
Repeated Mistakes
+
Difficulty
+
Recent Trends
+
Curriculum
+
Prerequisites
+
Learning Objectives
+
RAG Knowledge
+
OpenAI Reasoning
```

---

# 24. Learning Path Decision Architecture

```text
                 Student Data
                      │
                      ▼
              Analytics Engine
                      │
                      ▼
               Mastery Engine
                      │
                      ▼
        Strongest / Weakest Areas
                      │
                      ▼
         Curriculum + Prerequisites
                      │
                      ▼
          Candidate Learning Topics
                      │
                      ▼
             RAG Knowledge Base
                      │
                      ▼
                  OpenAI
                      │
                      ▼
          Adaptive Path Decision
                      │
                      ▼
          Personalized Learning Path
```

The AI must operate within curriculum and prerequisite constraints.

It should not invent subjects, topics, or concepts that do not exist in the TemariHub curriculum.

---

# 25. Get Learning Path

```http
GET /learning-path/me
```

### Response

```json
{
  "student_id": "uuid",
  "generated_at": "2026-10-02T18:30:00Z",
  "strongest_subject": {
    "subject_id": "uuid",
    "mastery_score": 82
  },
  "weakest_subject": {
    "subject_id": "uuid",
    "mastery_score": 43
  },
  "recommended": [],
  "in_progress": [],
  "completed": [],
  "locked": []
}
```

---

# 26. Next Learning Action

```http
GET /learning-path/me/next
```

### Response

```json
{
  "action": "study_topic",
  "subject_id": "uuid",
  "topic_id": "uuid",
  "topic_name": "Chemical Equilibrium",
  "reason": "low_mastery_and_repeated_mistakes",
  "priority": 1
}
```

---

# 27. Generate / Recalculate Learning Path

```http
POST /learning-path/me/recalculate
```

This endpoint runs the adaptive learning process.

### Processing

```text
1. Load student activity
2. Analyze diagnostic
3. Analyze practice
4. Analyze mistakes
5. Calculate mastery
6. Identify strong subjects
7. Identify weak subjects
8. Identify weak topics
9. Identify weak concepts
10. Analyze trends
11. Check prerequisites
12. Generate candidate topics
13. Retrieve relevant curriculum knowledge
14. Send structured context to OpenAI
15. Generate personalized path
16. Validate AI output against curriculum
17. Save learning path
18. Return updated path
```

### Response

```json
{
  "updated": true,
  "learning_path_id": "uuid",
  "generated_at": "2026-10-02T18:30:00Z"
}
```

---

# 28. Learning Path Item

Each learning path item should contain information such as:

```json
{
  "id": "uuid",
  "subject_id": "uuid",
  "unit_id": "uuid",
  "topic_id": "uuid",
  "concept_id": "uuid",
  "order": 1,
  "status": "recommended",
  "reason": "weak_concept",
  "priority": 1,
  "mastery_score": 29,
  "target_mastery_score": 70,
  "prerequisites": [],
  "recommended_action": "study_and_practice"
}
```

Possible statuses:

```text
locked
recommended
in_progress
completed
skipped
```

---

# 29. Adaptive Learning Path Rules

The AI should consider:

### Weakness

```text
Low mastery
Low recent accuracy
Repeated mistakes
Poor concept performance
```

### Strength

```text
High mastery
Consistent performance
Strong recent accuracy
Good performance at higher difficulty
```

### Prerequisites

If:

```text
Topic A → prerequisite → Topic B
```

and Topic A is not sufficiently mastered, the system can recommend Topic A before Topic B.

### Difficulty

The system should avoid repeatedly giving questions that are far above or below the student's current level.

### Recency

Recent performance should have meaningful influence so that the path adapts as the student improves.

---

# 30. AI Learning Path Output

The AI should return structured data, not only natural language.

Example:

```json
{
  "recommendations": [
    {
      "subject_id": "uuid",
      "topic_id": "uuid",
      "concept_id": "uuid",
      "priority": 1,
      "reason": "weak_concept",
      "recommended_action": "review_prerequisite"
    },
    {
      "subject_id": "uuid",
      "topic_id": "uuid",
      "priority": 2,
      "reason": "low_mastery",
      "recommended_action": "study"
    },
    {
      "subject_id": "uuid",
      "topic_id": "uuid",
      "priority": 3,
      "reason": "practice_needed",
      "recommended_action": "practice"
    }
  ]
}
```

The backend validates this output before storing it.

---

# 31. Recommendations

Base path:

```text
/recommendations
```

## 31.1 Get Recommendations

```http
GET /recommendations/me
```

### Response

```json
{
  "items": [
    {
      "type": "study_topic",
      "topic_id": "uuid",
      "priority": 1,
      "reason": "low_mastery_and_repeated_mistakes",
      "signals": {
        "mastery_score": 38,
        "recent_accuracy": 35,
        "repeat_mistakes": 5
      }
    },
    {
      "type": "practice_topic",
      "topic_id": "uuid",
      "priority": 2,
      "reason": "insufficient_practice"
    },
    {
      "type": "review_prerequisite",
      "topic_id": "uuid",
      "priority": 3,
      "reason": "prerequisite_not_mastered"
    }
  ]
}
```

---

# 32. RAG

Base path:

```text
/rag
```

RAG provides educational knowledge to the adaptive system and AI tutor.

Possible sources:

```text
Textbooks
Curriculum materials
Contributor resources
Study notes
Approved explanations
Examples
Learning resources
Practice explanations
```

---

# 33. RAG Search

```http
POST /rag/search
```

### Request

```json
{
  "query": "Explain equilibrium constant",
  "subject_id": "uuid",
  "topic_id": "uuid",
  "concept_id": "uuid",
  "top_k": 5
}
```

### Response

```json
{
  "results": [
    {
      "resource_id": "uuid",
      "chunk_id": "uuid",
      "title": "Grade 12 Chemistry",
      "content": "Relevant educational content...",
      "subject_id": "uuid",
      "topic_id": "uuid",
      "concept_id": "uuid",
      "relevance_score": 0.91
    }
  ]
}
```

---

# 34. RAG Metadata Filtering

Retrieval can use:

```text
Grade
Stream
Subject
Unit
Topic
Concept
Language
Source Type
Resource
```

The system should combine:

```text
Semantic similarity
+
Curriculum metadata
+
Student context
```

rather than relying only on vector similarity.

---

# 35. Personalized AI Tutor

```http
POST /rag/chat
```

### Request

```json
{
  "message": "I don't understand equilibrium constant.",
  "conversation_id": "uuid",
  "topic_id": "uuid",
  "concept_id": "uuid"
}
```

The backend automatically retrieves the student's learning context.

---

# 36. Student Context for AI

The AI tutor may receive:

```text
Student Grade
Stream
Strongest Subject
Weakest Subject
Current Subject
Current Topic
Current Concept
Mastery
Recent Accuracy
Historical Accuracy
Difficulty Performance
Average Time
Mistakes
Repeated Mistakes
Prerequisites
Current Learning Path
Recent Progress
Learning Objectives
```

Example:

```json
{
  "student_context": {
    "grade": 12,
    "stream": "natural_science",
    "strongest_subject": "Mathematics",
    "weakest_subject": "Chemistry",
    "current_subject": "Chemistry",
    "current_topic": "Chemical Equilibrium",
    "current_concept": "Equilibrium Constant",
    "mastery_score": 29,
    "recent_accuracy": 31,
    "repeat_mistakes": 4,
    "recommended_level": "beginner"
  }
}
```

---

# 37. AI Tutor Response

```json
{
  "conversation_id": "uuid",
  "message_id": "uuid",
  "answer": "Let's understand equilibrium constant step by step...",
  "sources": [
    {
      "resource_id": "uuid",
      "chunk_id": "uuid",
      "title": "Grade 12 Chemistry",
      "topic_id": "uuid",
      "concept_id": "uuid"
    }
  ],
  "context": {
    "current_topic": "Chemical Equilibrium",
    "current_concept": "Equilibrium Constant",
    "student_mastery": 29
  }
}
```

The AI must not invent student performance data.

---

# 38. RAG Conversations

## 38.1 List

```http
GET /rag/conversations
```

## 38.2 Get Conversation

```http
GET /rag/conversations/{conversation_id}
```

---

# 39. RAG Resource Management

Admin only.

## 39.1 Create Resource

```http
POST /rag/resources
```

### Request

```json
{
  "title": "Grade 12 Chemistry Textbook",
  "source_type": "textbook",
  "grade": 12,
  "stream": "natural_science",
  "subject_id": "uuid",
  "unit_id": "uuid",
  "topic_id": "uuid",
  "concept_id": "uuid",
  "language": "en",
  "content": "Educational content..."
}
```

---

# 40. Resource Indexing Pipeline

```text
Resource
   ↓
Validate
   ↓
Clean
   ↓
Normalize
   ↓
Chunk
   ↓
Attach Curriculum Metadata
   ↓
Generate Embeddings
   ↓
Store in pgvector
```

---

# 41. Reindex Resource

```http
POST /rag/resources/{resource_id}/reindex
```

---

# 42. Delete Resource

```http
DELETE /rag/resources/{resource_id}
```

---

# 43. Progress

Base path:

```text
/progress
```

## 43.1 Summary

```http
GET /progress/me/summary
```

### Response

```json
{
  "questions_attempted": 420,
  "correct": 289,
  "accuracy_pct": 68.8,
  "topics_completed": 17,
  "subjects_started": 4,
  "learning_streak_days": 6
}
```

---

## 43.2 Subject Progress

```http
GET /progress/me/subjects/{subject_id}
```

---

# 44. Dashboard

```http
GET /api/v1/dashboard/me/
```

**Auth:** Bearer JWT required. Always scoped to the authenticated student — no student id parameter.

### Response envelope

```json
{
  "success": true,
  "message": "Dashboard retrieved successfully",
  "data": {
    "overview": {
      "full_name": "Selam Bekele",
      "grade": 12,
      "stream": "natural_science",
      "onboarded": true,
      "onboarding_status": "COMPLETED",
      "learning_goals": ["entrance_exam_prep"],
      "selected_subjects": [],
      "subject_summaries": [],
      "overall_progress": null,
      "strongest_subject": null,
      "weakest_subject": null
    },
    "topic_performance": {
      "strong_topics": [],
      "weak_topics": [],
      "available": false
    },
    "current_learning": {
      "current_topic": null,
      "recommended_activity": null,
      "available": false
    },
    "engagement": {
      "streak": 0,
      "recent_activity": [],
      "available": true
    },
    "learning_status": {
      "diagnostic": { "status": "unavailable", "completed": false, "detail": null },
      "practice": { "status": "unavailable", "sessions_count": null, "detail": null },
      "learning_path": { "status": "unavailable", "progress": null, "detail": null }
    },
    "data_availability": {
      "onboarding": true,
      "profile": true,
      "selected_subjects": true,
      "mastery": false,
      "topic_performance": false,
      "recommendations": false,
      "streak": true,
      "recent_activity": true,
      "diagnostic": false,
      "practice": false,
      "learning_path": false
    },
    "profile_context": {
      "school": null,
      "city": null,
      "preferences": {}
    }
  }
}
```

### Notes

- The dashboard aggregates existing domains; it does **not** invent a second mastery formula. Mastery fields are read from the `mastery` app (`TopicMastery` + `compute_student_mastery_snapshot`).
- `overall_progress` is the mean of eligible topic mastery scores (0–100, one decimal). `null` means no eligible mastery rows (unavailable); `0.0` means genuine zero mastery.
- Eligible topics require `questions_attempted >= 3`. Unattempted / under-observed topics are excluded from rankings and are **not** treated as weak.
- Strong topics: mastery ≥ 80 (`strong` band). Weak topics: mastery ≤ 39 (`needs_attention` band). Bands: API contract §22.4.
- Strongest subject: highest subject mastery (≥1 eligible subject). Weakest: lowest subject mastery, only when ≥2 eligible subjects. Subject mastery = mean of that subject's eligible topic scores. Ties: strongest breaks by name/id ascending; weakest by name/id descending.
- **Current topic / next activity / learning-path progress** come from the `learning_path` app (`compute_learning_path_snapshot`). The dashboard never reimplements sequencing rules.
- V1 learning-path rules: no prerequisite locks; incomplete path topics ranked by ascending mastery (`null` = lowest), then topic name/id; prefer a stored `in_progress` item when still incomplete.
- Next activity types: `study_topic` (never practiced) or `practice` (practiced but mastery &lt; 80). V1 does **not** emit `review_prerequisite`. Completed topics (mastery ≥ 80) are not recommended again.
- Learning-path progress = `(topics with mastery ≥ 80) / (topics on the path) × 100` (one decimal). Empty path (no selected-subject topics) → `progress: null`, `status: "unavailable"`, `current_learning.available: false`. All complete → `status: "completed"`, no next activity.
- Path status vocabulary on the dashboard: `unavailable` | `not_started` | `in_progress` | `completed`.
- **Streak / recent activity** come from the `engagement` app (`compute_engagement_snapshot`). No separate streak counter table — days are derived from `LearningActivityEvent` rows.
- V1 qualifying learning day: at least one completed mastery write with `questions_attempted > 0` (recorded when practice/diagnostic writers call `upsert_topic_mastery`). Auth, profile, and zero-attempt mastery writes do **not** qualify.
- Calendar days use Django `TIME_ZONE` (`UTC`) with `USE_TZ=True`. Streak unit is days. Active today → consecutive days ending today; else active yesterday → consecutive days ending yesterday; else `0`. Multiple events on one day count once. No history → streak `0`, `recent_activity: []`, `engagement.available: true`.
- Recent activity: newest-first feed (default limit 10) of `{ type, title, status, timestamp }` (plus `topic_id` / `activity_date` when present). Timestamps are timezone-aware UTC/ISO 8601. One practice entry per topic per calendar day.
- **Diagnostic status / practice activity (missing backend domains):** There is currently **no** Django app, model, or service for diagnostic assessments (`/diagnostic`) or practice sessions (`/practice`). The dashboard therefore returns:
  - `learning_status.diagnostic`: `{ "status": "unavailable", "completed": false, "detail": null }`
  - `learning_status.practice`: `{ "status": "unavailable", "sessions_count": null, "detail": null }`
  - `data_availability.diagnostic` / `data_availability.practice`: `false`
  This is **not** the same as empty history. Once those domains exist, expected mappings are: no diagnostic attempt → `not_started`; active attempt → `in_progress`; finished attempt → `completed` with authorized `detail` (e.g. `completed_at`, results); practice with zero sessions → empty/zero counts with the feature `available`; practice capability missing → keep `unavailable`. The dashboard must call assessment/practice services rather than inventing scores or session rows. Engagement still reflects mastery-backed practice completions separately from the practice *status* block.
- Empty arrays mean the feature exists but the student has no matching items.
- Errors: `401` unauthenticated, using the standard `{ success: false, message, errors }` envelope. Student scope is always the authenticated user — never a client-supplied student id.

The dashboard should consume mastery, learning-path, and engagement (and later assessment, practice, and analytics) results rather than creating its own independent calculations.

---

# 45. Complete Student Learning Profile

TemariHub should maintain a continuously updated student learning profile.

```text
Student
│
├── Profile
│   ├── Grade
│   └── Stream
│
├── Diagnostic
│   ├── Subject Results
│   ├── Topic Results
│   └── Concept Results
│
├── Practice
│   ├── Attempts
│   ├── Accuracy
│   ├── Difficulty
│   └── Time
│
├── Mistakes
│   ├── Mistakes
│   ├── Repeated Mistakes
│   └── Patterns
│
├── Analytics
│   ├── Strongest Subject
│   ├── Weakest Subject
│   ├── Strong Topics
│   └── Weak Topics
│
├── Mastery
│   ├── Subject
│   ├── Unit
│   ├── Topic
│   └── Concept
│
├── Learning Path
│   ├── Recommended
│   ├── In Progress
│   ├── Completed
│   └── Locked
│
└── AI Context
    ├── Current Learning Goal
    ├── Current Topic
    ├── Current Concept
    └── Learning History
```

---

# 46. Strongest and Weakest Subject

TemariHub should identify the student's strongest and weakest subjects dynamically.

It should consider:

```text
Subject accuracy
Question difficulty
Diagnostic performance
Practice performance
Recent performance
Historical performance
Repeated mistakes
Time efficiency
Concept mastery
Topic mastery
Trend
Number of attempts
```

Therefore:

```text
weakest_subject != simply lowest_accuracy_subject
```

The system should use a versioned mastery algorithm so the scoring methodology can evolve without breaking the API.

---

# 47. Adaptive Learning Example

Suppose:

```text
Mathematics       82%
Physics           67%
Biology           76%
Chemistry         43%
```

The system examines Chemistry:

```text
Chemistry
│
├── Organic Chemistry       72%
├── Stoichiometry            61%
├── Thermochemistry          55%
├── Acids & Bases            42%
└── Chemical Equilibrium     38%
```

Then:

```text
Weakest Subject
      ↓
Chemistry
      ↓
Weakest Topic
      ↓
Chemical Equilibrium
      ↓
Weakest Concept
      ↓
Equilibrium Constant
      ↓
Check prerequisites
      ↓
Retrieve curriculum knowledge
      ↓
AI generates adaptive path
```

Possible result:

```text
1. Review Mole Concept
2. Study Chemical Equilibrium fundamentals
3. Study Equilibrium Constant
4. Solve basic questions
5. Solve medium questions
6. Review repeated mistakes
7. Take mini-assessment
8. Recalculate mastery
9. Continue or redirect
```

---

# 48. Dynamic Recalculation

The learning path must change when new evidence appears.

Example:

```text
Initial:
Chemical Equilibrium = 38%
       ↓
Learning Path recommends review
       ↓
Student practices
       ↓
New mastery = 58%
       ↓
Analytics recalculates
       ↓
AI reviews new state
       ↓
Learning path changes
       ↓
Student moves to next concept
```

Therefore the learning path is:

```text
Dynamic
Adaptive
Evidence-based
Prerequisite-aware
Student-specific
```

---

# 49. AI Learning Path Safety / Validation

OpenAI should not have unrestricted authority to create arbitrary curriculum.

Before an AI-generated learning path is saved:

```text
AI Output
   ↓
Backend Validation
   ↓
Does topic exist?
   ↓
Does concept belong to topic?
   ↓
Are prerequisites valid?
   ↓
Is subject correct?
   ↓
Is topic appropriate for student's grade/stream?
   ↓
Valid?
   ├── YES → Save
   └── NO  → Reject / Regenerate
```

This keeps the AI flexible while keeping TemariHub's curriculum authoritative.

---

# 50. Responsibility of Each Component

| Component                | Responsibility                                                           |
| ------------------------ | ------------------------------------------------------------------------ |
| Django + DRF             | API, authentication, business logic                                      |
| PostgreSQL               | Student/application data                                                 |
| pgvector                 | Semantic vector retrieval                                                |
| Analytics Engine         | Analyze student behavior                                                 |
| Mastery Engine           | Calculate learning mastery                                               |
| Curriculum Engine        | Curriculum/prerequisite constraints                                      |
| Adaptive Learning Engine | Determine candidate learning actions                                     |
| RAG                      | Retrieve relevant educational knowledge                                  |
| OpenAI                   | Reason over student context + knowledge and generate personalized output |
| Recommendation Engine    | Expose explainable recommendations                                       |
| Dashboard API            | Aggregate personalized information                                       |

---

# 51. Most Important Separation

TemariHub should **not** implement:

```text
RAG = simple chatbot
```

Instead:

```text
                 TEMARIHUB AI
                      │
        ┌─────────────┴─────────────┐
        │                           │
 Student Understanding        Educational Knowledge
        │                           │
        ▼                           ▼
 Analytics + Mastery              RAG
        │                           │
        └─────────────┬─────────────┘
                      ▼
                 OpenAI Reasoning
                      │
                      ▼
          Adaptive Learning Decision
                      │
             ┌────────┴────────┐
             ▼                 ▼
       Learning Path       AI Tutor
```

The **analytics engine provides evidence about the student**.

The **RAG system provides evidence about the educational content**.

The **AI layer connects the two** to produce a personalized learning experience.

---

# 52. Complete API Module List

```text
/api/v1

/auth
├── register
├── login
├── phone/send-otp
├── phone/verify-otp
├── 2fa/setup
├── 2fa/verify
├── 2fa/login
├── 2fa/disable
├── apple
├── refresh
├── logout
├── me
├── onboarding
└── change-password
|__ forgot-password

/curriculum
├── subjects
├── subjects/{id}/units
├── units/{id}/topics
├── topics/{id}
└── topics/{id}/prerequisites

/questions
├── create
├── list
└── detail

/diagnostic
├── start
├── {id}/answer
├── {id}/complete
└── {id}/results

/practice
├── sessions
├── sessions/{id}/answer
├── sessions/{id}/complete
└── sessions/{id}/retry/{question_id}

/mistakes
├── me
└── practice

/analytics
├── me
├── me/subjects
├── me/topics
└── me/topics/{topic_id}

/mastery
├── me
├── me/subjects
└── me/topics/{topic_id}

/learning-path
├── me
├── me/next
└── me/recalculate

/recommendations
└── me

/rag
├── search
├── chat
├── conversations
├── conversations/{id}
├── resources
├── resources/{id}/reindex
└── resources/{id}

/progress
├── me/summary
└── me/subjects/{subject_id}

/dashboard
└── me
```

# 53. Final V1 Learning Architecture

The central idea of TemariHub V1 is:

```text
                    STUDENT
                       │
                       ▼
              Diagnostic + Practice
                       │
                       ▼
              Student Activity Data
                       │
                       ▼
             ┌───────────────────┐
             │ Analytics Engine  │
             └─────────┬─────────┘
                       │
                       ▼
                Mastery Analysis
                       │
                       ▼
          Strongest / Weakest Areas
                       │
                       ▼
          Curriculum + Prerequisites
                       │
                       ▼
             Candidate Learning Path
                       │
                       ▼
               RAG Knowledge
                       │
                       ▼
                    OpenAI
                       │
                       ▼
           Adaptive Learning Decision
                       │
             ┌─────────┴─────────┐
             ▼                   ▼
       Learning Path         AI Tutor
             │                   │
             └─────────┬─────────┘
                       ▼
                    Student
                       │
                       ▼
                 New Practice
                       │
                       └──────────► Analytics
```

**Core principle:**

> **TemariHub should continuously learn about the student, not just teach the student.**

The student's diagnostic and practice history becomes evidence. Analytics and mastery interpret that evidence. Curriculum and prerequisites provide constraints. RAG provides trusted educational knowledge. OpenAI uses the combined context to help generate and explain an adaptive learning path. The student's new activity then feeds back into the system and the path is recalculated.
