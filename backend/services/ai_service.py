from pydantic import BaseModel

from config import Settings
from exceptions import InsufficientTokensException
from services.auth_service import AuthService
from storage.base import StorageBackend


class ExplainRequest(BaseModel):
    concept: str
    context: str | None = None


class HintRequest(BaseModel):
    question: str
    current_answer: str | None = None
    hint_level: int = 1


class ExamplesRequest(BaseModel):
    concept: str
    num_examples: int = 3


class SimplifyRequest(BaseModel):
    content: str


class AIResponse(BaseModel):
    content: str
    tokens_used: int


class AIService:
    def __init__(self, storage: StorageBackend, settings: Settings):
        self.storage = storage
        self.settings = settings
        self.auth_service = AuthService(storage, settings)

    async def _consume_tokens(self, user_id: str, amount: int) -> None:
        """Consume tokens for AI operations."""
        balance = await self.auth_service.get_token_balance(user_id)
        if balance < amount:
            raise InsufficientTokensException(
                f"Insufficient tokens. Required: {amount}, Available: {balance}"
            )
        await self.auth_service.consume_tokens(user_id, amount)

    async def _call_ai(self, prompt: str, system_prompt: str | None = None) -> str:
        """Call the AI provider."""
        if not self.settings.anthropic_api_key:
            return f"[AI Response - API key not configured]\n\nPrompt: {prompt}"

        try:
            import anthropic

            client = anthropic.Anthropic(api_key=self.settings.anthropic_api_key)

            messages = [{"role": "user", "content": prompt}]

            response = client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=1024,
                system=system_prompt
                or "You are a helpful study assistant. Be concise and educational.",
                messages=messages,
            )

            return response.content[0].text

        except Exception as e:
            return f"[AI Error: {str(e)}]"

    async def explain(self, user_id: str, request: ExplainRequest) -> AIResponse:
        """Explain a concept."""
        tokens_cost = 5
        await self._consume_tokens(user_id, tokens_cost)

        prompt = f"Explain the following concept clearly and concisely:\n\n{request.concept}"
        if request.context:
            prompt += f"\n\nContext: {request.context}"

        system = (
            "You are a patient tutor explaining concepts to a learner. "
            "Use simple language, provide examples, and break down complex ideas. "
            "Use bullet points and structure for clarity."
        )

        content = await self._call_ai(prompt, system)

        return AIResponse(content=content, tokens_used=tokens_cost)

    async def hint(self, user_id: str, request: HintRequest) -> AIResponse:
        """Provide a progressive hint."""
        tokens_cost = 3
        await self._consume_tokens(user_id, tokens_cost)

        hint_instructions = {
            1: "Give a very subtle hint without revealing the answer. Just point in the right direction.",
            2: "Give a moderate hint that narrows down the possibilities but doesn't give away the answer.",
            3: "Give a strong hint that almost reveals the answer but still requires some thinking.",
        }

        level = min(max(request.hint_level, 1), 3)

        prompt = f"Question: {request.question}\n\n{hint_instructions[level]}"
        if request.current_answer:
            prompt += f"\n\nThe learner's current attempt: {request.current_answer}"

        system = (
            "You are a Socratic tutor. Guide learners toward the answer "
            "without simply giving it away. Encourage thinking."
        )

        content = await self._call_ai(prompt, system)

        return AIResponse(content=content, tokens_used=tokens_cost)

    async def examples(self, user_id: str, request: ExamplesRequest) -> AIResponse:
        """Generate examples for a concept."""
        tokens_cost = 5
        await self._consume_tokens(user_id, tokens_cost)

        prompt = (
            f"Generate {request.num_examples} clear, practical examples "
            f"demonstrating the concept: {request.concept}\n\n"
            "Make each example distinct and progressively more complex."
        )

        system = (
            "You are an educational content creator. "
            "Create examples that are relatable, memorable, and instructive."
        )

        content = await self._call_ai(prompt, system)

        return AIResponse(content=content, tokens_used=tokens_cost)

    async def simplify(self, user_id: str, request: SimplifyRequest) -> AIResponse:
        """Simplify complex content."""
        tokens_cost = 4
        await self._consume_tokens(user_id, tokens_cost)

        prompt = (
            f"Simplify the following content for a beginner learner:\n\n{request.content}\n\n"
            "Use simpler words, shorter sentences, and analogies where helpful."
        )

        system = (
            "You are an expert at making complex topics accessible. "
            "Explain like you're talking to a curious 12-year-old."
        )

        content = await self._call_ai(prompt, system)

        return AIResponse(content=content, tokens_used=tokens_cost)
