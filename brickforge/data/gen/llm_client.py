"""LLM HTTP client for synthetic data generation.

Reuses the endpoint resolution pattern from eval/scorer.py —
same-workspace fallback when AGENT_MODEL_ENDPOINT is not set.
"""
from __future__ import annotations

import json
import os
import re

import requests


def _resolve_endpoint() -> tuple[str, str]:
    """Return (endpoint_url, bearer_token) from env vars."""
    endpoint = os.environ.get("AGENT_MODEL_ENDPOINT", "").strip()
    host = os.environ.get("DATABRICKS_HOST", "").strip().rstrip("/")

    if not endpoint:
        if not host:
            raise EnvironmentError(
                "AGENT_MODEL_ENDPOINT not set and DATABRICKS_HOST not set — "
                "configure the model endpoint in Setup first"
            )
        endpoint = f"{host}/serving-endpoints/databricks-claude-sonnet-4-6/invocations"

    token = (
        os.environ.get("AGENT_MODEL_TOKEN", "").strip()
        or os.environ.get("DATABRICKS_TOKEN", "").strip()
    )
    if not token:
        raise EnvironmentError(
            "No auth token found — set AGENT_MODEL_TOKEN or DATABRICKS_TOKEN"
        )
    return endpoint, token


def call_llm(system: str, user: str, max_tokens: int = 4096) -> str:
    """Call the model endpoint and return the assistant's text reply.

    Raises on HTTP errors or missing content.
    """
    endpoint, token = _resolve_endpoint()

    payload: dict = {
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        "max_tokens": max_tokens,
    }

    resp = requests.post(
        endpoint,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
        json=payload,
        timeout=90,
    )
    resp.raise_for_status()
    data = resp.json()
    return data["choices"][0]["message"]["content"].strip()


def call_llm_json(system: str, user: str, max_tokens: int = 4096) -> dict:
    """Call the model and parse the response as JSON.

    Retries once with a correction prompt on parse failure.
    """
    raw = call_llm(system, user, max_tokens)

    # Strip markdown fences if the model wraps output
    cleaned = re.sub(r"^```(?:json)?\s*", "", raw)
    cleaned = re.sub(r"\s*```$", "", cleaned)

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    # Retry once with correction
    print("[~] LLM returned invalid JSON — retrying with correction prompt")
    correction = (
        "Your previous response was not valid JSON. "
        "Return ONLY the raw JSON object, no markdown fences, no explanation."
    )
    raw2 = call_llm(system, f"{user}\n\n{correction}", max_tokens)
    cleaned2 = re.sub(r"^```(?:json)?\s*", "", raw2)
    cleaned2 = re.sub(r"\s*```$", "", cleaned2)

    try:
        return json.loads(cleaned2)
    except json.JSONDecodeError as e:
        raise ValueError(
            f"LLM returned invalid JSON after retry: {e}\nRaw: {cleaned2[:500]}"
        ) from e
