from pathlib import Path

import pytest

from storage.sqlite_storage import SQLiteStorage


@pytest.fixture
async def sqlite_storage(temp_storage_path):
    db_path = Path(temp_storage_path) / "test.db"
    storage = SQLiteStorage(str(db_path))
    yield storage
    await storage.close()


@pytest.mark.asyncio
async def test_sqlite_transaction_rolls_back_creates(sqlite_storage):
    with pytest.raises(RuntimeError):
        async with sqlite_storage.transaction() as txn:
            await txn.create("widgets", {"id": "one", "value": "first"})
            await txn.create("widgets", {"id": "two", "value": "second"})
            raise RuntimeError("boom")

    assert await sqlite_storage.get("widgets", "one") is None
    assert await sqlite_storage.get("widgets", "two") is None


@pytest.mark.asyncio
async def test_sqlite_transaction_rolls_back_updates_and_deletes(sqlite_storage):
    original = {"id": "one", "value": "first"}
    await sqlite_storage.create("widgets", original)

    with pytest.raises(RuntimeError):
        async with sqlite_storage.transaction() as txn:
            await txn.update("widgets", "one", {"value": "updated"})
            await txn.delete("widgets", "one")
            raise RuntimeError("boom")

    assert await sqlite_storage.get("widgets", "one") == original
