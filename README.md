# Study Buddy

A learning platform for visual learners who learn by doing. Combines flashcards, quizzes, tests, and visual references with AI-powered coaching.

## Features

- **Flashcard Decks**: Create and study flashcard decks with spaced repetition
- **Quizzes**: AI-generated quizzes to test your knowledge
- **Course Authoring**: Create structured courses with modules, content, and assessments
- **Learning Paths**: Organize courses into learning paths for guided learning
- **AI-Powered Content**: Generate module content, flashcards, quizzes, and visuals using AI
- **Progress Tracking**: Track your learning progress, streaks, and mastery
- **Notifications**: Configurable email and SMS reminders

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React + TypeScript (Vite) |
| Backend | Python 3.11+ / FastAPI |
| Data Models | Pydantic v2 |
| Content | Markdown files |
| Persistence | JSON (local), SQLite/Supabase (production) |
| AI | Claude API (text), Gemini (images) |

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- [uv](https://github.com/astral-sh/uv) (Python package manager)

### Backend Setup

```bash
cd backend
uv sync

# Copy and configure environment
cp .env.example .env
# Edit .env with your settings (ANTHROPIC_API_KEY, etc.)

# Run development server
uv run uvicorn main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

## Environment Variables

Create a `.env` file in the project root (or `backend/` directory):

```bash
# Required
DEBUG=true
JWT_SECRET=your-secret-key

# AI Services (at least one required for AI features)
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=AIza...  # For image generation

# Storage
STORAGE_BACKEND=json    # or sqlite, supabase
STORAGE_PATH=./data

# Optional: Supabase
SUPABASE_URL=...
SUPABASE_KEY=...

# Optional: Notifications
MAILGUN_API_KEY=...
MAILGUN_DOMAIN=...
```

Users can also provide their own API keys via the Settings page.

## Project Structure

```
/study-buddy
  /docs
    architecture.md      # API specs, data models
    implementation.md    # Development guide
  /backend
    /api/routes          # FastAPI route handlers
    /models              # Pydantic models
    /services            # Business logic
    /storage             # Storage backends
    main.py              # FastAPI app
  /frontend
    /src
      /api               # API client functions
      /components        # React components
      /hooks             # Custom React hooks
      /pages             # Page components
  /content
    /courses             # Markdown course content
```

## API Overview

Base URL: `/api/v1`

| Resource | Purpose |
|----------|---------|
| `/decks` | Flashcard CRUD |
| `/reviews` | Spaced repetition tracking |
| `/quiz` | Quiz generation and submission |
| `/progress` | Stats and session history |
| `/ai` | Explanations, hints, examples |
| `/auth` | Registration, login, API keys |
| `/courses` | Course CRUD and discovery |
| `/paths` | Learning path management |
| `/generate` | AI content generation |

## Development

### Running Tests

```bash
# Backend
cd backend
uv run pytest tests/ -v

# Frontend
cd frontend
npm run test
```

### Linting

```bash
# Backend
uv run ruff check backend/

# Frontend
npm run lint --prefix frontend
```

## License

MIT
