# VOID RIFT 3D System Usage Guide

## Overview

VOID RIFT now includes a complete 3D rendering system built with Three.js that maintains the original visual aesthetic while adding depth and dimensionality to the gameplay. The 3D system is designed to work alongside the existing 2D renderer with minimal integration effort.

## Quick Start

### Testing the 3D System

1. **Standalone Test Page**:
   ```bash
   npm start
   # Visit http://localhost:5173/test-3d.html
   ```
   
   The test page allows you to:
   - Initialize the 3D renderer
   - Toggle between 2D and 3D modes
   - Spawn test entities (bullets, enemies)
   - Test screen shake effects
   - Monitor FPS and entity counts

### Integration with Main Game

The 3D system can be integrated into the existing game with minimal code changes:

```javascript
// In your game initialization
import { init3DMode, is3DModeActive, update3D, render3D, resize3D } from './game-3d-integration.js';

const canvas = document.getElementById('gameCanvas');

// Initialize 3D rendering
const has3D = init3DMode(canvas);

// In your game loop
function gameLoop() {
  // Update game logic (2D entities)
  updateGame();
  
  // Check if 3D mode is active
  if (is3DModeActive()) {
    // Sync 3D entities with 2D state
    update3D({
      player: player,
      bullets: bullets,
      enemies: enemies,
      shipData: currentShipData,
      boosting: isPlayerBoosting
    });
    
    // Render in 3D
    render3D();
  } else {
    // Fallback to 2D rendering
    drawGame2D();
  }
}

// Handle window resize
window.addEventListener('resize', resize3D);
```

## Architecture

### Core Components

#### 1. **Renderer3D** (`src/renderer/Renderer3D.js`)
Main rendering engine that manages:
- Three.js scene, camera, and lights
- Post-processing effects (bloom for glow)
- Quality settings based on device capabilities
- Camera controls and screen shake

#### 2. **GeometryFactory** (`src/renderer/GeometryFactory.js`)
Creates and caches 3D geometries:
- Ship hulls (spear, needle, brick, razor shapes)
- Bullets, enemies, asteroids
- Coins and collectibles
- Geometry reuse for performance

#### 3. **MaterialFactory** (`src/renderer/MaterialFactory.js`)
Manages materials with:
- Emissive colors for neon glow effect
- Proper metalness and roughness values
- Additive blending for particles
- Material caching

#### 4. **Background3D** (`src/renderer/Background3D.js`)
Multi-layer starfield with:
- 4 depth layers for parallax effect
- Twinkling animation
- Depth-based fog integration

#### 5. **Game3D** (`src/renderer/Game3D.js`)
Coordinator that:
- Manages entity lifecycle (creation/update/disposal)
- Syncs 2D entities to 3D representations
- Handles particle effects
- Provides unified API for game integration

### Entity Classes

All 3D entities follow a common pattern:

```javascript
class Entity3D {
  constructor(params, renderer3D) {
    this.renderer3D = renderer3D;
    this.mesh = null;
    this.initialized = false;
  }
  
  init() { /* Create 3D objects */ }
  update(x, y) { /* Update position */ }
  dispose() { /* Clean up resources */ }
}
```

Available entity types:
- **Ship3D**: Player ship with animated engines
- **Bullet3D**: Projectiles with point light glow
- **Enemy3D**: Rotating enemy models
- **Asteroid3D**: Irregular rotating obstacles
- **Coin3D**: Animated collectibles with bob/spin
- **Particles3D**: Explosion and effect particles

## Visual Aesthetic

### Preserved 2D Style

The 3D system maintains the original visual identity:

1. **Color Schemes**:
   - All original hex colors preserved
   - Emissive materials for neon glow
   - Bloom post-processing for atmospheric glow

2. **Geometry Style**:
   - Low-poly aesthetic
   - Extruded 2D shapes with beveling
   - Clean, angular designs

3. **Lighting**:
   - Point lights on bullets/engines
   - Directional lights for depth
   - Subtle rim lighting for edges

4. **Effects**:
   - Additive blending for particles
   - Screen shake in 3D space
   - Depth fog for atmosphere

### Camera Setup

- **Type**: Orthographic (maintains 2D-like gameplay)
- **Position**: Slightly elevated (0, -200, 600)
- **Angle**: 15-20 degree tilt for depth perception
- **Follow**: Smooth camera following with parallax

## Performance Optimization

### Quality Tiers

The system automatically detects device capabilities and sets quality:

**High** (Desktop, High-end Mobile):
- Full shadows
- Bloom post-processing
- 100% particles
- Higher pixel ratio
- Antialiasing

