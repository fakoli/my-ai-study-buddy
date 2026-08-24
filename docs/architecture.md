# Study Buddy - Architecture

## Stack Overview

| Layer | Technology | Notes |
|-------|------------|-------|
| Frontend | React + TypeScript | Vite build tooling |
| Backend | Python 3.11+ / FastAPI | Async-first |
| Data Models | Pydantic v2 | Strict validation |
| Content Storage | Markdown files | Version controlled |
| Local Persistence | JSON files | Development use |
| Production DB | SQLite or Supabase | Environment configured |
| Email | Mailgun | Transactional and scheduled |
| SMS | TBD (Twilio) | Daily quizzes, hints |

---

## API Routes

Base URL: `/api/v1`

### Progress - Learning Progress Tracking

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/progress/dashboard` | Dashboard statistics |
| POST | `/progress/modules/{course_id}/{module_id}` | Record module progress |
| GET | `/progress/modules/{course_id}/{module_id}` | Get module progress |
| GET | `/progress/courses/{course_id}` | Course progress status |
| GET | `/progress/paths/{path_id}` | Learning path progress |
| GET | `/progress/activity` | Recent activity feed |
| GET | `/progress/next-up` | Recommended next items |
| GET | `/progress/stats` | Overall stats (deprecated) |
| GET | `/progress/sessions` | Session history (deprecated) |
| GET | `/progress/topics` | Per-topic mastery (deprecated) |

### Flashcard Ratings - Study Difficulty Tracking

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/courses/{course_id}/modules/{module_id}/flashcards/rate` | Rate a flashcard |
| GET | `/courses/{course_id}/modules/{module_id}/flashcards/ratings` | Get user's ratings |
| GET | `/courses/{course_id}/modules/{module_id}/flashcards/summary` | Rating summary |
| GET | `/courses/{course_id}/modules/{module_id}/flashcards/ratings-with-summary` | Ratings + summary |
| GET | `/courses/{course_id}/modules/{module_id}/flashcards/filter` | Filter by rating |
| GET | `/courses/{course_id}/feedback/unhelpful-cards` | Author feedback |

### References - Study Material

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/references` | List reference materials |
| GET | `/references/{topic}` | Get rendered content |
| GET | `/references/{topic}/visuals` | Get visual aids |

### AI - Assistance

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/ai/explain` | Explain a concept |
| POST | `/ai/hint` | Progressive hint |
| POST | `/ai/examples` | Generate examples |
| POST | `/ai/simplify` | Simpler explanation |

### Auth - Users and Tokens

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Create account |
| POST | `/auth/login` | Authenticate |
| POST | `/auth/logout` | Invalidate session |
| GET | `/auth/me` | Current user profile |
| GET | `/auth/tokens` | Token balance |
| POST | `/auth/tokens/consume` | Deduct tokens |

### Notifications - Preferences and Delivery

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/notifications/preferences` | Get settings |
| PUT | `/notifications/preferences` | Update settings |
| GET | `/notifications/history` | Sent notifications |
| POST | `/notifications/test/email` | Test email delivery |
| POST | `/notifications/test/sms` | Test SMS delivery |

### Courses - Course Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/courses` | List all accessible courses |
| GET | `/courses/mine` | List courses authored by current user |
| GET | `/courses/discover` | Browse/search public courses (with filters) |
| POST | `/courses` | Create new course |
| GET | `/courses/{course_id}` | Get course with modules |
| PUT | `/courses/{course_id}` | Update course metadata |
| DELETE | `/courses/{course_id}` | Delete course and modules |

