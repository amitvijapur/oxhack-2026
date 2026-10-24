# OXHack build harness comparison

24 October 2026. Status: Amit accepted Cortex for his own work and shared repository rules for the team. The shared scaffold is published in the private `amitvijapur/oxhack-2026` repository. No additional workflow installation is planned. The application stack remains open.

## Confirmed team setup

Amit uses Codex. Teammates use Claude Code with skills and no additional workflow system. Amit is considering Cortex as his main build workflow router. The setup should let teammates contribute without reproducing his personal tooling.

## Recommended arrangement

1. Keep Cortex as Amit's routing policy. His existing OMC or GSD capabilities can execute bounded work when useful and available.
2. Put the team's common instructions, MVP scope, ownership, interface examples, and verification commands in the repository.
3. Add another workflow system only when it solves a concrete coordination problem. OpenSpec is the most relevant optional addition if shared requirements become difficult to keep aligned.

Cortex's local routing CLI surfaces historical hints and records routes and outcomes; the coding host executes the selected workflow. Cloning a repository does not install its personal registry, plugins, CLI, hooks, or history. This was checked in `/Users/amit/.claude/cortex.md` and `/Users/amit/.claude/bin/cortex`. Keep those machine-specific components local.

## Alternatives

Both coding tools are listed in the linked maintainers' documentation. Overhead and fit are judgments for this event, rather than measured performance claims.

| Option | What it adds | Fit for this team |
| --- | --- | --- |
| [GSD Core](https://github.com/open-gsd/gsd-core/blob/main/README.md) | Persistent project state and phased planning, execution, verification, and shipping. | Useful for long sessions and handoffs. The full process adds medium overhead. Amit already has GSD skills; introducing a second installation is unnecessary. |
| [OpenSpec](https://github.com/Fission-AI/OpenSpec/blob/main/README.md) | Shared, editable proposals, requirements, design decisions, and task lists, with Codex and Claude Code adapters. | The strongest optional addition if scope or interfaces keep drifting. Low to medium process overhead. Start with ordinary project documents before requiring installation. |
| [GitHub Spec Kit](https://github.com/github/spec-kit/blob/main/README.md) | A project constitution and specification, planning, task, implementation, and convergence processes. | More setup and process than the immediate need. Its processes are flexible, but substantial overlap remains. Codex CLI support is documented; desktop-specific behavior was not independently verified. |
| [Superpowers](https://github.com/obra/superpowers/blob/main/README.md) | Brainstorming, detailed plans, worktrees, TDD, reviews, and completion checks. | Useful integrated discipline, with medium to high behavioral overhead when combined with Cortex and OMC/GSD. Avoid two workflow systems directing the same task. |

The former GSD repository now redirects to GSD Core. Amit's installed skills should not be assumed to match current upstream. No upgrade is proposed for the hackathon.

## Small shared repository harness

Proposed files, to be created once agreed:

- `AGENTS.md`: the project goal, architecture boundaries, task ownership, conventions, relevant checks, and completion criteria.
- `CLAUDE.md`: an `@AGENTS.md` import, plus Claude-specific content only when necessary.
- `README.md`: setup, run, and demo commands as they become known.
- `docs/mvp.md`: the agreed problem, scope, success conditions, and concrete interface examples.
- `tasks/todo.md`: the shared plan and outcomes, with one human owner per task. Update it through normal Git integration, rather than treating local edits as a live cross-machine task board.
- A shared verification command and CI calling it, added alongside executable code after the stack is selected.

Codex reads repository `AGENTS.md` files automatically. Current Claude Code can read them directly under documented version and configuration conditions; its documented `CLAUDE.md` import provides a compatibility path without maintaining two copies of the rules. Sources: [OpenAI instructions documentation](https://learn.chatgpt.com/docs/agent-configuration/agents-md), [Claude Code project instructions](https://code.claude.com/docs/en/memory#share-one-file-with-other-coding-tools).

Repository skills can be added for repeated procedures later. Codex documents `.agents/skills/`; Claude Code documents `.claude/skills/`. Sharing a skill format does not mean both tools discover the same directory. Keep a shared script or reference behind any tool-specific entry points. Sources: [OpenAI skill locations](https://learn.chatgpt.com/docs/build-skills), [Claude Code skill locations](https://code.claude.com/docs/en/skills#choose-where-skills-load).

## Verification before adopting the harness

- Start a session in each coding tool and confirm it reports the same project instructions and current task.
- Give every task a human owner and a clear file or module boundary.
- Use separate clones for teammates and isolated worktrees for concurrent agents where needed.
- Once code exists, prove setup and the shared checks work from a fresh clone without Amit's home-directory tooling.

The arrangement is accepted. The agreed repository is `amitvijapur/oxhack-2026`, private during development and public before submission. Teammate handles and application decisions remain open.
