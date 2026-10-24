# OXHack preparation

- [x] Close Discord research at Amit's request. No server messages were accessed.
- [x] Save Amit's Granola brief and label uncertainties and transcription issues.
- [x] Inspect local Git tooling and prepare a minimal repository plan.
- [x] Review the brief and repository proposal against Amit's notes.
- [x] Agree and publish the shared repository scaffold and main coding harness while idea selection continues.

## Repository and harness discussion

- [x] Inspect the session's actual working directory and applicable instructions. It remains `/Users/amit/Desktop/Hackathons/OXHack/`.
- [x] Review the existing proposal and verify Delta's current product description from its official site.
- [x] Clarify the team setup. Amit uses Codex with Cortex; teammates use Claude Code and shared repository rules.
- [x] Agree repository owner, name, and initial visibility: `amitvijapur/oxhack-2026`, private. Amit requires public visibility before submission.
- [x] Verify teammate handles from Amit's supplied image and send write-access invitations to `meep-boop`, `arjn15`, and `iloveclouduk`.
- [x] Create the agreed minimal shared scaffold and private remote; verify main and the scaffold from a fresh clone.
- [ ] Verify teammate access after invitations. Once application code exists, verify application setup from a fresh clone.

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

- [x] Verify `meep-boop`, `arjn15`, and `iloveclouduk` from Amit's image and invite them with write access. Acceptance is pending.
- [x] Confirm the supplied Granola ceremony notes are present on GitHub and link them clearly from the README.
- [x] Inspect current workflow permissions and security settings. Branch-protection availability will be confirmed when applying the rule.
- [x] Add stack-neutral CI for repository hygiene and secret scanning, with pinned dependencies and minimal permissions. Local positive and negative checks and independent review passed.
- [ ] Document the PR workflow and configure one approval, required CI, resolved conversations, and protections against force pushes where supported.
- [ ] Verify CI with both passing runs and a safe deliberate failure, independently review the change, and integrate it.
- [x] Prove hosted CI rejects a temporary trailing-whitespace defect. Run `40092708257` failed `Repository checks` on that defect and passed `Secret scan`; remove the probe before merge.
- [ ] Verify the effective GitHub settings and invitation state, then update the plan and Obsidian with any plan limitations.

## Review

24 October 2026: Discord was inaccessible and Amit then cancelled that research. The Granola notes are the working event brief. Local Git and author identity are available. GitHub CLI authentication for `amitvijapur` was successfully verified outside the sandbox; the earlier restricted check is superseded and no re-login is needed. The proposal is in `research/repository-plan.md`. The owner, name, initial visibility, and harness are agreed. Teammate handles, stack, data source, and exact submission deadline remain open.

The agreed setup is one shared repository, short task branches, a concise portable `AGENTS.md`, a `CLAUDE.md` compatibility import, and clear file ownership. Amit uses Codex with Cortex and teammates use Claude Code with skills only. The private repository is live at https://github.com/amitvijapur/oxhack-2026. The initial commit is `9d518ca`; GitHub confirms `main` as the default branch and private visibility. A fresh clone passed file, import, commit, clean-checkout, and ignore-rule checks. Gitleaks found no leaks in the initial files, and the staged whitespace check passed. No application exists yet, so application execution has not been tested. The repository must become public before submission. Rust remains a candidate for algorithm runtime performance. The image supplied in this session identifies `meep-boop`, `arjn15`, and `iloveclouduk`; all three have been invited with write access and currently await acceptance. Delta onboarding and sponsor eligibility still require confirmation. No application language or framework has been selected.
