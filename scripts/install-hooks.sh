#!/bin/bash
# Install Git hooks for MCP Configuration Template

set -e

HOOKS_DIR="$(pwd)/.git-hooks"
GIT_HOOKS_DIR="$(pwd)/.git/hooks"

echo "🔧 Installing Git hooks..."

# Check if .git-hooks directory exists
if [ ! -d "$HOOKS_DIR" ]; then
    echo "❌ .git-hooks directory not found"
    exit 1
fi

# Make hooks executable
chmod +x "$HOOKS_DIR"/*

# Install each hook
for hook in "$HOOKS_DIR"/*; do
    hook_name=$(basename "$hook")
    target="$GIT_HOOKS_DIR/$hook_name"

    # Create backup if hook already exists
    if [ -f "$target" ]; then
        echo "📦 Backing up existing hook: $hook_name"
        cp "$target" "$target.bak"
    fi

    # Create symlink or copy the hook
    if [ -L "$target" ]; then
        rm "$target"
    fi

    ln -sf "../../.git-hooks/$hook_name" "$target"
    echo "✅ Installed hook: $hook_name"
done

echo ""
echo "✅ Git hooks installed successfully!"
echo ""
echo "Available hooks:"
echo "  - pre-commit: Runs linting and formatting checks"
echo "  - commit-msg: Validates commit message format"
