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

Response:

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

---

## 14.1 Create Question

**Admin only**

```http
POST /questions
```

### Request

```json
{
  "topic_id": "uuid",
  "concept_id": "uuid",
  "prompt": "What is the value of x?",
  "choices": [
    {
      "id": "uuid",
      "text": "2",
      "is_correct": false
    },
    {
      "id": "uuid",
      "text": "4",
      "is_correct": true
    }
  ],
  "explanation": "The correct answer follows from...",
  "difficulty": 3,
  "estimated_time_seconds": 60,
  "source": "Entrance Exam",
  "exam_year": 2025
}
```

---

## 14.2 Get Question

```http
GET /questions/{question_id}
```

The student response must never expose `is_correct`.

---

## 14.3 List Questions

```http
GET /questions?topic_id={id}&difficulty=3&page=1&page_size=20
```

---

# 15. Diagnostic

Base path:

```text
/diagnostic
```

The V1 diagnostic contains 100 questions distributed across relevant subjects.

---

## 15.1 Start

```http
POST /diagnostic/start
```

### Response

```json
{
  "diagnostic_test_id": "uuid",
  "total_questions": 100,
  "sections": [
    {
      "subject_id": "uuid",
      "question_count": 25
    }
  ]
}
```

---

## 15.2 Answer

```http
POST /diagnostic/{diagnostic_test_id}/answer
```

### Request

```json
{
  "question_id": "uuid",
  "selected_choice_id": "uuid",
  "time_spent_seconds": 52
}
```

---

## 15.3 Complete

```http
POST /diagnostic/{diagnostic_test_id}/complete
```

### Response

```json
{
  "overall_score_pct": 64,
  "subjects": [],
  "strong_topics": [],
  "weak_topics": [],
  "completed_at": "2026-10-02T18:30:00Z"
}
```

Completion triggers the analytics/mastery pipeline.

---

## 15.4 Results

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
GET /dashboard/me
```

### Response

```json
{
  "progress_summary": {},
  "strongest_subject": {},
  "weakest_subject": {},
  "weak_topics": [],
  "strong_topics": [],
  "current_topic": {},
  "recommended_next": {},
  "learning_streak": 6,
  "recent_activity": []
}
```

The dashboard should consume analytics and recommendation results rather than creating its own independent mastery calculations.

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
