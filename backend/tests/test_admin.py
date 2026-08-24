"""Tests for admin service and API routes."""

import pytest
from dependencies import get_storage
from models.user import UserRole


@pytest.fixture
async def admin_headers(client, storage):
    """Create an admin user and return auth headers."""
    # Register admin user
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "admin@example.com",
            "name": "Admin User",
            "password": "adminpassword123",
        },
    )
    assert response.status_code == 200
    admin_data = response.json()

    # Update user role to admin
    await storage.update("users", admin_data["id"], {"role": "admin"})

    # Login
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "admin@example.com", "password": "adminpassword123"},
    )
    assert response.status_code == 200
    token = response.json()["access_token"]

    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
async def regular_user_with_tokens(client, storage):
    """Create a regular user with specific token balance."""
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "regular@example.com",
            "name": "Regular User",
            "password": "password123",
        },
    )
    assert response.status_code == 200
    user_data = response.json()

    # Set token balance to 50
    await storage.update("users", user_data["id"], {"token_balance": 50})

    return user_data


@pytest.mark.asyncio
async def test_admin_stats(client, admin_headers, regular_user_with_tokens):
    """Test GET /api/v1/admin/stats endpoint."""
    response = await client.get("/api/v1/admin/stats", headers=admin_headers)
    assert response.status_code == 200

    data = response.json()
    assert "total_users" in data
    assert "admin_count" in data
    assert "user_count" in data
    assert "total_tokens" in data
    assert data["total_users"] >= 2  # Admin + regular user
    assert data["admin_count"] >= 1
    assert data["user_count"] >= 1


@pytest.mark.asyncio
async def test_admin_stats_unauthorized(client, auth_headers):
    """Test that non-admin users cannot access stats."""
    response = await client.get("/api/v1/admin/stats", headers=auth_headers)
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_list_users(client, admin_headers, regular_user_with_tokens):
    """Test GET /api/v1/admin/users endpoint."""
    response = await client.get("/api/v1/admin/users", headers=admin_headers)
    assert response.status_code == 200

    data = response.json()
    assert "users" in data
    assert "total" in data
    assert "skip" in data
    assert "limit" in data
    assert len(data["users"]) >= 2
    assert data["total"] >= 2


@pytest.mark.asyncio
async def test_list_users_with_search(client, admin_headers, regular_user_with_tokens):
    """Test user search functionality."""
    response = await client.get(
        "/api/v1/admin/users?search=regular", headers=admin_headers
    )
    assert response.status_code == 200

    data = response.json()
    assert len(data["users"]) >= 1
    # Check that search found the right user
    found = any(u["email"] == "regular@example.com" for u in data["users"])
    assert found


@pytest.mark.asyncio
async def test_list_users_with_pagination(client, admin_headers, storage):
    """Test user pagination."""
    # Create multiple users
    for i in range(5):
        await client.post(
            "/api/v1/auth/register",
            json={
                "email": f"user{i}@example.com",
                "name": f"User {i}",
                "password": "password123",
            },
        )

    # Get first page with limit 2
    response = await client.get(
        "/api/v1/admin/users?skip=0&limit=2", headers=admin_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data["users"]) == 2
    assert data["skip"] == 0
    assert data["limit"] == 2

    # Get second page
    response = await client.get(
        "/api/v1/admin/users?skip=2&limit=2", headers=admin_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data["users"]) >= 2
    assert data["skip"] == 2


@pytest.mark.asyncio
async def test_list_users_unauthorized(client, auth_headers):
    """Test that non-admin users cannot list users."""
    response = await client.get("/api/v1/admin/users", headers=auth_headers)
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_get_user_detail(client, admin_headers, regular_user_with_tokens):
    """Test GET /api/v1/admin/users/{user_id} endpoint."""
    user_id = regular_user_with_tokens["id"]
    response = await client.get(
        f"/api/v1/admin/users/{user_id}", headers=admin_headers
    )
    assert response.status_code == 200

    data = response.json()
    assert "user" in data
    assert "transactions" in data
    assert data["user"]["id"] == user_id
    assert data["user"]["email"] == "regular@example.com"


