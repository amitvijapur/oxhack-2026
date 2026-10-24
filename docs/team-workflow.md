# Team workflow and repository security

## Working together

Each teammate uses their own clone and a short branch for a bounded task.
Coordinate shared interfaces and dependency files. Open a PR against `main`,
explain the change, and include actual verification results. Use squash merges
and remove completed branches.

The merge policy is one teammate approval, dismissal of stale approvals after
new changes, current required CI checks, resolved conversations, and no force
pushes or branch deletion on `main`. The repository owner follows the same
protected-branch requirements. A branch-protection readback must confirm this
policy is enforced; if GitHub plan limits prevent it, record that limitation
here and in the task list rather than claiming enforcement.

The intended API configuration is versioned in
[main-branch-protection.json](../.github/main-branch-protection.json).
Its required check issuer, GitHub Actions App ID `15368`, was read from this
repository's hosted check runs. A repository administrator can apply it with:

```sh
gh api --method PUT repos/amitvijapur/oxhack-2026/branches/main/protection \
  --input .github/main-branch-protection.json
```

Read the resulting protection back from GitHub before reporting enforcement.

## Initial CI boundary

`Repository checks` verifies whitespace and workflow validity. `Secret scan`
scans Git history for known credential patterns and redacts its output.
These checks do not prove an application's correctness or performance.
Add build, lint, and meaningful test checks when the application stack is chosen.

With actionlint and Gitleaks installed, the equivalent local checks are:

```sh
git diff --check "$(git hash-object -t tree /dev/null)" HEAD
actionlint
gitleaks git --redact --log-opts="--all" .
```

The [workflow](../.github/workflows/ci.yml) records the verified versions and
download checksums used in CI. Local tools are optional when using the hosted
checks; they are not application dependencies.

The workflow runs on PRs and changes to `main`, with read-only permissions,
immutable action pins, and no persisted checkout credentials. Required check
names must stay stable and must not be excluded by workflow path filters.
Require results from the GitHub Actions App, rather than accepting arbitrary
commit statuses with matching names.

## Credentials and dependencies

- Keep real credentials in local environment files or appropriate deployment
  secrets. Commit variable names and dummy values in `.env.example` only.
- CI for PRs must not receive deployment credentials or personal access tokens.
  Review workflow edits carefully. Do not execute untrusted PR code through
  privileged `pull_request_target` or `workflow_run` workflows.
- Actions use read-only default tokens and cannot approve PRs. The repository's
  Actions policy permits GitHub-owned actions with full commit pins.
- Gitleaks and actionlint binaries use fixed versions and verified checksums.
  Review changes to those pins. Dependabot checks GitHub Actions dependencies;
  add the selected application ecosystems later.
- A scanner can miss credentials. If a real secret is committed, revoke or
  rotate it immediately and contact the repository owner privately. Removing
  the latest file alone does not remove the secret from Git history.

## Before submission

Keep the repo private during development. Before making it public, review the
entire committed history for secrets and private data, check the event's
repository rules, and verify the same protections after the visibility change.
The exact submission deadline remains unknown.
