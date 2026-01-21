"""SQLite-based storage backend for single-instance production use."""

from __future__ import annotations

import json
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any, AsyncIterator

import aiosqlite

from storage.base import StorageBackend


class SQLiteStorage(StorageBackend):
    """SQLite storage backend with transaction support.

    Data is stored as JSON documents in a simple key-value schema,
    allowing flexible schema evolution while leveraging SQLite's
    ACID guarantees.
    """

    def __init__(self, db_path: str):
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._connection: aiosqlite.Connection | None = None
        self._transaction_depth = 0

    async def _get_connection(self) -> aiosqlite.Connection:
        """Get or create database connection."""
        if self._connection is None:
            self._connection = await aiosqlite.connect(self.db_path)
            self._connection.row_factory = aiosqlite.Row
            await self._ensure_table()
        return self._connection

    async def _ensure_table(self) -> None:
        """Create the documents table if it doesn't exist."""
        conn = self._connection
        if conn is None:
            return

        await conn.execute("""
            CREATE TABLE IF NOT EXISTS documents (
                collection TEXT NOT NULL,
                id TEXT NOT NULL,
                data TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (collection, id)
            )
        """)

        # Create index for faster collection queries
        await conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_collection
            ON documents(collection)
        """)

        await conn.commit()

    def _in_transaction(self) -> bool:
        return self._transaction_depth > 0

    async def _commit_if_needed(self, conn: aiosqlite.Connection) -> None:
        if not self._in_transaction():
            await conn.commit()

    async def close(self) -> None:
        """Close the database connection."""
        if self._connection is not None:
            await self._connection.close()
            self._connection = None

    async def get(self, collection: str, id: str) -> dict[str, Any] | None:
        """Get a single document by ID."""
        conn = await self._get_connection()
        cursor = await conn.execute(
            "SELECT data FROM documents WHERE collection = ? AND id = ?",
            (collection, id),
        )
        row = await cursor.fetchone()
        await cursor.close()

        if row is None:
            return None

        return json.loads(row["data"])

    async def list(
        self, collection: str, filters: dict[str, Any] | None = None
    ) -> list[dict[str, Any]]:
        """List documents in a collection, optionally filtered.

        Uses SQL-level JSON_EXTRACT for filtering when possible,
        which is significantly faster than Python filtering for large datasets.
        """
        conn = await self._get_connection()

        # Build SQL query with JSON_EXTRACT filters for better performance
        sql = "SELECT data FROM documents WHERE collection = ?"
        params: list[Any] = [collection]

        if filters:
            for key, value in filters.items():
                # JSON_EXTRACT returns JSON type, need to handle string comparison
                if isinstance(value, str):
                    sql += f" AND JSON_EXTRACT(data, '$.{key}') = ?"
                    params.append(value)
                elif isinstance(value, bool):
                    # SQLite stores booleans as 1/0 in JSON
                    sql += f" AND JSON_EXTRACT(data, '$.{key}') = ?"
                    params.append(1 if value else 0)
                elif isinstance(value, (int, float)):
                    sql += f" AND JSON_EXTRACT(data, '$.{key}') = ?"
                    params.append(value)
                elif value is None:
                    sql += f" AND JSON_EXTRACT(data, '$.{key}') IS NULL"
                else:
                    # For complex types, fall back to Python filtering
                    pass

        cursor = await conn.execute(sql, tuple(params))
        rows = await cursor.fetchall()
        await cursor.close()

        results = []
        for row in rows:
            doc = json.loads(row["data"])
            # Double-check filters in Python for any complex types we couldn't handle in SQL
            if self._matches_filters(doc, filters):
                results.append(doc)

        return results

    def _matches_filters(
        self, doc: dict[str, Any], filters: dict[str, Any] | None
    ) -> bool:
        """Check if document matches all filters."""
        if not filters:
            return True
        for key, value in filters.items():
            if key not in doc or doc[key] != value:
                return False
        return True

    async def create(self, collection: str, data: dict[str, Any]) -> dict[str, Any]:
        """Create a new document."""
        if "id" not in data:
            raise ValueError("Document must have an 'id' field")

        conn = await self._get_connection()
        await conn.execute(
            """
            INSERT INTO documents (collection, id, data)
            VALUES (?, ?, ?)
            """,
            (collection, data["id"], json.dumps(data, default=str)),
        )
        await self._commit_if_needed(conn)

        return data

    async def update(
        self, collection: str, id: str, data: dict[str, Any]
    ) -> dict[str, Any] | None:
        """Update an existing document."""
        conn = await self._get_connection()

        # Get existing document
        existing = await self.get(collection, id)
        if existing is None:
            return None

        # Merge updates
        updated = {**existing, **data, "id": id}

        await conn.execute(
            """
            UPDATE documents
            SET data = ?, updated_at = CURRENT_TIMESTAMP
            WHERE collection = ? AND id = ?
            """,
            (json.dumps(updated, default=str), collection, id),
        )
        await self._commit_if_needed(conn)

        return updated

    async def delete(self, collection: str, id: str) -> bool:
        """Delete a document by ID."""
        conn = await self._get_connection()
        cursor = await conn.execute(
            "DELETE FROM documents WHERE collection = ? AND id = ?",
            (collection, id),
        )
        await self._commit_if_needed(conn)

        deleted = cursor.rowcount > 0
        await cursor.close()
        return deleted

    async def count(self, collection: str, filters: dict[str, Any] | None = None) -> int:
        """Count documents in a collection.

        Uses SQL-level JSON_EXTRACT for filtering when possible,
        which is faster than loading all documents into Python.
        """
        conn = await self._get_connection()

        # Build SQL query with JSON_EXTRACT filters for better performance
        sql = "SELECT COUNT(*) as cnt FROM documents WHERE collection = ?"
        params: list[Any] = [collection]

        if filters:
            has_complex_filters = False
            for key, value in filters.items():
                if isinstance(value, str):
                    sql += f" AND JSON_EXTRACT(data, '$.{key}') = ?"
                    params.append(value)
                elif isinstance(value, bool):
                    sql += f" AND JSON_EXTRACT(data, '$.{key}') = ?"
                    params.append(1 if value else 0)
                elif isinstance(value, (int, float)):
                    sql += f" AND JSON_EXTRACT(data, '$.{key}') = ?"
                    params.append(value)
                elif value is None:
                    sql += f" AND JSON_EXTRACT(data, '$.{key}') IS NULL"
                else:
                    has_complex_filters = True

            # If there are complex filters we can't handle in SQL, fall back
            if has_complex_filters:
                docs = await self.list(collection, filters)
                return len(docs)

        cursor = await conn.execute(sql, tuple(params))
        row = await cursor.fetchone()
        await cursor.close()
        return row["cnt"] if row else 0

    @asynccontextmanager
    async def transaction(self) -> AsyncIterator["SQLiteStorage"]:
        """Context manager for transactions with automatic rollback on error."""
        conn = await self._get_connection()
        is_outermost = self._transaction_depth == 0
        if is_outermost:
            # Start transaction by disabling autocommit
            await conn.execute("BEGIN IMMEDIATE")

        self._transaction_depth += 1
        try:
            yield self
            if is_outermost:
                await conn.commit()
        except Exception:
            if is_outermost:
                await conn.rollback()
            raise
        finally:
            self._transaction_depth -= 1

    async def batch_delete(
        self, collection: str, ids: list[str]
    ) -> dict[str, bool]:
        """Delete multiple documents efficiently."""
        if not ids:
            return {}

        conn = await self._get_connection()
        results = {}

        # Validate list length to prevent abuse
        if len(ids) > 1000:
            raise ValueError("Cannot delete more than 1000 items at once")

        # Use a single transaction for all deletes
        placeholders = ",".join("?" * len(ids))
        query = f"SELECT id FROM documents WHERE collection = ? AND id IN ({placeholders})"
        cursor = await conn.execute(query, (collection, *ids))
        existing = {row["id"] for row in await cursor.fetchall()}
        await cursor.close()

        delete_query = f"DELETE FROM documents WHERE collection = ? AND id IN ({placeholders})"
        await conn.execute(delete_query, (collection, *ids))
        await self._commit_if_needed(conn)

        for id in ids:
            results[id] = id in existing

        return results

    async def batch_create(
        self, collection: str, items: list[dict[str, Any]]
    ) -> list[dict[str, Any]]:
        """Create multiple documents efficiently."""
        if not items:
            return []

        conn = await self._get_connection()

        await conn.executemany(
            """
            INSERT INTO documents (collection, id, data)
            VALUES (?, ?, ?)
            """,
            [
                (collection, item["id"], json.dumps(item, default=str))
                for item in items
            ],
        )
        await self._commit_if_needed(conn)

        return items
