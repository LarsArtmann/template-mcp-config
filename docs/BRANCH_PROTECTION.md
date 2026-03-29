# Branch Protection Rules

This document outlines the branch protection rules for the MCP Configuration Template repository.

## Overview

Branch protection rules prevent direct pushes to critical branches and ensure that all changes go through the proper review process.

## Protected Branches

| Branch   | Protection Level | Description                |
| -------- | ---------------- | -------------------------- |
| `main`   | High             | Production-ready code      |
| `master` | High             | Alias for main (if exists) |

## Protection Settings

### Main Branch Rules

```yaml
# GitHub Branch Protection Settings
branch_name_pattern: 'main'

# Require pull request reviews
required_reviewers:
  minimum: 1
  dismiss_stale_reviews: true
  require_code_owner_reviews: false

# Require status checks
required_status_checks:
  strict: true # Require branch to be up to date
  contexts:
    - 'ci/lint'
    - 'ci/test'
    - 'ci/validate'
    - 'ci/build'

# Require linear history
linear_history: true

# Prevent force pushes
allow_force_pushes: false

# Prevent deletion
allow_deletions: false

# Include administrators
include_administrators: false
```

## GitHub Settings (Manual Configuration)

### Step 1: Navigate to Branch Protection

1. Go to repository **Settings**
2. Navigate to **Branches** in the left sidebar
3. Click **Add rule** under "Branch protection rules"

### Step 2: Configure Protection Rule

```
Pattern: main

☑ Require a pull request before merging
  ☑ Require approvals
     Required number of reviewers: 1
  ☑ Dismiss stale reviews when new commits are pushed
  ☐ Require review from Code Owners
  ☐ Restrict who can dismiss pull request reviews

☑ Require status checks to pass before merging
  ☑ Require branches to be up to date before merging
  Required checks:
    ☑ ci/lint
    ☑ ci/test
    ☑ ci/validate
    ☑ ci/build

☑ Require conversation resolution before merging
☑ Do not allow bypassing the above settings

☑ Include administrators
```

### Step 3: Optional Settings

```
☑ Require linear history
  ☑ Prevent merge commits

☑ Allow force pushes
  ☐ Specify who can force push
  ⚠️ Only allow force pushes to be enabled for administrators

☑ Allow deletions
  ⚠️ Do not allow branch deletion

☑ Block permanent force pushes
```

## CLI Configuration (GitHub CLI)

```bash
# Install GitHub CLI if not already installed
brew install gh

# Login to GitHub
gh auth login

# Add branch protection rule
gh api repos/:owner/:repo/branches/main/protection \
  -X PUT \
  -f required_status_checks='{"strict":true,"contexts":["ci/lint","ci/test","ci/validate","ci/build"]}' \
  -f enforce_admins=true \
  -f required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true}' \
  -f restrictions=null
```

## Required Status Checks

The following GitHub Actions jobs must pass before merging:

| Job        | Description                 | Timeout |
| ---------- | --------------------------- | ------- |
| `lint`     | ESLint and Prettier checks  | 5 min   |
| `test`     | Unit and integration tests  | 10 min  |
| `validate` | Configuration validation    | 5 min   |
| `build`    | TypeSpec schema compilation | 5 min   |

## Bypass Permissions

| Role             | Can Bypass | Conditions                                    |
| ---------------- | ---------- | --------------------------------------------- |
| Repository Owner | Yes        | Only in emergencies                           |
| Admin            | Yes        | Only if "Include administrators" is unchecked |
| Maintainers      | No         | Must follow PR process                        |
| Contributors     | No         | Must follow PR process                        |

## Emergency Procedures

### When to Bypass Protection

Bypassing branch protection should only occur in:

- Critical security patches
- Immediate production fixes
- Recovering from broken CI/CD

### Bypass Process

1. **Document the bypass** in the PR description
2. **Notify repository maintainers** via Slack/Email
3. **Create bypass PR** with justification
4. **Post-mortem** - document what went wrong

### Emergency Recovery

```bash
# Temporarily disable protection (requires admin)
gh api repos/:owner/:repo/branches/main/protection -X DELETE

# After emergency fix, re-enable protection
# Follow the CLI Configuration section above
```

## Monitoring

### Check Protection Status

```bash
# View current protection settings
gh api repos/:owner/:repo/branches/main/protection

# View protection rules
gh api repos/:owner/:repo/branches/main/protection/required_status_checks
gh api repos/:owner/:repo/branches/main/protection/required_pull_request_reviews
```

### Audit Logs

Monitor branch protection changes in GitHub Audit Log:

1. Go to repository **Settings**
2. Navigate to **Audit log**
3. Filter by `branch_protection`

Events to monitor:

- `protected_branch.protection_enabled`
- `protected_branch.protection_disabled`
- `protected_branch.policy_removed`
- `protected_branch.required_status_checks.disabled`

## Best Practices

1. **Never disable protection permanently**
2. **Always require status checks**
3. **Keep required reviewers minimum at 1**
4. **Use CODEOWNERS for critical files**
5. **Monitor audit logs regularly**
6. **Document all bypasses**

## CODEOWNERS

Create a `.github/CODEOWNERS` file for additional protection:

```gitignore
# CODEOWNERS for MCP Configuration Template

# Default owners for everything
* @LarsArtmann

# Configuration files
.mcp.json @LarsArtmann
.env.example @LarsArtmann

# GitHub workflows
.github/workflows/*.yml @LarsArtmann

# Documentation
README.md @LarsArtmann
CONTRIBUTING.md @LarsArtmann
docs/**/*.md @LarsArtmann
```

## Additional Resources

- [GitHub Branch Protection Documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/defining-the-mergeability-of-pull-requests/about-protected-branches)
- [About required status checks](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/collaborating-with-repository-maintainers-about-protected-branches)
- [GitHub CLI Documentation](https://cli.github.com/manual/)
