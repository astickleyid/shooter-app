#!/bin/bash

# iOS Build Setup Verification Script
# Checks that all components are in place for iOS builds

set -e

echo "================================================"
echo "🔍 iOS Build Setup Verification"
echo "================================================"
echo ""

ERRORS=0
WARNINGS=0

# Check 1: iOS Project exists
echo "1. Checking iOS project..."
if [ -d "ios/VoidRift.xcodeproj" ]; then
    echo "   ✓ Xcode project found"
else
    echo "   ✗ Xcode project NOT found"
    ERRORS=$((ERRORS + 1))
fi

# Check 2: WebContent directory exists
echo "2. Checking WebContent directory..."
if [ -d "ios/VoidRift/WebContent" ]; then
    echo "   ✓ WebContent directory found"
else
    echo "   ✗ WebContent directory NOT found"
    ERRORS=$((ERRORS + 1))
fi

# Check 3: Essential web files exist
echo "3. Checking essential web files..."
for file in index.html script.js style.css backend-api.js auth-system.js leaderboard-system.js social-ui.js social-ui.css game-3d-integration.js; do
    if [ -f "$file" ]; then
        echo "   ✓ $file found"
    else
        echo "   ✗ $file NOT found"
        ERRORS=$((ERRORS + 1))
    fi
done

# Check 3b: Source modules exist (for 3D integration)
echo "3b. Checking src module directory..."
if [ -d "src" ]; then
    echo "   ✓ src directory found"
else
    echo "   ✗ src directory NOT found"
    ERRORS=$((ERRORS + 1))
fi

# Check 4: Sync script exists
echo "4. Checking sync script..."
if [ -f "sync-ios-content.sh" ] && [ -x "sync-ios-content.sh" ]; then
    echo "   ✓ sync-ios-content.sh found and executable"
else
    echo "   ✗ sync-ios-content.sh missing or not executable"
    ERRORS=$((ERRORS + 1))
fi

# Check 5: GitHub Actions workflow exists
echo "5. Checking GitHub Actions workflow..."
if [ -f ".github/workflows/ios-build.yml" ]; then
    echo "   ✓ iOS build workflow found"
else
    echo "   ✗ iOS build workflow NOT found"
    ERRORS=$((ERRORS + 1))
fi

# Check 6: Vercel URL configuration
echo "6. Checking Vercel URL configuration..."
if grep -q "shooter-app-one.vercel.app" backend-api.js; then
    echo "   ✓ Vercel URL configured in backend-api.js"
else
    echo "   ⚠ Vercel URL may not be configured"
    WARNINGS=$((WARNINGS + 1))
fi

# Check 7: iOS WebContent has latest files
echo "7. Checking if iOS WebContent is synced..."
SYNC_WARN=0
for file in index.html script.js style.css backend-api.js audio-manager.js game-utils.js auth-system.js leaderboard-system.js social-ui.js social-ui.css game-3d-integration.js unified-social.js; do
    if [ ! -f "ios/VoidRift/WebContent/$file" ]; then
        echo "   ⚠ iOS WebContent missing $file"
        WARNINGS=$((WARNINGS + 1))
        SYNC_WARN=1
    elif ! cmp -s "$file" "ios/VoidRift/WebContent/$file"; then
        echo "   ⚠ iOS WebContent out of sync for $file"
        WARNINGS=$((WARNINGS + 1))
        SYNC_WARN=1
    else
        echo "   ✓ $file synced"
    fi
done

if [ -d "ios/VoidRift/WebContent/src" ]; then
    echo "   ✓ iOS WebContent src directory found"
else
    echo "   ⚠ iOS WebContent src directory missing"
    WARNINGS=$((WARNINGS + 1))
    SYNC_WARN=1
fi

if [ -f "ios/VoidRift/WebContent/backend-api.js" ]; then
    if grep -q "shooter-app-one.vercel.app" ios/VoidRift/WebContent/backend-api.js; then
        echo "   ✓ iOS WebContent has Vercel URL"
    else
        echo "   ⚠ iOS WebContent may need sync (API URL)"
        WARNINGS=$((WARNINGS + 1))
        SYNC_WARN=1
    fi
fi

if [ $SYNC_WARN -eq 1 ]; then
    echo "   ⚠ Run ./sync-ios-content.sh to resync WebContent"
fi

# Check 8: Documentation exists
echo "8. Checking documentation..."
if [ -f "IOS_BUILD_GUIDE.md" ]; then
    echo "   ✓ iOS Build Guide found"
else
    echo "   ⚠ iOS Build Guide missing"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""
echo "================================================"
echo "Summary"
echo "================================================"
echo "Errors: $ERRORS"
echo "Warnings: $WARNINGS"
echo ""

if [ $ERRORS -eq 0 ]; then
    echo "✅ iOS build setup is complete!"
    echo ""
    echo "Next steps:"
    echo "  • Run ./sync-ios-content.sh to sync latest content"
    echo "  • Push to GitHub to trigger automated build"
    echo "  • Or open ios/VoidRift.xcodeproj in Xcode"
    exit 0
else
    echo "❌ iOS build setup has errors that need to be fixed"
    exit 1
fi
