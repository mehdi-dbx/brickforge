"""GitHub integration -- device flow auth, repo creation, code push.

Uses GitHub OAuth Device Flow for auth (no redirects needed).
client_id is from the BrickForge GitHub OAuth App.
"""
from __future__ import annotations

import json
import logging
import time
import urllib.parse
import urllib.request

_log = logging.getLogger(__name__)

CLIENT_ID = "Ov23liqaGLy9v7sWlVsM"


def start_device_flow() -> dict:
    """Start GitHub device flow. Returns {user_code, device_code, verification_uri, interval}."""
    data = urllib.parse.urlencode({
        "client_id": CLIENT_ID,
        "scope": "repo",
    }).encode()
    req = urllib.request.Request(
        "https://github.com/login/device/code",
        data=data,
        headers={"Accept": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=10) as r:
        return json.loads(r.read())


def poll_device_flow(device_code: str, interval: int = 5, timeout: int = 300) -> str | None:
    """Poll GitHub for device flow completion. Returns access_token or None on timeout."""
    data = urllib.parse.urlencode({
        "client_id": CLIENT_ID,
        "device_code": device_code,
        "grant_type": "urn:ietf:params:oauth:grant-type:device_code",
    }).encode()

    deadline = time.time() + timeout
    while time.time() < deadline:
        time.sleep(interval)
        req = urllib.request.Request(
            "https://github.com/login/oauth/access_token",
            data=data,
            headers={"Accept": "application/json"},
        )
        try:
            with urllib.request.urlopen(req, timeout=10) as r:
                resp = json.loads(r.read())
            if "access_token" in resp:
                return resp["access_token"]
            error = resp.get("error", "")
            if error == "authorization_pending":
                continue
            if error == "slow_down":
                interval = resp.get("interval", interval + 5)
                continue
            if error in ("expired_token", "access_denied"):
                return None
        except Exception:
            continue
    return None


def get_user(token: str) -> str:
    """Get the authenticated GitHub username."""
    req = urllib.request.Request(
        "https://api.github.com/user",
        headers={
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github+json",
        },
    )
    with urllib.request.urlopen(req, timeout=10) as r:
        return json.loads(r.read()).get("login", "unknown")


def create_repo(token: str, name: str, private: bool = True) -> str:
    """Create a GitHub repo. Returns clone_url. If exists, returns existing URL."""
    username = get_user(token)

    # Check if repo exists
    try:
        req = urllib.request.Request(
            f"https://api.github.com/repos/{username}/{name}",
            headers={
                "Authorization": f"Bearer {token}",
                "Accept": "application/vnd.github+json",
            },
        )
        with urllib.request.urlopen(req, timeout=10) as r:
            repo = json.loads(r.read())
        return repo["clone_url"]
    except urllib.error.HTTPError as e:
        if e.code != 404:
            raise

    # Create
    req = urllib.request.Request(
        "https://api.github.com/user/repos",
        data=json.dumps({"name": name, "private": private, "auto_init": False}).encode(),
        headers={
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github+json",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=10) as r:
        repo = json.loads(r.read())
    return repo["clone_url"]


def push_bundle(token: str, repo_url: str, bundle_zip: bytes, message: str = "BrickForge: project update") -> bool:
    """Extract bundle to temp dir and push via git CLI."""
    import os
    import shutil
    import subprocess
    import tempfile
    import zipfile
    import io

    # Check git is available
    try:
        subprocess.run(["git", "--version"], capture_output=True, check=True)
    except (FileNotFoundError, subprocess.CalledProcessError):
        print("[x] git CLI not found -- install git to push code")
        return False

    tmpdir = tempfile.mkdtemp(prefix="brickforge-push-")
    try:
        # Extract bundle
        zf = zipfile.ZipFile(io.BytesIO(bundle_zip))
        zf.extractall(tmpdir)
        zf.close()

        # Insert token into URL for auth
        # https://github.com/user/repo.git -> https://{token}@github.com/user/repo.git
        auth_url = repo_url.replace("https://", f"https://{token}@")

        env = dict(os.environ)
        env["GIT_TERMINAL_PROMPT"] = "0"

        # Init, add, commit, push
        cmds = [
            ["git", "init"],
            ["git", "checkout", "-b", "main"],
            ["git", "add", "."],
            ["git", "commit", "-m", message],
            ["git", "remote", "add", "origin", auth_url],
            ["git", "push", "-u", "origin", "main", "--force"],
        ]
        for cmd in cmds:
            label = " ".join(cmd[:3]) if "token" not in " ".join(cmd) else f"{cmd[0]} {cmd[1]} ..."
            r = subprocess.run(cmd, cwd=tmpdir, capture_output=True, text=True, env=env)
            if r.returncode != 0:
                stderr = r.stderr.strip()
                # Mask token in error output
                stderr = stderr.replace(token, "***")
                if "nothing to commit" in r.stdout:
                    print("[+] Nothing to commit (already up to date)")
                    return True
                print(f"[x] {label}: {stderr}")
                return False
        print("[+] Pushed to GitHub")
        return True
    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)
