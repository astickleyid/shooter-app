# Step-by-Step Integration Guide

This guide shows how to integrate the 3D rendering system into the main VOID RIFT game with minimal changes to existing code.

## Prerequisites

- All 3D system files are in place (already done)
- Three.js is installed via npm (already done)
- Game uses ES6 modules or bundler

## Step 1: Import 3D System in HTML

Add the 3D integration module to your `index.html` **before** the main `script.js`:

```html
<!-- Include 3D integration (before main script) -->
<script type="module" src="game-3d-integration.js"></script>
<script src="script.js"></script>
```

## Step 2: Initialize 3D in Main Script

At the top of `script.js`, add the 3D initialization after DOM ready:

```javascript
// Near the top of script.js, in the IIFE
(() => {
  // ... existing code ...

  // Initialize 3D system (add after canvas setup)
  let game3DInstance = null;
  let use3DMode = false;

  const init3DSystem = () => {
    if (typeof window.__VOID_RIFT_3D__ !== 'undefined') {
      try {
        use3DMode = window.__VOID_RIFT_3D__.init(dom.canvas);
        game3DInstance = window.__VOID_RIFT_3D__;
        console.log('3D system initialized:', use3DMode ? 'Enabled' : 'Disabled');
      } catch (error) {
        console.warn('3D initialization failed, using 2D fallback:', error);
        use3DMode = false;
      }
    }
  };

  // ... rest of code ...
})();
```

## Step 3: Update Game Loop

Modify the `drawGame()` function to support both 2D and 3D rendering:

```javascript
const drawGame = () => {
  if (!dom.ctx) return;
  
  // Check if 3D mode is active
  if (use3DMode && game3DInstance && game3DInstance.isActive()) {
    // Update 3D entities (sync 2D state to 3D)
    game3DInstance.update({
      player: player,
      bullets: bullets,
      enemies: enemies,
      // Add more entity types as needed
      shipData: {
        shape: Save.data.shipConfig?.shape || 'spear',
        scale: Save.data.shipConfig?.scale || 1,
        colors: Save.data.shipConfig?.colors || {
          primary: '#0ea5e9',
          accent: '#38bdf8',
          thruster: '#f97316'
        }
      },
      boosting: keys.boost || false
    });
    
    // Render 3D scene
    game3DInstance.render();
    
    // Note: HUD is still rendered separately in 2D (updateHUD())
  } else {
    // Existing 2D rendering code
    const ctx = dom.ctx;
    const canvas = dom.canvas;
    
    // ... all existing 2D rendering code ...
  }
};
```

## Step 4: Add Settings Toggle

Add a 3D mode toggle in the settings/controls modal:

```html
<!-- In the Controls Tab of controlSettingsModal -->
<div class="settings-section">
  <h3>Graphics</h3>
  <label class="checkbox-label">
    <input type="checkbox" id="enable3DMode">
    <span>3D Graphics Mode (Beta)</span>
  </label>
  <p style="color: #94a3b8; font-size: 12px; margin-top: 4px;">
    Requires WebGL support. May impact performance on older devices.
  </p>
</div>
```

Add the toggle handler in JavaScript:

```javascript
// In settings initialization
const enable3DModeCheckbox = document.getElementById('enable3DMode');
if (enable3DModeCheckbox) {
  // Load saved preference
  enable3DModeCheckbox.checked = use3DMode;
  
  // Handle toggle
  enable3DModeCheckbox.addEventListener('change', () => {
    if (game3DInstance) {
      use3DMode = game3DInstance.toggle();
      console.log('3D mode:', use3DMode ? 'Enabled' : 'Disabled');
    }
  });
}
```

## Step 5: Handle Window Resize

Update the resize handler:

```javascript
window.addEventListener('resize', () => {
  resizeCanvas();
  
  // Resize 3D renderer if active
  if (game3DInstance) {
    game3DInstance.resize();
  }
});
```

## Step 6: Add Screen Shake Integration

Update screen shake to work in both 2D and 3D:

```javascript
const shake = (power = 3) => {
  if (use3DMode && game3DInstance) {
    // Use 3D shake
    game3DInstance.shake(power);
  } else {
    // Use existing 2D shake
    shakeUntil = performance.now() + 200;
    shakePower = power;
  }
};
```

