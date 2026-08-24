"""Tests for AnvilClient — the self-hosted router LLM client.

Covers complete() (success, auth failure, rate limit, 4xx, connection
error, timeout, bad response shape, unconfigured), generate_image()
(success text/list parts, error), check_anvil_health(). Mocks httpx to
avoid network calls.
"""

import asyncio
from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest

from config import Settings
from exceptions import AIServiceException, ErrorCode
from services.anvil_client import (
    AnvilClient,
    check_anvil_health,
    get_anvil_client,
)


def _settings(**overrides):
    base = {
        "anvil_router_base_url": "https://router.test/v1",
        "anvil_router_token": "test-token",
        "anvil_model": "llm.primary",
    }
    base.update(overrides)
    return Settings(**base)


class _FakeResponse:
    def __init__(self, status_code, json_data=None, text=""):
        self.status_code = status_code
        self._json = json_data
        self.text = text if text else (json_data and str(json_data) or "")

    def json(self):
        return self._json


class TestComplete:
    @pytest.mark.asyncio
    async def test_unconfigured_raises(self):
        client = AnvilClient(_settings(anvil_router_base_url="", anvil_router_token=""))
        with pytest.raises(AIServiceException) as exc:
            await client.complete("hi")
        assert exc.value.code == ErrorCode.AI_SERVICE_UNAVAILABLE

    @pytest.mark.asyncio
    async def test_success(self):
        client = AnvilClient(_settings())
        resp = _FakeResponse(200, {"choices": [{"message": {"content": "Hello!"}}], "usage": {"prompt_tokens": 5, "completion_tokens": 2}})
        with patch("services.anvil_client.httpx.AsyncClient") as MockAC:
            MockAC.return_value.__aenter__ = AsyncMock(return_value=MagicMock(post=AsyncMock(return_value=resp)))
            MockAC.return_value.__aexit__ = AsyncMock(return_value=False)
            result = await client.complete("hi", system_prompt="sys", max_tokens=100, temperature=0.5)
        assert result == "Hello!"

    @pytest.mark.asyncio
    async def test_unauthorized(self):
        client = AnvilClient(_settings())
        resp = _FakeResponse(401, text="unauthorized")
        with patch("services.anvil_client.httpx.AsyncClient") as MockAC:
            MockAC.return_value.__aenter__ = AsyncMock(return_value=MagicMock(post=AsyncMock(return_value=resp)))
            MockAC.return_value.__aexit__ = AsyncMock(return_value=False)
            with pytest.raises(AIServiceException) as exc:
                await client.complete("hi")
        assert exc.value.code == ErrorCode.AI_SERVICE_UNAVAILABLE

    @pytest.mark.asyncio
    async def test_rate_limited(self):
        client = AnvilClient(_settings())
        resp = _FakeResponse(429, text="slow down")
        with patch("services.anvil_client.httpx.AsyncClient") as MockAC:
            MockAC.return_value.__aenter__ = AsyncMock(return_value=MagicMock(post=AsyncMock(return_value=resp)))
            MockAC.return_value.__aexit__ = AsyncMock(return_value=False)
            with pytest.raises(AIServiceException) as exc:
                await client.complete("hi")
        assert "rate limit" in str(exc.value).lower()

    @pytest.mark.asyncio
    async def test_server_error(self):
        client = AnvilClient(_settings())
        resp = _FakeResponse(500, text="boom")
        with patch("services.anvil_client.httpx.AsyncClient") as MockAC:
            MockAC.return_value.__aenter__ = AsyncMock(return_value=MagicMock(post=AsyncMock(return_value=resp)))
            MockAC.return_value.__aexit__ = AsyncMock(return_value=False)
            with pytest.raises(AIServiceException) as exc:
                await client.complete("hi")
        assert exc.value.code == ErrorCode.AI_SERVICE_ERROR

    @pytest.mark.asyncio
    async def test_connection_error(self):
        client = AnvilClient(_settings())
        with patch("services.anvil_client.httpx.AsyncClient") as MockAC:
            MockAC.return_value.__aenter__ = AsyncMock(return_value=MagicMock(post=AsyncMock(side_effect=httpx.ConnectError("refused"))))
            MockAC.return_value.__aexit__ = AsyncMock(return_value=False)
            with pytest.raises(AIServiceException) as exc:
                await client.complete("hi")
        assert exc.value.code == ErrorCode.AI_SERVICE_UNAVAILABLE

    @pytest.mark.asyncio
    async def test_timeout(self):
        client = AnvilClient(_settings())
        with patch("services.anvil_client.httpx.AsyncClient") as MockAC:
            MockAC.return_value.__aenter__ = AsyncMock(return_value=MagicMock(post=AsyncMock(side_effect=httpx.TimeoutException("timed out"))))
            MockAC.return_value.__aexit__ = AsyncMock(return_value=False)
            with pytest.raises(AIServiceException):
                await client.complete("hi")

    @pytest.mark.asyncio
    async def test_bad_response_shape(self):
        client = AnvilClient(_settings())
        resp = _FakeResponse(200, {"choices": []})  # missing content
        with patch("services.anvil_client.httpx.AsyncClient") as MockAC:
            MockAC.return_value.__aenter__ = AsyncMock(return_value=MagicMock(post=AsyncMock(return_value=resp)))
            MockAC.return_value.__aexit__ = AsyncMock(return_value=False)
            with pytest.raises(AIServiceException) as exc:
                await client.complete("hi")
        assert exc.value.code == ErrorCode.AI_SERVICE_ERROR

    @pytest.mark.asyncio
    async def test_empty_content_retry_success(self):
        """Empty content triggers a retry; second response has content."""
        client = AnvilClient(_settings())
        empty_resp = _FakeResponse(
            200, {"choices": [{"message": {"content": ""}}], "usage": {}}
        )
        ok_resp = _FakeResponse(
            200, {"choices": [{"message": {"content": "recovered"}}], "usage": {}}
        )
        post = AsyncMock(side_effect=[empty_resp, ok_resp])
        with patch("services.anvil_client.httpx.AsyncClient") as MockAC:
            MockAC.return_value.__aenter__ = AsyncMock(
                return_value=MagicMock(post=post)
            )
            MockAC.return_value.__aexit__ = AsyncMock(return_value=False)
            result = await client.complete("hi")
        assert result == "recovered"
        assert post.await_count == 2

    @pytest.mark.asyncio
    async def test_empty_content_retry_also_empty_raises(self):
        """Both attempts empty -> clear error, not a parse error."""
        client = AnvilClient(_settings())
        empty_resp = _FakeResponse(
            200, {"choices": [{"message": {"content": ""}}], "usage": {}}
        )
        post = AsyncMock(return_value=empty_resp)
        with patch("services.anvil_client.httpx.AsyncClient") as MockAC:
            MockAC.return_value.__aenter__ = AsyncMock(
                return_value=MagicMock(post=post)
            )
            MockAC.return_value.__aexit__ = AsyncMock(return_value=False)
            with pytest.raises(AIServiceException) as exc:
                await client.complete("hi")
        assert "empty response" in str(exc.value).lower()
        assert post.await_count == 2


