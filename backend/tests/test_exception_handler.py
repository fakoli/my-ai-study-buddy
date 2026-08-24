"""Tests pinning the generic exception handler (ticket 003).

The generic @app.exception_handler(Exception) converts unhandled errors into
structured INTERNAL_ERROR 500s. Under the default ASGITransport
(raise_app_exceptions=True) a raw exception is re-raised to the caller and the
handler never fires, so we use raise_app_exceptions=False here to exercise
the real production path (uvicorn-like delivery).
"""

import pytest
from httpx import ASGITransport, AsyncClient

from main import app


@pytest.fixture
def raw_client():
    """A client whose transport does NOT re-raise app exceptions, so the
    generic exception handler can produce a real 500 response."""
    return AsyncClient(
        transport=ASGITransport(app=app, raise_app_exceptions=False),
        base_url="http://test",
    )


@pytest.mark.asyncio
async def test_generic_handler_returns_structured_500(raw_client):
    """An unhandled route exception becomes a structured INTERNAL_ERROR 500
    with no exception text leaked to the client."""
    resp = await raw_client.get("/__force_500")
    assert resp.status_code == 500
    body = resp.json()
    assert body["error"]["code"] == "INTERNAL_ERROR"
    # The generic handler must never leak the exception message (ticket 003).
    assert "traceback" not in resp.text.lower()
    assert "exception" not in body["error"]["message"].lower()
    assert body["error"]["message"]  # non-empty generic message
