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

# AI (Anvil Serving router)
ANVIL_ROUTER_BASE_URL=https://fakoli-dark.tail4378d.ts.net/v1
ANVIL_ROUTER_TOKEN=your-router-token
ANVIL_MODEL=llm.primary
ANVIL_IMAGE_MODEL=gemini-nano-banana
```

---

## Folder Structure Details

### Backend

```
/backend
  main.py                 # FastAPI app initialization
  config.py               # Settings and environment loading
  dependencies.py         # Dependency injection, type aliases
  exceptions.py           # Error codes and exceptions

  /api
    __init__.py
    /routes               # 13 route files
      auth.py             # Authentication
      references.py       # Reference materials
      ai.py               # AI assistance endpoints
      notifications.py    # Notification preferences
      courses.py          # Course management
      learning_paths.py   # Learning paths
      uploads.py          # Image uploads
      user_settings.py    # API key management
      admin.py            # Admin console
      modules.py          # Module management
      progress.py         # Progress tracking
      flashcard_ratings.py # Flashcard difficulty ratings
      generation.py       # AI content generation

  /models                 # 11 model files
    __init__.py
    user.py               # User + UserRole
    quiz.py               # Quiz types (module-embedded)
    notification.py       # Notification preferences
    learning_path.py      # Learning paths
    course.py             # Course + CourseInstructions
    user_api_settings.py  # API key settings
    token_transaction.py  # Token history
    progress.py           # Progress tracking models
    module.py             # Module + FlashcardData + QuizData + SandboxData
    ai_generation.py      # AI generation request/response
    flashcard_rating.py   # Rating models

  /services               # 20 service files
    __init__.py
    base_service.py       # Base service class
    auth_service.py       # Authentication
    reference_service.py  # Reference materials
    notification_service.py # Notifications
    ai_service.py         # AI assistance
    learning_path_service.py # Learning paths
    image_service.py      # Image handling
    encryption_service.py # API key encryption
    user_api_settings_service.py # User API settings
    admin_service.py      # Admin operations
    module_service.py     # Module operations
    progress_service.py   # Progress tracking
    course_service.py     # Course operations
    flashcard_rating_service.py # Flashcard ratings
    ai_generation_service.py # AI content generation
    ai_model_router.py    # Cost-optimized model selection
    cache_service.py      # In-memory TTL caching
    course_orchestrator.py # Multi-phase course generation
    parallel_generation_service.py # Concurrent AI generation
    request_deduplication.py # Duplicate request prevention

  /storage
    __init__.py
    base.py               # StorageBackend ABC
    json_storage.py       # Development storage

  /tests
    conftest.py
    test_auth.py
    test_courses.py
    test_modules.py
    test_progress.py
    test_flashcard_ratings.py
```

### Frontend

```
/frontend
  /src
    main.tsx
    App.tsx

    /api                  # 14 API client files
      client.ts           # Fetch wrapper with auth
      auth.ts             # Authentication
      ai.ts               # AI assistance
      notifications.ts    # Notifications
      references.ts       # Reference materials
      courses.ts          # Course management
      learningPaths.ts    # Learning paths
      uploads.ts          # Image uploads
      generation.ts       # AI content generation
      userSettings.ts     # API key management
      admin.ts            # Admin operations
      modules.ts          # Module operations
      progress.ts         # Progress tracking
      flashcardRatings.ts # Flashcard ratings

    /components
      /common             # 15 shared components
        AuthProvider.tsx
        Button.tsx
        Card.tsx
        ConfirmModal.tsx
        EmptyState.tsx
        ErrorBoundary.tsx
        Input.tsx
        LiveRegion.tsx
        MarkdownRenderer.tsx
        Modal.tsx
        Pagination.tsx
        RunnableCodeBlock.tsx
        Skeleton.tsx
        Textarea.tsx
        Toast.tsx
        ToastProvider.tsx
      /dashboard          # 5 dashboard components
        ActionCard.tsx
        NextUpPanel.tsx
        RecentActivityFeed.tsx
        StatsGrid.tsx
        StreakDisplay.tsx
      /course-editor      # 5 course editor components
        CourseInfoStep.tsx
        CourseInstructionsStep.tsx
        CourseModulesStep.tsx
        CourseStepper.tsx
        ModuleSuggestionModal.tsx
      /courses            # 4 course listing components
        CourseCard.tsx
        CourseList.tsx
        PathCard.tsx
        PathList.tsx
      /module-editor      # 10 module editor components
        AIPromptPanel.tsx
        CodeSandbox.tsx
        ContentTab.tsx
        FlashcardItem.tsx
        FlashcardsTab.tsx
        MarkdownToolbar.tsx
        ModuleEditorTabs.tsx
        QuizQuestionItem.tsx
        QuizTab.tsx
        SandboxTab.tsx
      /flashcards         # 2 flashcard components
        FlashcardFilter.tsx
        RatingButtons.tsx
      /admin              # 3 admin components
        AdminStatsGrid.tsx
        TokenAdjustmentModal.tsx
        UserTable.tsx

    /pages                # 12 page components
      Dashboard.tsx
      Courses.tsx
      CourseDetail.tsx
      CourseEditor.tsx
      LearningPaths.tsx
      LearningPathDetail.tsx
      ModuleEditor.tsx
      ModuleViewer.tsx
      Settings.tsx
      Login.tsx
      Register.tsx
      /admin
        AdminDashboard.tsx

    /hooks                # 26 custom hooks
      useAuth.ts
      useAdmin.ts
      useCourses.ts
      useCourseEditorForm.ts
      useCourseSteps.ts
      useDebouncedSearch.ts
      useFlashcardEditor.ts
      useFlashcardRatings.ts
      useFormValidation.ts
      useGeneration.ts
      useLearningPaths.ts
      useLiveRegion.ts
      useMarkdownEditor.ts
      useModuleEditorForm.ts
      useModuleGeneration.ts
      useModuleOutlines.ts
      useModules.ts
      useModuleSuggestions.ts
      useModuleViewerState.ts
      useNotifications.ts
      useProgress.ts
      useQuizEditor.ts
      useToast.ts
      useTokenAdjustment.ts
      useUserSearch.ts
      useUserSettings.ts

    /services             # Code execution services
      codeExecution.ts    # Pyodide/Worker code execution

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
@router.post("/courses", response_model=CourseResponse)
async def create_course(
    course: CourseCreate,
    user: CurrentUser,
    course_service: CourseService = Depends(get_course_service)
) -> CourseResponse:
    return await course_service.create(user.id, course)

