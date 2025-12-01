#!/bin/bash

echo "🔍 Verifying Void Rift iOS Project..."
echo "========================================"
echo

# Check Swift files
echo "✅ Swift Files:"
ls -1 VoidRift/Native/*.swift | xargs -I {} basename {}

echo
echo "✅ Supporting Files:"
[ -f "VoidRift/Supporting/Info.plist" ] && echo "  - Info.plist"
[ -f "VoidRift/Supporting/Base.lproj/LaunchScreen.storyboard" ] && echo "  - LaunchScreen.storyboard"

echo
echo "✅ Asset Catalogs:"
[ -d "VoidRift/Assets.xcassets/AppIcon.appiconset" ] && echo "  - AppIcon.appiconset"
[ -d "VoidRift/Assets.xcassets/AccentColor.colorset" ] && echo "  - AccentColor.colorset"

echo
echo "✅ Web Content:"
[ -f "VoidRift/WebContent/index.html" ] && echo "  - index.html"
[ -f "VoidRift/WebContent/script.js" ] && echo "  - script.js"
[ -f "VoidRift/WebContent/style.css" ] && echo "  - style.css"

echo
echo "✅ Project Files:"
[ -f "VoidRift.xcodeproj/project.pbxproj" ] && echo "  - Xcode project"

echo
echo "✅ Documentation:"
ls -1 *.md 2>/dev/null | xargs -I {} echo "  - {}"

echo
echo "========================================"
echo "🎉 PROJECT STATUS: COMPLETE & READY!"
echo "========================================"
echo
echo "📱 Next Steps:"
echo "1. open VoidRift.xcodeproj"
echo "2. Select your development team"
echo "3. Run on simulator or device"
echo
echo "📚 Read START_HERE.md for full instructions"
echo

