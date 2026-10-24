# Proposed OXHack repository plan

Status: shared harness and repository identity agreed. Create `amitvijapur/oxhack-2026` as private and make it public before submission. Git initialization and remote creation are in progress alongside idea selection.

## Decisions we can make now

- Use one shared repository with `main` kept runnable.
- Work on short branches with one owner per task or file area. Integrate frequently and use brief pull requests.
- Document one reproducible setup and one demo command once the stack is chosen.
- Commit an `.env.example` with variable names and dummy values; ignore actual environment files and credentials.
- Keep the event brief, implementation plan, data provenance, and demo instructions easy to find.
- Record contributors' work and Delta collaboration as the build progresses if the team targets the Delta prize.

## Minimal repository before stack selection

Start with a README explaining the current purpose and open decisions, a short portable root `AGENTS.md`, `.gitignore`, and the agreed planning notes. Review existing notes before publishing them, particularly if the repository will be public. Choose application directories and dependency files when the project needs them.

Use `AGENTS.md` for shared project instructions. Keep personal machine paths, global Cortex configuration, and individual tool preferences out of the team instructions. The agreed Claude Code compatibility entry point is a root `CLAUDE.md` containing `@AGENTS.md`, which its official documentation supports. Maintain one shared rulebook.

Each teammate should use their own clone. Concurrent coding agents on one machine should have separate worktrees where needed. One person should coordinate integration and changes to shared dependency files. Keep reviews brief and add automated checks alongside executable code.

Amit uses Codex with Cortex; teammates use Claude Code with skills and shared repository rules. Amit accepted this arrangement. Keep his personal Cortex machinery local, with existing OMC/GSD capabilities used when useful. OpenSpec remains an optional future addition if scope or interfaces drift. See [the harness comparison](harness-comparison.md) for primary sources and tradeoffs.

## Rust and Zed

Amit wants Zed use considered as a scoring goal and is considering Rust for the project algorithm's runtime performance. The algorithm and language remain undecided. Keep Rust under consideration while identifying the actual workload and data; do not select a web or application framework yet.

Zed's official documentation confirms [native Rust support with rust-analyzer](https://zed.dev/docs/languages/rust) and support for [other languages including Python and TypeScript](https://zed.dev/docs/languages). Editor choice and application language can be decided independently. Local `rustc` and `cargo` both report version 1.93.1. A `zed` CLI was not found on PATH; this does not establish whether the desktop app is installed.

The supplied ceremony brief describes the Delta prize as requiring two active teammates in Delta. It does not establish that editing in Zed alone meets that requirement, nor that Rust receives a language-specific bonus. Confirm the sponsor's interpretation before relying on either for eligibility or scoring. Discord remains out of scope.

If runtime performance becomes central to the demo, define a representative input size, measure the algorithm in an appropriate optimized build, and report elapsed time alongside prediction quality. Avoid an early multi-language split until the workload justifies it. These are planning recommendations, not a stack decision.

Delta's [official homepage](https://delta.dev/), checked on 24 October 2026, describes shared threads for teammates and agents and marks the Delta CLI as coming soon. Test collaboration in the app before relying on it for the prize. These product facts do not verify the hackathon's eligibility rules, free-token offer, or the team's onboarding.

## Scaffold depends on the project

Choose language, framework, package manager, and hosting after confirming team experience and the available data. For a prediction project, establish the data path and a baseline early. Add the presentation layer around a working signal.

If the unconventional-data idea is selected, record each observation's availability time and evaluate on later time periods. Compare against a simple baseline and distinguish a measured improvement from a speculative relationship. This supports the Time theme and makes the HRT demo defensible.

## Setup checklist

- [x] Agree repository name, GitHub owner, and visibility: `amitvijapur/oxhack-2026`, private now and public before submission.
- [ ] Obtain teammate handles and grant access.
- [x] Agree the minimal stack-neutral scaffold and main coding harness.
- [x] Accept the successful external GitHub CLI authentication verification for `amitvijapur` using HTTPS. No re-login is needed.
- [ ] Initialize the local repository and create or connect the agreed remote.
- [x] Add the agreed README, shared instructions, ignore rules, and planning files.
- [ ] Once the project direction is agreed, select the stack and package manager, then add application files, dependency lockfiles, configuration examples, and setup instructions as needed.
- [ ] Verify a fresh clone can run the project.
- [ ] Verify teammates can access the remote and understand branch/task ownership.
- [ ] If targeting Delta, onboard at least two teammates and verify collaboration early.
- [ ] Make the repository public before submission after reviewing its contents and confirming event requirements.

## Local checks on 24 October 2026

- OXHack is a standalone folder outside an existing parent Git repository.
- Git 2.50.1 is installed. Git author name and email are configured.
- GitHub CLI, Node, npm, pnpm, and Python are on PATH. `uv` was not found on PATH.
- A successful external GitHub CLI authentication check for `amitvijapur` using HTTPS supersedes the earlier restricted check. No re-login is currently needed.

## Review

The shared harness and private repository identity are agreed. GitHub setup can proceed while language and framework decisions remain open. Collaborator access remains pending teammate handles. Public visibility is required by Amit before submission; the exact submission deadline and event repository requirements remain unknown.
