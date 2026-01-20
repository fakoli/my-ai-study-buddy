"""Tests for error handling and edge cases."""

import pytest


class TestStructuredErrorFormat:
    """Tests for the structured error response format."""

    @pytest.mark.asyncio
    async def test_not_found_error_format(self, client, auth_headers):
        """Test that not found errors use structured format."""
        response = await client.get(
            "/api/v1/decks/nonexistent-deck-id",
            headers=auth_headers,
        )
        assert response.status_code == 404
        data = response.json()
        assert "error" in data
        assert "code" in data["error"]
        assert "message" in data["error"]
        assert data["error"]["code"] == "DECK_NOT_FOUND"

    @pytest.mark.asyncio
    async def test_legacy_error_format(self, client, auth_headers):
        """Test that legacy format is supported with header."""
        response = await client.get(
            "/api/v1/decks/nonexistent-deck-id",
            headers={**auth_headers, "X-Error-Format": "legacy"},
        )
        assert response.status_code == 404
        data = response.json()
        assert "detail" in data
        assert "error" not in data

    @pytest.mark.asyncio
    async def test_unauthorized_error_format(self, client):
        """Test unauthorized error uses structured format."""
        response = await client.get("/api/v1/decks")
        assert response.status_code == 401
        data = response.json()
        assert "error" in data
        assert data["error"]["code"] == "UNAUTHORIZED"

    @pytest.mark.asyncio
    async def test_forbidden_error_format(self, client, auth_headers, other_user_deck):
        """Test forbidden error uses structured format."""
        response = await client.get(
            f"/api/v1/decks/{other_user_deck['id']}",
            headers=auth_headers,
        )
        assert response.status_code == 403
        data = response.json()
        assert "error" in data
        assert data["error"]["code"] == "ACCESS_DENIED"


class TestAccessControl:
    """Tests for authorization and access control."""

    @pytest.mark.asyncio
    async def test_cannot_access_other_user_deck(self, client, auth_headers, other_user_deck):
        """Test that users cannot access other user's decks."""
        response = await client.get(
            f"/api/v1/decks/{other_user_deck['id']}",
            headers=auth_headers,
        )
        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_cannot_update_other_user_deck(self, client, auth_headers, other_user_deck):
        """Test that users cannot update other user's decks."""
        response = await client.put(
            f"/api/v1/decks/{other_user_deck['id']}",
            json={"title": "Hacked Deck"},
            headers=auth_headers,
        )
        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_cannot_delete_other_user_deck(self, client, auth_headers, other_user_deck):
        """Test that users cannot delete other user's decks."""
        response = await client.delete(
            f"/api/v1/decks/{other_user_deck['id']}",
            headers=auth_headers,
        )
        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_cannot_add_card_to_other_user_deck(
        self, client, auth_headers, other_user_deck
    ):
        """Test that users cannot add cards to other user's decks."""
        response = await client.post(
            f"/api/v1/decks/{other_user_deck['id']}/cards",
            json={"front": "Malicious", "back": "Card"},
            headers=auth_headers,
        )
        assert response.status_code == 403


class TestAuthenticationErrors:
    """Tests for authentication edge cases."""

    @pytest.mark.asyncio
    async def test_invalid_token(self, client):
        """Test that invalid tokens are rejected."""
        response = await client.get(
            "/api/v1/decks",
            headers={"Authorization": "Bearer invalid.token.here"},
        )
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_expired_token_format(self, client):
        """Test that malformed tokens are rejected."""
        response = await client.get(
            "/api/v1/decks",
            headers={"Authorization": "Bearer notavalidjwt"},
        )
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_missing_bearer_prefix(self, client, auth_headers):
        """Test that tokens without Bearer prefix are rejected."""
        token = auth_headers["Authorization"].replace("Bearer ", "")
        response = await client.get(
            "/api/v1/decks",
            headers={"Authorization": token},
        )
        assert response.status_code == 401


class TestValidationErrors:
    """Tests for input validation."""

    @pytest.mark.asyncio
    async def test_create_deck_missing_title(self, client, auth_headers):
        """Test that decks without title are rejected."""
        response = await client.post(
            "/api/v1/decks",
            json={"description": "Test without title"},
            headers=auth_headers,
        )
        # Pydantic validation should reject missing required field
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_create_card_missing_front(self, client, auth_headers, deck_with_cards):
        """Test that cards without front are rejected."""
        deck_id = deck_with_cards["deck"]["id"]
        response = await client.post(
            f"/api/v1/decks/{deck_id}/cards",
            json={"back": "Answer only"},
            headers=auth_headers,
        )
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_review_invalid_difficulty(self, client, auth_headers, deck_with_cards):
        """Test that invalid difficulty values are rejected."""
        card_id = deck_with_cards["cards"][0]["id"]
        response = await client.post(
            "/api/v1/reviews",
            json={"card_id": card_id, "difficulty": "impossible"},
            headers=auth_headers,
        )
        assert response.status_code == 422


class TestResourceNotFound:
    """Tests for not found scenarios."""

    @pytest.mark.asyncio
    async def test_get_nonexistent_deck(self, client, auth_headers):
        """Test getting a deck that doesn't exist."""
        response = await client.get(
            "/api/v1/decks/nonexistent-deck-id",
            headers=auth_headers,
        )
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_update_nonexistent_deck(self, client, auth_headers):
        """Test updating a deck that doesn't exist."""
        response = await client.put(
            "/api/v1/decks/nonexistent-deck-id",
            json={"title": "New Title"},
            headers=auth_headers,
        )
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_nonexistent_deck(self, client, auth_headers):
        """Test deleting a deck that doesn't exist."""
        response = await client.delete(
            "/api/v1/decks/nonexistent-deck-id",
            headers=auth_headers,
        )
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_get_nonexistent_quiz(self, client, auth_headers):
        """Test getting a quiz that doesn't exist."""
        response = await client.get(
            "/api/v1/quiz/nonexistent-quiz-id",
            headers=auth_headers,
        )
        assert response.status_code == 404
