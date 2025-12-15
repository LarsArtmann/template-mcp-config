# MCP Template Usage Guide

This guide provides detailed instructions for integrating the MCP template into your projects using different strategies.

## 📋 Table of Contents

- [Integration Strategies](#-integration-strategies)
- [Git Subtree Deep Dive](#-git-subtree-deep-dive)
- [Git Submodule Deep Dive](#-git-submodule-deep-dive)
- [Direct Copy Usage](#-direct-copy-usage)
- [Customization Guide](#-customization-guide)
- [Troubleshooting](#-troubleshooting)

## 🎯 Integration Strategies

### Decision Matrix

| Use Case                       | Subtree          | Submodule             | Direct Copy      |
| ------------------------------ | ---------------- | --------------------- | ---------------- |
| **Team collaboration**         | ✅ Best          | ⚠️ Complex            | ❌ Manual sync   |
| **Frequent modifications**     | ✅ Excellent     | ⚠️ Complex            | ✅ Simple        |
| **Contributing back**          | ✅ Easy          | ✅ Easy               | ❌ Hard          |
| **Repository size**            | ❌ Larger        | ✅ Minimal            | ⚠️ Medium        |
| **Setup complexity**           | ⚠️ Medium        | ❌ High               | ✅ Simple        |
| **New contributor onboarding** | ✅ Zero friction | ❌ Requires knowledge | ✅ Zero friction |

## 🌳 Git Subtree Deep Dive

### Why Choose Subtree?

Git subtree is **recommended for most teams** because:

- **Seamless cloning**: New team members get everything in one `git clone`
- **Unified history**: Changes integrate naturally with your project history
- **Easy modifications**: Edit files directly without complex workflows
- **Optional updates**: Pull upstream changes only when you want them

### Initial Setup

```bash
# 1. Add remote for the template repository
git remote add mcp-template https://github.com/LarsArtmann/template-mcp-config.git

# 2. Add subtree (--squash recommended to avoid cluttering history)
git subtree add --prefix=.mcp-template mcp-template main --squash

# 3. Link the configuration to your project root
ln -s .mcp-template/.mcp.json .mcp.json

# 4. Add to .gitignore if you don't want to track the symlink
echo ".mcp.json" >> .gitignore  # Optional
```

### Working with Subtree

```bash
# Update from upstream (pull latest template changes)
git subtree pull --prefix=.mcp-template mcp-template main --squash

# Push local changes back to template (if contributing)
git subtree push --prefix=.mcp-template mcp-template feature/my-improvement

# Remove subtree (if needed)
git rm -r .mcp-template
git commit -m "Remove MCP template subtree"
```

### Team Workflow

```bash
# Team member clones - gets everything automatically
git clone https://your-org/your-project.git
cd your-project

# Configure environment and start using immediately
cp .env.example .env
# Edit .env with your API keys
# Restart MCP client - ready to go!
```

## 🔗 Git Submodule Deep Dive

### Why Choose Submodule?

Choose submodules when:

- **Strict versioning**: Need precise control over template versions
- **Component architecture**: Template is treated as external dependency
- **Repository size matters**: Keep main repo minimal
- **Independent development**: Template and project evolve separately

### Initial Setup

```bash
# 1. Add submodule
git submodule add https://github.com/LarsArtmann/template-mcp-config.git .mcp-template

# 2. Initialize and update
git submodule update --init --recursive

# 3. Link configuration
ln -s .mcp-template/.mcp.json .mcp.json

# 4. Commit the setup
git add .gitmodules .mcp-template .mcp.json
git commit -m "Add MCP template as submodule"
```

### Working with Submodules

```bash
# Update submodule to latest version
git submodule update --remote .mcp-template
git add .mcp-template
git commit -m "Update MCP template to latest version"

# Update submodule to specific commit
cd .mcp-template
git checkout v1.2.0  # or specific commit hash
cd ..
git add .mcp-template
git commit -m "Pin MCP template to v1.2.0"

# Update all submodules
git submodule update --init --recursive --remote
```

### Team Workflow

```bash
# Team member clones (requires --recurse-submodules)
git clone --recurse-submodules https://your-org/your-project.git

# Or if already cloned without submodules
git submodule update --init --recursive

# When pulling updates that change submodule versions
git pull
git submodule update --init --recursive
```

## 📋 Direct Copy Usage

### When to Use Direct Copy

Perfect for:

- **Quick experiments**: Testing MCP configurations
- **Personal projects**: No team collaboration needed
- **Learning**: Understanding MCP server configurations
- **Custom bases**: Starting point for heavily modified configs

### Setup Process

```bash
# 1. Clone template repository
git clone https://github.com/LarsArtmann/template-mcp-config.git mcp-temp

# 2. Copy files to your project
cp mcp-temp/.mcp.json your-project/
cp mcp-temp/.env.example your-project/

# 3. Clean up
rm -rf mcp-temp

# 4. Configure and use
cd your-project
cp .env.example .env
# Edit .env with your values
```

### Keeping Updated

```bash
# Manually check for updates and merge changes
git clone https://github.com/LarsArtmann/template-mcp-config.git mcp-latest
diff your-project/.mcp.json mcp-latest/.mcp.json
# Manually merge desired changes
rm -rf mcp-latest
```

## ⚙️ Customization Guide

### Adding New Servers

1. **Find the server**: Check [MCP Servers Directory](https://mcpservers.org/)
2. **Add to configuration**:

```json
{
  "mcpServers": {
    "your-new-server": {
      "command": "bunx",
      "args": ["-y", "@scope/your-mcp-server"],
      "env": {
        "YOUR_API_KEY": "${YOUR_API_KEY:-}"
      }
    }
  }
}
```

3. **Update environment variables** in `.env.example`
4. **Test the configuration** with your MCP client

### Removing Unwanted Servers

```bash
# Use jq to remove servers (install with: brew install jq)
jq 'del(.mcpServers.puppeteer)' .mcp.json > .mcp.json.tmp
mv .mcp.json.tmp .mcp.json

# Or edit manually in your preferred editor
```

### Customizing File System Paths

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "bunx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/your/custom/path1",
        "/your/custom/path2",
        "${HOME}/projects"
      ],
      "env": {}
    }
  }
}
```

### Environment-Specific Configurations

Create multiple configuration files:

```bash
# Development configuration
cp .mcp.json .mcp.dev.json
# Add development-only servers (like local databases)

# Production configuration
cp .mcp.json .mcp.prod.json
# Remove development servers, add production monitoring

# Use with symlinks
ln -sf .mcp.dev.json .mcp.json    # Development
ln -sf .mcp.prod.json .mcp.json   # Production
```

## 🔧 Troubleshooting

### Common Issues

#### "Server not found" errors

```bash
# Check if bunx can find the package
bunx --help @upstash/context7-mcp

# Try with npx if bunx fails
# Update .mcp.json to use "npx" instead of "bunx"
```

#### Environment variable not set

```bash
# Check if variables are loaded
echo $GITHUB_PERSONAL_ACCESS_TOKEN

# Source .env file manually if needed
set -a && source .env && set +a
```

#### Subtree merge conflicts

```bash
# Resolve conflicts manually, then:
git add .
git commit -m "Resolve subtree merge conflicts"
```

#### Submodule update failures

```bash
# Reset submodule to known good state
git submodule deinit .mcp-template
git rm .mcp-template
git submodule add https://github.com/LarsArtmann/template-mcp-config.git .mcp-template
```

### Validation Steps

1. **JSON validity**: `jq . .mcp.json > /dev/null`
2. **Environment variables**: Check all required vars are set
3. **Server availability**: Test with MCP client
4. **Permissions**: Verify API tokens have correct permissions

### Getting Help

- **Template issues**: [Open an issue](https://github.com/LarsArtmann/template-mcp-config/issues)
- **MCP questions**: [MCP Documentation](https://modelcontextprotocol.io/)
- **Server-specific**: Check individual server documentation
- **Git subtree/submodule**: [Atlassian Git tutorials](https://www.atlassian.com/git/tutorials)

---

## 📚 Additional Resources

- [Model Context Protocol Specification](https://modelcontextprotocol.io/docs/concepts/architecture)
- [Context7 Documentation](https://apidog.com/blog/context7-mcp-server/)
- [Git Subtree Tutorial](https://www.atlassian.com/git/tutorials/git-subtree)
- [Git Submodule Tutorial](https://git-scm.com/book/en/v2/Git-Tools-Submodules)

**💡 Pro Tip**: Start with Git Subtree for most use cases. You can always migrate to submodules later if you need stricter version control.
