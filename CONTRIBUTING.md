# Contributing to Study Buddy

Thank you for your interest in contributing to Study Buddy! This document provides guidelines and instructions for contributing.

## Code of Conduct

This project adheres to a [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## How to Contribute

### Reporting Bugs

Before creating a bug report, please check existing issues to avoid duplicates. When creating a bug report, include:

- A clear, descriptive title
- Steps to reproduce the issue
- Expected vs actual behavior
- Your environment (OS, Python version, Node.js version)
- Relevant logs or screenshots

### Suggesting Features

Feature suggestions are welcome! Please:

- Use a clear, descriptive title
- Describe the use case and why it would be valuable
- Consider how it fits with the project's goals (visual learning, learning by doing)

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Follow the branch naming convention**:
   - `feature/` for new features
   - `fix/` for bug fixes
   - `refactor/` for code refactoring
   - `docs/` for documentation
   - `chore/` for maintenance tasks

3. **Make your changes**:
   - Follow the code style guidelines below
   - Add tests for new functionality
   - Update documentation as needed

4. **Test your changes**:
   ```bash
   # Backend tests
   cd backend
   uv run pytest tests/ -v

   # Frontend tests
   cd frontend
   npm run test

   # Linting
   uv run ruff check backend/
   npm run lint --prefix frontend
   ```

5. **Create a pull request**:
   - Use a descriptive title
   - Include a summary of changes
   - Reference any related issues

## Development Setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- [uv](https://github.com/astral-sh/uv) (Python package manager)

### Backend Setup

```bash
cd backend
uv sync
cp .env.example .env
# Edit .env with your configuration
uv run uvicorn main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

## Code Style Guidelines

### Python

- Use type hints on all functions
- Use Pydantic models for request/response validation
- Keep business logic in `/services`, not route handlers
- Use `async` handlers where appropriate
- Follow snake_case naming convention

Example:
```python
async def create_module(
    course_id: str,
    module: ModuleCreate,
    service: ModuleService = Depends(get_module_service)
) -> Module:
    return await service.create(course_id, module)
```

### TypeScript/React

- Use functional components with hooks
- Enable TypeScript strict mode
- Use named exports
- One responsibility per component
- Define prop interfaces

Example:
```typescript
interface FlashcardProps {
  card: FlashcardData;
  onFlip: () => void;
}

export function Flashcard({ card, onFlip }: FlashcardProps) {
  // ...
}
```

## Project Structure

```
/backend
  /api/routes     # FastAPI route handlers
  /models         # Pydantic models
  /services       # Business logic
  /storage        # Storage backends
  /tests          # Backend tests

/frontend/src
  /api            # API client functions
  /components     # React components
  /hooks          # Custom React hooks
  /pages          # Page components
```

## Testing

- Write tests alongside new features
- Use file-scoped test commands for faster iteration
- Aim for meaningful test coverage, not 100%

```bash
# Run a specific test file
uv run pytest backend/tests/test_modules.py -v

# Run a specific test
uv run pytest backend/tests/test_modules.py::test_create_module -v
```

## Documentation

- Update README.md for user-facing changes
- Update docs/architecture.md for API changes
- Update docs/implementation.md for development workflow changes
- Add inline comments only where logic isn't self-evident

## Questions?

Feel free to open an issue for questions about contributing. We're happy to help!

## License

By contributing, you agree that your contributions will be licensed under the Apache License 2.0.
