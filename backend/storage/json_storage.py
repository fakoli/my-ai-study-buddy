import json
import os
from pathlib import Path
from typing import Any

import aiofiles

from storage.base import StorageBackend


class JSONStorage(StorageBackend):
    """JSON file-based storage backend for development."""

    def __init__(self, storage_path: str):
        self.storage_path = Path(storage_path)
        self.storage_path.mkdir(parents=True, exist_ok=True)

    def _get_collection_path(self, collection: str) -> Path:
        return self.storage_path / f"{collection}.json"

    async def _read_collection(self, collection: str) -> dict[str, dict[str, Any]]:
        path = self._get_collection_path(collection)
        if not path.exists():
            return {}
        async with aiofiles.open(path, "r") as f:
            content = await f.read()
            return json.loads(content) if content else {}

    async def _write_collection(
        self, collection: str, data: dict[str, dict[str, Any]]
    ) -> None:
        path = self._get_collection_path(collection)
        async with aiofiles.open(path, "w") as f:
            await f.write(json.dumps(data, indent=2, default=str))

    def _matches_filters(
        self, doc: dict[str, Any], filters: dict[str, Any] | None
    ) -> bool:
        if not filters:
            return True
        for key, value in filters.items():
            if key not in doc or doc[key] != value:
                return False
        return True

    async def get(self, collection: str, id: str) -> dict[str, Any] | None:
        data = await self._read_collection(collection)
        return data.get(id)

    async def list(
        self, collection: str, filters: dict[str, Any] | None = None
    ) -> list[dict[str, Any]]:
        data = await self._read_collection(collection)
        return [doc for doc in data.values() if self._matches_filters(doc, filters)]

    async def create(self, collection: str, data: dict[str, Any]) -> dict[str, Any]:
        if "id" not in data:
            raise ValueError("Document must have an 'id' field")

        collection_data = await self._read_collection(collection)
        collection_data[data["id"]] = data
        await self._write_collection(collection, collection_data)
        return data

    async def update(
        self, collection: str, id: str, data: dict[str, Any]
    ) -> dict[str, Any] | None:
        collection_data = await self._read_collection(collection)
        if id not in collection_data:
            return None

        collection_data[id] = {**collection_data[id], **data, "id": id}
        await self._write_collection(collection, collection_data)
        return collection_data[id]

    async def delete(self, collection: str, id: str) -> bool:
        collection_data = await self._read_collection(collection)
        if id not in collection_data:
            return False

        del collection_data[id]
        await self._write_collection(collection, collection_data)
        return True

    async def count(self, collection: str, filters: dict[str, Any] | None = None) -> int:
        data = await self._read_collection(collection)
        if not filters:
            return len(data)
        return sum(1 for doc in data.values() if self._matches_filters(doc, filters))
