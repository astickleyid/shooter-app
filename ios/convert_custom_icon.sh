#!/bin/bash

# Convert custom Void Rift icon to all iOS sizes
# Source: /Users/austinstickley/Pictures/voidrift-icon.icon

echo "🎨 Converting Void Rift custom icon to iOS sizes..."

SOURCE_ICON="/Users/austinstickley/Pictures/voidrift-icon.icon/Assets/fb599ff7-0ef9-4e3b-b52d-56d8728345c6 2.png"
ICON_DIR="VoidRift/Assets.xcassets/AppIcon.appiconset"

# Check if source exists
if [ ! -f "$SOURCE_ICON" ]; then
    echo "❌ Source icon not found at: $SOURCE_ICON"
    exit 1
fi

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "📦 Installing ImageMagick..."
    brew install imagemagick || {
        echo "❌ Please install ImageMagick manually:"
        echo "   brew install imagemagick"
        exit 1
    }
fi

# Check if sips is available (macOS built-in)
if command -v sips &> /dev/null; then
    echo "✅ Using sips (macOS native tool)"
    USE_SIPS=true
else
    echo "✅ Using ImageMagick"
    USE_SIPS=false
fi

mkdir -p "$ICON_DIR"

# Function to resize icon
resize_icon() {
    local size=$1
    local output=$2
    
    if [ "$USE_SIPS" = true ]; then
        sips -z $size $size "$SOURCE_ICON" --out "$output" > /dev/null 2>&1
    else
        convert "$SOURCE_ICON" -resize ${size}x${size} "$output"
    fi
    
    if [ $? -eq 0 ]; then
        echo "  ✅ Created ${size}x${size}: $(basename $output)"
    else
        echo "  ❌ Failed to create ${size}x${size}"
    fi
}

echo ""
echo "📱 Generating iPhone icons..."

resize_icon 40 "$ICON_DIR/icon-20@2x.png"          # 20pt @2x
resize_icon 60 "$ICON_DIR/icon-20@3x.png"          # 20pt @3x
resize_icon 58 "$ICON_DIR/icon-29@2x.png"          # 29pt @2x
resize_icon 87 "$ICON_DIR/icon-29@3x.png"          # 29pt @3x
resize_icon 80 "$ICON_DIR/icon-40@2x.png"          # 40pt @2x
resize_icon 120 "$ICON_DIR/icon-40@3x.png"         # 40pt @3x
resize_icon 120 "$ICON_DIR/icon-60@2x.png"         # 60pt @2x
resize_icon 180 "$ICON_DIR/icon-60@3x.png"         # 60pt @3x

echo ""
echo "📱 Generating iPad icons..."

resize_icon 20 "$ICON_DIR/icon-20-ipad.png"        # 20pt @1x
resize_icon 40 "$ICON_DIR/icon-20-ipad@2x.png"     # 20pt @2x
resize_icon 29 "$ICON_DIR/icon-29-ipad.png"        # 29pt @1x
resize_icon 58 "$ICON_DIR/icon-29-ipad@2x.png"     # 29pt @2x
resize_icon 40 "$ICON_DIR/icon-40-ipad.png"        # 40pt @1x
resize_icon 80 "$ICON_DIR/icon-40-ipad@2x.png"     # 40pt @2x
resize_icon 76 "$ICON_DIR/icon-76.png"             # 76pt @1x
resize_icon 152 "$ICON_DIR/icon-76@2x.png"         # 76pt @2x
resize_icon 167 "$ICON_DIR/icon-83.5@2x.png"       # 83.5pt @2x

echo ""
echo "🏪 Generating App Store icon..."

resize_icon 1024 "$ICON_DIR/icon-1024.png"         # 1024pt @1x

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ All icons generated from custom Void Rift icon!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📁 Location: $ICON_DIR"
echo ""
echo "Next steps:"
echo "1. Open VoidRift.xcodeproj in Xcode"
echo "2. Check Assets.xcassets > AppIcon"
echo "3. Verify all icons are visible"
echo "4. Build and run to see icon on device!"
echo ""
