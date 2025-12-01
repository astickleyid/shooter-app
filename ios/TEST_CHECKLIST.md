# iOS Testing Checklist

## 🧪 Complete Testing Guide

Use this checklist to verify all fixes are working correctly.

---

## ✅ PRE-TEST SETUP

- [ ] Open project in Xcode: `open VoidRift.xcodeproj`
- [ ] Select your development team in Signing & Capabilities
- [ ] Choose a simulator or connect device
- [ ] Clean build folder (Shift+⌘+K)
- [ ] Build project (⌘B)

---

## 1️⃣ START SCREEN TESTS

### Visual Elements:
- [ ] Game title displays: "VOID**RIFT**"
- [ ] Tagline shows: "CREATED BY AUSTIN STICKLEY" (not "TWIN-STICK SHOOTER")
- [ ] Start button is neon green
- [ ] Only difficulty selector visible (Easy/Normal/Hard)
- [ ] **NO** game mode selector (no Space/Planetary dropdown)
- [ ] **NO** planet selector

### Expected Result:
✅ Clean start screen with only difficulty choice, no mode selection

---

## 2️⃣ TUTORIAL TESTS

### First Launch:
- [ ] Tutorial appears automatically on first launch
- [ ] Skip button visible at bottom
- [ ] Step indicator shows "Step X of Y"

### Interactive Elements:
- [ ] Step 1: Welcome message, game visible in background
- [ ] Step 2: **LEFT joystick highlighted** with pulsing green outline
- [ ] Step 3: **RIGHT joystick highlighted** with pulsing green outline  
- [ ] Step 4: **Health bar highlighted** at top-left
- [ ] Step 5: **Score display highlighted** at top-center
- [ ] Step 6: **Pause button highlighted** at top-right
- [ ] Step 7: **Weapon display highlighted** (if visible)
- [ ] Step 8: Final "You're Ready!" message

### Interaction:
- [ ] Can tap "Next" to proceed through steps
- [ ] Can tap "Skip Tutorial" anytime
- [ ] Skip confirmation dialog appears
- [ ] Tutorial closes after completion
- [ ] Doesn't show again on second launch

### Expected Result:
✅ Tutorial highlights ACTUAL game elements, not fake mockups

---

## 3️⃣ MENU STYLING TESTS

