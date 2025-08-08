# Template MCP Config

> **Production-ready MCP configuration template with Context7 integration and comprehensive tooling for modern development workflows**

[![License: EUPL v1.2](https://img.shields.io/badge/License-EUPLv1.2-blue.svg)](https://joinup.ec.europa.eu/software/page/eupl)
[![GitHub stars](https://img.shields.io/github/stars/LarsArtmann/template-mcp-config.svg?style=social&label=Star)](https://github.com/LarsArtmann/template-mcp-config)

A curated Model Context Protocol (MCP) configuration template that provides essential MCP servers for development teams. Features **Context7** for real-time documentation, plus carefully selected servers for filesystem access, GitHub integration, browser automation, and DevOps tools—all without requiring external API keys (except GitHub and optional Turso).

## 🌟 Key Features

### ✨ **Context7 Integration**
- **Real-time documentation**: Access up-to-date library docs and code examples
- **Zero configuration**: Works immediately with `use context7` in prompts
- **Version-specific**: Always gets the latest official documentation

### 🎯 **Curated Server Selection**
- **Minimal API dependencies**: Most servers work without external API keys
- **Development-focused**: Optimized for common development workflows
- **Bunx-powered**: Fast package execution with modern JavaScript runtime
- **Team-friendly**: Easy setup for entire development teams

### 🛠️ **Multiple Integration Methods**
- **Direct copy**: Simple `.mcp.json` for immediate use
- **Git Subtree**: Embed as part of your project (recommended for teams)
- **Git Submodule**: Reference as external dependency
- **Template base**: Foundation for custom MCP configurations

## 📋 Included Servers

| Category | Server | Purpose | API Key Required |
|----------|--------|---------|------------------|
| **📚 Documentation** | Context7 | Real-time library documentation | ❌ |
| **🔧 Version Control** | GitHub | Repository operations & issue management | ✅ |
| **📁 File System** | Filesystem | Multi-directory file access | ❌ |
| **🧠 AI Enhancement** | Memory | Persistent conversation context | ❌ |
| **🤔 Analysis** | Sequential Thinking | Complex problem reasoning | ❌ |
| **🔍 Search** | Everything | Universal content indexing & search | ❌ |
| **🎭 Browser Automation** | Playwright | Modern browser automation (accessibility-tree based) | ❌ |
| **🌐 Web Scraping** | Puppeteer | Traditional browser automation & scraping | ❌ |
| **🌐 HTTP Client** | Fetch | HTTP requests & web content retrieval | ❌ |
| **📺 Media** | YouTube Transcript | Extract video transcripts for analysis | ❌ |
| **☁️ Container Orchestration** | Kubernetes | Cluster management & pod operations | ❌ |
| **🔐 Remote Access** | SSH | Secure remote server management | ❌ |
| **🗄️ Local Database** | SQLite | Local database operations & queries | ❌ |
| **☁️ Distributed Database** | Turso | Edge SQLite with global replication | ⚠️ Optional |
| **🏗️ Infrastructure** | Terraform | Infrastructure as Code management | ❌ |
| **❄️ Package Management** | NixOS | Nix package & system management | ❌ |
| **📊 Monitoring** | Prometheus | Metrics collection & analysis | ❌ |
| **📦 Kubernetes Packages** | Helm | Kubernetes application management | ❌ |

**Total: 17 MCP servers** - Only **1 required API key** (GitHub), **1 optional** (Turso)

## 🚀 Quick Start

### Option 1: Direct Copy (Fastest)
```bash
# Clone and copy to your project
git clone https://github.com/LarsArtmann/template-mcp-config.git
cp template-mcp-config/.mcp.json your-project/.mcp.json

# Set up environment variables
cp template-mcp-config/.env.example your-project/.env
# Edit .env with your GitHub token

# Restart your MCP client (Claude Desktop, Cursor, etc.) and test
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

### Browser Automation
```
User: "Take a screenshot of https://example.com and analyze its layout"
AI: [Uses Playwright to capture and analyze the page]

User: "Test the login form on my local development site"
AI: [Uses Playwright to interact with form elements via accessibility tree]
```

### File System Operations
```
User: "Find all TypeScript files that import 'react' in my projects"
AI: [Uses filesystem server to search across configured directories]

User: "Show me the structure of my project"
AI: [Uses filesystem server to display directory tree and file organization]
```

### DevOps Operations
```
User: "Show current pods in my Kubernetes cluster"
AI: [Uses kubernetes server to query cluster state]

User: "Help me debug this Terraform configuration"
AI: [Uses terraform server to validate and analyze infrastructure code]
```

## ⚙️ Configuration

### Environment Variables
Create a `.env` file in your project root:

```bash
# Required for GitHub integration
GITHUB_PERSONAL_ACCESS_TOKEN=ghp_xxxxxxxxxxxx

# Optional for Turso database (edge SQLite)
TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your-auth-token

# Optional infrastructure settings (have sensible defaults)
KUBECONFIG=${HOME}/.kube/config
PROMETHEUS_URL=http://localhost:9090
```

### Customizing Server Selection
The template includes a comprehensive set of servers. Customize by:

1. **Removing unwanted servers** from `.mcp.json`
2. **Adding additional servers** following the same pattern
3. **Modifying filesystem paths** to match your directory structure
4. **Adjusting browser automation settings** for Playwright/Puppeteer

### File System Path Configuration
Update the `filesystem` server paths for your environment:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "bunx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/your/projects/directory",
        "/another/work/directory",
        "/tmp"
      ]
    }
  }
}
```

## 🔄 Update Patterns

### Git Subtree Updates (Recommended)
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

## 🌐 Local vs Remote MCP Architecture

### Current Template: Local STDIO
This template uses **local stdio servers** for:
- ✅ **Security**: Everything runs with your local user permissions
- ✅ **Performance**: No network latency, direct process communication
- ✅ **Simplicity**: No web server setup or HTTPS certificates needed
- ✅ **Privacy**: All operations stay on your machine

### Future: Remote Server Support
Remote MCP servers via HTTP/SSE offer:
- 🌍 **Team accessibility**: Shared servers for development teams
- ☁️ **Cloud deployment**: Deploy servers to edge locations
- 🔄 **Always available**: Independent of local machine status
- 👥 **Multi-client**: Support multiple developers simultaneously

> **Note**: MCP protocol is evolving with HTTP-based streaming in v2024-11-05+

## 🎯 When to Use Each Integration Method

### Direct Copy ✨
**Best for**: Quick projects, personal experimentation, learning MCP
- ✅ Immediate setup and usage
- ✅ Full control over configuration
- ❌ Manual updates required
- ❌ No upstream contribution path

### Git Subtree 🌳 (Recommended)
**Best for**: Team projects, active development, collaborative environments
- ✅ Seamless clone experience for team members
- ✅ Easy to modify and extend locally
- ✅ Can contribute improvements back upstream
- ✅ No submodule complexity for contributors
- ❌ Slightly larger repository size

### Git Submodule 🔗
**Best for**: Component-based architecture, strict dependency management
- ✅ Clear separation of concerns
- ✅ Precise version tracking and control
- ✅ Minimal repository size impact
- ❌ Requires submodule knowledge from team
- ❌ Extra setup steps for new contributors

## 🛠️ Development & Contributing

### Local Development
```bash
# Fork and clone the repository
git clone https://github.com/your-username/template-mcp-config.git
cd template-mcp-config

# Test the configuration locally
cp .mcp.json .mcp.json.local
cp .env.example .env
# Configure your environment variables
# Restart your MCP client to test changes
```

### Contributing Guidelines
1. **Fork the repository** on GitHub
2. **Create a feature branch**: `git checkout -b feature/new-server`
3. **Test your changes**: Ensure servers work correctly across different clients
4. **Update documentation**: Document new servers or configuration changes
5. **Submit a pull request**: Include clear description and testing instructions

### Adding New Servers
When proposing new servers:
- **Prioritize zero-configuration servers** (no API keys required)
- **Follow the bunx pattern** for consistency
- **Update the server table** in README.md
- **Test with multiple MCP clients** (Claude Desktop, Cursor, VS Code)
- **Include usage examples** in your pull request

## 🧪 Supported MCP Clients

This template has been tested with:
- **Claude Desktop** (Primary target)
- **Cursor IDE** (Full support)
- **VS Code with MCP extensions** (Compatible)
- **JetBrains IDEs with MCP plugins** (Compatible)
- **Custom MCP implementations** (Protocol-compliant)

## 🔧 Troubleshooting

### Common Issues

#### Server startup failures
```bash
# Verify bunx can access the package
bunx --help @upstash/context7-mcp

# Check environment variables
echo $GITHUB_PERSONAL_ACCESS_TOKEN
```

#### Playwright browser issues
```bash
# Install browser dependencies (if needed)
bunx playwright install

# For headless environments
bunx playwright install --with-deps
```

#### File system permissions
- Ensure MCP client has access to configured directories
- Check path permissions and existence
- Use absolute paths if relative paths cause issues

### Getting Help
- **Template issues**: [Open an issue](https://github.com/LarsArtmann/template-mcp-config/issues)
- **MCP protocol questions**: [MCP Documentation](https://modelcontextprotocol.io/)
- **Server-specific issues**: Check individual server documentation
- **Integration patterns**: See [USAGE.md](./USAGE.md) for detailed guides

## 📚 Additional Resources

- [Model Context Protocol Documentation](https://modelcontextprotocol.io/)
- [Context7 Usage Guide](https://apidog.com/blog/context7-mcp-server/)
- [MCP Servers Directory](https://mcpservers.org/)
- [Playwright MCP Documentation](https://executeautomation.github.io/mcp-playwright/)
- [Git Subtree vs Submodule Comparison](https://www.atlassian.com/git/tutorials/git-subtree)

## 🤝 Community & Support

- **GitHub Discussions**: Share usage patterns and ask questions
- **Issues**: Report bugs or request new server additions  
- **Pull Requests**: Contribute improvements and new servers
- **Documentation**: Help improve guides and examples

## 📄 License

This project is licensed under the [European Union Public Licence v1.2](https://joinup.ec.europa.eu/software/page/eupl).

## 🙏 Acknowledgments

- **Context7 Team** for the excellent real-time documentation server
- **Anthropic** for the Model Context Protocol specification  
- **Microsoft** for the Playwright MCP server
- **MCP Community** for the comprehensive server ecosystem
- **All contributors** who help improve this template

---

**⚡ Ready to enhance your AI development workflow? Choose your integration method and get started in minutes!**

*This template is maintained by the community and designed to work out-of-the-box for development teams worldwide.*