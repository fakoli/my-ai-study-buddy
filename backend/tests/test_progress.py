"""Tests for the progress API endpoints."""

import pytest


@pytest.mark.asyncio
async def test_get_stats_empty(client, auth_headers):
    """Test getting stats for user with no activity."""
    response = await client.get(
        "/api/v1/progress/stats",
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["total_cards_reviewed"] == 0
    assert data["total_quizzes_completed"] == 0
    assert data["current_streak"] == 0


@pytest.mark.asyncio
async def test_get_stats_after_activity(client, auth_headers, deck_with_cards, generated_quiz):
    """Test getting stats after some activity."""
    card_id = deck_with_cards["cards"][0]["id"]

    # Submit a review
    await client.post(
        "/api/v1/reviews",
        json={"card_id": card_id, "difficulty": "easy"},
        headers=auth_headers,
    )

    # Submit quiz
    quiz_id = generated_quiz["id"]
    num_questions = len(generated_quiz["questions"])
    await client.post(
        "/api/v1/quiz/submit",
        json={"quiz_id": quiz_id, "answers": [0] * num_questions},
        headers=auth_headers,
    )

    response = await client.get(
        "/api/v1/progress/stats",
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["total_cards_reviewed"] >= 1
    assert data["total_quizzes_completed"] >= 1


@pytest.mark.asyncio
async def test_get_sessions_empty(client, auth_headers):
    """Test getting sessions for user with no sessions."""
    response = await client.get(
        "/api/v1/progress/sessions",
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["sessions"] == []
    assert data["total"] == 0


@pytest.mark.asyncio
async def test_get_topic_mastery(client, auth_headers, deck_with_cards):
    """Test getting topic mastery levels."""
    response = await client.get(
        "/api/v1/progress/topics",
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert "topics" in data
    # Should have our test deck
    assert len(data["topics"]) >= 1
    topic = data["topics"][0]
    assert "topic" in topic
    assert "total_cards" in topic
    assert "mastery_percentage" in topic


@pytest.mark.asyncio
async def test_topic_mastery_increases_with_reviews(client, auth_headers, deck_with_cards):
    """Test that mastery increases with repeated reviews."""
    cards = deck_with_cards["cards"]

    # Review first card multiple times to increase mastery
    for _ in range(3):
        await client.post(
            "/api/v1/reviews",
            json={"card_id": cards[0]["id"], "difficulty": "easy"},
            headers=auth_headers,
        )

    response = await client.get(
        "/api/v1/progress/topics",
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    topic = data["topics"][0]
    # At least one card should be mastered (3+ reviews)
    assert topic["mastered_cards"] >= 1


@pytest.mark.asyncio
async def test_stats_unauthenticated(client):
    """Test that unauthenticated users cannot access stats."""
    response = await client.get("/api/v1/progress/stats")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_accuracy_rate_calculation(client, auth_headers, deck_with_cards):
    """Test that accuracy rate is calculated correctly."""
    deck_id = deck_with_cards["deck"]["id"]

    # Generate and submit a quiz with all correct answers
    response = await client.post(
        "/api/v1/quiz/generate",
        json={"deck_id": deck_id, "num_questions": 3},
        headers=auth_headers,
    )
    quiz = response.json()

    # Get correct answers
    correct_answers = [q["correct_index"] for q in quiz["questions"]]

    # Submit with correct answers
    await client.post(
        "/api/v1/quiz/submit",
        json={"quiz_id": quiz["id"], "answers": correct_answers},
        headers=auth_headers,
    )

    response = await client.get(
        "/api/v1/progress/stats",
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    # Should have 100% accuracy for perfect score
    assert data["accuracy_rate"] == 100.0
