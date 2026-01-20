import pytest


@pytest.mark.asyncio
async def test_create_deck(client, auth_headers):
    response = await client.post(
        "/api/v1/decks",
        json={"title": "Test Deck", "description": "A test deck"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Test Deck"
    assert data["description"] == "A test deck"
    assert "id" in data


@pytest.mark.asyncio
async def test_list_decks(client, auth_headers):
    await client.post(
        "/api/v1/decks",
        json={"title": "Deck 1"},
        headers=auth_headers,
    )
    await client.post(
        "/api/v1/decks",
        json={"title": "Deck 2"},
        headers=auth_headers,
    )

    response = await client.get("/api/v1/decks", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2


@pytest.mark.asyncio
async def test_add_card(client, auth_headers):
    deck_response = await client.post(
        "/api/v1/decks",
        json={"title": "Card Test Deck"},
        headers=auth_headers,
    )
    deck_id = deck_response.json()["id"]

    response = await client.post(
        f"/api/v1/decks/{deck_id}/cards",
        json={"front": "What is Python?", "back": "A programming language"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["front"] == "What is Python?"
    assert data["back"] == "A programming language"


@pytest.mark.asyncio
async def test_get_deck_with_cards(client, auth_headers):
    deck_response = await client.post(
        "/api/v1/decks",
        json={"title": "Full Deck"},
        headers=auth_headers,
    )
    deck_id = deck_response.json()["id"]

    await client.post(
        f"/api/v1/decks/{deck_id}/cards",
        json={"front": "Q1", "back": "A1"},
        headers=auth_headers,
    )
    await client.post(
        f"/api/v1/decks/{deck_id}/cards",
        json={"front": "Q2", "back": "A2"},
        headers=auth_headers,
    )

    response = await client.get(f"/api/v1/decks/{deck_id}", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Full Deck"
    assert len(data["cards"]) == 2
