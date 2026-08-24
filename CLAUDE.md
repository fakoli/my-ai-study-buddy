# Study Buddy

A learning platform for visual learners who learn by doing. Combines flashcards, quizzes, tests, and visual references with AI-powered coaching.

## Tech Stack

- **Frontend**: React + TypeScript
- **Backend**: Python 3.11+, FastAPI
- **Data Models**: Pydantic v2
- **Content**: Markdown files
- **Persistence**: JSON (local), SQLite/Supabase (production)
- **Notifications**: Mailgun (email), SMS provider TBD
- **AI**: Anvil Serving router (self-hosted, OpenAI-compatible) for text and image generation

## Documentation

- Architecture details: @docs/architecture.md
- Implementation guide: @docs/implementation.md

Read these files when working on related areas. They contain API specifications, data models, and coding conventions.

## Commands

```bash
# Backend
cd backend
uv sync
uv run uvicorn main:app --reload --port 8010

# Frontend
cd frontend
npm install
npm run dev

# Testing (prefer file-scoped)
uv run pytest backend/tests/test_modules.py -v
npm run test -- --filter=FlashcardItem

# Linting
uv run ruff check backend/
npm run lint --prefix frontend
```

## Project Structure

```
/study-buddy
  CLAUDE.md                     # This file
  /docs
    architecture.md             # API specs, models, error codes
    implementation.md           # Setup and coding conventions
    quick-reference.md          # Token-efficient reference
  /backend
    main.py                     # FastAPI app entry
    config.py                   # Settings and environment
    dependencies.py             # Type aliases (StorageDep, CurrentUser, etc.)
    exceptions.py               # Error codes and exceptions
    /api/routes                 # 13 route files
      admin.py                  # Admin console endpoints
      auth.py                   # Authentication
      courses.py                # Course management
      modules.py                # Module management
      generation.py             # AI content generation
      learning_paths.py         # Learning paths
      user_settings.py          # API key management
      uploads.py                # Image uploads
      progress.py               # Progress tracking
      flashcard_ratings.py      # Flashcard difficulty ratings
      ...
    /models                     # 11 Pydantic model files
      user.py                   # User + UserRole
      course.py                 # Course + CourseInstructions
      module.py                 # Module + FlashcardData + QuizData + SandboxData
      learning_path.py          # Learning paths
      progress.py               # Progress tracking models
      flashcard_rating.py       # Flashcard rating models
      token_transaction.py      # Token history
      user_api_settings.py      # API key settings
      ...
    /services                   # 20 service files
      admin_service.py          # User management
      ai_generation_service.py  # AI content generation
      encryption_service.py     # API key encryption
      module_service.py         # Module operations
      flashcard_rating_service.py # Flashcard ratings
      course_orchestrator.py    # Full course generation
      cache_service.py          # In-memory caching
      ai_model_router.py        # Model selection
      ...
    /storage
      base.py                   # StorageBackend ABC
      json_storage.py           # Development storage
  /frontend/src
    /api                        # 14 API client files
    /hooks                      # 26 custom hooks
    /pages                      # 12 page components
      CourseEditor.tsx          # Course authoring
      ModuleEditor.tsx          # Module authoring
      ModuleViewer.tsx          # Module learning view
      Settings.tsx              # User settings + API keys
    /components                 # 45 component files
    /services                   # Code execution services
      codeExecution.ts          # Pyodide/Worker execution
  /content/courses              # Filesystem-based courses
```

## Code Style

### Python
- Type hints on all functions
- Pydantic models for request/response
- Async handlers where appropriate
- Snake_case for variables and functions
- Business logic in `/services`, not route handlers

### React
- Functional components with hooks
- TypeScript strict mode
- Named exports
- One responsibility per component

## Design Principles

1. **Visual-first**: Diagrams and visuals over text walls
2. **Learn by doing**: Every concept connects to action
3. **Coach, don't judge**: Guide through mistakes
4. **Small and frequent**: Sustainable habits over cram sessions

## Do