### Modules - Course Content

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/courses/{course_id}/modules` | List modules for a course |
| POST | `/courses/{course_id}/modules` | Create new module |
| POST | `/courses/{course_id}/modules/batch` | Batch create modules |
| GET | `/courses/{course_id}/modules/{module_id}` | Get module by ID |
| PUT | `/courses/{course_id}/modules/{module_id}` | Update module |
| DELETE | `/courses/{course_id}/modules/{module_id}` | Delete module |
| PUT | `/courses/{course_id}/modules/reorder` | Reorder modules |

### Learning Paths - Curriculum Organization

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/paths` | List accessible learning paths |
| GET | `/paths/mine` | List paths owned by current user |
| POST | `/paths` | Create learning path |
| GET | `/paths/{path_id}` | Get path with courses |
| PUT | `/paths/{path_id}` | Update path metadata |
| DELETE | `/paths/{path_id}` | Delete learning path |
| POST | `/paths/{path_id}/courses` | Add course to path |
| DELETE | `/paths/{path_id}/courses/{course_id}` | Remove course from path |
| PUT | `/paths/{path_id}/courses/reorder` | Reorder courses in path |

### AI Generation - Content Creation

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/generate/suggest-modules` | Generate module structure (10 tokens) |
| POST | `/generate/module-content` | Generate full module content (25 tokens) |
| POST | `/generate/flashcards` | Generate flashcards (8 tokens) |
| POST | `/generate/quiz` | Generate quiz (10 tokens) |
| POST | `/generate/visual` | Generate educational image (5 tokens) |
| POST | `/generate/full-course` | Generate entire course with orchestration (variable) |

### Admin - User Management (Admin only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/stats` | Admin dashboard statistics |
| GET | `/admin/users` | List all users (with search/pagination) |
| GET | `/admin/users/{user_id}` | User details with transaction history |
| PUT | `/admin/users/{user_id}/tokens` | Adjust user token balance |

### User Settings - API Keys

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/settings/api-keys` | List configured API keys |
| POST | `/settings/api-keys` | Set/update API key |
| DELETE | `/settings/api-keys/{provider}` | Delete API key |
| POST | `/settings/api-keys/{provider}/validate` | Validate stored API key |

### Image Uploads

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/uploads/images/{course_id}` | Upload image file |
| POST | `/uploads/images/{course_id}/from-url` | Download and store image from URL |
| GET | `/uploads/courses/{course_id}/images/{filename}` | Serve uploaded image |

---

## Data Models

### User

```python
class UserRole(str, Enum):
    USER = "user"
    ADMIN = "admin"

class User(BaseModel):
    id: str
    email: EmailStr
    name: str
    created_at: datetime
    token_balance: int = 100
    role: UserRole = UserRole.USER
```

### Progress

```python
class ModuleProgressStatus(BaseModel):
    """Progress status for a single module."""
    module_id: str
    module_title: str
    status: Literal["not_started", "in_progress", "completed"] = "not_started"
    started_at: datetime | None = None
    completed_at: datetime | None = None
    content_read: bool = False
    flashcards_reviewed: int = 0
    flashcards_total: int = 0
    quiz_score: float | None = None
    quiz_attempts: int = 0
    time_spent_minutes: int = 0

class ModuleProgress(BaseModel):
    """User's progress on a specific module."""
    id: str
    user_id: str
    module_id: str
    course_id: str
    status: Literal["not_started", "in_progress", "completed"] = "not_started"
    started_at: datetime | None = None
    completed_at: datetime | None = None
    content_read: bool = False
    flashcards_reviewed: int = 0
    quiz_score: float | None = None
    quiz_attempts: int = 0
    time_spent_minutes: int = 0
    created_at: datetime
    updated_at: datetime

class CourseProgressStatus(BaseModel):
    """Progress status for a course."""
    course_id: str
    course_title: str
    total_modules: int = 0
    completed_modules: int = 0
    in_progress_modules: int = 0
    completion_percentage: float = 0.0
    average_quiz_score: float | None = None
    total_time_spent_minutes: int = 0
    modules: list[ModuleProgressStatus] = []

class PathProgressStatus(BaseModel):
    """Progress status for a learning path."""
    path_id: str
    path_title: str
    total_courses: int = 0
    completed_courses: int = 0
    in_progress_courses: int = 0
    completion_percentage: float = 0.0
    total_time_spent_minutes: int = 0
    courses: list[CourseProgressStatus] = []

class DashboardStats(BaseModel):
    """User's overall learning dashboard statistics."""
    user_id: str
    active_paths: int = 0
    courses_in_progress: int = 0
    courses_completed: int = 0
    modules_completed_week: int = 0
    modules_completed_month: int = 0
    modules_completed_total: int = 0
    average_quiz_score: float | None = None
    total_quizzes_taken: int = 0
    total_study_time_minutes: int = 0
    current_streak: int = 0
    longest_streak: int = 0

class RecentActivity(BaseModel):
    """A single recent activity entry."""
    id: str
    user_id: str
    activity_type: Literal["module_started", "module_completed", "quiz_submitted", "content_read"]
    module_id: str | None = None
    module_title: str | None = None
    course_id: str | None = None
    course_title: str | None = None
    details: dict = {}
    created_at: datetime

class NextUpItem(BaseModel):
    """Recommended next module/course to study."""
    item_type: Literal["module", "course"]
    module_id: str | None = None
    module_title: str | None = None
    course_id: str
    course_title: str
    reason: str  # e.g., "Continue where you left off", "Next in path"
```

