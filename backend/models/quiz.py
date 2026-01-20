from datetime import datetime

from pydantic import BaseModel


class QuizQuestion(BaseModel):
    id: str
    question: str
    options: list[str]
    correct_index: int
    explanation: str | None = None


class QuizGenerateRequest(BaseModel):
    deck_id: str | None = None
    topic: str | None = None
    num_questions: int = 5


class Quiz(BaseModel):
    id: str
    user_id: str
    deck_id: str | None = None
    topic: str | None = None
    questions: list[QuizQuestion]
    created_at: datetime


class QuizResponse(Quiz):
    pass


class QuestionResult(BaseModel):
    question_id: str
    selected: int
    correct: int
    is_correct: bool


class QuizSubmitRequest(BaseModel):
    quiz_id: str
    answers: list[int]


class QuizSubmission(BaseModel):
    id: str
    quiz_id: str
    user_id: str
    answers: list[int]
    submitted_at: datetime
    score: float
    results: list[QuestionResult]


class QuizSubmissionResponse(QuizSubmission):
    pass


class QuizWithSubmission(Quiz):
    submission: QuizSubmission | None = None
