#!/bin/sh
# ci_post_clone.sh — Xcode Cloud post-clone for VoidRift (Capacitor)
set -e

echo "=== [Xcode Cloud] VoidRift post-clone ==="
echo "CI_PRIMARY_REPOSITORY_PATH: $CI_PRIMARY_REPOSITORY_PATH"
echo "CI_WORKSPACE: $CI_WORKSPACE"
echo "PWD: $(pwd)"
echo "Node: $(node --version 2>/dev/null || echo 'not found')"
echo "npm:  $(npm --version 2>/dev/null || echo 'not found')"

# Ensure node/npm are available — install via Homebrew if missing
if ! command -v npm >/dev/null 2>&1; then
  echo "npm not found, installing node via Homebrew..."
  brew install node
  export PATH="/opt/homebrew/bin:$PATH"
fi

echo "Using node: $(node --version)"
echo "Using npm:  $(npm --version)"

# Move to repo root
REPO="${CI_PRIMARY_REPOSITORY_PATH:-$CI_WORKSPACE}"
echo "cd to: $REPO"
cd "$REPO"

echo "==> npm ci"
npm ci

echo "==> npx cap copy ios"
npx cap copy ios

echo "=== VoidRift post-clone complete ==="
