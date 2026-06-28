#!/bin/sh
# Xcode Cloud pre-build: build web game assets before xcodebuild
set -e

cd "$CI_PRIMARY_REPOSITORY_PATH"

echo "==> Installing Node dependencies..."
npm ci

echo "==> Syncing web assets into iOS project..."
npx cap copy ios

echo "==> Pre-build complete."
