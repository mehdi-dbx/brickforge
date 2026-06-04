"""Test config.json migration and flatten round-trip."""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "brickforge"))

from lib.config_provider import env_local_to_config_json, flatten, DEFAULT_CONFIG, LocalConfigProvider
import json


def test_migrate_and_flatten():
    env_file = ROOT / ".env.local"
    if not env_file.exists():
        print("[skip] no .env.local found")
        return

    config = env_local_to_config_json(env_file)
    flat = flatten(config)

    print("=== FLATTENED ENV VARS ===")
    for k, v in sorted(flat.items()):
        display = v[:50] + "..." if len(v) > 50 else v
        print(f"  {k}={display}")
    print(f"  Total: {len(flat)} env vars")

    # Verify key vars survived
    assert config["workspace"]["host"], "host missing"
    assert config["workspace"]["warehouse_id"], "warehouse_id missing"
    assert config["workspace"]["unity_catalog_schema"], "schema missing"
    assert config["model"]["endpoint"], "model endpoint missing"
    assert "DATABRICKS_HOST" in flat, "DATABRICKS_HOST not in flat"
    assert "AGENT_MODEL" in flat, "AGENT_MODEL not in flat"
    assert "PROJECT_UNITY_CATALOG_SCHEMA" in flat, "schema not in flat"

    # Verify arrays
    if config["tools"]["genie_spaces"]:
        assert "PROJECT_GENIE_SPACES" in flat, "genie spaces not flattened"
        assert "," not in flat["PROJECT_GENIE_SPACES"] or len(config["tools"]["genie_spaces"]) > 1

    if config["tools"]["functions"]:
        assert "PROJECT_FUNCTIONS" in flat, "functions not flattened"

    # Verify disabled entries are NOT in flat
    for slug, entry in config["tools"].get("ka", {}).items():
        if not entry.get("enabled", True):
            assert f"PROJECT_KA_{slug}" not in flat, f"disabled KA {slug} should not be in flat"

    print("[+] migration + flatten round-trip passed")


def test_local_config_provider_write_read(tmp_path):
    config_file = tmp_path / "config.json"
    provider = LocalConfigProvider(config_file)

    # Set structured values
    provider.set("workspace.host", "https://test.databricks.com")
    provider.set("workspace.token", "dapi_test_token")
    provider.set("model.endpoint", "test-model")

    # Read back
    assert provider.get("workspace.host") == "https://test.databricks.com"
    assert provider.get("model.endpoint") == "test-model"

    # Verify file on disk
    on_disk = json.loads(config_file.read_text())
    assert on_disk["workspace"]["host"] == "https://test.databricks.com"

    # Flatten
    flat = provider.flatten()
    assert flat["DATABRICKS_HOST"] == "https://test.databricks.com"
    assert flat["AGENT_MODEL"] == "test-model"

    print("[+] LocalConfigProvider write/read passed")


def test_legacy_set_many(tmp_path):
    config_file = tmp_path / "config.json"
    provider = LocalConfigProvider(config_file)

    # Legacy API
    provider.set_many({
        "DATABRICKS_HOST": "https://legacy.databricks.com",
        "DATABRICKS_WAREHOUSE_ID": "wh123",
        "PROJECT_GENIE_SPACES": "space1,space2,space3",
        "PROJECT_TOOL_MEMORY": "true",
        "PROJECT_BRICK_KA": "true",
        "PROJECT_KA_TEST": "ka-test-endpoint",
    })

    assert provider.get("workspace.host") == "https://legacy.databricks.com"
    assert provider.get("workspace.warehouse_id") == "wh123"
    assert provider.get("tools.genie_spaces") == ["space1", "space2", "space3"]
    assert provider.get("features.MEMORY") == {"enabled": True}
    assert provider.get("bricks.KA") == {"enabled": True}
    assert provider.get("tools.ka.TEST") == {"enabled": True, "endpoint": "ka-test-endpoint"}

    # Flatten - KA should be in output (both bricks.KA and tools.ka.TEST are enabled)
    flat = provider.flatten()
    assert flat.get("PROJECT_KA_TEST") == "ka-test-endpoint"
    assert flat.get("PROJECT_GENIE_SPACES") == "space1,space2,space3"

    print("[+] legacy set_many passed")


def test_toggle_and_disable(tmp_path):
    config_file = tmp_path / "config.json"
    provider = LocalConfigProvider(config_file)

    provider.set_many({"PROJECT_KA_TEST": "ka-test-ep", "PROJECT_BRICK_KA": "true"})

    # Toggle KA instance off
    provider.toggle("PROJECT_KA_TEST")
    assert provider.get("tools.ka.TEST")["enabled"] is False
    flat = provider.flatten()
    assert "PROJECT_KA_TEST" not in flat  # disabled, should be omitted

    # Toggle back on
    provider.toggle("PROJECT_KA_TEST")
    assert provider.get("tools.ka.TEST")["enabled"] is True
    flat = provider.flatten()
    assert flat.get("PROJECT_KA_TEST") == "ka-test-ep"

    # Disable
    provider.disable("PROJECT_KA_TEST")
    assert provider.get("tools.ka.TEST")["enabled"] is False

    # Delete
    provider.delete_key("PROJECT_KA_TEST")
    assert provider.get("tools.ka.TEST") is None

    print("[+] toggle/disable/delete passed")


if __name__ == "__main__":
    import tempfile
    test_migrate_and_flatten()
    with tempfile.TemporaryDirectory() as tmp:
        tmp_path = Path(tmp)
        test_local_config_provider_write_read(tmp_path)
        test_legacy_set_many(tmp_path)
        test_toggle_and_disable(tmp_path)
    print("[+] ALL TESTS PASSED")