class TestGenerateImage:
    @pytest.mark.asyncio
    async def test_success_text(self):
        client = AnvilClient(_settings())
        resp = _FakeResponse(200, {"choices": [{"message": {"content": "an image description"}}]})
        with patch("services.anvil_client.httpx.AsyncClient") as MockAC:
            MockAC.return_value.__aenter__ = AsyncMock(return_value=MagicMock(post=AsyncMock(return_value=resp)))
            MockAC.return_value.__aexit__ = AsyncMock(return_value=False)
            result = await client.generate_image("a cat")
        assert result == "an image description"

    @pytest.mark.asyncio
    async def test_success_list_image_part(self):
        client = AnvilClient(_settings())
        content = [{"type": "image_url", "image_url": {"url": "data:image/png;base64,xxx"}}]
        resp = _FakeResponse(200, {"choices": [{"message": {"content": content}}]})
        with patch("services.anvil_client.httpx.AsyncClient") as MockAC:
            MockAC.return_value.__aenter__ = AsyncMock(return_value=MagicMock(post=AsyncMock(return_value=resp)))
            MockAC.return_value.__aexit__ = AsyncMock(return_value=False)
            result = await client.generate_image("a cat")
        assert result == "data:image/png;base64,xxx"

    @pytest.mark.asyncio
    async def test_success_list_text_parts(self):
        client = AnvilClient(_settings())
        content = [{"type": "text", "text": "line1"}, {"type": "text", "text": "line2"}]
        resp = _FakeResponse(200, {"choices": [{"message": {"content": content}}]})
        with patch("services.anvil_client.httpx.AsyncClient") as MockAC:
            MockAC.return_value.__aenter__ = AsyncMock(return_value=MagicMock(post=AsyncMock(return_value=resp)))
            MockAC.return_value.__aexit__ = AsyncMock(return_value=False)
            result = await client.generate_image("a cat")
        assert result == "line1\nline2"

    @pytest.mark.asyncio
    async def test_error_status(self):
        client = AnvilClient(_settings())
        resp = _FakeResponse(500, text="boom")
        with patch("services.anvil_client.httpx.AsyncClient") as MockAC:
            MockAC.return_value.__aenter__ = AsyncMock(return_value=MagicMock(post=AsyncMock(return_value=resp)))
            MockAC.return_value.__aexit__ = AsyncMock(return_value=False)
            with pytest.raises(AIServiceException) as exc:
                await client.generate_image("a cat")
        assert exc.value.code == ErrorCode.AI_SERVICE_ERROR


