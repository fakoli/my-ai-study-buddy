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

### Decks - Flashcard Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/decks` | List all decks |
| POST | `/decks` | Create new deck |
| GET | `/decks/{deck_id}` | Get deck with cards |
| PUT | `/decks/{deck_id}` | Update deck metadata |
| DELETE | `/decks/{deck_id}` | Delete deck |
| POST | `/decks/{deck_id}/cards` | Add card to deck |
| PUT | `/decks/{deck_id}/cards/{card_id}` | Update card |
| DELETE | `/decks/{deck_id}/cards/{card_id}` | Remove card |

### Reviews - Spaced Repetition

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/reviews` | Submit review (card_id, difficulty) |
| GET | `/reviews/due` | Get cards due for review |
| GET | `/reviews/history` | Review history for analytics |

### Quiz - Generation and Submission

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/quiz/generate` | Generate quiz |
| POST | `/quiz/submit` | Submit answers, get scored results |
| GET | `/quiz/{quiz_id}` | Retrieve quiz and results |

### Progress - Stats and History

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/progress/stats` | Overall stats |
| GET | `/progress/sessions` | Session history |
| GET | `/progress/topics` | Per-topic mastery |

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

---

## Data Models

### User

```python
class User(BaseModel):
    id: str
    email: str
    name: str
    created_at: datetime
    token_balance: int = 100
```

### Deck and Card

```python
class Deck(BaseModel):
    id: str
    user_id: str
    title: str
    description: str | None = None
    created_at: datetime
    updated_at: datetime

class Card(BaseModel):
    id: str
    deck_id: str
    front: str
    back: str
    visual_url: str | None = None
    created_at: datetime
```

### Review

```python
class Difficulty(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"

class Review(BaseModel):
    id: str
    user_id: str
    card_id: str
    difficulty: Difficulty
    reviewed_at: datetime
    next_review_at: datetime
```

### Quiz

```python
class QuizQuestion(BaseModel):
    id: str
    question: str
    options: list[str]
    correct_index: int
    explanation: str | None = None

class Quiz(BaseModel):
    id: str
    user_id: str
    deck_id: str | None = None
    topic: str | None = None
    questions: list[QuizQuestion]
    created_at: datetime

class QuizSubmission(BaseModel):
    quiz_id: str
    answers: list[int]
    submitted_at: datetime
    score: float
    results: list[QuestionResult]

class QuestionResult(BaseModel):
    question_id: str
    selected: int
    correct: int
    is_correct: bool
```

### Progress

```python
class ProgressStats(BaseModel):
    user_id: str
    total_cards_reviewed: int
    total_quizzes_completed: int
    accuracy_rate: float
    current_streak: int
    longest_streak: int
    time_spent_minutes: int

class Session(BaseModel):
    id: str
    user_id: str
    started_at: datetime
    ended_at: datetime | None
    activity_type: Literal["review", "quiz", "reference"]
    items_completed: int
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
