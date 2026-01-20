"""Tests for the quiz API endpoints."""

import pytest


@pytest.mark.asyncio
async def test_generate_quiz(client, auth_headers, deck_with_cards):
    """Test generating a quiz from a deck."""
    deck_id = deck_with_cards["deck"]["id"]

    response = await client.post(
        "/api/v1/quiz/generate",
        json={"deck_id": deck_id, "num_questions": 3},
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    assert "questions" in data
    assert len(data["questions"]) == 3
    for question in data["questions"]:
        assert "id" in question
        assert "question" in question
        assert "options" in question
        assert len(question["options"]) == 4  # 3 distractors + 1 correct


@pytest.mark.asyncio
async def test_generate_quiz_invalid_deck(client, auth_headers):
    """Test generating a quiz with non-existent deck."""
    response = await client.post(
        "/api/v1/quiz/generate",
        json={"deck_id": "nonexistent-id", "num_questions": 3},
        headers=auth_headers,
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_generate_quiz_other_user_deck(client, auth_headers, other_user_deck):
    """Test that users cannot generate quiz from other user's deck."""
    response = await client.post(
        "/api/v1/quiz/generate",
        json={"deck_id": other_user_deck["id"], "num_questions": 3},
        headers=auth_headers,
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_generate_quiz_no_deck_or_topic(client, auth_headers):
    """Test generating a quiz without deck_id or topic."""
    response = await client.post(
        "/api/v1/quiz/generate",
        json={"num_questions": 3},
        headers=auth_headers,
    )
    assert response.status_code == 422  # Validation error


@pytest.mark.asyncio
async def test_submit_quiz(client, auth_headers, generated_quiz):
    """Test submitting quiz answers."""
    quiz_id = generated_quiz["id"]
    num_questions = len(generated_quiz["questions"])

    # Submit all answers as 0 (first option)
    response = await client.post(
        "/api/v1/quiz/submit",
        json={"quiz_id": quiz_id, "answers": [0] * num_questions},
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert "score" in data
    assert "results" in data
    assert len(data["results"]) == num_questions


@pytest.mark.asyncio
async def test_submit_quiz_wrong_answer_count(client, auth_headers, generated_quiz):
    """Test submitting quiz with wrong number of answers."""
    quiz_id = generated_quiz["id"]

    response = await client.post(
        "/api/v1/quiz/submit",
        json={"quiz_id": quiz_id, "answers": [0]},  # Too few answers
        headers=auth_headers,
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_submit_quiz_invalid_quiz(client, auth_headers):
    """Test submitting answers to non-existent quiz."""
    response = await client.post(
        "/api/v1/quiz/submit",
        json={"quiz_id": "nonexistent-id", "answers": [0, 0, 0]},
        headers=auth_headers,
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_quiz(client, auth_headers, generated_quiz):
    """Test retrieving a quiz."""
    quiz_id = generated_quiz["id"]

    response = await client.get(
        f"/api/v1/quiz/{quiz_id}",
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == quiz_id
    assert "questions" in data


@pytest.mark.asyncio
async def test_get_quiz_with_submission(client, auth_headers, generated_quiz):
    """Test retrieving a quiz that has been submitted."""
    quiz_id = generated_quiz["id"]
    num_questions = len(generated_quiz["questions"])

    # Submit the quiz
    await client.post(
        "/api/v1/quiz/submit",
        json={"quiz_id": quiz_id, "answers": [0] * num_questions},
        headers=auth_headers,
    )

    # Retrieve the quiz
    response = await client.get(
        f"/api/v1/quiz/{quiz_id}",
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == quiz_id
    assert data["submission"] is not None
    assert "score" in data["submission"]


@pytest.mark.asyncio
async def test_get_quiz_other_user(client, auth_headers, other_user_headers, deck_with_cards):
    """Test that users cannot view other user's quiz."""
    deck_id = deck_with_cards["deck"]["id"]

    # Generate quiz as main user
    response = await client.post(
        "/api/v1/quiz/generate",
        json={"deck_id": deck_id, "num_questions": 3},
        headers=auth_headers,
    )
    quiz_id = response.json()["id"]

    # Try to get it as other user
    response = await client.get(
        f"/api/v1/quiz/{quiz_id}",
        headers=other_user_headers,
    )
    assert response.status_code == 404
