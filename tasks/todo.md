# OXHack preparation

## Optional pieces from Muhammad's team kit

Owner: Amit, with Codex integrating the selected tools. The kit source is the
archive on `ahmed/team-kit-proposal` at `d517f31f842f9e8223d72175d797345a783743ef`.

- [x] Inspect the actual archive and audit the selected source before execution.
- [x] Adapt only the staged secret hook, manual debug and cleanup skills, and an explicitly loaded Claude deny profile.
- [x] Document provenance, activation, limitations, and compatibility with Cortex and shared rules.
- [x] Verify staged-only scanning, redaction, missing-tool behavior, skill safety, and unchanged workflow and approval requirements.
- [x] Prepare integration through the existing protected PR flow. Track final hosted CI, merge, policy readback, and build-log completion in the PR and Obsidian log.

- [x] Close Discord research at Amit's request. No server messages were accessed.
- [x] Save Amit's Granola brief and label uncertainties and transcription issues.
- [x] Inspect local Git tooling and prepare a minimal repository plan.
- [x] Review the brief and repository proposal against Amit's notes.
- [x] Agree and publish the shared repository scaffold and main coding harness while idea selection continues.

## Remove mandatory teammate approval

Owner: Amit, with Codex maintaining the repository configuration and documentation.

- [x] Synchronize the stored branch-protection configuration with Amit's request for zero required approvals while preserving CI and security requirements.
- [x] Update the current team workflow and resolve the superseded pending approval for PR #3.
- [x] Capture the preference in session lessons, validate the diff and configuration, and record verification results.

## Repository and harness discussion

- [x] Inspect the session's actual working directory and applicable instructions. It remains `/Users/amit/Desktop/Hackathons/OXHack/`.
- [x] Review the existing proposal and verify Delta's current product description from its official site.
- [x] Clarify the team setup. Amit uses Codex with Cortex; teammates use Claude Code and shared repository rules.
- [x] Agree repository owner, name, and initial visibility: `amitvijapur/oxhack-2026`, private. Amit requires public visibility before submission.
- [x] Verify teammate handles from Amit's supplied image and send write-access invitations to `meep-boop`, `arjn15`, and `iloveclouduk`.
- [x] Create the agreed minimal shared scaffold and private remote; verify main and the scaffold from a fresh clone.
- [x] Verify accepted write access for `meep-boop`, `arjn15`, and `iloveclouduk` through GitHub's collaborator permissions API.
- [ ] Once application code exists, verify application setup from a fresh clone.

## Mixed-tool harness comparison

- [x] Verify Cortex's local capabilities and portability constraints without copying personal configuration into the team repo.
- [x] Check official Codex and Claude Code docs for shared project instructions and repository skills.
- [x] Compare GSD, OpenSpec, GitHub Spec Kit, and Superpowers against the existing Cortex/OMC setup and a 25-hour time budget.
- [x] Recommend the minimum shared repository harness and at most one additional workflow, with evidence and clear tradeoffs. See `research/harness-comparison.md`.
- [x] Record findings in the repository plan and Obsidian, and complete an independent portability review.
- [x] Agree the proposed shared harness with Amit. Cortex stays local to Amit; the team follows shared repository rules.

## Shared scaffold and Rust/Zed assessment

- [x] Create portable `AGENTS.md`, the `CLAUDE.md` import, README, and ignore rules, without application dependencies or a framework.
- [x] Check official Zed language support and distinguish the editor choice from the Delta prize condition in the supplied brief.
- [x] Confirm the workload requiring speed is the project algorithm. Amit wants Rust kept under consideration without selecting a language or framework yet.
- [ ] Confirm Rust experience if needed when selecting the implementation language.
- [x] Review shared rules for compatibility and verify the initial files without running package installs. The Claude import and local Markdown links pass; no Cargo or application dependency manifest was created.
- [x] Record agreed decisions and remaining questions in the repository plan. The existing Obsidian build log is maintained separately.
- [x] Initialize and publish `amitvijapur/oxhack-2026`; verify its private visibility, main branch, and initial remote commit.
- [ ] Make the repository public before submission, after reviewing its contents and confirming event repository rules. Exact submission time remains unknown.

## Team access, CI, and repository security

