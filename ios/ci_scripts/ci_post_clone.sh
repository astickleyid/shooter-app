#!/bin/sh
# ci_post_clone.sh — Xcode Cloud post-clone for VoidRift (Capacitor)
set -e

echo "=== [Xcode Cloud] VoidRift: installing Node deps and building web assets ==="

# Homebrew is available in Xcode Cloud environments
brew install node || true
export PATH="/opt/homebrew/opt/node/bin:$PATH"

# Move to repo root (this script lives inside ios/App/ci_scripts/)
cd "$CI_WORKSPACE"

# Install deps (no build step — plain HTML/JS game, no bundler)
npm ci || npm install

# Copy web assets into the iOS Capacitor wrapper
npx cap copy ios

echo "=== [Xcode Cloud] VoidRift: post-clone complete ==="
