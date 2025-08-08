# Template MCP Config

> **Unified MCP configuration template with Context7 integration and comprehensive tooling for development environments**

[![License: EUPL v1.2](https://img.shields.io/badge/License-EUPLv1.2-blue.svg)](https://joinup.ec.europa.eu/software/page/eupl)
[![GitHub stars](https://img.shields.io/github/stars/LarsArtmann/template-mcp-config.svg?style=social&label=Star)](https://github.com/LarsArtmann/template-mcp-config)

A production-ready Model Context Protocol (MCP) configuration template that provides a curated selection of MCP servers optimized for modern development workflows. Features **Context7** for real-time documentation, plus essential servers for filesystem, GitHub, databases, and DevOps tools.

## 🌟 Key Features

### ✨ **Context7 Integration**
- **Real-time documentation**: Access up-to-date library docs and code examples
- **Zero configuration**: Works immediately with `use context7` in prompts
- **Version-specific**: Always gets the latest official documentation

### 🎯 **Curated Server Selection**
- **No API key hassle**: Only includes servers that work without external API keys
- **Development-focused**: Optimized for common development workflows
- **Bunx-powered**: Fast package execution with modern JavaScript runtime

### 🛠️ **Multiple Usage Patterns**
- **Direct copy**: Simple `.mcp.json` for immediate use
- **Git Subtree**: Embed as part of your project
- **Git Submodule**: Reference as external dependency
- **Template base**: Foundation for custom MCP configurations

## 📋 Included Servers

| Category | Server | Purpose | API Key Required |
|----------|--------|---------|------------------|
| **📚 Documentation** | Context7 | Real-time library documentation | ❌ |
| **🔧 Core** | GitHub | Repository operations | ✅ (you have this) |
| **📁 Files** | Filesystem | Multi-directory file access | ❌ |
| **🧠 AI** | Memory | Persistent conversation context | ❌ |
| **🤔 Analysis** | Sequential Thinking | Complex problem reasoning | ❌ |
| **🔍 Search** | Everything | Universal content search | ❌ |
| **🌐 Web** | Puppeteer | Browser automation & scraping | ❌ |
| **🌐 Web** | Fetch | HTTP requests & web content | ❌ |
| **📺 Media** | YouTube Transcript | Extract video transcripts | ❌ |
| **☁️ DevOps** | Kubernetes | Container orchestration | ❌ |
| **🐳 DevOps** | Docker | Container management | ❌ |
| **🔐 DevOps** | SSH | Remote server access | ❌ |
| **🗄️ Database** | SQLite | Local database operations | ❌ |
| **☁️ Database** | Turso | Distributed SQLite | ✅ (you have this) |
| **🏗️ Infrastructure** | Terraform | Infrastructure as Code | ❌ |
| **❄️ System** | NixOS | Nix package management | ❌ |
| **📊 Monitoring** | Prometheus | Metrics collection | ❌ |
| **📈 DevOps** | Helm | Kubernetes package manager | ❌ |

## 🚀 Quick Start

### Option 1: Direct Copy (Fastest)
```bash
# Clone and copy to your project
git clone https://github.com/LarsArtmann/template-mcp-config.git
cp template-mcp-config/.mcp.json your-project/.mcp.json

# Set environment variables
export GITHUB_PERSONAL_ACCESS_TOKEN="your_token_here"
export TURSO_DATABASE_URL="your_turso_url"      # Optional
export TURSO_AUTH_TOKEN="your_turso_token"      # Optional

# Restart your MCP client and test
```

### Option 2: Git Subtree (Recommended for Teams)
```bash
# Add as subtree to your project
cd your-project
git subtree add --prefix=mcp-config https://github.com/LarsArtmann/template-mcp-config.git main --squash

# Link the configuration
ln -s mcp-config/.mcp.json .mcp.json

# Update later with:
git subtree pull --prefix=mcp-config https://github.com/LarsArtmann/template-mcp-config.git main --squash
```

### Option 3: Git Submodule (For Component-Based Development)
```bash
# Add as submodule
git submodule add https://github.com/LarsArtmann/template-mcp-config.git mcp-config
git submodule update --init

# Link the configuration  
ln -s mcp-config/.mcp.json .mcp.json

# Update later with:
git submodule update --remote
```

## 💡 Usage Examples

### Context7 in Action
```
User: "Create a FastAPI application with JWT authentication. use context7"
AI: [Fetches latest FastAPI docs and provides current best practices]

User: "Write a Next.js 14 component with server actions. use context7"  
AI: [Gets up-to-date Next.js 14 documentation and examples]
```

### File System Operations
```
User: "Find all TypeScript files that import 'react' in my projects"
AI: [Uses filesystem server to search across configured directories]

User: "Show me the structure of my Go project"
AI: [Uses filesystem server to display directory tree]
```

### DevOps Operations
```
User: "Show current pods in my Kubernetes cluster"
AI: [Uses kubernetes server to query cluster state]

User: "Check the status of my Docker containers"
AI: [Uses docker server to display container information]
```

## ⚙️ Configuration

### Environment Variables
Create a `.env` file in your project root:

```bash
# Required for GitHub integration
GITHUB_PERSONAL_ACCESS_TOKEN=ghp_xxxxxxxxxxxx

# Optional for Turso database
TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your-auth-token

# Optional infrastructure settings (have sensible defaults)
KUBECONFIG=${HOME}/.kube/config
PROMETHEUS_URL=http://localhost:9090
```

### Customizing Server Selection
The template includes a comprehensive set of servers. You can customize by:

1. **Removing unwanted servers** from `.mcp.json`
2. **Adding your own servers** following the same pattern
3. **Modifying filesystem paths** to match your directory structure

## 🔄 Update Patterns

### Git Subtree Updates
```bash
# Pull latest changes from template
git subtree pull --prefix=mcp-config https://github.com/LarsArtmann/template-mcp-config.git main --squash

# Push local modifications back (if contributing)
git subtree push --prefix=mcp-config https://github.com/LarsArtmann/template-mcp-config.git feature-branch
```

### Git Submodule Updates
```bash
# Update to latest version
git submodule update --remote

# Update to specific commit
cd mcp-config && git checkout <commit-hash> && cd ..
git add mcp-config && git commit -m "Update MCP config to <commit-hash>"
```

## 🌐 Remote vs Local MCP Servers

### Current Template: Local STDIO
This template uses **local stdio servers** for:
- ✅ **Security**: Everything runs with your local user permissions
- ✅ **Performance**: No network latency, direct process communication
- ✅ **Simplicity**: No web server setup or HTTPS certificates needed
- ✅ **Privacy**: All operations stay on your machine

### Future: Remote SSE Support
Remote MCP servers via Server-Sent Events offer:
- 🌍 **Accessibility**: Use from any device with internet access
- 👥 **Team sharing**: Multiple developers can access same MCP servers
- ☁️ **Cloud integration**: Deploy servers to cloud platforms
- 🔄 **Always available**: Don't depend on local machine running

> **Note**: SSE transport is being updated in MCP protocol v2024-11-05+ with new HTTP-based streaming approach.

## 🎯 When to Use Each Approach

### Direct Copy ✨
**Best for**: Quick projects, personal use, one-off configurations
- ✅ Immediate setup
- ✅ Full control over configuration
- ❌ Manual updates required
- ❌ No upstream contribution path

### Git Subtree 🌳 (Recommended)
**Best for**: Team projects, active development, frequent modifications
- ✅ Seamless clone experience for team members
- ✅ Easy to modify and extend locally
- ✅ Can contribute improvements back upstream
- ✅ No submodule complexity for contributors
- ❌ Larger repository size

### Git Submodule 🔗
**Best for**: Component-based architecture, strict version control
- ✅ Clear separation of concerns
- ✅ Precise version tracking
- ✅ Minimal repository size impact
- ❌ Requires submodule knowledge from team
- ❌ Extra steps for setup and updates

## 🛠️ Development

```bash
# Clone the repository
git clone https://github.com/LarsArtmann/template-mcp-config.git
cd template-mcp-config

# Test the configuration
cp .mcp.json .mcp.json.local
# Configure your environment variables
# Restart your MCP client

# Make modifications
# Test your changes
# Submit pull request
```

## 📚 Additional Resources

- [Model Context Protocol Documentation](https://modelcontextprotocol.io/)
- [Context7 Usage Guide](https://apidog.com/blog/context7-mcp-server/)
- [MCP Servers Directory](https://mcpservers.org/)
- [Git Subtree vs Submodule Guide](https://www.atlassian.com/git/tutorials/git-subtree)

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/new-server`
3. **Test your changes**: Ensure servers work correctly
4. **Update documentation**: Document new servers or changes
5. **Submit a pull request**: Include clear description of changes

### Guidelines
- Follow the existing configuration patterns
- Only include servers that work without external API keys (exceptions: GitHub, Turso)
- Use `bunx` for package execution
- Test configurations before submitting
- Update the server table in README when adding servers

## 📄 License

This project is licensed under the [European Union Public Licence v1.2](https://joinup.ec.europa.eu/software/page/eupl).

## 🙏 Acknowledgments

- **Context7 Team** for the excellent real-time documentation server
- **Anthropic** for the Model Context Protocol specification
- **MCP Community** for the comprehensive server ecosystem
- **All contributors** who help improve this template

---

**⚡ Ready to supercharge your development workflow with MCP? Choose your integration method and get started in minutes!**