"""Exercise the optional hook in disposable repositories, never this checkout."""

import json
import os
from pathlib import Path
import secrets
import shutil
import string
import subprocess
import tempfile
import unittest


ROOT = Path(__file__).resolve().parents[1]
HOOK = ROOT / "scripts/git-hooks/pre-commit"
PROFILE = ROOT / ".claude/optional-permissions.json"
GIT = shutil.which("git")
GITLEAKS = shutil.which("gitleaks")


class HookFixture(unittest.TestCase):
    def setUp(self):
        if GIT is None:
            self.skipTest("git is required for the disposable-repository tests")
        self.temporary = tempfile.TemporaryDirectory(prefix="oxhack hook test ")
        self.addCleanup(self.temporary.cleanup)
        self.base = Path(self.temporary.name)
        self.repo = self.base / "repo"
        self.repo.mkdir()
        # Ignore personal Git/scanner configuration and credentials in fixtures.
        self.env = {
            key: value
            for key, value in os.environ.items()
            if not key.startswith(("GIT_", "GITLEAKS_"))
        }
        self.env.update(
            GIT_CONFIG_NOSYSTEM="1",
            GIT_CONFIG_GLOBAL=os.devnull,
            GIT_TERMINAL_PROMPT="0",
        )
        self.tokens = []
        self.git("init", "-q", "-b", "main")
        self.git("config", "user.name", "Optional hook test")
        self.git("config", "user.email", "hook-test@example.invalid")
        self.git("config", "commit.gpgsign", "false")
        self.write("README.md", "Disposable fixture.\n")
        self.git("add", "README.md")
        self.git("commit", "-qm", "Initialize fixture")

    def safe_output(self, result):
        output = result.stdout + result.stderr
        for token in self.tokens:
            output = output.replace(token, "[synthetic credential redacted]")
        return output

    def run_command(self, command, *, env=None, expected=0):
        result = subprocess.run(
            command,
            cwd=self.repo,
            env=self.env if env is None else env,
            capture_output=True,
            text=True,
            timeout=30,
            check=False,
        )
        if expected is not None:
            self.assertEqual(result.returncode, expected, self.safe_output(result))
        return result

    def git(self, *arguments, expected=0):
        return self.run_command([GIT, *arguments], expected=expected)

    def write(self, name, content):
        path = self.repo / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")
        return path

    def credential(self):
        # Generated only in a disposable fixture, never stored in project history.
        alphabet = string.ascii_letters + string.digits
        token = "ghp_" + "".join(secrets.choice(alphabet) for _ in range(36))
        self.tokens.append(token)
        return f'github_token = "{token}"\n'

    def hook(self, *, env=None, expected=0):
        return self.run_command([str(HOOK)], env=env, expected=expected)


class OptionalHookBehaviorTests(HookFixture):
    def test_missing_scanner_warns_and_permits_commit(self):
        empty_path = self.base / "no tools"
        empty_path.mkdir()
        result = self.hook(env={**self.env, "PATH": str(empty_path)})
        self.assertIn("local staged secret scan was skipped", result.stderr)
        self.assertIn("CI still scans committed history", result.stderr)

    def test_scanner_error_blocks_commit(self):
        tools = self.base / "scanner error"
        tools.mkdir()
        stub = tools / "gitleaks"
        stub.write_text("#!/bin/sh\nexit 2\n", encoding="utf-8")
        stub.chmod(0o755)
        result = self.hook(env={**self.env, "PATH": str(tools)}, expected=1)
        self.assertIn("staged secret scan failed", result.stderr)