### Flashcard Ratings

```python
class FlashcardRating(str, Enum):
    """Rating options for flashcards."""
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"
    UNHELPFUL = "unhelpful"

class FlashcardRatingRecord(BaseModel):
    """A user's rating for a specific flashcard."""
    id: str
    user_id: str
    course_id: str
    module_id: str
    flashcard_index: int
    flashcard_id: str | None = None
    rating: FlashcardRating
    created_at: datetime
    updated_at: datetime

class RateFlashcardRequest(BaseModel):
    """Request to rate a flashcard."""
    flashcard_index: int
    flashcard_id: str | None = None
    rating: FlashcardRating

class FlashcardRatingSummary(BaseModel):
    """Summary of ratings for a module's flashcards."""
    total: int
    unrated: int
    easy: int
    medium: int
    hard: int
    unhelpful: int

class FilteredFlashcard(BaseModel):
    """A flashcard with its rating status."""
    index: int
    id: str | None = None
    front: str
    back: str
    visual: str | None = None
    rating: FlashcardRating | None = None
```

### Notifications

```python
class NotificationChannel(str, Enum):
    EMAIL = "email"
    SMS = "sms"

class NotificationType(str, Enum):
    REMINDER = "reminder"
    DAILY_QUIZ = "daily_quiz"
    HINT = "hint"
    ENCOURAGEMENT = "encouragement"
    PROGRESS_SUMMARY = "progress_summary"

class NotificationPreferences(BaseModel):
    user_id: str

    # Email
    email_enabled: bool = True
    email_address: str

    # SMS
    sms_enabled: bool = False
    phone_number: str | None = None

    # Scheduling
    daily_quiz_enabled: bool = True
    daily_quiz_time: str = "09:00"
    daily_quiz_channel: NotificationChannel = NotificationChannel.SMS

    reminder_frequency: Literal["daily", "every_other_day", "weekly", "none"] = "daily"
    reminder_channel: NotificationChannel = NotificationChannel.EMAIL

    progress_summary_enabled: bool = True
    progress_summary_day: Literal["monday", "friday", "sunday"] = "monday"
    progress_summary_channel: NotificationChannel = NotificationChannel.EMAIL

    # Quiet hours
    quiet_hours_enabled: bool = False
    quiet_hours_start: str = "22:00"
    quiet_hours_end: str = "08:00"
    timezone: str = "America/Los_Angeles"

    # Per-type
    send_encouragement: bool = True
    send_hints: bool = True

class NotificationRecord(BaseModel):
    id: str
    user_id: str
    channel: NotificationChannel
    notification_type: NotificationType
    content: str
    sent_at: datetime
    delivered: bool
    delivery_status: str | None = None
```

### Course and CourseInstructions

```python
class CourseInstructions(BaseModel):
    purpose: str
    target_audience: str
    learning_objectives: list[str] = []
    tone: str = "Technical but approachable, visual-first"
    additional_context: str | None = None

class Course(BaseModel):
    id: str
    title: str
    description: str | None = None
    thumbnail_url: str | None = None
    difficulty: Literal["beginner", "intermediate", "advanced"] = "beginner"
    tags: list[str] = []
    visibility: Literal["private", "unlisted", "public"] = "private"
    source: Literal["filesystem", "database"] = "database"
    author_id: str
    author_name: str
    ai_enabled: bool = False
    instructions: CourseInstructions | None = None
    times_added: int = 0
    created_at: datetime
    updated_at: datetime
```