class TestHealth:
    @pytest.mark.asyncio
    async def test_not_configured(self):
        ok, msg = await check_anvil_health(_settings(anvil_router_base_url="", anvil_router_token=""))
        assert ok is False
        assert "not configured" in msg

    @pytest.mark.asyncio
    async def test_health_ok(self):
        settings = _settings()
        with patch("services.anvil_client.httpx.AsyncClient") as MockAC:
            MockAC.return_value.__aenter__ = AsyncMock(return_value=MagicMock(get=AsyncMock(return_value=_FakeResponse(200))))
            MockAC.return_value.__aexit__ = AsyncMock(return_value=False)
            ok, msg = await check_anvil_health(settings)
        assert ok is True
        assert "reachable" in msg

    @pytest.mark.asyncio
    async def test_health_unauthorized(self):
        settings = _settings()
        with patch("services.anvil_client.httpx.AsyncClient") as MockAC:
            MockAC.return_value.__aenter__ = AsyncMock(return_value=MagicMock(get=AsyncMock(return_value=_FakeResponse(401))))
            MockAC.return_value.__aexit__ = AsyncMock(return_value=False)
            ok, msg = await check_anvil_health(settings)
        assert ok is False
        assert "credentials" in msg

    @pytest.mark.asyncio
    async def test_health_http_error(self):
        settings = _settings()
        with patch("services.anvil_client.httpx.AsyncClient") as MockAC:
            MockAC.return_value.__aenter__ = AsyncMock(return_value=MagicMock(get=AsyncMock(side_effect=httpx.ConnectError("down"))))
            MockAC.return_value.__aexit__ = AsyncMock(return_value=False)
            ok, msg = await check_anvil_health(settings)
        assert ok is False
        assert "unreachable" in msg


class TestGetAnvilClient:
    def test_singleton(self):
        client = get_anvil_client()
        assert isinstance(client, AnvilClient)
        # Calling again returns the same instance
        assert get_anvil_client() is client

    def test_is_configured(self):
        assert AnvilClient(_settings()).is_configured is True
        assert AnvilClient(_settings(anvil_router_token="")).is_configured is False
