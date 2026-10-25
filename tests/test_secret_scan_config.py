"""Check the cache-hash exception without weakening credential detection."""
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
SCANNER = os.environ.get("GITLEAKS_BIN") or shutil.which("gitleaks")


@unittest.skipUnless(SCANNER, "Gitleaks binary is not available")
class CacheFingerprintExceptionTests(unittest.TestCase):
    def scan(self, filename, field="key", value=None):
        value = value or hashlib.sha256(b"oxhack scanner boundary fixture").hexdigest()
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory) / filename
            target.parent.mkdir(parents=True)
            target.write_text(json.dumps({field: value}) + "\n")
            return subprocess.run(
                [SCANNER, "dir", "--config", str(ROOT / ".gitleaks.toml"),
                 "--redact", "--no-banner", directory],
                capture_output=True, text=True, check=False,
            ).returncode

    def test_cache_prompt_fingerprint_is_allowed(self):
        self.assertEqual(self.scan("swarm/records/judge_cache.jsonl"), 0)

    def test_same_key_outside_cache_is_detected(self):
        self.assertEqual(self.scan("app/settings.json"), 1)

    def test_credential_field_inside_cache_is_detected(self):
        self.assertEqual(self.scan("swarm/records/judge_cache.jsonl", field="api_key"), 1)

    def test_non_fingerprint_key_inside_cache_is_detected(self):
        value = "fixture_" + hashlib.sha256(b"non fingerprint fixture").hexdigest()
        self.assertEqual(self.scan("swarm/records/judge_cache.jsonl", value=value), 1)


if __name__ == "__main__":
    unittest.main()