### Module

```python
class FlashcardData(BaseModel):
    """Flashcard within a module."""
    id: str | None = None  # Optional ID for tracking ratings
    front: str
    back: str
    visual: str | None = None

class QuizQuestionData(BaseModel):
    """Quiz question within a module."""
    question: str
    options: list[str]
    correct_index: int
    explanation: str | None = None

class QuizData(BaseModel):
    """Quiz for a module."""
    questions: list[QuizQuestionData] = []

class SandboxData(BaseModel):
    """Code sandbox for hands-on practice within a module."""
    language: Literal["python", "javascript"] = "python"
    starter_code: str = ""
    solution_code: str | None = None
    instructions: str | None = None

class Module(BaseModel):
    id: str
    course_id: str
    title: str
    order_index: int
    content_markdown: str = ""
    flashcards: list[FlashcardData] = []
    quiz: QuizData | None = None
    sandbox: SandboxData | None = None
    created_at: datetime
    updated_at: datetime
```

### Learning Path

```python
class LearningPath(BaseModel):
    id: str
    owner_id: str
    title: str
    description: str | None = None
    thumbnail_url: str | None = None
    difficulty: Literal["beginner", "intermediate", "advanced"] = "beginner"
    estimated_hours: int | None = None
    course_ids: list[str] = []
    visibility: Literal["private", "unlisted", "public"] = "private"
    created_at: datetime
    updated_at: datetime
```

### Token Transaction

```python
class TokenTransaction(BaseModel):
    id: str
    user_id: str
    amount: int  # positive = credit, negative = debit
    balance_after: int
    operation: str  # "admin_adjustment", "generate_content", etc.
    reason: str | None = None
    admin_id: str | None = None
    created_at: datetime
```

### AI Connection (Anvil Router)

```python
class Settings(BaseSettings):
    # ...
    anvil_router_base_url: str | None = None  # e.g. https://fakoli-dark.tail4378d.ts.net/v1
    anvil_router_token: str | None = None
    anvil_model: str = "llm.primary"          # text generation route
    anvil_image_model: str = "gemini-nano-banana"  # image generation (Gemini nano banana, only image model right now)
```

All AI text and image generation routes through a single self-hosted Anvil
Serving router (OpenAI-compatible `/v1/chat/completions`). No per-user API keys.

---

## Error Codes

All API errors return a structured JSON response:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": {}
  }
}
```

### Error Code Reference

| Category | Code | HTTP Status | Description |
|----------|------|-------------|-------------|
| **General** | `VALIDATION_ERROR` | 422 | Request validation failed |
| | `INTERNAL_ERROR` | 500 | Server error |
| **Auth** | `UNAUTHORIZED` | 401 | Missing/invalid auth |
| | `INVALID_TOKEN` | 401 | JWT token invalid/expired |
| | `INVALID_CREDENTIALS` | 401 | Wrong email/password |
| **Access** | `FORBIDDEN` | 403 | Permission denied |
| | `ACCESS_DENIED` | 403 | Resource access denied |
| **Resources** | `NOT_FOUND` | 404 | Generic not found |
| | `USER_NOT_FOUND` | 404 | User doesn't exist |
| | `COURSE_NOT_FOUND` | 404 | Course doesn't exist |
| | `MODULE_NOT_FOUND` | 404 | Module doesn't exist |
| | `LEARNING_PATH_NOT_FOUND` | 404 | Learning path doesn't exist |
| | `FLASHCARD_NOT_FOUND` | 404 | Flashcard doesn't exist |
| **Authoring** | `COURSE_NOT_EDITABLE` | 403 | User can't edit this course |
| | `INVALID_MODULE_ORDER` | 400 | Invalid module ordering |
| | `IMAGE_DOWNLOAD_FAILED` | 400 | Failed to download image |
| | `INVALID_IMAGE_FORMAT` | 400 | Unsupported image format |
| **Conflict** | `CONFLICT` | 409 | Resource conflict |
| | `EMAIL_ALREADY_EXISTS` | 409 | Email already registered |
| **Tokens** | `INSUFFICIENT_TOKENS` | 402 | Not enough tokens |
| **AI** | `AI_SERVICE_ERROR` | 503 | AI service failed |
| | `AI_SERVICE_UNAVAILABLE` | 503 | AI service offline |

---

## Content Storage

Course content lives in Markdown files for easy authoring and version control.

```
/content
  /courses
    /python-basics
      meta.json
      /modules
        /01-variables
          content.md
          visuals/
          flashcards.json
          quiz.json
        /02-data-types
          content.md
          visuals/
          flashcards.json
          quiz.json
