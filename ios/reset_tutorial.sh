#!/bin/bash
# Reset tutorial flag for testing

echo "🔄 Resetting tutorial flag..."

# Get the bundle ID
BUNDLE_ID="com.voidrift.game"

# Reset UserDefaults
defaults delete $BUNDLE_ID hasCompletedTutorial 2>/dev/null

# Also reset for simulator
xcrun simctl spawn booted defaults delete $BUNDLE_ID hasCompletedTutorial 2>/dev/null

echo "✅ Tutorial flag reset!"
echo "Next time you launch the app, the tutorial will show again."
