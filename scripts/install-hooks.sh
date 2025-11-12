#!/bin/bash

# Install Git hooks for the repository
# This script copies hooks from scripts/hooks/ to .git/hooks/

set -e

HOOKS_DIR=".git/hooks"
SCRIPTS_HOOKS_DIR="scripts/hooks"

echo ""
echo "🔧 Installing Git hooks..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ Error: Not a git repository. Run this from the repository root."
    exit 1
fi

# Check if hooks directory exists
if [ ! -d "$SCRIPTS_HOOKS_DIR" ]; then
    echo "❌ Error: $SCRIPTS_HOOKS_DIR directory not found."
    exit 1
fi

# Create hooks directory if it doesn't exist
mkdir -p "$HOOKS_DIR"

# Install each hook
for hook_file in "$SCRIPTS_HOOKS_DIR"/*; do
    if [ -f "$hook_file" ]; then
        hook_name=$(basename "$hook_file")
        target_path="$HOOKS_DIR/$hook_name"

        # Copy hook
        cp "$hook_file" "$target_path"
        chmod +x "$target_path"

        echo "✅ Installed: $hook_name"
    fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Git hooks installed successfully!"
echo ""
echo "Installed hooks will run automatically on:"
echo "  • pre-commit: Validates plugin versions before committing"
echo ""
echo "To bypass hooks (not recommended), use: git commit --no-verify"
echo ""
