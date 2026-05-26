"""Custom build: runs npm build for the agent chat UI before packaging."""
import subprocess
import shutil
from pathlib import Path
from setuptools import setup
from setuptools.command.build_py import build_py


class BuildWithNpm(build_py):
    """Run npm install + build for the chat UI before collecting Python packages."""

    def run(self):
        root = Path(__file__).parent
        pkg = root / "brickforge"
        app_dir = pkg / "app"
        client_dist = app_dir / "client" / "dist"
        server_dist = app_dir / "server" / "dist"

        # Copy pyproject.toml into brickforge/ so it ships in the wheel
        # (needed by deploy script for pip install on DBX Apps compute)
        pyproject_src = root / "pyproject.toml"
        pyproject_dst = pkg / "pyproject.toml"
        if pyproject_src.exists() and not pyproject_dst.exists():
            shutil.copy2(str(pyproject_src), str(pyproject_dst))
            print("[+] Copied pyproject.toml into brickforge/")

        # Build chat UI if source exists and node is available
        if app_dir.exists() and (app_dir / "package.json").exists():
            node = shutil.which("node")
            npm = shutil.which("npm")
            if not node or not npm:
                if not client_dist.exists() or not server_dist.exists():
                    print("[!] node/npm not found and no pre-built dist -- chat UI will not be included")
                else:
                    print("[+] Using existing pre-built dist (node/npm not found)")
            else:
                print("[+] Building chat UI...")
                subprocess.run([npm, "install"], cwd=app_dir, check=True)
                subprocess.run([npm, "run", "build:client"], cwd=app_dir, check=True)
                subprocess.run([npm, "run", "build:server"], cwd=app_dir, check=True)
                print("[+] Chat UI built")

        super().run()

        # Clean up the copied pyproject.toml from source tree
        if pyproject_dst.exists() and pyproject_src.exists():
            pyproject_dst.unlink()



setup(cmdclass={"build_py": BuildWithNpm})
