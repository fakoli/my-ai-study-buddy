from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config import get_settings
from exceptions import StudyBuddyException

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    description="A learning platform for visual learners who learn by doing",
    version="0.1.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(StudyBuddyException)
async def study_buddy_exception_handler(request: Request, exc: StudyBuddyException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.message},
    )


@app.get("/health")
async def health_check():
    return {"status": "healthy", "app": settings.app_name}


# Import and register routers
from api.routes import auth, decks, reviews, quiz, progress, references, ai, notifications

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(decks.router, prefix="/api/v1/decks", tags=["decks"])
app.include_router(reviews.router, prefix="/api/v1/reviews", tags=["reviews"])
app.include_router(quiz.router, prefix="/api/v1/quiz", tags=["quiz"])
app.include_router(progress.router, prefix="/api/v1/progress", tags=["progress"])
app.include_router(references.router, prefix="/api/v1/references", tags=["references"])
app.include_router(ai.router, prefix="/api/v1/ai", tags=["ai"])
app.include_router(notifications.router, prefix="/api/v1/notifications", tags=["notifications"])
