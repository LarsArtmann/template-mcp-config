# Template MCP Configuration Automation
# Provides setup, validation, testing, and health monitoring for MCP servers

default:
    @just --list

# 🚀 Setup everything - install dependencies and configure environment
setup:
    @echo "🚀 Setting up MCP configuration environment..."
    bun run setup

# ✅ Validate configuration - check .mcp.json and environment variables  
validate:
    @echo "✅ Validating MCP configuration..."
    node scripts/validate-config.js

# 🧪 Test all MCP servers - verify each server can start and respond
test:
    @echo "🧪 Testing all MCP servers..."
    node scripts/test-servers.js

# 💚 Check server health - monitor running MCP servers (parallel)
health:
    @echo "💚 Checking MCP server health..."
    bun run health:check

# 🧹 Clean up - remove temporary files and caches
clean:
    @echo "🧹 Cleaning up..."
    rm -rf node_modules .cache dist tmp
    rm -f .env.local .mcp.json.backup
    @echo "✅ Cleanup complete"

# 🔧 Install system dependencies (bunx, node packages)
install-deps:
    @echo "🔧 Installing system dependencies..."
    @if ! command -v bunx >/dev/null 2>&1; then \
        echo "Installing bun..."; \
        curl -fsSL https://bun.sh/install | bash; \
        export PATH="$HOME/.bun/bin:$PATH"; \
    fi
    @if ! command -v node >/dev/null 2>&1; then \
        echo "❌ Node.js is required but not found"; \
        echo "Please install Node.js from https://nodejs.org"; \
        exit 1; \
    fi
    @echo "✅ Dependencies installed"

# 📋 Show system information and requirements
info:
    @echo "📋 MCP Configuration System Information"
    @echo "======================================="
    @echo "Node.js: $(node --version 2>/dev/null || echo 'Not installed')"
    @echo "Bun: $(bunx --version 2>/dev/null || echo 'Not installed')"
    @echo "Platform: $(uname -s)"
    @echo "Architecture: $(uname -m)"
    @echo "MCP Servers configured: $(cat .mcp.json | grep -o '"[^"]*":' | wc -l | tr -d ' ')"
    @echo ""
    @echo "Required environment variables:"
    @echo "- GITHUB_PERSONAL_ACCESS_TOKEN (required)"
    @echo "- TURSO_DATABASE_URL (optional)"  
    @echo "- TURSO_AUTH_TOKEN (optional)"
    @echo ""
    @echo "Project directory: $(pwd)"

# 🚀 Quick start - run setup, validate, and test in sequence
quick-start:
    @echo "🚀 Quick start: Setting up MCP configuration..."
    @just setup
    @just validate  
    @just test
    @echo "✅ Quick start complete! Your MCP configuration is ready."

# 🔄 Update dependencies - refresh MCP server packages
update:
    @echo "🔄 Updating MCP server dependencies..."
    bun update
    bun run cache:optimize
    @echo "✅ Dependencies updated and optimized"

# 🚀 Optimize performance - prepare all packages for fast startup
optimize:
    @echo "🚀 Optimizing MCP server performance..."
    bun run cache:optimize

# 📊 Performance analysis - benchmark and health check
perf:
    @echo "📊 Running performance analysis..."
    bun run perf:analyze

# 📊 Generate status report - comprehensive system status
status:
    @echo "📊 MCP Configuration Status Report"
    @echo "=================================="
    @just info
    @echo ""
    @just validate
    @echo ""
    @just health

# 🛠 Development mode - watch for changes and auto-validate
dev:
    @echo "🛠 Development mode - watching for configuration changes..."
    @echo "Press Ctrl+C to stop"
    while true; do \
        just validate; \
        sleep 5; \
    done