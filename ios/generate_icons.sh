#!/bin/bash

# Generate Void Rift App Icons
# Creates space-themed icons with neon green glow

echo "🎨 Generating Void Rift App Icons..."

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "⚠️  ImageMagick not found. Installing..."
    brew install imagemagick 2>/dev/null || {
        echo "❌ Please install ImageMagick manually:"
        echo "   brew install imagemagick"
        echo "Or use an online icon generator:"
        echo "   - https://appicon.co"
        echo "   - https://makeappicon.com"
        exit 1
    }
fi

ICON_DIR="VoidRift/Assets.xcassets/AppIcon.appiconset"
mkdir -p "$ICON_DIR"

# Base icon SVG (space theme with neon green)
create_base_icon() {
    local size=$1
    local output=$2
    
    convert -size ${size}x${size} xc:"#0f0f1e" \
        -fill "#4ade80" \
        -draw "circle $((size/2)),$((size/2)) $((size/2)),$((size/4))" \
        -blur 0x10 \
        -fill "#1e1e2e" \
        -draw "circle $((size/2)),$((size/2)) $((size/2)),$((size/3))" \
        -fill "#4ade80" \
        -pointsize $((size/4)) \
        -gravity center \
        -annotate +0+0 "V" \
        -blur 0x2 \
        "$output"
    
    echo "  ✅ Created $output"
}

# Generate all required sizes
echo "Generating icon sizes..."

# iPhone
create_base_icon 40 "$ICON_DIR/icon-20@2x.png"          # 20pt @2x
create_base_icon 60 "$ICON_DIR/icon-20@3x.png"          # 20pt @3x
create_base_icon 58 "$ICON_DIR/icon-29@2x.png"          # 29pt @2x
create_base_icon 87 "$ICON_DIR/icon-29@3x.png"          # 29pt @3x
create_base_icon 80 "$ICON_DIR/icon-40@2x.png"          # 40pt @2x
create_base_icon 120 "$ICON_DIR/icon-40@3x.png"         # 40pt @3x
create_base_icon 120 "$ICON_DIR/icon-60@2x.png"         # 60pt @2x
create_base_icon 180 "$ICON_DIR/icon-60@3x.png"         # 60pt @3x

# iPad
create_base_icon 20 "$ICON_DIR/icon-20-ipad.png"        # 20pt @1x
create_base_icon 40 "$ICON_DIR/icon-20-ipad@2x.png"     # 20pt @2x
create_base_icon 29 "$ICON_DIR/icon-29-ipad.png"        # 29pt @1x
create_base_icon 58 "$ICON_DIR/icon-29-ipad@2x.png"     # 29pt @2x
create_base_icon 40 "$ICON_DIR/icon-40-ipad.png"        # 40pt @1x
create_base_icon 80 "$ICON_DIR/icon-40-ipad@2x.png"     # 40pt @2x
create_base_icon 76 "$ICON_DIR/icon-76.png"             # 76pt @1x
create_base_icon 152 "$ICON_DIR/icon-76@2x.png"         # 76pt @2x
create_base_icon 167 "$ICON_DIR/icon-83.5@2x.png"       # 83.5pt @2x

# App Store
create_base_icon 1024 "$ICON_DIR/icon-1024.png"         # 1024pt @1x

echo
echo "✅ Icons generated!"
echo "📁 Location: $ICON_DIR"
echo
echo "Note: These are placeholder icons."
echo "For production, create custom icons with:"
echo "  - Dark void/space background"
echo "  - Neon cyan/purple glow"
echo "  - Spaceship or 'V' logo"
echo "  - Star effects"
echo
echo "Recommended tools:"
echo "  - Figma: https://figma.com"
echo "  - Icon generators: https://appicon.co"
echo
