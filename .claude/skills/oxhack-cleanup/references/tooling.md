# Use existing checks

Read the repository's documented commands, CI, manifests, and configuration.
Run only relevant checks already available for the selected stack. This skill
does not select a language or framework, install tools, or add a workflow.

Examples, only if already configured:

| Concern | Possible existing check |
|---|---|
| Formatting, lint, unused imports | Project formatter or linter |
| Types and public boundaries | Project type checker or compiler |
| Behavior | Relevant tests or a repeatable local reproduction |
| Dead code or duplication | Existing analyzer, checked against dynamic use |
| Performance | Existing benchmark or profiler with representative input |

When no tool applies, inspect the bounded diff and relevant references. Targeted
`rg` searches can find temporary diagnostics, TODOs, exception handling, and
suppression comments, but a match is a prompt to understand the code, not proof
that it should be deleted. Preserve a suppression or TODO unless its purpose
is understood and removal is safe. Report unavailable checks honestly.
