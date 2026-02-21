#!/bin/bash
set -e
# Install the Snag skill for Claude Code
# Usage: ./install.sh

SKILL_DIR="$HOME/.claude/skills/snag"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

mkdir -p "$SKILL_DIR"
cp "$SCRIPT_DIR/SKILL.md" "$SKILL_DIR/SKILL.md"

echo "Snag skill installed to $SKILL_DIR"
echo "Use /snag in Claude Code to list and manage captured issues."
