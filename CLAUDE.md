# Study Buddy

A learning platform for visual learners who learn by doing. Combines flashcards, quizzes, tests, and visual references with AI-powered coaching.

## Tech Stack

- **Frontend**: React + TypeScript
- **Backend**: Python 3.11+, FastAPI
- **Data Models**: Pydantic v2
- **Content**: Markdown files
- **Persistence**: JSON (local), SQLite/Supabase (production)
- **Notifications**: Mailgun (email), SMS provider TBD
- **AI**: Claude API (text generation), Gemini via nano-banana-pro (image generation)

## Documentation

- Architecture details: @docs/architecture.md
- Implementation guide: @docs/implementation.md

Read these files when working on related areas. They contain API specifications, data models, and coding conventions.

## Commands

```bash
# Backend
cd backend
uv sync
uv run uvicorn main:app --reload --port 8000

# Frontend
cd frontend
npm install
npm run dev

# Testing (prefer file-scoped)
uv run pytest backend/tests/test_decks.py -v
npm run test -- --filter=FlashCard

# Linting
uv run ruff check backend/
npm run lint --prefix frontend
```

## Project Structure

```
/study-buddy
  AGENTS.md
  /docs
    architecture.md
    implementation.md
  /backend
    /api
      /routes
    /models
    /services
    /storage
    main.py
  /frontend
    /src
      /components
      /pages
      /hooks
      /api
  /content
    /courses
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

## API Overview

All routes defined in @docs/architecture.md

| Resource | Purpose |
|----------|---------|
| `/api/v1/decks` | Flashcard CRUD |
| `/api/v1/reviews` | Spaced repetition tracking |
| `/api/v1/quiz` | Quiz generation and submission |
| `/api/v1/progress` | Stats and session history |
| `/api/v1/references` | Reference material and visuals |
| `/api/v1/ai` | Explanations, hints, examples |
| `/api/v1/auth` | Registration, login, tokens |
| `/api/v1/notifications` | Preferences and delivery |
| `/api/v1/courses` | Course CRUD and discovery |
| `/api/v1/paths` | Learning path management |
| `/api/v1/generate` | AI content generation |
| `/api/v1/uploads` | Image upload and serving |

## Testing

- Backend: pytest with async support
- Frontend: Vitest + React Testing Library
- Single test: `uv run pytest backend/tests/test_file.py::test_name -v`
- All PRs require passing tests

## Patterns to Follow

| Pattern | Example Location |
|---------|------------------|
| API route | `backend/api/routes/decks.py` |
| Pydantic model | `backend/models/deck.py` |
| Service layer | `backend/services/quiz_service.py` |
| Storage backend | `backend/storage/json_storage.py` |
| React component | `frontend/src/components/FlashCard.tsx` |
| Custom hook | `frontend/src/hooks/useQuiz.ts` |
| Course model | `backend/models/course.py` |
| AI generation | `backend/services/ai_generation_service.py` |
| Frontend API client | `frontend/src/api/courses.ts` |

## AI Generation

The `AIGenerationService` provides AI-powered content generation for courses:

| Endpoint | Token Cost | Purpose |
|----------|------------|---------|
| `POST /generate/suggest-modules` | 10 | Generate module structure from course instructions |
| `POST /generate/module-content` | 25 | Generate markdown, flashcards, and quiz |
| `POST /generate/flashcards` | 8 | Generate flashcards from module content |
| `POST /generate/quiz` | 10 | Generate quiz from module content |
| `POST /generate/visual` | 5 | Generate educational images via Gemini |

### Course Instructions

AI-enabled courses have `instructions` that guide all generation:
- `purpose`: What the course is for
- `target_audience`: Who it's designed for
- `learning_objectives`: What learners will achieve
- `tone`: Writing style and approach
- `additional_context`: Extra guidance

These instructions flow from course to module generation for consistent content.
