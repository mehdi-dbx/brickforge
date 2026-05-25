"""SSE (Server-Sent Events) helpers for streaming subprocess output."""
from __future__ import annotations

import asyncio
import json
import os
import time
from pathlib import Path
from typing import AsyncGenerator

from brickforge import PROJECT_ROOT


def sse_event(event_type: str, data: dict) -> str:
    """Format a single SSE event string."""
    return f"event:{event_type}\ndata:{json.dumps(data)}\n\n"


def sse_line(text: str, stream: str = "out") -> str:
    return sse_event("line", {"text": text, "stream": stream})


def sse_done(ok: bool, code: int = 0) -> str:
    return sse_event("done", {"ok": ok, "code": code})


def sse_result(data: dict) -> str:
    return sse_event("result", data)


class ExecLogger:
    """Logs exec output to file."""

    def __init__(self, action: str):
        self.log_dir = PROJECT_ROOT / "logs" / "exec"
        self.log_dir.mkdir(parents=True, exist_ok=True)
        self.log_file = self.log_dir / f"{action}-{int(time.time() * 1000)}.log"
        self.latest_link = self.log_dir / f"{action}-latest.log"
        self._lines: list[str] = []
        self._lines.append(f"=== {action} {time.strftime('%Y-%m-%dT%H:%M:%S')}Z ===\n")

    def log(self, text: str) -> None:
        self._lines.append(text if text.endswith("\n") else text + "\n")

    def finish(self, ok: bool, code: int = 0) -> None:
        self._lines.append(f"=== {'OK' if ok else 'FAILED'} (exit {code}) ===\n")
        content = "".join(self._lines)
        self.log_file.write_text(content)
        # Update latest link (copy, not symlink for cross-platform)
        try:
            self.latest_link.write_text(content)
        except Exception:
            pass


async def stream_subprocess(
    cmd: list[str],
    env: dict[str, str] | None = None,
    cwd: str | Path | None = None,
    timeout: float = 300,
    detect_result: bool = False,
) -> AsyncGenerator[str, None]:
    """Stream subprocess stdout/stderr as SSE events.

    If detect_result=True, lines starting with __RESULT__: are emitted as event:result.
    """
    cwd = str(cwd or PROJECT_ROOT)
    proc = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
        cwd=cwd,
        env=env,
    )

    async def read_stream(stream, stream_name: str):
        while True:
            line = await stream.readline()
            if not line:
                break
            text = line.decode("utf-8", errors="replace")
            # Skip uv VIRTUAL_ENV warning
            if "VIRTUAL_ENV" in text and "does not match" in text:
                continue
            if detect_result and text.startswith("__RESULT__:"):
                try:
                    result_data = json.loads(text[len("__RESULT__:"):])
                    yield sse_result(result_data)
                except json.JSONDecodeError:
                    yield sse_line(text, stream_name)
            else:
                yield sse_line(text, stream_name)

    # Read stdout first, then stderr
    async for event in read_stream(proc.stdout, "out"):
        yield event
    async for event in read_stream(proc.stderr, "err"):
        yield event

    try:
        await asyncio.wait_for(proc.wait(), timeout=timeout)
    except asyncio.TimeoutError:
        proc.kill()
        yield sse_line("[x] Process timed out\n", "err")

    code = proc.returncode or 0
    yield sse_done(code == 0, code)


async def _collect(gen) -> list[str]:
    """Collect all items from an async generator."""
    items = []
    async for item in gen:
        items.append(item)
    return items
