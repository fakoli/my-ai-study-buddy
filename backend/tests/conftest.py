import pytest
from httpx import AsyncClient, ASGITransport

from main import app
from storage.json_storage import JSONStorage
import tempfile
import shutil
import os


@pytest.fixture
def temp_storage_path():
    path = tempfile.mkdtemp()
    yield path
    shutil.rmtree(path)


@pytest.fixture
def storage(temp_storage_path):
    return JSONStorage(temp_storage_path)


@pytest.fixture(autouse=True)
def use_test_storage(temp_storage_path, monkeypatch):
    """Ensure tests use temporary storage."""
    from storage import reset_storage
    from config import get_settings

    # Reset the storage singleton before each test
    reset_storage()
    get_settings.cache_clear()

    monkeypatch.setenv("STORAGE_PATH", temp_storage_path)
    monkeypatch.setenv("DEBUG", "true")  # Allow default JWT secret in tests

    yield

    # Clean up after test
    reset_storage()
    get_settings.cache_clear()


@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture
async def auth_headers(client):
    """Create a test user and return auth headers."""
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "test@example.com",
            "name": "Test User",
            "password": "testpassword123",
        },
    )
    assert response.status_code == 200

    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "test@example.com", "password": "testpassword123"},
    )
    assert response.status_code == 200
    token = response.json()["access_token"]

    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
async def other_user_headers(client):
    """Create another test user and return auth headers for access control tests."""
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "other@example.com",
            "name": "Other User",
            "password": "otherpassword123",
        },
    )
    assert response.status_code == 200

    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "other@example.com", "password": "otherpassword123"},
    )
    assert response.status_code == 200
    token = response.json()["access_token"]

    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
async def deck_with_cards(client, auth_headers):
    """Create a deck with some cards for testing."""
    # Create deck
    response = await client.post(
        "/api/v1/decks",
        json={"title": "Test Deck", "description": "A test deck"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    deck = response.json()

    # Add cards
    cards = []
    for i in range(3):
        response = await client.post(
            f"/api/v1/decks/{deck['id']}/cards",
            json={
                "front": f"Question {i + 1}",
                "back": f"Answer {i + 1}",
            },
            headers=auth_headers,
        )
        assert response.status_code == 200
        cards.append(response.json())

    return {"deck": deck, "cards": cards}


@pytest.fixture
async def generated_quiz(client, auth_headers, deck_with_cards):
    """Generate a quiz from a deck for submission tests."""
    deck_id = deck_with_cards["deck"]["id"]

    response = await client.post(
        "/api/v1/quiz/generate",
        json={"deck_id": deck_id, "num_questions": 3},
        headers=auth_headers,
    )
    assert response.status_code == 200
    return response.json()


@pytest.fixture
async def other_user_deck(client, other_user_headers):
    """Create a deck owned by another user for forbidden access tests."""
    response = await client.post(
        "/api/v1/decks",
        json={"title": "Other User Deck", "description": "Should not be accessible"},
        headers=other_user_headers,
    )
    assert response.status_code == 200
    return response.json()