### Pause Menu:
- [ ] Background is **grey/black** (not blue)
- [ ] Has blur effect
- [ ] Border is **neon green** (#4ade80)
- [ ] Buttons are **neon green**
- [ ] Glow/shadow effects visible

### Shop/Upgrades:
- [ ] Modal background is **grey/black**
- [ ] Borders are **neon green**
- [ ] Upgrade cards styled with theme
- [ ] Purchase buttons are **green**

### Settings:
- [ ] Modal background matches theme
- [ ] All UI elements green-accented
- [ ] Sliders and controls visible
- [ ] No blue elements

### Expected Result:
✅ All menus use dark grey/black with neon green accents, NO blue

---

## 4️⃣ TEXT OVERLAP TESTS

### Portrait Mode:
- [ ] Level transition text doesn't overlap other UI
- [ ] "LEVEL X" displays centered
- [ ] Subtitle text visible and readable
- [ ] Kill streak popup at top-right, no overlap
- [ ] Combo counter visible and separated from streak
- [ ] Score and health don't overlap
- [ ] All text fits on screen

### Landscape Mode:
- [ ] Same as above but in landscape
- [ ] More spacing due to wider screen
- [ ] No elements cut off or overlapping

### Between Levels:
- [ ] "Level Complete" message centered
- [ ] Enemy count visible
- [ ] Continue button accessible
- [ ] No text overlapping countdown

### Expected Result:
✅ NO text overlap in ANY orientation or screen size

---

## 5️⃣ ACHIEVEMENT NOTIFICATION TESTS

### Trigger Achievement:
- [ ] Unlock first achievement (kill enemies)
- [ ] Notification appears at top-right
- [ ] Has dark background with blur
- [ ] **Neon green border**
- [ ] Icon displays with glow effect
- [ ] Title in green: "ACHIEVEMENT UNLOCKED"
- [ ] Achievement name in white
- [ ] Description text visible
- [ ] Slides in smoothly from right
- [ ] Auto-dismisses after few seconds

### Expected Result:
✅ Beautiful styled card, not plain text

---

## 6️⃣ LEADERBOARD TESTS

### In-Game:
- [ ] Access leaderboard from pause menu
- [ ] Background is grey/black with blur
- [ ] Entries have green borders
- [ ] Rank numbers in green
- [ ] Player names visible
- [ ] Scores formatted properly
- [ ] Hover effects work (if on iPad/cursor)

### Game Over Screen:
- [ ] Leaderboard displays properly
- [ ] Your score highlighted
- [ ] Can see top players
- [ ] Scrollable if needed
- [ ] Properly styled

### Expected Result:
✅ Leaderboard looks professional, not broken

---

## 7️⃣ ICON TESTS

### Generate Icons:
```bash
cd /Users/austinstickley/shooter-app/ios
./generate_icons.sh
```

### Verify:
- [ ] Script runs successfully
- [ ] Icons created in AppIcon.appiconset/
- [ ] All sizes present (20x20 to 1024x1024)
- [ ] Icons have space theme
- [ ] Neon green color visible

### In Xcode:
- [ ] Open Assets.xcassets
- [ ] Click AppIcon
- [ ] All icon slots filled
- [ ] Preview looks correct

### On Device/Simulator:
- [ ] App icon visible on home screen
- [ ] Icon matches theme
- [ ] No placeholder/generic icon

### Expected Result:
✅ Custom space-themed icons everywhere

---

## 8️⃣ RESPONSIVE DESIGN TESTS

### Portrait Mode:
- [ ] All UI elements visible
- [ ] Joysticks positioned correctly
- [ ] HUD elements don't overlap
- [ ] Text readable
- [ ] Buttons accessible

### Landscape Mode:
- [ ] Better layout utilized
- [ ] Joysticks in corners
- [ ] HUD spread out
- [ ] More visible play area

### Orientation Change:
- [ ] Smooth transition when rotating
- [ ] No UI jumping or glitching
- [ ] Game continues playing
- [ ] All elements reposition correctly

### Different Devices:
Test on multiple simulators:
- [ ] iPhone SE (small)
- [ ] iPhone 15 (standard)
- [ ] iPhone 15 Pro Max (large)
- [ ] iPad (if supported)

### Expected Result:
✅ Perfect layout on ALL devices and orientations

---

## 9️⃣ GAMEPLAY TESTS

### Controls:
- [ ] Left joystick moves ship
- [ ] Right joystick aims and fires
- [ ] Touch controls responsive
- [ ] Haptic feedback works
- [ ] No input lag

### Game Mechanics:
- [ ] Enemies spawn correctly
- [ ] Collision detection works
- [ ] Weapons fire properly
- [ ] Power-ups collectible
- [ ] Score increases
- [ ] Levels progress

### Performance:
- [ ] Game runs at 60 FPS
- [ ] No stuttering or lag
- [ ] Smooth animations
- [ ] Quick load times

### Expected Result:
✅ Perfect gameplay experience

---

## 🔟 FINAL CHECKS

### Console:
- [ ] No errors in Xcode console
- [ ] No warnings during build
- [ ] JavaScript console clean (Safari Web Inspector)

### Memory:
- [ ] No memory leaks
- [ ] Stable performance over time
- [ ] No crashes

### Build:
- [ ] Debug build succeeds
- [ ] Release build succeeds
- [ ] Archive succeeds (for App Store)

### Documentation:
- [ ] Read FIXES_APPLIED.md
- [ ] Understand all changes
- [ ] Know how to modify if needed

---

## 📊 RESULTS SUMMARY

After completing all tests, fill this out:

### Issues Found:
```
1. 
2.
3.
```

### All Working:
- [ ] Start screen tagline
- [ ] Game mode removed
- [ ] Interactive tutorial
- [ ] Menu colors
- [ ] Text overlap fixed
- [ ] Achievements styled
- [ ] Leaderboard working
- [ ] Icons generated
- [ ] Responsive design
- [ ] Gameplay perfect

### Ready for App Store:
- [ ] All tests pass
- [ ] No critical issues
- [ ] Production icons ready
- [ ] Signing configured
- [ ] Metadata prepared

---

## 🐛 IF ISSUES FOUND

### Debug Steps:
1. Check FIXES_APPLIED.md for details
2. Review ios-fixes.css for styling issues
3. Check Web Inspector for JavaScript errors
4. Verify all files copied to device
5. Clean and rebuild project

### Common Fixes:
- **Icons not showing:** Run `./generate_icons.sh`
- **CSS not applying:** Check ios-fixes.css is linked in index.html
- **Tutorial not highlighting:** Check webView passed to TutorialOverlay
- **Text still overlapping:** Check device-specific media queries
- **Colors wrong:** Verify ios-fixes.css loads after style.css

---

## ✅ SUCCESS CRITERIA

**All 8 fixes verified:**
1. ✅ Icons rendering
2. ✅ Game mode gone
3. ✅ Menu colors correct
4. ✅ No text overlap
5. ✅ Achievements styled
6. ✅ Leaderboard working
7. ✅ Tutorial interactive
8. ✅ Tagline updated

**Ready to submit to App Store!** 🎉

---

**Tester:** _______________  
**Date:** _______________  
**Device:** _______________  
**iOS Version:** _______________  
**Result:** ☐ PASS  ☐ FAIL (see notes)

**Notes:**
```




```