```

### meta.json

```json
{
  "id": "python-basics",
  "title": "Python Basics",
  "description": "Introduction to Python programming",
  "modules": ["01-variables", "02-data-types"],
  "difficulty": "beginner"
}
```

### content.md

Standard Markdown with support for:
- Headers for sections
- Code blocks with syntax highlighting
- Image references to visuals folder
- Callouts for tips and warnings

### flashcards.json

```json
{
  "cards": [
    {
      "front": "What keyword declares a variable in Python?",
      "back": "Python doesn't require a keyword. Just assign: x = 5",
      "visual": "visuals/variable-assignment.png"
    }
  ]
}
```

---

## Persistence Layer

Abstraction allows swapping storage backends via environment configuration.

```python
class StorageBackend(ABC):
    @abstractmethod
    async def get(self, collection: str, id: str) -> dict | None: ...

    @abstractmethod
    async def list(self, collection: str, filters: dict = None) -> list[dict]: ...

    @abstractmethod
    async def create(self, collection: str, data: dict) -> dict: ...

    @abstractmethod
    async def update(self, collection: str, id: str, data: dict) -> dict: ...

    @abstractmethod
    async def delete(self, collection: str, id: str) -> bool: ...
```

### Implementations

| Class | Use Case |
|-------|----------|
| `JSONStorage` | Local development, simple deployments |
| `SQLiteStorage` | Single-instance production |
| `SupabaseStorage` | Cloud, multi-user, built-in auth |

Configuration via environment:

```bash
STORAGE_BACKEND=json      # or sqlite, supabase
STORAGE_PATH=./data       # for json/sqlite
SUPABASE_URL=...          # for supabase
SUPABASE_KEY=...
```

---

## Dashboard

The dashboard provides learner awareness and motivation.

### Key Elements

- **Progress Overview**: Visual of completed vs remaining content
- **Outstanding Work**: Pending quizzes, reviews, tests
- **Streak Tracking**: Consecutive days of activity
- **Encouragement**: Context-aware messages
- **Recent Activity**: Last studied topics and performance
- **Next Action**: Prominent recommended next step

### Design Goals

- Glanceable: understand status in under 5 seconds
- Positive framing: progress made, not just work remaining
- Clear call to action

---

## External Integrations

### Mailgun (Email)

```python
# services/notifications/email_service.py

class EmailService:
    async def send(
        self,
        to: str,
        subject: str,
        template: str,
        context: dict
    ) -> bool: ...
```

Templates:
- `reminder.html` - Study reminders
- `progress_summary.html` - Weekly recap
- `encouragement.html` - Milestone celebrations

### SMS Provider (TBD)

```python
# services/notifications/sms_service.py

class SMSService:
    async def send(self, to: str, message: str) -> bool: ...
    async def handle_reply(self, from_number: str, body: str) -> str: ...
```

Daily quiz format:
```
📚 Daily Quiz: What does len() return?
A) The type
B) The length
C) The value

Reply A, B, or C
```

### Scheduler

Background job scheduling for timed notifications.

```python
# services/notifications/scheduler.py

class NotificationScheduler:
    async def schedule_daily_quizzes(self): ...
    async def schedule_reminders(self): ...
    async def schedule_progress_summaries(self): ...
```
