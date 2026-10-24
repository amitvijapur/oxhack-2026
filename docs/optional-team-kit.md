# Optional tools from Muhammad's kit

These tools are available when useful. Shared `AGENTS.md` rules and the existing
task list remain authoritative. Cortex stays local to Amit. No reviewer agents,
score requirements, session hooks, additional workflows, or approval requirements
are installed. Required CI and the zero-approval merge policy are unchanged.

## Staged secret scan

The executable [pre-commit hook](../scripts/git-hooks/pre-commit) runs Gitleaks
against the staged index, with detected values redacted. If Gitleaks is missing,
it warns that the local scan was skipped and allows the commit. CI still scans
committed history. A scanner can miss secrets, so continue to keep real
credentials outside Git.

The hook is inactive in a fresh clone. To use it, first install the open-source
[Gitleaks CLI](https://github.com/gitleaks/gitleaks#installing) yourself. CI uses
version 8.30.1. Inspect existing hook configuration from the repository root:

```sh
git config --show-origin --get-all core.hooksPath
git rev-parse --git-path hooks
```

Exit status 1 with no output from the first command means no value is configured.
Also inspect the hooks directory reported by the second command. Default hooks
can be active without a configured `core.hooksPath`. Preserve any existing
non-sample hooks, including symlinks. If a hook path or custom hook already
exists, integrate the scan into that setup yourself instead of replacing it.
If neither exists, opt in for this clone:

```sh
git config --local core.hooksPath scripts/git-hooks
```

This affects commits from any editor or coding tool, including Codex, Claude
Code, and Zed. Linked worktrees normally share this repository configuration.
To disable our hook, first confirm the current local value is exactly
`scripts/git-hooks`, then remove that value:

```sh
git config --local --get core.hooksPath
git config --local --unset core.hooksPath
```

Do not run the removal command for a different hook setup. Existing global hook
configuration takes effect again after removing a local override. No activation
or installation command runs automatically.

The hook can also be invoked explicitly without changing Git configuration:

```sh
./scripts/git-hooks/pre-commit
```

If a credential is detected, unstage it and move it out of Git. If it was real
and exposed, rotate it. Inspect potential false positives individually rather
than adding blanket exclusions.

## Manual Claude Code skills

From a Claude Code session in this repository, invoke:

- `/oxhack-debug` to investigate a specific failure with evidence and a small fix.
- `/oxhack-cleanup` to simplify an agreed set of files or the current diff.

Both skills set `disable-model-invocation: true` and leave tool permissions
unchanged. They do not run automatically before commits, pushes, or merges.
Unique names avoid replacing
Claude's bundled `/debug` or teammates' personal skills. They request only
proportionate verification for the requested work. Codex users can explicitly
read the same Markdown when useful; these directories do not install a Codex
workflow. See Claude's [manual invocation controls](https://code.claude.com/docs/en/skills#control-who-invokes-a-skill).

## Optional Claude deny profile

The [deny profile](../.claude/optional-permissions.json) is an ordinary JSON file,
not the automatically loaded `.claude/settings.json`. To use it for a session,
start Claude Code **from the repository root** with:

```sh
claude --settings ./.claude/optional-permissions.json
```

An ordinary launch omits this extra profile. Your normal personal and project
settings still apply. The profile contains only denies for credential paths and
selected destructive shell command forms. It does not grant tools or enable a
permission bypass. Environment examples remain accessible through ordered
exceptions. Paths are relative to the launch directory, which is why launching
from the root matters.

These are tool permission guardrails, not an operating system sandbox. Shell
patterns do not cover every equivalent command, and arbitrary code can access
files outside recognized file tools. Existing deny rules from another settings
source may still block an example file. Consult the current
[permission rules](https://code.claude.com/docs/en/permissions) and
[CLI settings option](https://code.claude.com/docs/en/cli-reference).

## Provenance and scope

Muhammad supplied [the kit archive at commit d517f31](https://github.com/amitvijapur/oxhack-2026/blob/d517f31f842f9e8223d72175d797345a783743ef/research/team-kit.zip).
Its SHA-256 is
`29e5f333780cbc4f1157e066ce313623981c58223725e57c40e2f43bbe032d09`.
The archive was inspected as data before adapting these pieces:

| Original path inside `team-kit/` | Adapted path | Changes |
| --- | --- | --- |
| `scripts/git-hooks/pre-commit` | `scripts/git-hooks/pre-commit` | Retain staged redacted scanning and missing-tool warning. Remove verbose output and blanket suppression advice; make executable. |
| `.claude/settings.json` | `.claude/optional-permissions.json` | Denies only, explicit loading, nested credential paths and environment-example exceptions. Remove all automatic hooks. |
| `.claude/skills/debug/` | `.claude/skills/oxhack-debug/` | Manual invocation, scoped evidence and local diagnostics, no mandatory gate or production operations. |
| `.claude/skills/no-slop/` | `.claude/skills/oxhack-cleanup/` | Manual invocation, bounded cleanup, observed workload, preserve unrelated work and useful tests. |

The original rulebooks, boards, agents, other skills, scripts, commit-message
guard, and complete archive are not imported. There is no dependency on their
missing research ledger or session machinery. Markdown line endings are
normalized. The selected skills and their references retain useful guidance
with the adaptations above.

## Verification

With Python 3 and Gitleaks on `PATH`, run:

```sh
python3 -m unittest discover -s tests -p 'test_optional_tooling.py' -v
```

Tests use disposable repositories and synthetic credentials generated at runtime.
No fixtures with credentials enter this repository's Git history. The existing
`Secret scan` job runs the tests with its pinned Gitleaks binary. JSON and skill
metadata checks verify the intended optional structure. Separate inspection and
pure-matcher probes against installed Claude Code 2.1.238 confirmed the example
exceptions while keeping environment files and examples inside `secrets/`
denied. This does not demonstrate full Claude tool permission evaluation. No
model session is started by these tests.
