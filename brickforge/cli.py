"""BrickForge CLI entry point."""
import sys

if sys.version_info < (3, 9):
    sys.exit(f"brickforge requires Python 3.9+. You have {sys.version.split()[0]}.")


def main():
    """Start the BrickForge Setup App."""
    if "--version" in sys.argv or "-v" in sys.argv:
        from brickforge import __version__
        print(f"brickforge {__version__}")
        return
    from brickforge.server import main as server_main
    server_main()


if __name__ == "__main__":
    main()
