# Study Buddy - Quick Reference

Token-efficient reference for AI coding sessions.

## Endpoint Counts (74+ total)

| Category | Count | Router Prefix |
|----------|-------|---------------|
| Auth | 6 | `/auth` |
| Courses | 7 | `/courses` |
| Modules | 7 | `/courses/{id}/modules` |
| Learning Paths | 9 | `/paths` |
| AI Generation | 5 | `/generate` |
| Admin | 4 | `/admin` |
| User Settings | 4 | `/settings` |
| Decks | 8 | `/decks` |
| Reviews | 3 | `/reviews` |
| Quiz | 3 | `/quiz` |
| Progress | 3 | `/progress` |
| AI Assist | 4 | `/ai` |
| References | 3 | `/references` |
| Uploads | 3 | `/uploads` |
| Notifications | 5 | `/notifications` |

## Token Costs (AI Generation)

| Operation | Tokens | Endpoint |
|-----------|--------|----------|
| Suggest modules | 10 | `POST /generate/suggest-modules` |
| Module content | 25 | `POST /generate/module-content` |
| Flashcards | 8 | `POST /generate/flashcards` |
| Quiz | 10 | `POST /generate/quiz` |
| Visual | 5 | `POST /generate/visual` |

## User Roles

| Role | Access |
|------|--------|
| `user` | Standard features |
| `admin` | + Admin console (`/admin/*`) |

## Type Aliases (backend/dependencies.py)

| Alias | Resolves To |
|-------|-------------|
| `StorageDep` | `StorageBackend` via dependency |
| `SettingsDep` | `Settings` via dependency |
| `CurrentUser` | Authenticated `User` (required) |
| `OptionalUser` | Authenticated `User` or `None` |
| `AdminUser` | `User` with admin role |

## Error Code Categories

| Category | Example Codes |
|----------|---------------|
| Auth | `UNAUTHORIZED`, `INVALID_TOKEN`, `INVALID_CREDENTIALS` |
| Access | `FORBIDDEN`, `ACCESS_DENIED` |
| Resource | `NOT_FOUND`, `COURSE_NOT_FOUND`, `MODULE_NOT_FOUND` |
| Authoring | `COURSE_NOT_EDITABLE`, `INVALID_MODULE_ORDER` |
| Tokens | `INSUFFICIENT_TOKENS` |
| AI | `AI_SERVICE_ERROR`, `AI_SERVICE_UNAVAILABLE` |
| Conflict | `EMAIL_ALREADY_EXISTS` |

See `backend/exceptions.py` for 25 total error codes.

## Storage Collections

| Collection | Model |
|------------|-------|
| `users` | User |
| `decks` | Deck |
| `cards` | Card |
| `reviews` | Review |
| `quizzes` | Quiz |
| `sessions` | Session |
| `courses` | Course |
| `modules` | Module |
| `learning_paths` | LearningPath |
| `token_transactions` | TokenTransaction |
| `user_api_settings` | UserAPISettings |
| `notification_preferences` | NotificationPreferences |

## File Patterns

### Adding a New Endpoint

1. Model: `backend/models/{resource}.py`
2. Service: `backend/services/{resource}_service.py`
3. Route: `backend/api/routes/{resource}.py`
4. Register in: `backend/main.py`

### Adding a New Frontend Page

1. API client: `frontend/src/api/{resource}.ts`
2. Hook: `frontend/src/hooks/use{Resource}.ts`
3. Page: `frontend/src/pages/{Resource}.tsx`
4. Route in: `frontend/src/App.tsx`

## Key Model Fields

### Course

```
id, title, description, difficulty, tags, visibility
author_id, author_name, ai_enabled, instructions
source: "filesystem" | "database"
```

### Module

```
id, course_id, title, order_index
content_markdown, flashcards[], quiz
```

### LearningPath

```
id, owner_id, title, description, difficulty
course_ids[], visibility, estimated_hours
```

## Admin Endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /admin/stats` | Dashboard stats |
| `GET /admin/users` | List users (paginated) |
| `GET /admin/users/{id}` | User + transaction history |
| `PUT /admin/users/{id}/tokens` | Adjust token balance |

## AI Provider Support

| Provider | Feature | Config |
|----------|---------|--------|
| Anthropic | Text generation | `ANTHROPIC_API_KEY` |
| Gemini | Image generation | `GEMINI_API_KEY` |

Users can store their own keys via `/settings/api-keys`.
