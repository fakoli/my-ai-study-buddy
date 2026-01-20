import pytest
from httpx import AsyncClient, ASGITransport

from main import app
from storage.json_storage import JSONStorage
import tempfile
import shutil


@pytest.fixture
def temp_storage_path():
    path = tempfile.mkdtemp()
    yield path
    shutil.rmtree(path)


@pytest.fixture
def storage(temp_storage_path):
    return JSONStorage(temp_storage_path)


@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture
async def auth_headers(client):
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