@unittest.skipUnless(GITLEAKS, "install gitleaks to run staged secret scan tests")
class StagedSecretScanTests(HookFixture):
    def test_clean_staged_file_passes(self):
        self.write("clean.txt", "No credentials here.\n")
        self.git("add", "clean.txt")
        self.hook()

    def test_staged_secret_blocks_and_output_is_redacted(self):
        self.write("credentials.txt", self.credential())
        self.git("add", "credentials.txt")
        result = self.hook(expected=1)
        output = result.stdout + result.stderr
        self.assertTrue(
            all(token not in output for token in self.tokens),
            "scanner output must redact synthetic credentials",
        )
        self.assertIn("leaks found", output)

    def test_staged_secret_blocks_even_when_working_copy_is_clean(self):
        self.write("credentials.txt", self.credential())
        self.git("add", "credentials.txt")
        self.write("credentials.txt", "Secret removed only from working copy.\n")
        self.hook(expected=1)

    def test_unstaged_secret_does_not_block_clean_staged_content(self):
        self.write("partial.txt", "Clean index version.\n")
        self.git("add", "partial.txt")
        self.write("partial.txt", self.credential())
        self.hook()

    def test_untracked_secret_is_not_part_of_staged_scan(self):
        self.write("untracked.txt", self.credential())
        self.write("clean.txt", "Clean staged version.\n")
        self.git("add", "clean.txt")
        self.hook()

    def test_staged_deletion_ignores_old_secret_content(self):
        self.write("obsolete.txt", self.credential())
        self.git("add", "obsolete.txt")
        self.git("commit", "-qm", "Add disposable file")
        self.git("rm", "obsolete.txt")
        self.hook()

    def test_renamed_file_with_spaces_and_new_secret_blocks(self):
        self.write("old name.txt", "Safe text.\n")
        self.git("add", "old name.txt")
        self.git("commit", "-qm", "Add rename fixture")
        self.git("mv", "old name.txt", "new name.txt")
        self.write("new name.txt", "Safe text.\n" + self.credential())
        self.git("add", "new name.txt")
        self.hook(expected=1)

    def test_hook_requires_explicit_per_clone_activation(self):
        installed = self.repo / "scripts/git-hooks/pre-commit"
        installed.parent.mkdir(parents=True)
        shutil.copy2(HOOK, installed)
        self.git("add", "scripts/git-hooks/pre-commit")
        self.git("commit", "-qm", "Add optional hook")
        clone = self.base / "fresh clone"
        self.git("clone", "-q", "--no-local", str(self.repo), str(clone))
        self.repo = clone
        self.git("config", "user.name", "Optional hook test")
        self.git("config", "user.email", "hook-test@example.invalid")
        self.git("config", "commit.gpgsign", "false")
        self.git("config", "--get", "core.hooksPath", expected=1)
        self.write("credentials.txt", self.credential())
        self.git("add", "credentials.txt")
        self.git("config", "--local", "core.hooksPath", "scripts/git-hooks")
        before = self.git("rev-parse", "HEAD").stdout
        self.git("commit", "-qm", "Must be rejected", expected=1)
        self.assertEqual(self.git("rev-parse", "HEAD").stdout, before)
        self.git("config", "--local", "--unset", "core.hooksPath")
        self.git("config", "--get", "core.hooksPath", expected=1)


class OptionalProfileTests(unittest.TestCase):
    def test_profile_contains_only_deny_rules(self):
        profile = json.loads(PROFILE.read_text(encoding="utf-8"))
        self.assertEqual(set(profile), {"permissions"})
        self.assertEqual(set(profile["permissions"]), {"deny"})
        rules = profile["permissions"]["deny"]
        self.assertTrue(rules)
        self.assertTrue(all(isinstance(rule, str) for rule in rules))
        self.assertTrue(all(rule.startswith(("Read(", "Edit(", "Bash(")) for rule in rules))

    def test_env_examples_have_ordered_exceptions(self):
        # These are configuration invariants, not a Claude runtime permission test.
        rules = json.loads(PROFILE.read_text(encoding="utf-8"))["permissions"]["deny"]
        for tool in ("Read", "Edit"):
            for prefix, exception_prefix in (("./", ""), ("./**/", "**/")):
                self.assertLess(
                    rules.index(f"{tool}({prefix}.env.*)"),
                    rules.index(f"{tool}(!{exception_prefix}.env.example)"),
                )
                self.assertLess(
                    rules.index(f"{tool}(!{exception_prefix}.env.example)"),
                    rules.index(f"{tool}({prefix}secrets/**)"),
                )

    def test_hook_is_executable_and_not_enabled_by_an_active_settings_file(self):
        self.assertTrue(os.access(HOOK, os.X_OK))
        self.assertFalse((ROOT / ".claude/settings.json").exists())


if __name__ == "__main__":
    unittest.main()
