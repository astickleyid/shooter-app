#!/bin/bash

# Script to sync latest web content to iOS bundle
# This ensures the iOS app always has the latest game files

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$SCRIPT_DIR"
IOS_WEB_DIR="$ROOT_DIR/ios/VoidRift/WebContent"

echo "================================================"
echo "📱 VOID RIFT - Sync Web Content to iOS"
echo "================================================"
echo ""

# Check if iOS directory exists
if [ ! -d "$IOS_WEB_DIR" ]; then
    echo "❌ Error: iOS WebContent directory not found!"
    echo "   Expected: $IOS_WEB_DIR"
    exit 1
fi

echo "✓ iOS WebContent directory found"
echo ""

# Sync main game files
echo "📄 Syncing main game files..."
cp -v "$ROOT_DIR/index.html" "$IOS_WEB_DIR/index.html"
cp -v "$ROOT_DIR/script.js" "$IOS_WEB_DIR/script.js"
cp -v "$ROOT_DIR/style.css" "$IOS_WEB_DIR/style.css"
echo ""

# Sync auth + social UI system files
echo "🧩 Syncing auth and social UI files..."
cp -v "$ROOT_DIR/auth-system.js" "$IOS_WEB_DIR/auth-system.js"
cp -v "$ROOT_DIR/leaderboard-system.js" "$IOS_WEB_DIR/leaderboard-system.js"
cp -v "$ROOT_DIR/social-ui.js" "$IOS_WEB_DIR/social-ui.js"
cp -v "$ROOT_DIR/social-ui.css" "$IOS_WEB_DIR/social-ui.css"
echo ""

# Sync 3D integration module
echo "🛰️  Syncing 3D integration module..."
cp -v "$ROOT_DIR/game-3d-integration.js" "$IOS_WEB_DIR/game-3d-integration.js"
echo ""

# Sync API and supporting files
echo "🔌 Syncing API and supporting files..."
cp -v "$ROOT_DIR/backend-api.js" "$IOS_WEB_DIR/backend-api.js"
cp -v "$ROOT_DIR/audio-manager.js" "$IOS_WEB_DIR/audio-manager.js"
cp -v "$ROOT_DIR/game-utils.js" "$IOS_WEB_DIR/game-utils.js"
echo ""

# Sync social integration files
echo "👥 Syncing social integration files..."
cp -v "$ROOT_DIR/social-api.js" "$IOS_WEB_DIR/social-api.js"
cp -v "$ROOT_DIR/social-hub.js" "$IOS_WEB_DIR/social-hub.js"
cp -v "$ROOT_DIR/social-integration.js" "$IOS_WEB_DIR/social-integration.js"
cp -v "$ROOT_DIR/social-ui.js" "$IOS_WEB_DIR/social-ui.js"
cp -v "$ROOT_DIR/social-ui.css" "$IOS_WEB_DIR/social-ui.css"
cp -v "$ROOT_DIR/unified-social.js" "$IOS_WEB_DIR/unified-social.js"
echo ""

# Sync authentication and leaderboard systems
echo "🔐 Syncing authentication and leaderboard systems..."
cp -v "$ROOT_DIR/auth-system.js" "$IOS_WEB_DIR/auth-system.js"
cp -v "$ROOT_DIR/leaderboard-system.js" "$IOS_WEB_DIR/leaderboard-system.js"
echo ""

# Sync 3D rendering system
echo "🎮 Syncing 3D rendering system..."
if [ -f "$ROOT_DIR/game-3d-integration.js" ]; then
    cp -v "$ROOT_DIR/game-3d-integration.js" "$IOS_WEB_DIR/game-3d-integration.js"
else
    echo "   Warning: game-3d-integration.js not found, skipping"
fi
echo ""

# Sync src directory (modular code)
echo "📦 Syncing src directory (modular code)..."
if [ -d "$ROOT_DIR/src" ]; then
    rsync -av --delete "$ROOT_DIR/src/" "$IOS_WEB_DIR/src/"
else
    echo "   Warning: src directory not found, skipping"
fi
echo ""

# Sync Three.js libraries for 3D rendering
echo "🌐 Syncing Three.js libraries..."
if [ -d "$ROOT_DIR/node_modules/three" ]; then
    # Create libs directory structure
    mkdir -p "$IOS_WEB_DIR/libs/three-examples/jsm/postprocessing"
    mkdir -p "$IOS_WEB_DIR/libs/three-examples/jsm/shaders"
    
    # Copy Three.js core
    cp -v "$ROOT_DIR/node_modules/three/build/three.module.js" "$IOS_WEB_DIR/libs/three.module.js"
    
    # Copy postprocessing effects
    cp -v "$ROOT_DIR/node_modules/three/examples/jsm/postprocessing/EffectComposer.js" "$IOS_WEB_DIR/libs/three-examples/jsm/postprocessing/"
    cp -v "$ROOT_DIR/node_modules/three/examples/jsm/postprocessing/RenderPass.js" "$IOS_WEB_DIR/libs/three-examples/jsm/postprocessing/"
    cp -v "$ROOT_DIR/node_modules/three/examples/jsm/postprocessing/UnrealBloomPass.js" "$IOS_WEB_DIR/libs/three-examples/jsm/postprocessing/"
    cp -v "$ROOT_DIR/node_modules/three/examples/jsm/postprocessing/Pass.js" "$IOS_WEB_DIR/libs/three-examples/jsm/postprocessing/"
    
    # Copy required shaders
    cp -v "$ROOT_DIR/node_modules/three/examples/jsm/shaders/CopyShader.js" "$IOS_WEB_DIR/libs/three-examples/jsm/shaders/"
    cp -v "$ROOT_DIR/node_modules/three/examples/jsm/shaders/LuminosityHighPassShader.js" "$IOS_WEB_DIR/libs/three-examples/jsm/shaders/"
    
    echo "   ✓ Three.js libraries copied successfully"
else
    echo "   ⚠️  Warning: Three.js not found in node_modules"
    echo "   Run 'npm install' first to install dependencies"
fi
echo ""

# Sync assets directory
echo "🎨 Syncing assets..."
if [ -d "$ROOT_DIR/assets" ]; then
    rsync -av --delete "$ROOT_DIR/assets/" "$IOS_WEB_DIR/assets/"
else
    echo "   Warning: assets directory not found, skipping"
fi
echo ""

# Sync source modules (needed for 3D integration)
echo "🧱 Syncing src modules..."
if [ -d "$ROOT_DIR/src" ]; then
    rsync -av --delete "$ROOT_DIR/src/" "$IOS_WEB_DIR/src/"
else
    echo "   Warning: src directory not found, skipping"
fi
echo ""

# Verify Vercel URL
echo "🔍 Verifying Vercel API URL..."
if grep -q "shooter-app-one.vercel.app" "$IOS_WEB_DIR/backend-api.js"; then
    echo "   ✓ Vercel URL configured: shooter-app-one.vercel.app"
else
    echo "   ⚠️  Warning: Vercel URL may not be configured"
    echo "   Please check backend-api.js for API_URL setting"
fi
echo ""

echo "✅ Web content sync complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Open ios/VoidRift.xcodeproj in Xcode"
echo "   2. Build and run the project"
echo "   3. The iOS app now has the latest web content!"
echo ""
