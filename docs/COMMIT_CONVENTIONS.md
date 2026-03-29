# Commit Message Conventions

This project follows the [Conventional Commits](https://www.conventionalcommits.org/) specification for commit messages.

## Format

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

## Components

### 1. Type

The `type` field is mandatory and describes the type of change:

| Type       | Description      | When to Use                              |
| ---------- | ---------------- | ---------------------------------------- |
| `feat`     | New feature      | Adding new MCP server, new functionality |
| `fix`      | Bug fix          | Fixing broken functionality, fixing bugs |
| `docs`     | Documentation    | README, guides, inline docs              |
| `style`    | Formatting       | Code style, whitespace, no logic change  |
| `refactor` | Code refactoring | Restructuring without behavior change    |
| `test`     | Adding tests     | New test files, test improvements        |
| `chore`    | Maintenance      | Build process, dependencies, CI/CD       |
| `perf`     | Performance      | Improving performance, optimization      |
| `ci`       | CI/CD            | GitHub Actions, build scripts            |
| `hotfix`   | Critical fix     | Urgent production fixes                  |
| `revert`   | Revert           | Reverting previous commits               |

### 2. Scope

The `scope` is optional and describes the affected area:

| Scope        | Description                      |
| ------------ | -------------------------------- |
| `config`     | `.mcp.json`, configuration files |
| `server`     | MCP server additions/updates     |
| `schema`     | TypeSpec schema changes          |
| `validation` | Validation logic, validators     |
| `scripts`    | Automation scripts, CLI tools    |
| `deps`       | Dependency updates               |
| `docs`       | Documentation files              |
| `lint`       | ESLint, Prettier, formatting     |
| `format`     | Code style changes               |
| `workflow`   | GitHub Actions, CI/CD            |
| `security`   | Security-related changes         |
| `tests`      | Test files                       |

### 3. Description

- **Required**: Short, concise description
- **Imperative mood**: "add", "fix", "update" (not "added", "fixed")
- **No period** at the end
- **Max 72 characters** recommended
- **Lowercase** first letter

### 4. Body (Optional)

- **Blank line** after description
- **Explain what and why**, not how
- **Wrap at 72 characters**
- **Use imperative mood**

### 5. Footer (Optional)

- **Reference issues**: `Closes #123`, `Fixes #456`
- **Breaking changes**: `BREAKING CHANGE: description`
- **Co-authored by**: `Co-authored-by: name <email>`

## Examples

### Feature

```
feat(server): add Kubernetes MCP server support

Added kubernetes server configuration with kubeconfig validation.
Includes support for KUBECONFIG environment variable.
```

### Bug Fix

```
fix(config): correct fetch-mcp package name

The package name was incorrectly set to @modelcontextprotocol/server-fetch.
Updated to use fetch-mcp which is the correct package.
```

### Documentation

```
docs(readme): update server list with Terraform server

Added Terraform to the server table and updated total count.
```

### Dependency Update

```
chore(deps): update eslint to v10.1.0

Updated eslint from v10.0.3 to v10.1.0 to address security
vulnerabilities and get latest linting improvements.
```

### Breaking Change

```
feat(config)!: change environment variable format

Changed from ${VAR} to ${VAR:-default} for optional variables.
This is a breaking change for users with custom .env files.

BREAKING CHANGE: Environment variables now require :- syntax
Closes #42
```

### Revert

```
revert: revert "feat(server): add context7 server"

This reverts commit abc123def456.

Reason: Caused build failures on CI
```

### Multi-line

```
feat(validation): add comprehensive schema validation

- Added TypeSpec-based schema validation for .mcp.json
- Implemented server configuration validation
- Added environment variable extraction
- Created detailed error messages for validation failures

Closes #15
```

## Rules

1. **Every commit must have a type**
2. **Use imperative mood** in description
3. **Keep subject line under 72 characters**
4. **Use body for detailed explanations**
5. **Reference related issues in footer**
6. **Breaking changes must be marked**

## Validation

The project includes a commit-msg hook that validates commit messages.

### Automatic Validation

```bash
# Install hooks
bun run hooks:install

# Test a commit message
echo "feat(server): add new server" | sh .git-hooks/commit-msg /dev/stdin
```

### Manual Check

Use the [commitlint](https://commitlint.js.org/) tool:

```bash
# Install
npm install -g @commitlint/cli @commitlint/config-conventional

# Check
commitlint --from HEAD~1 --to HEAD
```

## Common Mistakes

### ❌ Wrong

```
feat: Add new feature
Fixed the bug
WIP: work in progress
Update README
```

### ✅ Correct

```
feat(server): add new MCP server
fix(config): resolve package name issue
docs(readme): add installation instructions
chore(deps): update dependencies
```

## Tools

### Commitizen (Interactive CLI)

```bash
# Install
npm install -g commitizen

# Initialize
cz init

# Use
cz commit
```

### VS Code Extension

Install "Conventional Commits" extension for VS Code.

### Git Aliases

Add to `~/.gitconfig`:

```ini
[alias]
  commit = commit -m
  amend = commit --amend --no-edit
  log-format = log --pretty=format:"%h %s" --graph
```

## Quick Reference

```
<type>(<scope>): <description>

feat(config): add new server
fix(server): fix connection issue
docs(readme): update instructions
style(lint): format code
refactor(validation): improve logic
test(scripts): add unit tests
chore(deps): update packages
perf(cache): optimize warming
ci(workflow): add GitHub Actions
hotfix(security): patch vulnerability
```
