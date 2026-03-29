# Contributing to MCP Configuration Template

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to this project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Submitting Changes](#submitting-changes)
- [Reporting Issues](#reporting-issues)

## Code of Conduct

This project adheres to the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/). By participating, you are expected to uphold this code.

## Getting Started

### Prerequisites

- **Bun** (v1.0.0 or higher) - [Install Bun](https://bun.sh)
- **Git** - For version control
- **Node.js** (v18 or higher) - For running tests

### Fork the Repository

1. Fork the repository on GitHub
2. Clone your fork locally:

   ```bash
   git clone https://github.com/YOUR_USERNAME/template-mcp-config.git
   cd template-mcp-config
   ```

3. Add the upstream remote:
   ```bash
   git remote add upstream https://github.com/LarsArtmann/template-mcp-config.git
   ```

## Development Setup

### 1. Install Dependencies

```bash
bun install
```

### 2. Install Git Hooks

```bash
bun run hooks:install
```

This installs:

- **pre-commit**: Runs linting and formatting checks
- **commit-msg**: Validates commit message format

### 3. Set Up Environment

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 4. Verify Setup

```bash
# Run all checks
bun run lint    # Check code style
bun run test    # Run tests
bun run validate:json  # Validate JSON
```

## Making Changes

### Branch Naming

Follow the naming convention:

- `feature/<issue-number>-<description>` - New features
- `fix/<issue-number>-<description>` - Bug fixes
- `hotfix/<issue-number>-<description>` - Urgent fixes

### Code Style

This project uses:

- **Prettier** for code formatting
- **ESLint** for linting
- **Conventional Commits** for commit messages

Format your code before committing:

```bash
bun run format
```

### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <description>

[optional body]
```

**Types:**

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Formatting
- `refactor` - Code refactoring
- `test` - Adding tests
- `chore` - Maintenance

**Scopes:**

- `config` - Configuration changes
- `server` - MCP server changes
- `schema` - TypeSpec schemas
- `validation` - Validation logic
- `scripts` - Automation scripts
- `deps` - Dependencies
- `docs` - Documentation

**Example:**

```
feat(server): add Kubernetes MCP server support

Added kubernetes server configuration with kubeconfig support.
Includes validation for KUBECONFIG environment variable.
```

### Testing

Write tests for new functionality:

```bash
# Run tests
bun run test

# Run tests with coverage
bun run test:coverage

# Run tests in watch mode
bun run test:watch
```

### Writing Tests

Place test files in `tests/` directory:

```javascript
import { describe, it, expect } from 'vitest';

describe('Feature Name', () => {
  it('should do something specific', () => {
    expect(true).toBe(true);
  });
});
```

## Submitting Changes

### 1. Keep Changes Focused

- One feature or fix per pull request
- Related changes in separate PRs
- Small changes are easier to review

### 2. Update Documentation

- Update README.md if adding new servers
- Add inline comments for complex code
- Update this CONTRIBUTING.md if changing processes

### 3. Create Pull Request

1. Push your branch:

   ```bash
   git push origin feature/15-my-feature
   ```

2. Open a Pull Request on GitHub

3. Fill in the PR template:
   - **Title**: Clear, descriptive title
   - **Description**: What, Why, How
   - **Test plan**: Steps to test
   - **Related issues**: Link to issues

### 4. PR Requirements

- [ ] Code follows project style guidelines
- [ ] Tests pass locally
- [ ] Documentation updated
- [ ] Commit messages follow convention
- [ ] No merge conflicts with main

## Reporting Issues

### Bug Reports

Include:

- Clear, descriptive title
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Bun version, etc.)
- Relevant logs or error messages

### Feature Requests

Include:

- Clear description of the feature
- Use case / motivation
- Possible implementation approaches
- Any relevant examples

### Security Issues

**Do not** report security issues in public issues.

Email security concerns to: [maintainer's email]

## Resources

- [Project Documentation](./README.md)
- [Usage Guide](./docs/guides/USAGE.md)
- [Branching Strategy](./docs/BRANCHING_STRATEGY.md)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Vitest Documentation](https://vitest.dev/)

## Questions?

- Open an issue for bugs or feature requests
- Check existing issues before creating new ones

## License

By contributing, you agree that your contributions will be licensed under the EUPL-1.2 License.
