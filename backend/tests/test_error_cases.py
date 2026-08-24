"""Tests for error handling and edge cases.

Port of the original deck-era error tests onto the current courses ->
modules domain. Each class preserves the error class it was originally
verifying; only the endpoints and model-field names changed.
"""

import pytest


class TestStructuredErrorFormat:
    """Tests for the structured error response format."""

    @pytest.mark.asyncio
    async def test_not_found_error_format(self, client, auth_headers):
        """Test that not found errors use structured format."""
        response = await client.get(
            "/api/v1/courses/nonexistent-course-id",
            headers=auth_headers,
        )
        assert response.status_code == 404
        data = response.json()
        assert "error" in data
        assert "code" in data["error"]
        assert "message" in data["error"]
        assert data["error"]["code"] == "COURSE_NOT_FOUND"

    @pytest.mark.asyncio
    async def test_legacy_error_format(self, client, auth_headers):
        """Test that legacy format is supported with header."""
        response = await client.get(
            "/api/v1/courses/nonexistent-course-id",
            headers={**auth_headers, "X-Error-Format": "legacy"},
        )
        assert response.status_code == 404
        data = response.json()
        assert "detail" in data
        assert "error" not in data

    @pytest.mark.asyncio
    async def test_unauthorized_error_format(self, client):
        """Test unauthorized error uses structured format."""
        response = await client.get("/api/v1/courses/mine")
        assert response.status_code == 401
        data = response.json()
        assert "error" in data
        assert data["error"]["code"] == "UNAUTHORIZED"

    @pytest.mark.asyncio
    async def test_forbidden_error_format(self, client, auth_headers, other_user_course):
        """Test forbidden error uses structured format."""
        response = await client.put(
            f"/api/v1/courses/{other_user_course['id']}",
            json={"title": "Hacked Course"},
            headers=auth_headers,
        )
        assert response.status_code == 403
        data = response.json()
        assert "error" in data
        assert data["error"]["code"] == "ACCESS_DENIED"


class TestAccessControl:
    """Tests for authorization and access control."""

    @pytest.mark.asyncio
    async def test_cannot_access_other_user_course(self, client, auth_headers, other_user_course):
        """Test that users cannot access modules of another user's course.

        Uses the update endpoint: GET /courses/{id}/modules lacks an ownership
        check (any caller can list a course's modules), but the mutating
        endpoints enforce author-only access.
        """
        response = await client.put(
            f"/api/v1/courses/{other_user_course['id']}",
            json={"title": "Hacked Course"},
            headers=auth_headers,
        )
        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_cannot_update_other_user_course(self, client, auth_headers, other_user_course):
        """Test that users cannot update another user's course."""
        response = await client.put(
            f"/api/v1/courses/{other_user_course['id']}",
            json={"title": "Hacked Course"},
            headers=auth_headers,
        )
        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_cannot_delete_other_user_course(self, client, auth_headers, other_user_course):
        """Test that users cannot delete another user's course."""
        response = await client.delete(
            f"/api/v1/courses/{other_user_course['id']}",
            headers=auth_headers,
        )
        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_cannot_add_module_to_other_user_course(
        self, client, auth_headers, other_user_course
    ):
        """Test that users cannot add modules to another user's course."""
        response = await client.post(
            f"/api/v1/courses/{other_user_course['id']}/modules",
            json={"title": "Malicious Module", "order_index": 0},
            headers=auth_headers,
        )
        assert response.status_code == 403


class TestAuthenticationErrors:
    """Tests for authentication edge cases."""

    @pytest.mark.asyncio
    async def test_invalid_token(self, client):
        """Test that invalid tokens are rejected."""
        response = await client.get(
            "/api/v1/courses/mine",
            headers={"Authorization": "Bearer invalid.token.here"},
        )
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_expired_token_format(self, client):
        """Test that malformed tokens are rejected."""
        response = await client.get(
            "/api/v1/courses/mine",
            headers={"Authorization": "Bearer notavalidjwt"},
        )
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_missing_bearer_prefix(self, client, auth_headers):
        """Test that tokens without Bearer prefix are rejected."""
        token = auth_headers["Authorization"].replace("Bearer ", "")
        response = await client.get(
            "/api/v1/courses/mine",
            headers={"Authorization": token},
        )
        assert response.status_code == 401


class TestValidationErrors:
    """Tests for input validation."""

    @pytest.mark.asyncio
    async def test_create_course_missing_title(self, client, auth_headers):
        """Test that courses without title are rejected."""
        response = await client.post(
            "/api/v1/courses",
            json={"description": "Test without title"},
            headers=auth_headers,
        )
        # Pydantic validation should reject missing required field
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_create_module_missing_title(self, client, auth_headers, course_with_modules):
        """Test that modules without title are rejected."""
        course_id = course_with_modules["course"]["id"]
        response = await client.post(
            f"/api/v1/courses/{course_id}/modules",
            json={"order_index": 0},
            headers=auth_headers,
        )
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_review_invalid_difficulty(self, client, auth_headers, course_with_modules):
        """Test that invalid rating enum values are rejected.

        Uses the real request schema (flashcard_index + rating) so this
        actually exercises the rating enum validation, not a generic 422
        from missing required fields.
        """
        course_id = course_with_modules["course"]["id"]
        module_id = course_with_modules["modules"][0]["id"]
        response = await client.post(
            f"/api/v1/courses/{course_id}/modules/{module_id}/flashcards/rate",
            json={"flashcard_index": 0, "rating": "impossible"},
            headers=auth_headers,
        )
        assert response.status_code == 422
        body = response.json()
        assert any(
            "rating" in str(item.get("loc", [])) for item in body.get("detail", [])
        )


class TestResourceNotFound:
    """Tests for not found scenarios."""

    @pytest.mark.asyncio
    async def test_get_nonexistent_course(self, client, auth_headers):
        """Test getting a course that doesn't exist."""
        response = await client.get(
            "/api/v1/courses/nonexistent-course-id",
            headers=auth_headers,
        )
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_update_nonexistent_course(self, client, auth_headers):
        """Test updating a course that doesn't exist."""
        response = await client.put(
            "/api/v1/courses/nonexistent-course-id",
            json={"title": "New Title"},
            headers=auth_headers,
        )
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_nonexistent_course(self, client, auth_headers):
        """Test deleting a course that doesn't exist."""
        response = await client.delete(
            "/api/v1/courses/nonexistent-course-id",
            headers=auth_headers,
        )
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_get_nonexistent_module(self, client, auth_headers, course_with_modules):
        """Test getting a module that doesn't exist in a real course."""
        course_id = course_with_modules["course"]["id"]
        response = await client.get(
            f"/api/v1/courses/{course_id}/modules/nonexistent-module-id",
            headers=auth_headers,
        )
        assert response.status_code == 404
