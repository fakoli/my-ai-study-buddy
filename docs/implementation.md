# Study Buddy - Implementation Guide

## Environment Setup

### Backend

```bash
# Python 3.11+ required
# UV handles virtual environments automatically

uv sync

# Environment variables
cp .env.example .env
# Edit .env with your configuration

# Run development server
uv run uvicorn main:app --reload --port 8000
```

### Frontend

```bash
# Node 18+ required
cd frontend
npm install

# Run development server
npm run dev
```

### Environment Variables

```bash
# .env

# Storage
STORAGE_BACKEND=json
STORAGE_PATH=./data

# Auth
JWT_SECRET=your-secret-key
JWT_EXPIRATION_HOURS=24

# Email (Mailgun)
MAILGUN_API_KEY=your-key
MAILGUN_DOMAIN=your-domain

# SMS (when configured)
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
TWILIO_PHONE_NUMBER=+1234567890

# AI
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=your-key
```

---

## Folder Structure Details

### Backend

```
/backend
  main.py                 # FastAPI app initialization
  config.py               # Settings and environment loading
  dependencies.py         # Dependency injection
  
  /api
    __init__.py
    /routes
      decks.py
      reviews.py
      quiz.py
      progress.py
      references.py
      ai.py
      auth.py
      notifications.py
  
  /models
    __init__.py
    user.py
    deck.py
    card.py
    review.py
    quiz.py
    progress.py
    notification.py
  
  /services
    __init__.py
    deck_service.py
    quiz_service.py
    review_service.py
    progress_service.py
    ai_service.py
    /notifications
      __init__.py
      email_service.py
      sms_service.py
      scheduler.py
      /templates
        reminder.html
        progress_summary.html
  
  /storage
    __init__.py
    base.py               # StorageBackend ABC
    json_storage.py
    sqlite_storage.py
    supabase_storage.py
  
  /tests
    conftest.py
    test_decks.py
    test_quiz.py
    test_reviews.py
```

### Frontend

```
/frontend
  /src
    main.tsx
    App.tsx
    
    /api
      client.ts           # Axios/fetch wrapper
      decks.ts
      quiz.ts
      auth.ts
      notifications.ts
    
    /components
      /common
        Button.tsx
        Card.tsx
        Modal.tsx
      /flashcards
        FlashCard.tsx
        DeckList.tsx
        ReviewSession.tsx
      /quiz
        QuizQuestion.tsx
        QuizResults.tsx
      /dashboard
        ProgressChart.tsx
        StreakDisplay.tsx
        ActionCard.tsx
    
    /pages
      Dashboard.tsx
      Decks.tsx
      Quiz.tsx
      References.tsx
      Settings.tsx
    
    /hooks
      useDecks.ts
      useQuiz.ts
      useProgress.ts
      useNotifications.ts
    
    /types
      index.ts
    
    /utils
      date.ts
      formatting.ts
```

---

## Coding Conventions

### Python

#### Route Handlers

Keep thin. Validate input, call service, return response.

```python
# Good
@router.post("/decks", response_model=DeckResponse)
async def create_deck(
    deck: DeckCreate,
    user: User = Depends(get_current_user),
    deck_service: DeckService = Depends(get_deck_service)
) -> DeckResponse:
    return await deck_service.create(user.id, deck)

# Bad - logic in handler
@router.post("/decks")
async def create_deck(deck: DeckCreate, user: User = Depends(get_current_user)):
    deck_id = str(uuid4())
    now = datetime.utcnow()
    data = {"id": deck_id, "user_id": user.id, "created_at": now, **deck.dict()}
    # ... more logic
```

#### Service Layer

Business logic lives here.

```python
class DeckService:
    def __init__(self, storage: StorageBackend):
        self.storage = storage
    
    async def create(self, user_id: str, deck: DeckCreate) -> Deck:
        data = {
            "id": str(uuid4()),
            "user_id": user_id,
            "title": deck.title,
            "description": deck.description,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        result = await self.storage.create("decks", data)
        return Deck(**result)
    
    async def get_with_cards(self, deck_id: str, user_id: str) -> DeckWithCards:
        deck = await self.storage.get("decks", deck_id)
        if not deck or deck["user_id"] != user_id:
            raise NotFoundException("Deck not found")
        
        cards = await self.storage.list("cards", {"deck_id": deck_id})
        return DeckWithCards(**deck, cards=[Card(**c) for c in cards])
```

#### Type Hints

Always use them.

```python
# Good
async def calculate_next_review(
    card_id: str,
    difficulty: Difficulty,
    current_interval: int
) -> datetime:
    ...

# Bad
async def calculate_next_review(card_id, difficulty, current_interval):
    ...
```

#### Error Handling

Use custom exceptions, handle in middleware.

```python
# exceptions.py
class StudyBuddyException(Exception):
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code

class NotFoundException(StudyBuddyException):
    def __init__(self, message: str = "Not found"):
        super().__init__(message, 404)

class UnauthorizedException(StudyBuddyException):
    def __init__(self, message: str = "Unauthorized"):
        super().__init__(message, 401)
```

