# VOID RIFT 3D Conversion Architecture

## Overview

This document outlines the architecture for converting VOID RIFT from 2D Canvas rendering to 3D using Three.js while maintaining the visual aesthetic, performance targets, and code stability.

## Goals

1. **Visual Continuity**: Maintain the neon/cyberpunk aesthetic with glowing elements
2. **Performance**: Target 60 FPS on iPhone 8+ and modern browsers
3. **Code Stability**: Minimal breaking changes to existing game logic
4. **Mobile-First**: Preserve touch controls and mobile optimization
5. **Backward Compatibility**: Option to fallback to 2D rendering

## Technology Stack

### Three.js Selection Rationale
- **Lightweight**: ~600KB minified, suitable for mobile
- **Well-documented**: Extensive documentation and examples
- **Active Community**: Regular updates and strong ecosystem
- **WebGL Abstraction**: Simplifies 3D rendering without raw WebGL complexity
- **Mobile-Friendly**: Good performance on mobile devices

## Architecture Design

### Dual Rendering System

```javascript
// Renderer factory pattern
const Renderer = {
  mode: '3d', // '2d' or '3d'
  current: null,
  
  init() {
    if (this.mode === '3d' && supportsWebGL()) {
      this.current = new Renderer3D();
    } else {
      this.current = new Renderer2D();
    }
  }
}
```

### 3D Coordinate System

- **Z-axis usage**: 
  - Z = 0: Main gameplay plane
  - Z > 0: Objects closer to camera (UI elements, foreground effects)
  - Z < 0: Background elements (stars, distant objects)
  
- **Camera Setup**:
  - Orthographic camera for maintaining 2D-like gameplay
  - OR Perspective camera with high FOV positioned far back
  - Default angle: Top-down with slight tilt (15-20 degrees)

### Scene Structure

```
Scene
├── Background Layer (z: -1000 to -100)
│   ├── Deep Space Stars (z: -1000)
│   ├── Distant Stars (z: -500)
│   ├── Nebulae (z: -300)
│   └── Celestial Bodies (z: -200)
│
├── Gameplay Layer (z: -50 to 50)
│   ├── Obstacles (z: -10 to 10)
│   ├── Spawners (z: 0)
│   ├── Coins & Supply Crates (z: 5)
│   ├── Enemies (z: 10)
│   ├── Bullets (z: 15)
│   ├── Player (z: 20)
│   └── Particles (z: 25 to 30)
│
└── Effects Layer (z: 50 to 100)
    ├── Explosions (z: 50)
    └── Screen Effects (z: 100)
```

## Entity Conversion Strategy

### Ship Geometry Approach

Each ship will be converted from 2D canvas paths to 3D extruded geometry:

1. **Extrusion Method**:
   - Convert 2D shape paths to Three.js Shape objects
   - Use ExtrudeGeometry with small depth (5-8 units)
   - Apply beveling for smooth edges

2. **Material Strategy**:
   ```javascript
   const shipMaterial = new THREE.MeshStandardMaterial({
     color: primaryColor,
     emissive: primaryColor,
     emissiveIntensity: 0.3,
     metalness: 0.8,
     roughness: 0.2
   });
   ```

3. **Composite Ship Model**:
   - Each ship part (hull, wings, engines) as separate meshes
   - Grouped together in THREE.Group
   - Allows individual part animations/effects

### Particle System

Convert 2D particles to 3D:

1. **Points System**:
   ```javascript
   const geometry = new THREE.BufferGeometry();
   const material = new THREE.PointsMaterial({
     size: 2,
     vertexColors: true,
     transparent: true,
     blending: THREE.AdditiveBlending
   });
   ```

2. **Sprite-based Particles** (for complex shapes):
   - Use THREE.Sprite for textured particles
   - Better for explosions and detailed effects

### Bullet Conversion

```javascript
// Simple bullet: SphereGeometry or CylinderGeometry
const bulletGeometry = new THREE.SphereGeometry(radius, 8, 8);
const bulletMaterial = new THREE.MeshBasicMaterial({
  color: bulletColor,
  emissive: bulletColor,
  emissiveIntensity: 0.8
});

// Add glow effect with PointLight
const glowLight = new THREE.PointLight(bulletColor, 0.5, 50);
bulletMesh.add(glowLight);
```

## Visual Aesthetic Preservation

### Neon/Glow Effects

1. **Bloom Post-Processing**:
   ```javascript
   const bloomPass = new UnrealBloomPass(
     new THREE.Vector2(window.innerWidth, window.innerHeight),
     1.5,  // strength
     0.4,  // radius
     0.85  // threshold
   );
   ```

2. **Emissive Materials**:
   - All glowing elements use emissive colors
   - Bloom pass enhances emissive materials

3. **Point Lights**:
   - Attach small point lights to bullets, engines, effects
   - Dynamic lighting for atmosphere

### Color Scheme Mapping

Existing 2D colors map directly to 3D materials:
- `#4ade80` (green) → emissive green material
- `#0ea5e9` (blue) → emissive blue material
- Maintain exact hex values for brand consistency

### Depth Fog

```javascript
scene.fog = new THREE.Fog(0x030712, 500, 2000);
```
- Matches 2D background color
- Creates depth and atmosphere
- Fades distant objects naturally

## Performance Optimization

### Mobile-First Strategies