## Step 7: Initialize on Game Start

Call 3D initialization when the game starts:

```javascript
const ready = () => {
  // ... existing ready code ...
  
  // Initialize 3D system
  init3DSystem();
  
  // ... rest of code ...
};
```

## Step 8: Test the Integration

1. **Test 2D Mode (default)**:
   - Start game normally
   - Verify everything works as before

2. **Test 3D Mode**:
   - Open settings, enable 3D mode
   - Verify 3D entities render correctly
   - Test all game features

3. **Test Toggle**:
   - Switch between 2D and 3D during gameplay
   - Verify smooth transition

## Optional Enhancements

### Add Visual Indicator

Show which mode is active in the UI:

```javascript
// Add to HUD
const updateGraphicsModeIndicator = () => {
  const indicator = document.getElementById('graphicsModeIndicator');
  if (indicator) {
    indicator.textContent = use3DMode ? '3D' : '2D';
    indicator.className = use3DMode ? 'mode-3d' : 'mode-2d';
  }
};
```

### Add Keyboard Shortcut

Toggle 3D with a key press:

```javascript
// In keyboard event handler
if (e.key === 'v' || e.key === 'V') {
  if (game3DInstance) {
    use3DMode = game3DInstance.toggle();
    showMessage(`Graphics: ${use3DMode ? '3D' : '2D'} Mode`);
  }
}
```

### Add Performance Monitoring

Display FPS and adjust quality:

```javascript
// Monitor FPS
let fpsHistory = [];
const monitorPerformance = () => {
  fpsHistory.push(fps);
  if (fpsHistory.length > 60) {
    fpsHistory.shift();
    const avgFps = fpsHistory.reduce((a, b) => a + b) / fpsHistory.length;
    
    // Auto-adjust quality if FPS too low
    if (avgFps < 30 && use3DMode) {
      console.warn('Low FPS detected, consider reducing quality');
    }
  }
};
```

## Troubleshooting

### Issue: 3D doesn't initialize

**Solution**: Check console for errors. Verify WebGL is supported:

```javascript
if (typeof window.__VOID_RIFT_3D__ === 'undefined') {
  console.error('3D system not loaded');
}
```

### Issue: Entities not appearing in 3D

**Solution**: Ensure entities have ID property:

```javascript
// When creating entities, ensure they have unique IDs
const bullet = {
  id: `bullet_${Date.now()}_${Math.random()}`,
  x: x,
  y: y,
  // ... other properties
};
```

### Issue: Low FPS in 3D mode

**Solution**: Adjust quality settings:

```javascript
if (game3DInstance) {
  game3DInstance.setQualitySettings({
    pixelRatio: 1,
    shadows: false,
    postProcessing: false,
    particleMultiplier: 0.5
  });
}
```

### Issue: 2D HUD not visible over 3D

**Solution**: Ensure HUD has higher z-index:

```css
#uiPanel {
  z-index: 100;
  position: absolute;
}
```

## Testing Checklist

- [ ] Game starts in 2D mode
- [ ] Can toggle to 3D mode in settings
- [ ] Player ship appears in 3D
- [ ] Bullets appear in 3D
- [ ] Enemies appear in 3D
- [ ] Coins appear in 3D
- [ ] Asteroids appear in 3D
- [ ] Particles work in 3D
- [ ] Camera follows player
- [ ] Screen shake works
- [ ] HUD is visible and functional
- [ ] Touch controls work (mobile)
- [ ] Performance is acceptable
- [ ] Can toggle back to 2D
- [ ] No memory leaks
- [ ] No console errors

## Performance Targets

- **Desktop**: 60 FPS @ 1920x1080
- **Mobile**: 60 FPS @ device resolution (iPhone 8+)
- **Minimum**: 30 FPS on low-end devices

## Rollout Strategy

1. **Phase 1**: Beta feature (opt-in via settings)
2. **Phase 2**: Gather feedback and optimize
3. **Phase 3**: Make default if performance good
4. **Phase 4**: Keep 2D as fallback option

## Support

For issues or questions:
- Check docs/3D_USAGE_GUIDE.md
- Check docs/3D_CONVERSION.md
- Test with test-3d.html first
- Check browser console for errors

---

**Last Updated**: 2026-01-13
**Status**: Ready for Integration
