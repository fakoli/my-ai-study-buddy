"""Tests for the progress API endpoints.

Ported from the deck-era tests to the current courses -> modules domain.
`/api/v1/progress/stats`, `/sessions`, and `/topics` remain live (marked
DEPRECATED in models/progress.py but still served, so these tests pin
their behavior).
"""

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
async def test_get_stats_after_activity(
    client, auth_headers, course_with_modules
):
    """Test getting stats after some activity."""
    course_id = course_with_modules["course"]["id"]
    module_id = course_with_modules["modules"][0]["id"]

    # Review a flashcard (drives total_cards_reviewed)
    card_id = course_with_modules["modules"][0]["flashcards"][0]["id"]
    await client.post(
        f"/api/v1/courses/{course_id}/modules/{module_id}/flashcards/rate",
        json={"card_id": card_id, "difficulty": "easy"},
        headers=auth_headers,
    )

    # Submit a quiz on the generated module (drives total_quizzes_completed)
    await client.post(
        f"/api/v1/progress/modules/{course_id}/{module_id}",
        json={"action": "submit_quiz", "quiz_score": 80.0},
        headers=auth_headers,
    )

    response = await client.get(
        "/api/v1/progress/stats",
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    # total_cards_reviewed is intentionally always 0 in the current domain
    # (see progress_service.py:611 "No longer tracked this way"); the
    # meaningful signal is total_quizzes_completed, driven by submit_quiz.
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
async def test_get_dashboard_stats(client, auth_headers, course_with_modules):
    """Test getting overall dashboard stats."""
    # Complete a module so the dashboard shows activity
    course_id = course_with_modules["course"]["id"]
    module_id = course_with_modules["modules"][0]["id"]
    response = await client.post(
        f"/api/v1/progress/modules/{course_id}/{module_id}",
        json={"action": "complete"},
        headers=auth_headers,
    )
    assert response.status_code == 200

    response = await client.get(
        "/api/v1/progress/dashboard",
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert "user_id" in data
    assert "current_streak" in data
    assert "modules_completed_total" in data
    assert data["modules_completed_total"] >= 1


@pytest.mark.asyncio
async def test_stats_unauthenticated(client):
    """Test that unauthenticated users cannot access stats."""
    response = await client.get("/api/v1/progress/stats")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_accuracy_rate_calculation(
    client, auth_headers, course_with_modules
):
    """Test that accuracy rate reflects quiz submissions with a perfect score."""
    course_id = course_with_modules["course"]["id"]
    module_id = course_with_modules["modules"][0]["id"]

    # Submit a perfect quiz score (submit_quiz with a perfect score)
    await client.post(
        f"/api/v1/progress/modules/{course_id}/{module_id}",
        json={"action": "submit_quiz", "quiz_score": 100.0},
        headers=auth_headers,
    )

    response = await client.get(
        "/api/v1/progress/stats",
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    # A perfect score submission should yield a non-zero, high accuracy
    assert data["accuracy_rate"] == 100.0


@pytest.mark.asyncio
async def test_course_progress(client, auth_headers, course_with_modules):
    """Test course-level progress status."""
    course_id = course_with_modules["course"]["id"]
    module_id = course_with_modules["modules"][0]["id"]

    # Complete one module
    await client.post(
        f"/api/v1/progress/modules/{course_id}/{module_id}",
        json={"action": "complete"},
        headers=auth_headers,
    )

    response = await client.get(
        f"/api/v1/progress/courses/{course_id}",
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["course_id"] == course_id
    assert data["total_modules"] >= 1
    assert data["completed_modules"] >= 1
