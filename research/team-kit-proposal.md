# Proposal: adopt parts of Ahmed's team kit

24 October 2026. Status: proposal from Ahmed (`meep-boop`) for Amit to review. Nothing here is adopted until Amit ticks it.

## Why a proposal and not a drop-in

[The harness comparison](harness-comparison.md) says no extra workflow system is planned, and that one should only be added when it solves a concrete coordination problem. This file follows that rule: each piece of the kit is listed with the problem it solves, what it clashes with, and a recommendation. Amit picks; a small follow-up PR adds only the ticked pieces.

The kit is a Claude Code workflow kit our teammates used at a previous 24-hour event (IBM Z Datathon). It contains shared rules, skills, subagents, hooks, and git hooks. The full kit is in [team-kit.zip](team-kit.zip) for review. It is archived rather than unpacked so none of its hooks, skills, or rules take effect until pieces are chosen. Unzip it outside the repo to read it.

## Recommended: low cost, no clash

These sit beside the current setup without changing `AGENTS.md`, `tasks/todo.md`, CI, or branch protection. Claude Code users get them on clone; Codex ignores them.

- [ ] **Git hooks** (`scripts/git-hooks/`). `pre-commit` runs `gitleaks` on staged changes, so a secret is stopped before it reaches history rather than flagged by CI after the push. `commit-msg` rejects AI co-author trailers. Opt-in per clone with `git config core.hooksPath scripts/git-hooks`; nobody is forced. If `gitleaks` is missing, the hook warns and allows the commit.
- [ ] **Permission denies** (`.claude/settings.json`, denies only, no hooks). Stops Claude Code reading `.env*`, `secrets/`, and `*.pem`, and running `git push --force` or `git reset --hard`. Complements the existing `.gitignore` and protected `main`.
- [ ] **Quality skills** (`.claude/skills/no-slop`, `.claude/skills/debug`). `no-slop` is a pre-commit cleanup pass (dead code, what-comments, duplication). `debug` is an evidence-first procedure for failing tests and errors. Both support the existing rule to verify before claiming completion.
- [ ] **Subagents** (`.claude/agents/reviewer.md`, `.claude/agents/researcher.md`). `reviewer` is a read-only, fresh-context diff reviewer, useful before requesting the one required approval. `researcher` does web research with a per-source verdict ledger, which fits the sourcing style already used in `research/`.
- [ ] **`decide` skill**. Makes the agent stop and present options when a task contains a design choice (storage, interfaces, dependencies, failure modes) instead of picking silently. Matches `AGENTS.md`'s "coordinate shared interfaces and dependency files before editing them".

## Optional: useful once code exists

- [ ] **UI skills** (`design-direction`, `motion`, `ui-audit`, `frontend-performance`). Only worth it if the demo has a web front end. `ui-audit` vendors about 700 KB of Apache-2.0 JavaScript (licence file included), so add it only if we use it.
- [ ] **`DECISIONS.md`**. A short decision log (chose, because, rejected, revisit if). The repo currently records decisions in prose across `research/`. Worth adding once stack and MVP decisions start landing, so the reasoning sits in one place for the pitch.

## Not recommended for this repo

- **Kit `AGENTS.md`, `PROJECT.md`, `BOARD.md`, `START-HERE.md`.** They duplicate `AGENTS.md`, `README.md`, and `tasks/todo.md`. Two rulebooks would direct the same task, which the harness comparison warns against.
- **`ship` and `score` skills, `scorer` agent, `docs/RUBRIC.md`.** They require a fresh-context scorer PASS before every merge. Our merge gate is already CI plus one teammate approval; a second gate costs time in a 25-hour event and only works for Claude Code users.
- **Context-branch scripts** (`sync-context.sh`, `publish-context.sh`, and the session hooks). They keep agent docs off a public `main`. This repo is private during development and is reviewed before going public, so plain in-repo docs are simpler.

## If accepted

Ahmed opens one PR adding only the ticked items, unchanged from the kit apart from repo-specific paths. Verification for that PR: hosted `Repository checks` and `Secret scan` pass, a Claude Code session lists the added skills and agents, and a test commit with a fake AI trailer is rejected by `commit-msg` when the hooks path is set. The PR records the actual results.
