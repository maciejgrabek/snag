#!/bin/bash
set -e

echo ""
echo "  So you don't like Jira either, huh? Welcome aboard.
  Your AI agents will thank you."
echo ""
echo "Setting up Snag..."

# Install dependencies
npm install --no-audit --no-fund

# Build the .app bundle
echo "Building Snag.app..."
npm run build 2>&1 | tail -5

# Copy to /Applications
APP_SRC="dist/mac-arm64/Snag.app"
APP_DEST="/Applications/Snag.app"

if [ -d "$APP_DEST" ]; then
  echo "Removing existing Snag.app..."
  rm -rf "$APP_DEST"
fi

cp -R "$APP_SRC" "$APP_DEST"
echo "Installed to /Applications/Snag.app"

# Open it
open "$APP_DEST"
echo ""
echo "Done! Snag is running in your menubar."
echo ""
echo "  Cmd+Shift+X  — capture a snag"
echo "  http://127.0.0.1:9999 — web dashboard + API"
echo ""
echo "To uninstall: rm -rf /Applications/Snag.app"
