"""Tests for AI service, particularly token consumption behavior."""

import pytest
from unittest.mock import AsyncMock, patch

from services.ai_service import AIService, ExplainRequest, HintRequest, ExamplesRequest, SimplifyRequest
from exceptions import AIServiceException, InsufficientTokensException


class TestTokenConsumptionOnFailure:
    """Tests that tokens are NOT consumed when AI service fails."""

    @pytest.mark.asyncio
    async def test_explain_preserves_tokens_on_ai_failure(self, client, auth_headers):
        """Tokens should not be consumed when AI call fails."""
        # Get initial balance
        response = await client.get("/api/v1/auth/me", headers=auth_headers)
        initial_balance = response.json()["token_balance"]

        # Mock the AI call to fail
        with patch("services.ai_service.AIService._call_ai") as mock_ai:
            mock_ai.side_effect = AIServiceException("AI service unavailable")

            response = await client.post(
                "/api/v1/ai/explain",
                json={"concept": "test concept"},
                headers=auth_headers,
            )
            assert response.status_code == 503  # Service unavailable

        # Verify tokens were NOT consumed
        response = await client.get("/api/v1/auth/me", headers=auth_headers)
        final_balance = response.json()["token_balance"]
        assert final_balance == initial_balance, "Tokens should not be consumed on AI failure"

    @pytest.mark.asyncio
    async def test_hint_preserves_tokens_on_ai_failure(self, client, auth_headers):
        """Tokens should not be consumed when hint AI call fails."""
        response = await client.get("/api/v1/auth/me", headers=auth_headers)
        initial_balance = response.json()["token_balance"]

        with patch("services.ai_service.AIService._call_ai") as mock_ai:
            mock_ai.side_effect = AIServiceException("Rate limit exceeded")

            response = await client.post(
                "/api/v1/ai/hint",
                json={"question": "What is 2+2?", "hint_level": 1},
                headers=auth_headers,
            )
            assert response.status_code == 503

        response = await client.get("/api/v1/auth/me", headers=auth_headers)
        final_balance = response.json()["token_balance"]
        assert final_balance == initial_balance, "Tokens should not be consumed on AI failure"

    @pytest.mark.asyncio
    async def test_examples_preserves_tokens_on_ai_failure(self, client, auth_headers):
        """Tokens should not be consumed when examples AI call fails."""
        response = await client.get("/api/v1/auth/me", headers=auth_headers)
        initial_balance = response.json()["token_balance"]

        with patch("services.ai_service.AIService._call_ai") as mock_ai:
            mock_ai.side_effect = AIServiceException("Connection error")

            response = await client.post(
                "/api/v1/ai/examples",
                json={"concept": "recursion", "num_examples": 3},
                headers=auth_headers,
            )
            assert response.status_code == 503

        response = await client.get("/api/v1/auth/me", headers=auth_headers)
        final_balance = response.json()["token_balance"]
        assert final_balance == initial_balance, "Tokens should not be consumed on AI failure"

    @pytest.mark.asyncio
    async def test_simplify_preserves_tokens_on_ai_failure(self, client, auth_headers):
        """Tokens should not be consumed when simplify AI call fails."""
        response = await client.get("/api/v1/auth/me", headers=auth_headers)
        initial_balance = response.json()["token_balance"]

        with patch("services.ai_service.AIService._call_ai") as mock_ai:
            mock_ai.side_effect = AIServiceException("API key invalid")

            response = await client.post(
                "/api/v1/ai/simplify",
                json={"content": "Complex quantum mechanics explanation"},
                headers=auth_headers,
            )
            assert response.status_code == 503

        response = await client.get("/api/v1/auth/me", headers=auth_headers)
        final_balance = response.json()["token_balance"]
        assert final_balance == initial_balance, "Tokens should not be consumed on AI failure"


class TestTokenConsumptionOnSuccess:
    """Tests that tokens ARE consumed on successful AI calls."""

    @pytest.mark.asyncio
    async def test_explain_consumes_tokens_on_success(self, client, auth_headers):
        """Tokens should be consumed when AI call succeeds."""
        response = await client.get("/api/v1/auth/me", headers=auth_headers)
        initial_balance = response.json()["token_balance"]

        with patch("services.ai_service.AIService._call_ai") as mock_ai:
            mock_ai.return_value = "This is an explanation of the concept."

            response = await client.post(
                "/api/v1/ai/explain",
                json={"concept": "test concept"},
                headers=auth_headers,
            )
            assert response.status_code == 200
            assert response.json()["tokens_used"] == 5

        response = await client.get("/api/v1/auth/me", headers=auth_headers)
        final_balance = response.json()["token_balance"]
        assert final_balance == initial_balance - 5, "Tokens should be consumed on success"


class TestInsufficientTokens:
    """Tests for insufficient token balance scenarios."""

    @pytest.mark.asyncio
    async def test_explain_rejects_with_insufficient_tokens(self, client, auth_headers):
        """Should reject request if user doesn't have enough tokens."""
        # Drain the user's tokens first
        with patch("services.ai_service.AIService._call_ai") as mock_ai:
            mock_ai.return_value = "Response"

            # Consume most tokens (100 initial - need to leave < 5 for explain)
            for _ in range(19):  # 19 * 5 = 95 tokens consumed, leaving 5
                await client.post(
                    "/api/v1/ai/explain",
                    json={"concept": "test"},
                    headers=auth_headers,
                )

        # Verify balance is low
        response = await client.get("/api/v1/auth/me", headers=auth_headers)
        balance = response.json()["token_balance"]
        assert balance == 5  # 100 - 95 = 5

        # Consume remaining tokens
        with patch("services.ai_service.AIService._call_ai") as mock_ai:
            mock_ai.return_value = "Response"
            await client.post(
                "/api/v1/ai/explain",
                json={"concept": "test"},
                headers=auth_headers,
            )

        # Now balance should be 0
        response = await client.get("/api/v1/auth/me", headers=auth_headers)
        assert response.json()["token_balance"] == 0

        # Next request should fail with insufficient tokens
        response = await client.post(
            "/api/v1/ai/explain",
            json={"concept": "test"},
            headers=auth_headers,
        )
        assert response.status_code == 402  # Payment required
        data = response.json()
        assert "error" in data
        assert data["error"]["code"] == "INSUFFICIENT_TOKENS"