- Use file-scoped test commands
- Reference existing patterns before creating new ones
- Keep API responses consistent with structured JSON
- Write tests alongside features
- Use `StorageBackend` abstraction for persistence
- Check user notification preferences before sending

## Do Not

- Hardcode storage backends
- Put business logic in route handlers
- Skip type hints
- Create endpoints without Pydantic models
- Send notifications without preference checks
- Use placeholders—output complete code
- Commit directly to `main`—always use PR workflow

## Git Workflow

**Always use a PR-based workflow. Never commit directly to `main`.**

### Creating Changes

1. Create a feature branch from `main`:
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/descriptive-name
   ```

2. Make commits on the feature branch with clear messages

3. Push the branch and create a PR:
   ```bash
   git push -u origin feature/descriptive-name
   gh pr create --title "Brief description" --body "## Summary\n- Change 1\n- Change 2"
   ```

### Branch Naming

| Prefix | Use Case |
|--------|----------|
| `feature/` | New features |
| `fix/` | Bug fixes |
| `refactor/` | Code refactoring |
| `docs/` | Documentation updates |
| `chore/` | Maintenance tasks |

### PR Requirements

- Descriptive title summarizing the change
- Summary section with bullet points
- Test plan if applicable
- Link to related issues if any

## API Overview

All routes defined in @docs/architecture.md (70+ endpoints total)

| Resource | Endpoints | Purpose |
|----------|-----------|---------|
| `/api/v1/progress` | 10 | Dashboard, module/course/path progress |
| `/api/v1/courses/.../flashcards` | 6 | Flashcard ratings and filtering |
| `/api/v1/references` | 3 | Reference material and visuals |
| `/api/v1/ai` | 4 | Explanations, hints, examples |
| `/api/v1/auth` | 6 | Registration, login, tokens |
| `/api/v1/notifications` | 5 | Preferences and delivery |
| `/api/v1/courses` | 7 | Course CRUD and discovery |
| `/api/v1/courses/.../modules` | 7 | Module CRUD and reordering |
| `/api/v1/paths` | 9 | Learning path management |
| `/api/v1/generate` | 6 | AI content generation (including full-course) |
| `/api/v1/uploads` | 3 | Image upload and serving |
| `/api/v1/settings` | 4 | User API key management |
| `/api/v1/admin` | 4 | Admin console (users, tokens) |

## Testing

- Backend: pytest with async support
- Frontend: Vitest + React Testing Library
- Single test: `uv run pytest backend/tests/test_file.py::test_name -v`
- All PRs require passing tests

## Patterns to Follow

| Pattern | Example Location |
|---------|------------------|
| API route | `backend/api/routes/courses.py` |
| Pydantic model | `backend/models/module.py` |
| Service layer | `backend/services/module_service.py` |
| Storage backend | `backend/storage/json_storage.py` |
| React component | `frontend/src/components/module-editor/FlashcardItem.tsx` |
| Custom hook | `frontend/src/hooks/useModules.ts` |
| Frontend API client | `frontend/src/api/courses.ts` |
| Course model | `backend/models/course.py` |
| Module model | `backend/models/module.py` |
| Learning path model | `backend/models/learning_path.py` |
| Progress model | `backend/models/progress.py` |
| Flashcard rating | `backend/services/flashcard_rating_service.py` |
| AI generation service | `backend/services/ai_generation_service.py` |
| Course orchestrator | `backend/services/course_orchestrator.py` |
| Cache service | `backend/services/cache_service.py` |
| Model router | `backend/services/ai_model_router.py` |
| Admin service | `backend/services/admin_service.py` |
| Admin routes | `backend/api/routes/admin.py` |
| Encryption service | `backend/services/encryption_service.py` |
| Course editor page | `frontend/src/pages/CourseEditor.tsx` |
| Module editor page | `frontend/src/pages/ModuleEditor.tsx` |
| Module viewer page | `frontend/src/pages/ModuleViewer.tsx` |
| Admin hook | `frontend/src/hooks/useAdmin.ts` |
| Debounced search | `frontend/src/hooks/useDebouncedSearch.ts` |
| Code sandbox | `frontend/src/services/codeExecution.ts` |
| Type aliases | `backend/dependencies.py` |

## AI Generation

The `AIGenerationService` provides AI-powered content generation for courses:

| Endpoint | Token Cost | Purpose |
|----------|------------|---------|
| `POST /generate/suggest-modules` | 10 | Generate module structure from course instructions |
| `POST /generate/module-content` | 25 | Generate markdown, flashcards, and quiz |
| `POST /generate/flashcards` | 8 | Generate flashcards from module content |
| `POST /generate/quiz` | 10 | Generate quiz from module content |
| `POST /generate/visual` | 5 | Generate educational images via Gemini |
| `POST /generate/full-course` | Variable | Generate entire course with parallel orchestration |

### Full Course Generation

The `/generate/full-course` endpoint uses multi-phase orchestration:
1. **Planning**: Generate module structure (~10 tokens)
2. **Content**: Generate modules in parallel (~25 tokens/module)
3. **Enrichment**: Generate flashcards and quizzes
4. **Visuals**: Generate educational images (optional, ~5 tokens/visual)

Typical cost for 8 modules with visuals: ~290 tokens

### Course Instructions

AI-enabled courses have `instructions` that guide all generation:
- `purpose`: What the course is for
- `target_audience`: Who it's designed for
- `learning_objectives`: What learners will achieve
- `tone`: Writing style and approach
- `additional_context`: Extra guidance

These instructions flow from course to module generation for consistent content.

## Admin Console

Admin-only features for user management and token administration.

### Access Control

- Users with `role: "admin"` can access admin endpoints
- Use `AdminUser` dependency for route protection
- Regular users get 403 Forbidden

### Features

| Feature | Endpoint | Description |
|---------|----------|-------------|
| Stats | `GET /admin/stats` | Total users, admins, tokens |
| User list | `GET /admin/users` | Paginated, searchable |
| User detail | `GET /admin/users/{id}` | User + transaction history |
| Token adjust | `PUT /admin/users/{id}/tokens` | Add/deduct with reason |

### Token Transactions

All token changes are logged with:
- `amount`: positive (credit) or negative (debit)
- `operation`: "admin_adjustment", "generate_content", etc.
- `reason`: human-readable explanation
- `admin_id`: who made the change (for admin adjustments)

## Flashcard Ratings

Learners can rate flashcards to track difficulty and provide feedback to authors.

### Rating Types

| Rating | Purpose |
|--------|---------|
| `easy` | Flashcard was easy to recall |
| `medium` | Required some thought |
| `hard` | Struggled to remember |
| `unhelpful` | Card is confusing or unhelpful |

### Key Features

- **Filter by rating**: `/flashcards/filter?filter_by=hard` to study difficult cards
- **Author feedback**: `/feedback/unhelpful-cards` shows cards marked unhelpful
- **Rating summary**: Track distribution of ratings per module
- **Combined endpoint**: `/flashcards/ratings-with-summary` for efficient loading

### Components

- `FlashcardFilter.tsx`: Filter buttons for rating-based filtering
- `RatingButtons.tsx`: Rating selection UI
- `useFlashcardRatings.ts`: Hook for managing ratings state

## Code Sandbox

Modules can include interactive code sandboxes for hands-on practice.

### Supported Languages

| Language | Runtime | Notes |
|----------|---------|-------|
| Python | Pyodide (WASM) | Full Python 3 in browser |
| JavaScript | Web Worker | Isolated execution |

### Module Model

```python
class SandboxData(BaseModel):
    language: Literal["python", "javascript"] = "python"
    starter_code: str = ""
    solution_code: str | None = None
    instructions: str | None = None
```

### Components

- `CodeSandbox.tsx`: Interactive code editor with execution
- `RunnableCodeBlock.tsx`: Inline runnable code in markdown
- `SandboxTab.tsx`: Sandbox configuration in module editor
- `codeExecution.ts`: Pyodide/Worker execution service