1. **Geometry Optimization**:
   - Low-poly models (< 500 triangles per entity)
   - Reuse geometries with instancing
   - Object pooling for bullets/particles

2. **Texture Management**:
   - Minimize texture usage (prefer vertex colors)
   - Use texture atlases for multiple objects
   - Power-of-2 dimensions for efficiency

3. **Render Optimization**:
   - Frustum culling (automatic in Three.js)
   - Layer-based rendering
   - Reduce shadow quality on mobile

4. **LOD System** (if needed):
   ```javascript
   const lod = new THREE.LOD();
   lod.addLevel(highDetailMesh, 0);
   lod.addLevel(mediumDetailMesh, 200);
   lod.addLevel(lowDetailMesh, 500);
   ```

### Performance Targets

- **Desktop**: 60 FPS @ 1920x1080
- **Mobile (iPhone 8+)**: 60 FPS @ device resolution
- **Low-end Mobile**: 30 FPS minimum with quality reduction

### Quality Settings

```javascript
const qualitySettings = {
  high: {
    shadows: true,
    postProcessing: true,
    particleCount: 1.0,
    maxLights: 10
  },
  medium: {
    shadows: false,
    postProcessing: true,
    particleCount: 0.7,
    maxLights: 6
  },
  low: {
    shadows: false,
    postProcessing: false,
    particleCount: 0.4,
    maxLights: 3
  }
};
```

## Implementation Phases

### Phase 1: Foundation (Week 1)
- Install Three.js
- Create Renderer3D class
- Set up basic scene, camera, lights
- Implement simple 3D test object

### Phase 2: Core Entities (Week 2)
- Convert player ship
- Convert bullets
- Convert basic enemy
- Test gameplay loop

### Phase 3: Complete Entities (Week 3)
- Convert all enemy types
- Convert obstacles (asteroids, etc.)
- Convert spawners
- Convert collectibles

### Phase 4: Effects & Polish (Week 4)
- Particle system
- Explosions
- Post-processing
- Visual polish

### Phase 5: Testing & Optimization (Week 5)
- Performance profiling
- Mobile testing
- Cross-browser testing
- Bug fixes

## Code Structure

### New Files

```
shooter-app/
├── src/
│   ├── renderer/
│   │   ├── Renderer3D.js       # Main 3D renderer class
│   │   ├── Renderer2D.js       # Existing 2D renderer wrapper
│   │   ├── SceneManager.js     # 3D scene setup and management
│   │   ├── MaterialFactory.js  # Material creation and caching
│   │   └── GeometryFactory.js  # Geometry creation and caching
│   ├── entities3d/
│   │   ├── Ship3D.js           # 3D ship entity
│   │   ├── Bullet3D.js         # 3D bullet entity
│   │   ├── Enemy3D.js          # 3D enemy entity
│   │   └── Particle3D.js       # 3D particle system
│   └── utils/
│       └── webgl.js            # WebGL detection and capabilities
├── libs/
│   └── three.module.js         # Three.js ES6 module
└── docs/
    └── 3D_CONVERSION.md        # This document
```

### Integration Points

1. **Main Game Loop**:
   ```javascript
   // In drawGame()
   if (renderer.mode === '3d') {
     renderer3D.render(scene, camera);
   } else {
     // existing 2D rendering
   }
   ```

2. **Entity Update**:
   ```javascript
   // Entities maintain x, y, rotation
   // 3D renderer maps to x, 0 (or y*scale), z
   ```

3. **Collision Detection**:
   - Keep 2D collision detection (x, y plane)
   - Z-axis used only for visual layering

## Testing Strategy

### Unit Tests
- Geometry creation functions
- Material factory
- Coordinate conversion
- WebGL detection

### Integration Tests
- Renderer switching (2D ↔ 3D)
- Entity rendering in 3D
- Performance benchmarks

### Manual Testing
- All ship types in 3D
- All weapon types in 3D
- All game modes
- Mobile device testing
- Browser compatibility

## Rollout Strategy

1. **Feature Flag**: Add `enable3D` setting
2. **Beta Testing**: Enable for opt-in users
3. **Performance Monitoring**: Track FPS, load times
4. **Gradual Rollout**: Enable by default if metrics good
5. **Fallback**: Keep 2D as option in settings

## Risk Mitigation

### Potential Issues

1. **Performance on Low-End Devices**:
   - Mitigation: Quality settings + 2D fallback
   
2. **iOS WKWebView Limitations**:
   - Mitigation: Test early, optimize for WebKit
   
3. **File Size Increase**:
   - Mitigation: Use Three.js modules (tree-shaking)
   
4. **Breaking Existing Code**:
   - Mitigation: Abstraction layer, comprehensive testing

## Success Metrics

1. **Performance**: 95% of devices achieve target FPS
2. **User Satisfaction**: Positive feedback on 3D visuals
3. **Stability**: No increase in crash rate
4. **Adoption**: 80%+ users prefer 3D mode
5. **Mobile Performance**: 60 FPS on iPhone 8+

## Future Enhancements

After initial 3D conversion:
- Camera shake in 3D space
- Dynamic shadows
- Advanced particle effects
- 3D audio positioning
- VR/AR support (stretch goal)

---

**Document Version**: 1.0  
**Last Updated**: 2026-01-13  
**Status**: Planning Phase
