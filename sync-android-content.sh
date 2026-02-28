#!/bin/bash

# Script to sync latest web content to the Android assets bundle.
# Run this before building the Android app locally, or let CI do it automatically.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$SCRIPT_DIR"
ANDROID_WEB_DIR="$ROOT_DIR/android/app/src/main/assets/WebContent"

echo "================================================"
echo "🤖 VOID RIFT - Sync Web Content to Android"
echo "================================================"
echo ""

if [ ! -d "$ANDROID_WEB_DIR" ]; then
    echo "❌ Error: Android WebContent directory not found!"
    echo "   Expected: $ANDROID_WEB_DIR"
    exit 1
fi

echo "✓ Android WebContent directory found"
echo ""

# Main game files
echo "📄 Syncing main game files..."
cp -v "$ROOT_DIR/index.html"    "$ANDROID_WEB_DIR/index.html"
cp -v "$ROOT_DIR/script.js"     "$ANDROID_WEB_DIR/script.js"
cp -v "$ROOT_DIR/style.css"     "$ANDROID_WEB_DIR/style.css"
echo ""

# Auth + social UI
echo "🧩 Syncing auth and social UI files..."
cp -v "$ROOT_DIR/auth-system.js"       "$ANDROID_WEB_DIR/auth-system.js"
cp -v "$ROOT_DIR/leaderboard-system.js" "$ANDROID_WEB_DIR/leaderboard-system.js"
cp -v "$ROOT_DIR/social-ui.js"         "$ANDROID_WEB_DIR/social-ui.js"
cp -v "$ROOT_DIR/social-ui.css"        "$ANDROID_WEB_DIR/social-ui.css"
echo ""

# API and supporting files
echo "🔌 Syncing API and supporting files..."
cp -v "$ROOT_DIR/backend-api.js"   "$ANDROID_WEB_DIR/backend-api.js"
cp -v "$ROOT_DIR/audio-manager.js" "$ANDROID_WEB_DIR/audio-manager.js"
cp -v "$ROOT_DIR/game-utils.js"    "$ANDROID_WEB_DIR/game-utils.js"
echo ""

# Social integration
echo "👥 Syncing social integration files..."
cp -v "$ROOT_DIR/social-api.js"         "$ANDROID_WEB_DIR/social-api.js"
cp -v "$ROOT_DIR/social-hub.js"         "$ANDROID_WEB_DIR/social-hub.js"
cp -v "$ROOT_DIR/social-integration.js" "$ANDROID_WEB_DIR/social-integration.js"
cp -v "$ROOT_DIR/unified-social.js"     "$ANDROID_WEB_DIR/unified-social.js"
echo ""

# Modular source directory
echo "📦 Syncing src directory..."
if [ -d "$ROOT_DIR/src" ]; then
    rsync -av --delete "$ROOT_DIR/src/" "$ANDROID_WEB_DIR/src/"
else
    echo "   Warning: src directory not found, skipping"
fi
echo ""

# Assets directory
echo "🎨 Syncing assets..."
if [ -d "$ROOT_DIR/assets" ]; then
    rsync -av --delete "$ROOT_DIR/assets/" "$ANDROID_WEB_DIR/assets/"
else
    echo "   Warning: assets directory not found, skipping"
fi
echo ""

echo "✅ Android web content sync complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Open the android/ directory in Android Studio"
echo "   2. Build → Generate Signed Bundle/APK"
echo "   3. Upload the .aab to Google Play Console"
echo ""
