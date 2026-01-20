"""Tests for the reviews API endpoints."""

import pytest


@pytest.mark.asyncio
async def test_submit_review(client, auth_headers, deck_with_cards):
    """Test submitting a review for a card."""
    card_id = deck_with_cards["cards"][0]["id"]

    response = await client.post(
        "/api/v1/reviews",
        json={"card_id": card_id, "difficulty": "easy"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["card_id"] == card_id
    assert data["difficulty"] == "easy"
    assert "reviewed_at" in data
    assert "next_review_at" in data


@pytest.mark.asyncio
async def test_submit_review_invalid_card(client, auth_headers):
    """Test submitting a review for non-existent card."""
    response = await client.post(
        "/api/v1/reviews",
        json={"card_id": "nonexistent-id", "difficulty": "easy"},
        headers=auth_headers,
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_submit_review_unauthenticated(client, deck_with_cards):
    """Test that unauthenticated users cannot submit reviews."""
    card_id = deck_with_cards["cards"][0]["id"]

    response = await client.post(
        "/api/v1/reviews",
        json={"card_id": card_id, "difficulty": "easy"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_due_cards(client, auth_headers, deck_with_cards):
    """Test getting cards due for review."""
    response = await client.get(
        "/api/v1/reviews/due",
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert "cards" in data
    assert "total_due" in data
    # All cards should be due since none have been reviewed
    assert data["total_due"] == len(deck_with_cards["cards"])


@pytest.mark.asyncio
async def test_get_due_cards_after_review(client, auth_headers, deck_with_cards):
    """Test that reviewed cards are not immediately due."""
    card_id = deck_with_cards["cards"][0]["id"]

    # Submit an easy review
    await client.post(
        "/api/v1/reviews",
        json={"card_id": card_id, "difficulty": "easy"},
        headers=auth_headers,
    )

    # Check due cards
    response = await client.get(
        "/api/v1/reviews/due",
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    # One less card should be due
    assert data["total_due"] == len(deck_with_cards["cards"]) - 1


@pytest.mark.asyncio
async def test_get_review_history(client, auth_headers, deck_with_cards):
    """Test getting review history."""
    card_id = deck_with_cards["cards"][0]["id"]

    # Submit some reviews
    for difficulty in ["easy", "medium", "hard"]:
        await client.post(
            "/api/v1/reviews",
            json={"card_id": card_id, "difficulty": difficulty},
            headers=auth_headers,
        )

    response = await client.get(
        "/api/v1/reviews/history",
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert "reviews" in data
    assert "total" in data
    assert data["total"] >= 3


@pytest.mark.asyncio
async def test_review_difficulty_affects_interval(client, auth_headers, deck_with_cards):
    """Test that different difficulties affect next review timing."""
    cards = deck_with_cards["cards"]

    # Submit easy review for first card
    easy_response = await client.post(
        "/api/v1/reviews",
        json={"card_id": cards[0]["id"], "difficulty": "easy"},
        headers=auth_headers,
    )
    easy_data = easy_response.json()

    # Submit hard review for second card
    hard_response = await client.post(
        "/api/v1/reviews",
        json={"card_id": cards[1]["id"], "difficulty": "hard"},
        headers=auth_headers,
    )
    hard_data = hard_response.json()

    # Easy review should have longer interval than hard review
    # (next_review_at for easy should be further in future than hard)
    assert easy_data["next_review_at"] > hard_data["next_review_at"]
