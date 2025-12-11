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
for file in index.html script.js style.css backend-api.js; do
    if [ -f "$file" ]; then
        echo "   ✓ $file found"
    else
        echo "   ✗ $file NOT found"
        ERRORS=$((ERRORS + 1))
    fi
done

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
if [ -f "ios/VoidRift/WebContent/backend-api.js" ]; then
    if grep -q "shooter-app-one.vercel.app" ios/VoidRift/WebContent/backend-api.js; then
        echo "   ✓ iOS WebContent has Vercel URL"
    else
        echo "   ⚠ iOS WebContent may need sync"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo "   ⚠ iOS WebContent missing files - run ./sync-ios-content.sh"
    WARNINGS=$((WARNINGS + 1))
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