**Medium** (Mid-range Devices):
- No shadows
- Bloom enabled
- 70% particles
- Medium pixel ratio
- Antialiasing

**Low** (Low-end Mobile):
- No shadows
- No post-processing
- 40% particles
- 1.0 pixel ratio
- No antialiasing

### Best Practices

1. **Object Pooling**: Reuse geometries and materials via factories
2. **Instancing**: Use same geometry for multiple entities
3. **Culling**: Automatic frustum culling by Three.js
4. **LOD**: Can be added for distant objects if needed
5. **Disposal**: Always dispose entities when removed

### Mobile Optimization

- Target: 60 FPS on iPhone 8+
- Lower polygon counts for mobile
- Reduce particle counts on low-tier devices
- Minimize shadow usage
- Use lower pixel ratio on mobile

## API Reference

### Game3D Methods

```javascript
// Initialization
game3D.init() // Returns boolean, true if successful
game3D.setEnabled(true/false) // Toggle 3D mode

// Entity Management
game3D.createPlayerShip(player, shipData)
game3D.updatePlayerShip(player, boosting)
game3D.syncBullets(bullets2DArray)
game3D.syncEnemies(enemies2DArray)
game3D.syncAsteroids(asteroids2DArray)
game3D.syncCoins(coins2DArray)

// Effects
game3D.addParticleEffect({
  x, y,
  count: 20,
  color: '#ffffff',
  lifetime: 1000,
  speed: 2,
  spread: Math.PI * 2,
  size: 3
})
game3D.updateParticles(deltaTime)
game3D.shake(intensity)

// Camera
game3D.updateCamera(player)

// Rendering
game3D.render()
game3D.resize()

// Cleanup
game3D.clearAll()
game3D.dispose()

// Settings
game3D.getQualitySettings()
game3D.setQualitySettings(settings)
```

### Integration API

```javascript
// From game-3d-integration.js
init3DMode(canvas) // Initialize 3D system
toggle3DMode() // Toggle between 2D/3D
is3DModeActive() // Check if 3D is active
update3D(gameState) // Sync entities
render3D() // Render 3D scene
resize3D() // Handle resize
shake3D(intensity) // Screen shake
dispose3D() // Cleanup
get3DQualitySettings() // Get settings
set3DQualitySettings(settings) // Update settings
```

## Coordinate System

### 2D to 3D Mapping

```javascript
// 2D coordinates (x, y)
const entity2D = { x: 100, y: 200 };

// 3D coordinates (x, y, z)
const entity3D = {
  x: entity2D.x,  // Horizontal (left/right)
  y: 0,           // Depth (always 0 for gameplay plane)
  z: entity2D.y   // Vertical (up/down in 2D becomes forward/back in 3D)
};
```

### Z-Layer Organization

- **-1000 to -100**: Deep background (distant stars)
- **-50 to 50**: Gameplay layer (entities, player)
- **50 to 100**: Effects layer (explosions, particles)
- **100+**: UI elements (if needed in 3D space)

## Troubleshooting

### Common Issues

1. **3D Not Initializing**:
   - Check WebGL support: `supportsWebGL()`
   - Check console for errors
   - Verify Three.js is loaded

2. **Low FPS**:
   - Check quality settings
   - Reduce particle counts
   - Disable shadows
   - Lower pixel ratio

3. **Entities Not Appearing**:
   - Verify entity has ID property
   - Check entity is in visible range
   - Ensure update() is being called
   - Check entity hasn't been disposed

4. **Memory Leaks**:
   - Always call dispose() on removed entities
   - Use object pools
   - Check for retained references

### Debug Mode

Enable debug logging:
```javascript
window.__VOID_RIFT_3D__.debug = true;
```

Monitor performance:
```javascript
const settings = game3D.getQualitySettings();
console.log('Quality Tier:', settings);
console.log('FPS:', /* your FPS counter */);
```

## Future Enhancements

Potential additions:
- Dynamic shadows on mobile (quality-gated)
- Advanced particle systems (trails, smoke)
- Camera shake varieties (rotation, zoom)
- LOD system for distant entities
- VR support (stretch goal)
- Custom shaders for unique effects
- 3D audio positioning

## Browser Compatibility

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome 90+ | ✅ Full | Best performance |
| Firefox 88+ | ✅ Full | Good performance |
| Safari 14+ | ✅ Full | iOS optimization needed |
| Edge 90+ | ✅ Full | Chromium-based |
| Mobile Safari | ✅ Full | Target platform |
| Chrome Mobile | ✅ Full | Good performance |

## License

Same as main VOID RIFT project (MIT).

---

**Last Updated**: 2026-01-13
**Version**: 1.0
**Status**: Production Ready