### React/TypeScript

#### Components

Functional, focused, typed.

```typescript
// Good
interface FlashCardProps {
  card: Card;
  onFlip: () => void;
  onDifficulty: (difficulty: Difficulty) => void;
  isFlipped: boolean;
}

export function FlashCard({ card, onFlip, onDifficulty, isFlipped }: FlashCardProps) {
  return (
    <div className="flash-card" onClick={onFlip}>
      {isFlipped ? (
        <div className="back">
          <p>{card.back}</p>
          {card.visualUrl && <img src={card.visualUrl} alt="" />}
          <DifficultyButtons onSelect={onDifficulty} />
        </div>
      ) : (
        <div className="front">
          <p>{card.front}</p>
        </div>
      )}
    </div>
  );
}
```

#### Custom Hooks

Encapsulate data fetching and state.

```typescript
export function useQuiz(quizId: string) {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);

  useEffect(() => {
    fetchQuiz(quizId)
      .then(setQuiz)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [quizId]);

  const submitAnswer = (answerIndex: number) => {
    setAnswers([...answers, answerIndex]);
    setCurrentIndex(currentIndex + 1);
  };

  const submit = async () => {
    if (!quiz) return null;
    return await submitQuiz(quiz.id, answers);
  };

  return {
    quiz,
    loading,
    error,
    currentQuestion: quiz?.questions[currentIndex],
    isComplete: quiz ? currentIndex >= quiz.questions.length : false,
    submitAnswer,
    submit,
  };
}
```

#### API Client

Centralized, typed responses.

```typescript
// api/client.ts
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new ApiError(error.message || 'Request failed', response.status);
  }

  return response.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data: unknown) => 
    request<T>(path, { method: 'POST', body: JSON.stringify(data) }),
  put: <T>(path: string, data: unknown) => 
    request<T>(path, { method: 'PUT', body: JSON.stringify(data) }),
  delete: <T>(path: string) => 
    request<T>(path, { method: 'DELETE' }),
};
```

---

## Adding New Content

### New Course

1. Create folder: `/content/courses/course-name/`
2. Add `meta.json` with course metadata
3. Create module folders: `/modules/01-topic-name/`
4. Add `content.md`, `flashcards.json`, `quiz.json` to each module
5. Add visuals to `visuals/` subfolder

### New API Endpoint

1. Define Pydantic models in `/backend/models/`
2. Create service methods in `/backend/services/`
3. Add route handler in `/backend/api/routes/`
4. Register router in `main.py`
5. Add tests in `/backend/tests/`

### New React Component

1. Create component file in appropriate `/components/` subfolder
2. Define props interface
3. Export as named export
4. Add to page or parent component
5. Add tests if complex logic involved

---

## Testing

### Backend

```bash
# All tests
uv run pytest backend/tests/ -v

# Single file
uv run pytest backend/tests/test_decks.py -v

# Single test
uv run pytest backend/tests/test_decks.py::test_create_deck -v

# With coverage
uv run pytest backend/tests/ --cov=backend --cov-report=html
```

Test structure:

```python
# test_decks.py
import pytest
from httpx import AsyncClient

@pytest.fixture
async def client():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac

@pytest.fixture
async def auth_headers(client):
    # Create test user and return auth headers
    ...

async def test_create_deck(client, auth_headers):
    response = await client.post(
        "/api/v1/decks",
        json={"title": "Test Deck", "description": "A test"},
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Test Deck"
```

### Frontend

```bash
# All tests
npm run test

# Watch mode
npm run test -- --watch

# Single file
npm run test -- --filter=FlashCard

# Coverage
npm run test -- --coverage
```

---

## Deployment

### Docker

```dockerfile
# backend/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install UV
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

COPY . .
CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```dockerfile
# frontend/Dockerfile
FROM node:18-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - STORAGE_BACKEND=sqlite
      - STORAGE_PATH=/data/study-buddy.db
    volumes:
      - ./data:/data

  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    depends_on:
      - backend
```

---

## Common Tasks

### Add a new notification type

1. Add to `NotificationType` enum in `models/notification.py`
2. Add preference field to `NotificationPreferences` if user-configurable
3. Create template in `services/notifications/templates/`
4. Add send method in appropriate service (email or SMS)
5. Schedule in `scheduler.py` if time-based

### Implement spaced repetition adjustment

1. Review current algorithm in `services/review_service.py`
2. Modify `calculate_next_review()` based on difficulty
3. Update tests to verify intervals
4. Consider adding user-configurable parameters

### Add visual to reference material

1. Add image to `/content/courses/course/modules/module/visuals/`
2. Reference in `content.md`: `![Alt text](visuals/filename.png)`
3. Or link from flashcard in `flashcards.json`: `"visual": "visuals/filename.png"`
