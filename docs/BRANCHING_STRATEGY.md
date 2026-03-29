# Branching Strategy

This document outlines the branching strategy for the MCP Configuration Template project.

## Overview

We follow a simplified GitFlow-inspired branching strategy with three main branch types:

| Branch Type | Purpose                       | Lifetime  |
| ----------- | ----------------------------- | --------- |
| `main`      | Production-ready code         | Permanent |
| `feature/*` | New features and improvements | Temporary |
| `fix/*`     | Bug fixes                     | Temporary |

## Branch Types

### Main Branch

The `main` branch is the single source of truth for production-ready code.

**Rules:**

- Direct commits are prohibited
- All changes must come through pull requests
- Protected by branch rules (see [Branch Protection](#branch-protection))
- Must pass all CI checks before merge

### Feature Branches

Feature branches are used for developing new features, improvements, or enhancements.

**Naming Convention:**

```
feature/<issue-number>-<short-description>
```

**Examples:**

- `feature/15-add-context7-server`
- `feature/22-improve-validation`
- `feature/30-add-kubernetes-support`

**Rules:**

- Branch off from `main`
- Keep changes focused and atomic
- Write tests for new functionality
- Update documentation as needed
- Delete branch after merge

### Fix Branches

Fix branches are used for bug fixes and hotfixes.

**Naming Convention:**

```
fix/<issue-number>-<short-description>
```

**Examples:**

- `fix/25-server-package-name`
- `fix/18-json-validation-error`
- `fix/42-environment-variables`

**Rules:**

- Branch off from `main`
- Keep changes minimal and targeted
- Include test case that reproduces the bug
- Update CHANGELOG.md with fix details

## Workflow

### Feature Development

```bash
# 1. Update main branch
git checkout main
git pull origin main

# 2. Create feature branch
git checkout -b feature/15-add-context7-server

# 3. Make changes, commit with conventional messages
git add .
git commit -m "feat(server): add context7 MCP server support"

# 4. Push and create pull request
git push origin feature/15-add-context7-server
```

### Bug Fix Development

```bash
# 1. Update main branch
git checkout main
git pull origin main

# 2. Create fix branch
git checkout -b fix/25-server-package-name

# 3. Make fix, commit with conventional message
git add .
git commit -m "fix(config): correct package name for fetch server"

# 4. Push and create pull request
git push origin fix/25-server-package-name
```

### Hotfix (Urgent Production Fix)

For critical production issues:

```bash
# 1. Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/42-critical-security-fix

# 2. Make urgent fix
git add .
git commit -m "hotfix(security): apply critical security patch"

# 3. Push and create urgent PR
git push origin hotfix/42-critical-security-fix
```

## Pull Request Process

1. **Create PR** with:
   - Clear title describing the change
   - Detailed description of what/why/how
   - Link to related issue
   - Screenshots for UI changes

2. **PR Requirements:**
   - All CI checks must pass
   - At least one reviewer approval
   - Up-to-date with main branch
   - No merge conflicts

3. **Merge Strategy:**
   - Squash merge for feature branches
   - Merge commit for fix branches
   - Delete branch after merge

## Branch Protection

### Main Branch Rules

Settings for the `main` branch:

- ✅ Require pull request reviews before merging
- ✅ Require status checks to pass before merging
- ✅ Require branches to be up to date before merging
- ✅ Do not allow force pushes
- ✅ Do not allow deletions
- ⬜ Require signed commits (recommended)

### Required Status Checks

The following checks must pass before merge:

1. `lint` - ESLint and Prettier checks
2. `test` - All unit tests pass
3. `validate` - Configuration validation
4. `build` - Schema compilation

## Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

| Type       | Description                |
| ---------- | -------------------------- |
| `feat`     | New feature                |
| `fix`      | Bug fix                    |
| `docs`     | Documentation only         |
| `style`    | Formatting, no code change |
| `refactor` | Code refactoring           |
| `test`     | Adding tests               |
| `chore`    | Maintenance tasks          |
| `perf`     | Performance improvements   |
| `ci`       | CI/CD changes              |
| `hotfix`   | Critical production fix    |

### Scopes

Common scopes for this project:

- `config` - .mcp.json configuration
- `server` - MCP server additions/updates
- `schema` - TypeSpec schema changes
- `validation` - Validation logic
- `scripts` - Automation scripts
- `deps` - Dependency updates
- `docs` - Documentation
- `lint` - Code style/formatting

### Examples

```
feat(server): add DeepWiki MCP server integration

fix(config): correct fetch-mcp package name

docs(readme): update installation instructions

chore(deps): update eslint to v10.1.0

hotfix(security): patch vulnerability in dependency
```

## Release Process

1. Update version in `package.json`
2. Update CHANGELOG.md
3. Create git tag: `git tag -a v2.0.0 -m "Release v2.0.0"`
4. Push tag: `git push origin v2.0.0`
5. GitHub Actions will create GitHub Release

## Quick Reference

```bash
# Create feature branch
git checkout -b feature/XX-description

# Create fix branch
git checkout -b fix/XX-description

# Update from main
git fetch origin
git rebase origin/main

# Squash commits before merge
git rebase -i HEAD~3
```

## Resources

- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitHub Flow](https://guides.github.com/introduction/flow/)
- [Creating a Pull Request](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request)