@pytest.mark.asyncio
async def test_get_user_detail_not_found(client, admin_headers):
    """Test getting details for non-existent user."""
    response = await client.get(
        "/api/v1/admin/users/nonexistent-id", headers=admin_headers
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_user_detail_unauthorized(client, auth_headers, regular_user_with_tokens):
    """Test that non-admin users cannot get user details."""
    user_id = regular_user_with_tokens["id"]
    response = await client.get(f"/api/v1/admin/users/{user_id}", headers=auth_headers)
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_adjust_tokens_add(client, admin_headers, regular_user_with_tokens, storage):
    """Test adding tokens to a user."""
    user_id = regular_user_with_tokens["id"]
    response = await client.put(
        f"/api/v1/admin/users/{user_id}/tokens",
        json={"amount": 100, "reason": "Bonus for testing"},
        headers=admin_headers,
    )
    assert response.status_code == 200

    data = response.json()
    assert data["user_id"] == user_id
    assert data["previous_balance"] == 50
    assert data["new_balance"] == 150
    assert data["amount"] == 100
    assert "transaction_id" in data

    # Verify user balance was updated
    user = await storage.get("users", user_id)
    assert user["token_balance"] == 150


@pytest.mark.asyncio
async def test_adjust_tokens_deduct(client, admin_headers, regular_user_with_tokens, storage):
    """Test deducting tokens from a user."""
    user_id = regular_user_with_tokens["id"]
    response = await client.put(
        f"/api/v1/admin/users/{user_id}/tokens",
        json={"amount": -25, "reason": "Penalty for spam"},
        headers=admin_headers,
    )
    assert response.status_code == 200

    data = response.json()
    assert data["user_id"] == user_id
    assert data["previous_balance"] == 50
    assert data["new_balance"] == 25
    assert data["amount"] == -25

    # Verify user balance was updated
    user = await storage.get("users", user_id)
    assert user["token_balance"] == 25


@pytest.mark.asyncio
async def test_adjust_tokens_prevent_negative(client, admin_headers, regular_user_with_tokens, storage):
    """Test that token balance is clamped to zero (no negative balances)."""
    user_id = regular_user_with_tokens["id"]
    response = await client.put(
        f"/api/v1/admin/users/{user_id}/tokens",
        json={"amount": -100, "reason": "Large deduction"},
        headers=admin_headers,
    )
    assert response.status_code == 200

    data = response.json()
    assert data["user_id"] == user_id
    assert data["previous_balance"] == 50
    assert data["new_balance"] == 0  # Clamped to zero
    assert data["amount"] == -50  # Actual amount applied, not requested -100

    # Verify user balance was updated to 0
    user = await storage.get("users", user_id)
    assert user["token_balance"] == 0


@pytest.mark.asyncio
async def test_adjust_tokens_creates_transaction(client, admin_headers, regular_user_with_tokens, storage):
    """Test that token adjustments create transaction records."""
    user_id = regular_user_with_tokens["id"]
    response = await client.put(
        f"/api/v1/admin/users/{user_id}/tokens",
        json={"amount": 75, "reason": "Test transaction"},
        headers=admin_headers,
    )
    assert response.status_code == 200
    transaction_id = response.json()["transaction_id"]

    # Verify transaction was created
    transaction = await storage.get("token_transactions", transaction_id)
    assert transaction is not None
    assert transaction["user_id"] == user_id
    assert transaction["amount"] == 75
    assert transaction["balance_after"] == 125
    assert transaction["operation"] == "admin_adjustment"
    assert transaction["reason"] == "Test transaction"
    assert transaction["admin_id"] is not None


@pytest.mark.asyncio
async def test_adjust_tokens_audit_trail_consistency(client, admin_headers, regular_user_with_tokens, storage):
    """Test that transaction records reflect actual amount applied after clamping."""
    user_id = regular_user_with_tokens["id"]
    # Try to deduct more than user has
    response = await client.put(
        f"/api/v1/admin/users/{user_id}/tokens",
        json={"amount": -200, "reason": "Excessive deduction"},
        headers=admin_headers,
    )
    assert response.status_code == 200

    data = response.json()
    transaction_id = data["transaction_id"]

    # Verify transaction records actual amount applied (-50, not -200)
    transaction = await storage.get("token_transactions", transaction_id)
    assert transaction["amount"] == -50  # Actual amount applied
    assert transaction["balance_after"] == 0


@pytest.mark.asyncio
async def test_adjust_tokens_amount_constraints(client, admin_headers, regular_user_with_tokens):
    """Test that amount field has min/max constraints."""
    user_id = regular_user_with_tokens["id"]

    # Test amount too large
    response = await client.put(
        f"/api/v1/admin/users/{user_id}/tokens",
        json={"amount": 2000000, "reason": "Too large"},
        headers=admin_headers,
    )
    assert response.status_code == 422  # Validation error

    # Test amount too small
    response = await client.put(
        f"/api/v1/admin/users/{user_id}/tokens",
        json={"amount": -2000000, "reason": "Too small"},
        headers=admin_headers,
    )
    assert response.status_code == 422  # Validation error


@pytest.mark.asyncio
async def test_adjust_tokens_unauthorized(client, auth_headers, regular_user_with_tokens):
    """Test that non-admin users cannot adjust tokens."""
    user_id = regular_user_with_tokens["id"]
    response = await client.put(
        f"/api/v1/admin/users/{user_id}/tokens",
        json={"amount": 50, "reason": "Unauthorized attempt"},
        headers=auth_headers,
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_adjust_tokens_invalid_user(client, admin_headers):
    """Test adjusting tokens for non-existent user."""
    response = await client.put(
        "/api/v1/admin/users/nonexistent-id/tokens",
        json={"amount": 50, "reason": "Test"},
        headers=admin_headers,
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_adjust_tokens_rollback_on_transaction_failure(client, admin_headers, regular_user_with_tokens, storage, monkeypatch):
    """Test that balance update is rolled back if transaction logging fails."""
    user_id = regular_user_with_tokens["id"]
    original_balance = 50

    # Mock storage.create to fail on transaction creation
    original_create = storage.create
    create_call_count = 0

    async def mock_create(collection, data):
        nonlocal create_call_count
        create_call_count += 1
        if collection == "token_transactions":
            raise Exception("Simulated transaction logging failure")
        return await original_create(collection, data)

    monkeypatch.setattr(storage, "create", mock_create)

    # Attempt to adjust tokens
    response = await client.put(
        f"/api/v1/admin/users/{user_id}/tokens",
        json={"amount": 100, "reason": "Test rollback"},
        headers=admin_headers,
    )
    assert response.status_code == 500  # Internal server error

    # Verify balance was rolled back
    user = await storage.get("users", user_id)
    assert user["token_balance"] == original_balance


@pytest.mark.asyncio
async def test_admin_role_default_value(client):
    """Test that new users default to 'user' role."""
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "newuser@example.com",
            "name": "New User",
            "password": "password123",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["role"] == "user"
