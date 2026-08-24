#!/usr/bin/env python3
"""Tailnet E2E for Study Buddy.

Runs through the HTTPS site endpoint and proves:
  1. combined frontend/API host is reachable;
  2. registration and login work through the proxy;
  3. the server can reach Anvil Serving;
  4. real model text is returned;
  5. structured flashcards are generated from persisted course content.

No third-party Python packages are required.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.request
import uuid


class E2E:
    def __init__(self, base: str) -> None:
        self.base = base.rstrip("/")
        self.token: str | None = None
        self.email = f"e2e-{uuid.uuid4().hex[:10]}@example.com"
        # Password for the throwaway E2E account. Override via env so no
        # hardcoded credential ships in the repo (public).
        self.password = os.environ.get("E2E_PASSWORD", "Tailnet-E2E-123!")
        self.results: list[tuple[str, bool, str]] = []

    def request(
        self,
        method: str,
        path: str,
        body: dict | None = None,
        timeout: int = 240,
    ) -> tuple[int, dict]:
        data = json.dumps(body).encode() if body is not None else None
        request = urllib.request.Request(
            f"{self.base}{path}", data=data, method=method
        )
        request.add_header("Content-Type", "application/json")
        if self.token:
            request.add_header("Authorization", f"Bearer {self.token}")
        try:
            with urllib.request.urlopen(request, timeout=timeout) as response:
                raw = response.read().decode()
                return response.status, json.loads(raw) if raw else {}
        except urllib.error.HTTPError as error:
            raw = error.read().decode()
            try:
                return error.code, json.loads(raw)
            except json.JSONDecodeError:
                return error.code, {"raw": raw[:500]}

    def check(self, name: str, passed: bool, detail: str = "") -> None:
        self.results.append((name, passed, detail))
        suffix = f" — {detail[:180]}" if detail and not passed else ""
        print(f"  [{'PASS' if passed else 'FAIL'}] {name}{suffix}")

    def run(self) -> int:
        print(f"\nStudy Buddy tailnet E2E\nEndpoint: {self.base}\n")

        status, body = self.request("GET", "/health", timeout=20)
        self.check(
            "HTTPS site health",
            status == 200 and body.get("status") == "healthy",
            f"HTTP {status}: {body}",
        )
        if not self.results[-1][1]:
            return self.finish()

        status, body = self.request(
            "POST",
            "/api/v1/auth/register",
            {"email": self.email, "name": "Tailnet E2E", "password": self.password},
        )
        self.check(
            "Register through site API proxy",
            status in (200, 201) and body.get("email") == self.email,
            f"HTTP {status}: {body}",
        )

        status, body = self.request(
            "POST",
            "/api/v1/auth/login",
            {"email": self.email, "password": self.password},
        )
        self.token = body.get("access_token")
        self.check(
            "Login and receive bearer token",
            status == 200 and bool(self.token),
            f"HTTP {status}: {body}",
        )
        if not self.token:
            return self.finish()

        status, body = self.request("GET", "/api/v1/auth/ai-connection")
        self.check(
            "Anvil router configured and reachable",
            status == 200
            and body.get("provider") == "anvil"
            and body.get("is_configured") is True
            and body.get("is_reachable") is True,
            f"HTTP {status}: {body}",
        )

        started = time.monotonic()
        status, body = self.request(
            "POST",
            "/api/v1/ai/explain",
            {
                "concept": "spaced repetition",
                "context": "A student is learning to use flashcards for long-term memory.",
            },
        )
        elapsed = time.monotonic() - started
        content = body.get("content", "")
        self.check(
            f"Real AI explanation via Anvil ({elapsed:.1f}s)",
            status == 200 and len(content) >= 80 and body.get("tokens_used") == 5,
            f"HTTP {status}: {body}",
        )
        if content:
            print(f"\n  Model output: {content[:350].replace(chr(10), ' ')}\n")

        status, course = self.request(
            "POST",
            "/api/v1/courses",
            {
                "title": f"Tailnet E2E {uuid.uuid4().hex[:6]}",
                "description": "Disposable E2E course",
                "ai_enabled": True,
            },
        )
        course_id = course.get("id")
        if course_id:
            status, module = self.request(
                "POST",
                f"/api/v1/courses/{course_id}/modules",
                {
                    "title": "Flashcard Basics",
                    "order_index": 0,
                    "content_markdown": (
                        "A flashcard has a prompt on the front and an answer on the back. "
                        "Spaced repetition reviews cards at increasing intervals. "
                        "Active recall strengthens long-term memory more than rereading."
                    ),
                },
            )
        else:
            module = {}
        module_id = module.get("id")
        self.check(
            "Persist course and module through site",
            bool(course_id and module_id),
            f"course HTTP {status}: course={course}, module={module}",
        )

        if course_id and module_id:
            started = time.monotonic()
            status, body = self.request(
                "POST",
                "/api/v1/generate/flashcards",
                {"course_id": course_id, "module_id": module_id, "count": 3},
            )
            elapsed = time.monotonic() - started
            cards = body.get("flashcards", [])
            valid = all(card.get("front") and card.get("back") for card in cards)
            self.check(
                f"Structured flashcards via Anvil ({elapsed:.1f}s)",
                status == 200 and len(cards) == 3 and valid,
                f"HTTP {status}: {body}",
            )
            if cards:
                print(
                    f"  Sample card: {cards[0].get('front')} -> "
                    f"{cards[0].get('back')}\n"
                )

        return self.finish()

    def finish(self) -> int:
        passed = sum(ok for _, ok, _ in self.results)
        total = len(self.results)
        print(f"Result: {passed}/{total} checks passed")
        return 0 if passed == total else 1


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--base",
        default="https://fakoli-mini.tail4378d.ts.net:4443",
        help="Study Buddy Tailscale Serve URL",
    )
    args = parser.parse_args()
    sys.exit(E2E(args.base).run())


if __name__ == "__main__":
    main()
