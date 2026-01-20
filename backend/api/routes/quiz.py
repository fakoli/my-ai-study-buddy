from fastapi import APIRouter, Depends

from dependencies import CurrentUser, StorageDep
from models.quiz import Quiz, QuizGenerateRequest, QuizSubmission, QuizSubmitRequest, QuizWithSubmission
from services.quiz_service import QuizService

router = APIRouter()


def get_quiz_service(storage: StorageDep) -> QuizService:
    return QuizService(storage)


@router.post("/generate", response_model=Quiz)
async def generate_quiz(
    request: QuizGenerateRequest,
    user: CurrentUser,
    quiz_service: QuizService = Depends(get_quiz_service),
):
    """Generate a quiz from cards."""
    return await quiz_service.generate_quiz(user.id, request)


@router.post("/submit", response_model=QuizSubmission)
async def submit_quiz(
    request: QuizSubmitRequest,
    user: CurrentUser,
    quiz_service: QuizService = Depends(get_quiz_service),
):
    """Submit quiz answers and get scored results."""
    return await quiz_service.submit_quiz(user.id, request)


@router.get("/{quiz_id}", response_model=QuizWithSubmission)
async def get_quiz(
    quiz_id: str,
    user: CurrentUser,
    quiz_service: QuizService = Depends(get_quiz_service),
):
    """Get a quiz with its submission if exists."""
    return await quiz_service.get_quiz(quiz_id, user.id)