- [x] Verify `meep-boop`, `arjn15`, and `iloveclouduk` from Amit's image, invite them, and confirm all three accepted with write access.
- [x] Confirm the supplied Granola ceremony notes are present on GitHub and link them clearly from the README.
- [x] Inspect workflow permissions and security settings, then confirm private-repo branch protection by a successful update and independent readback.
- [x] Add stack-neutral CI for repository hygiene and secret scanning, with pinned dependencies and minimal permissions. Local positive and negative checks and independent review passed.
- [x] Initially configure one approval, current GitHub Actions checks, resolved conversations, linear history, admin enforcement, and protections against force pushes/deletions. The approval requirement is superseded by Amit's request for zero required approvals; the other safeguards remain active.
- [x] Verify CI with both passing runs and a safe deliberate failure, independently review the change, and integrate it. PR #2 merged as `ce40669`; clean PR run `40092846642` and main run `40092935972` passed.
- [x] Prove hosted CI rejects a temporary trailing-whitespace defect. Run `40092708257` failed `Repository checks` on that defect and passed `Secret scan`; remove the probe before merge.
- [x] Verify effective GitHub settings and accepted collaborator access. Actions require full SHA pins, permit GitHub-owned actions, use read-only tokens, and cannot approve PRs. Dependabot alerts and security fixes are enabled.
- [x] Merge the follow-up configuration/verification PR. PR #3 merged as `c08a66a`; the stored request omits legacy `contexts` when using `checks`.

## Event context (owner: Ahmed)

- [x] Compile the official slide deck and ceremony audio into `research/event-context.md`: schedule, Sunday 12:00 hacking cutoff, prize rubrics, corrected MLH prize names, venue, and the team's brainstorm leanings.
- [ ] Confirm with an organiser whether Sunday 12:00 is also the Devpost deadline, plus team size and repository rules.

## Ideas list (owner: Ahmed)

- [x] Add the full scored ideas list as `research/all-ideas.md`, with a section cross-checking it against the event context and the Fed Millisecond brief.
- [ ] Team picks the direction: Fed Millisecond or Golden Hour (financial), Flag Fall or Memento Mori (non-financial), Bang the Close as backup.

## Review

24 October 2026, optional kit import: inspected Muhammad's actual archive at
`d517f31`, then adapted only the staged scan, two manual skills and supporting
references, and an explicitly loaded deny profile. All 13 disposable-repository
tests passed with Gitleaks 8.30.1. Shell syntax, JSON parsing, actionlint,
whitespace, 17 local documentation links, manual skill metadata, both skill
security audits, and the directory secret scan passed. Independent review
caught and resolved environment-example negation syntax and preservation of
default Git hooks. Pure-matcher probes against Claude Code 2.1.238 verified
the intended example exceptions, but no full Claude tool permission invocation
was tested. No hooks were activated in contributors' clones. The same two
required checks and zero-approval policy were read back unchanged. Final hosted
CI and integration results are recorded in the PR and external build log.

24 October 2026, approval-policy update: the stored protection JSON changes only
the required approval count from one to zero, stale-review dismissal to false,
and latest-push approval to false. Both strict GitHub Actions checks and every
other protection are unchanged. `git diff --check` passed; Python parsed the
JSON, compared it against the prior configuration, checked the six-file edit
scope, and verified all nine local Markdown links in the changed documents.
The live protection update and independent API readback were completed in the
coordinating maintenance session. Hosted CI and integration of this follow-up
remain to be completed there.

24 October 2026: Discord was inaccessible and Amit then cancelled that research. The Granola notes are the working event brief. Local Git and author identity are available. GitHub CLI authentication for `amitvijapur` was successfully verified outside the sandbox; the earlier restricted check is superseded and no re-login is needed. The plan is in `research/repository-plan.md`. Repository identity, visibility, harness, and accepted teammate access are confirmed. Stack, data source, and exact submission deadline remain open.

The private repository is live at https://github.com/amitvijapur/oxhack-2026 with the shared Cortex/Codex/Claude Code arrangement and supplied Granola notes. All three teammates from the image have accepted write access. PR #2 added CI, dependency controls, and team documentation; the deliberate whitespace defect was rejected and removed before the clean revision merged. Both required jobs passed on the PR and main. PR #3 merged as `c08a66a`, correcting the stored API payload and recording verification. Main protection now requires zero approving reviews at Amit's request. Stale-review dismissal and latest-push approval are disabled. Current GitHub Actions-issued checks, resolved conversations, linear history, no force pushes/deletions, and admin enforcement remain active and were independently read back from GitHub. No application exists yet, so runtime correctness/performance checks remain pending. Rust is a candidate for algorithm performance. Keep the repo private until the planned review and public transition before submission; exact deadline and event eligibility rules remain open.