# Bad - logic in handler
@router.post("/courses")
async def create_course(course: CourseCreate, user: CurrentUser):
    course_id = str(uuid4())
    now = datetime.utcnow()
    data = {"id": course_id, "author_id": user.id, "created_at": now, **course.dict()}
    # ... more logic
```

#### Service Layer

Business logic lives here.

```python
class ModuleService:
    def __init__(self, storage: StorageBackend):
        self.storage = storage

    async def create(self, course_id: str, module: ModuleCreate) -> Module:
        data = {
            "id": str(uuid4()),
            "course_id": course_id,
            "title": module.title,
            "order_index": module.order_index,
            "content_markdown": module.content_markdown,
            "flashcards": [f.model_dump() for f in module.flashcards],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        result = await self.storage.create("modules", data)
        return Module(**result)

    async def get_by_id(self, module_id: str, course_id: str) -> Module:
        module = await self.storage.get("modules", module_id)
        if not module or module["course_id"] != course_id:
            raise NotFoundException("Module not found")
        return Module(**module)
```

#### Type Hints

Always use them.

```python
# Good
async def rate_flashcard(
    user_id: str,
    module_id: str,
    flashcard_index: int,
    rating: FlashcardRating
) -> FlashcardRatingRecord:
    ...

# Bad
async def rate_flashcard(user_id, module_id, flashcard_index, rating):
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
interface FlashcardItemProps {
  flashcard: FlashcardData;
  index: number;
  rating: FlashcardRating | null;
  onRate: (rating: FlashcardRating) => void;
}

export function FlashcardItem({ flashcard, index, rating, onRate }: FlashcardItemProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div className="flashcard-item" onClick={() => setIsFlipped(!isFlipped)}>
      {isFlipped ? (
        <div className="back">
          <p>{flashcard.back}</p>
          {flashcard.visual && <img src={flashcard.visual} alt="" />}
          <RatingButtons currentRating={rating} onRate={onRate} />
        </div>
      ) : (
        <div className="front">
          <p>{flashcard.front}</p>
        </div>
      )}
    </div>
  );
}
```

#### Custom Hooks

Encapsulate data fetching and state.

```typescript
export function useFlashcardRatings(courseId: string, moduleId: string) {
  const [ratings, setRatings] = useState<FlashcardRatingRecord[]>([]);
  const [summary, setSummary] = useState<FlashcardRatingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchRatingsWithSummary(courseId, moduleId)
      .then(({ ratings, summary }) => {
        setRatings(ratings);
        setSummary(summary);
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, [courseId, moduleId]);

  const rateFlashcard = async (index: number, rating: FlashcardRating) => {
    const result = await submitRating(courseId, moduleId, index, rating);
    setRatings(prev => {
      const existing = prev.findIndex(r => r.flashcard_index === index);
      if (existing >= 0) {
        return [...prev.slice(0, existing), result, ...prev.slice(existing + 1)];
      }
      return [...prev, result];
    });
  };

  return {
    ratings,
    summary,
    loading,
    error,
    rateFlashcard,
    getRating: (index: number) => ratings.find(r => r.flashcard_index === index)?.rating,
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
uv run pytest backend/tests/test_modules.py -v

# Single test
uv run pytest backend/tests/test_modules.py::test_create_module -v

# With coverage
uv run pytest backend/tests/ --cov=backend --cov-report=html
```

Test structure:

```python
# test_modules.py
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

async def test_create_module(client, auth_headers, test_course):
    response = await client.post(
        f"/api/v1/courses/{test_course.id}/modules",
        json={"title": "Test Module", "order_index": 0, "content_markdown": "# Hello"},
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Test Module"
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

### Add flashcard rating functionality to a module

1. Use `FlashcardRatingService` to track user ratings
2. Ratings: easy, medium, hard, unhelpful
3. Use `/flashcards/filter` endpoint to filter by difficulty
4. Author feedback via `/feedback/unhelpful-cards` endpoint

### Add visual to reference material

1. Add image to `/content/courses/course/modules/module/visuals/`
2. Reference in `content.md`: `![Alt text](visuals/filename.png)`
3. Or link from flashcard in `flashcards.json`: `"visual": "visuals/filename.png"`
