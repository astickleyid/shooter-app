# Ship Visual and Systems Enhancements

This document describes the major enhancements made to the VOID RIFT ship systems, visuals, and mechanics.

## Enhanced Ship Visuals

### New Ship Geometries
Three new ship hull geometries have been added to support existing ship types:

1. **Bastion Hull** (`createBastionHull`)
   - Heavy tank design with thick armor plating
   - Wide profile with reinforced structure
   - Used by: Bulwark-7

2. **Dart Hull** (`createDartHull`)
   - Sleek, streamlined interceptor design
   - Very aerodynamic with minimal cross-section
   - Used by: Spectre-9

3. **Fortress Hull** (`createFortressHull`)
   - Massive capital ship design
   - Imposing structure with heavy weapon mounts
   - Used by: Titan Heavy

### Ship Detail Enhancements
All ships now feature:

- **Cockpit/Canopy**: Transparent glass dome with realistic material
  - Uses `MeshPhysicalMaterial` with transmission for glass effect
  - Positioned at front of ship for pilot visibility

- **Weapon Hardpoints**: Visible gun barrels/emitters
  - Metallic cylinders positioned on ship sides
  - Serve as visual anchor points for muzzle flashes

- **Hull Detailing**: Panel lines and trim
  - Ventral and dorsal panel stripes
  - Color-coded using ship's trim color

## Enhanced Weapons Systems

### Muzzle Flash Effects
- Weapon fire triggers visual muzzle flashes
- Color-coded by weapon type:
  - Pulse Blaster: Yellow (`#fde047`)
  - Scatter Coil: Amber (`#fbbf24`)
  - Rail Lance: Purple (`#a855f7`)
  - Ion Burst: Cyan (`#38bdf8`)
  - Plasma Cutter: Green (`#4ade80`)
  - Photon Repeater: Pink (`#f0abfc`)

- Flashes emit from weapon hardpoints
- Additive blending for bright glow effect
- Fade animation over 6 frames

### Enhanced Bullet Visuals
- **Elongated Projectiles**: Bullets use cylindrical geometry instead of spheres
- **Trail Effects**: Line-based trails fade behind bullets
- **Orientation**: Bullets rotate to face direction of travel
- **Enhanced Glow**: Stronger point lights (1.2 intensity, 40 unit range)
- **Better Materials**: Emissive materials with metalness and transparency

## Improved Flying Mechanics

### Inertia-Based Movement
Ships now feature realistic physics:

- **Gradual Acceleration**: 25% acceleration rate towards target velocity
  ```javascript
  this.actualVel.x += (targetVelX - this.actualVel.x) * 0.25;
  ```

- **Smooth Deceleration**: 15% deceleration when no input
  ```javascript
  this.actualVel.x *= (1 - 0.15);
  ```

- **Momentum Preservation**: Ships continue moving when input stops
- **Separate Velocity Tracking**: `actualVel` for physics, `vel` for direction

### Ship Banking and Tilting
3D ships now react to movement:

- **Banking**: Ships tilt left/right based on horizontal velocity
  - Max bank angle: ±0.3 radians (±17°)
  - Proportional to velocity: `bankAmount = velocity.x * 0.15`

- **Pitching**: Ships pitch up/down based on vertical velocity
  - Max pitch angle: ±0.2 radians (±11°)
  - Proportional to velocity: `pitchAmount = velocity.y * 0.1`

- **Visual Feedback**: Creates more dynamic, realistic ship movement
- **3D Only**: Banking/tilting applied in `Ship3D.update()` method

## New Ship Categories

### 1. Wraith Stealth (Stealth Interceptor)
```javascript
{
  id: 'wraith',
  name: 'Wraith Stealth',
  category: 'stealth',
  special: 'cloaking',
  shape: 'dart'
}
```

**Stats Profile**:
- HP: 0.7x (fragile)
- Speed: 1.45x (very fast)
- Boost: 1.55x (extreme speed)
- Damage: 1.15x (enhanced)
- Fire Rate: 0.8x (faster)

**Unique Mechanic**: Cloaking field (framework in place)
- Hit-and-run tactics
- Enhanced sensors
- Stealth reconnaissance

### 2. Devastator Bomber (Heavy Bomber)
```javascript
{
  id: 'devastator',
  name: 'Devastator Bomber',
  category: 'bomber',
  special: 'areaWeapons',
  shape: 'fortress'
}
```

**Stats Profile**:
- HP: 1.75x (very durable)
- Speed: 0.65x (slow)
- Boost: 0.7x (minimal boost)
- Damage: 1.5x (devastating)
- Ammo: 1.6x (large capacity)

**Unique Mechanic**: Area weapons (framework in place)
- Maximum destruction focus
- Heavy bomber platform
- Siege capabilities

### 3. Nexus Carrier (Support Carrier)
```javascript
{
  id: 'nexus',
  name: 'Nexus Carrier',
  category: 'support',
  special: 'drones',
  shape: 'bastion'
}
```

**Stats Profile**:
- HP: 1.4x (durable)
- Speed: 0.82x (moderate)
- Damage: 0.95x (balanced)
- Pickup Range: 1.15x (enhanced)
- Ammo Regen: 0.9x (good sustain)

**Unique Mechanic**: Drone deployment (framework in place)
- Autonomous combat drones
- Shield generators
- Support abilities

## Technical Implementation

### GeometryFactory Updates
- Added `createBastionHull()`, `createDartHull()`, `createFortressHull()`
- Each uses `ExtrudeGeometry` with custom 2D shapes
- Multiple geometry components merged with `BufferGeometryUtils.mergeGeometries()`

### Ship3D Enhancements
```javascript
class Ship3D {
  constructor() {
    // New properties
    this.weaponMounts = [];
    this.cockpit = null;
    this.engineTrails = [];
  }
  
  // New methods
  createCockpit(size, color)
  createWeaponHardpoints(size, color)
  addHullDetails(size, color)
  showMuzzleFlash(weaponType)
}
```

### MaterialFactory Additions
- `createBulletMaterial()`: Enhanced bullet materials with glow
- Existing materials work with new geometries

### Game3D Integration
- `updatePlayerShip()` now passes velocity for banking
- `triggerWeaponFire()` triggers muzzle flash effects
- `syncBullets()` passes velocity for bullet orientation

### Movement Physics (script.js)
```javascript
class PlayerEntity {
  constructor() {
    this.actualVel = { x: 0, y: 0 }; // Physics velocity
  }
  
  update(dt) {
    // Inertia-based movement
    const acceleration = 0.25;
    this.actualVel.x += (targetVelX - this.actualVel.x) * acceleration;
    this.x += this.actualVel.x;
  }
}
```

## Configuration Updates

All new ships added to `SHIP_TEMPLATES` in `config.js`:
- 9 total ships (6 original + 3 new)
- Each with complete stats, colors, and special mechanics
- Framework in place for special abilities

## Future Enhancements

### Ready for Implementation
1. **Cloaking System**: Framework exists in Wraith ship config
2. **Drone System**: Framework exists in Nexus ship config  
3. **Area Weapons**: Framework exists in Devastator ship config
4. **Flight Stabilization**: Toggle for assisted vs manual flight
5. **Weapon Sound Integration**: Trigger sounds on `triggerWeaponFire()`

### Visual Improvements
- Engine particle trails (more visible contrails)
- Weapon charging indicators (visual buildup before fire)
- Shield visualization (when defense abilities active)
- Damage states (hull cracks, sparks at low HP)

## Files Modified

### Core Changes
- `src/renderer/GeometryFactory.js`: New hull geometries
- `src/entities3d/Ship3D.js`: Visual details and effects
- `src/renderer/Game3D.js`: Integration with game loop
- `src/renderer/MaterialFactory.js`: New bullet materials
- `src/entities3d/Bullet3D.js`: Enhanced bullets with trails
- `script.js`: Inertia-based movement physics
- `src/core/config.js`: New ship templates

### iOS Sync
All changes synchronized to `ios/VoidRift/WebContent/`

## Testing

All existing tests pass:
- ✅ Game utilities tests
- ✅ Game configuration tests
- ✅ Leaderboard API tests
- ✅ No lint errors (only pre-existing warnings)

## Performance Considerations

### Optimizations Applied
- Geometry caching in `GeometryFactory`
- Material caching in `MaterialFactory`
- Muzzle flash cleanup (disposed after fade)
- Trail geometry reused (vertex update vs recreation)

### Performance Impact
- **Minimal**: New geometries cached on creation
- **Low**: Muzzle flashes are temporary (< 0.1s lifetime)
- **Negligible**: Bullet trails use single line geometry
- **Positive**: Inertia physics more realistic, no extra computations

## Summary

These enhancements significantly improve VOID RIFT's visual quality and gameplay feel:

1. **More Detailed Ships**: Cockpits, weapons, hull details
2. **Better Combat Feedback**: Muzzle flashes and bullet trails
3. **Realistic Flight**: Inertia and ship banking
4. **More Variety**: 3 new ship categories with unique roles
5. **Framework for Future**: Special abilities ready for implementation

The changes maintain the mobile-first focus with efficient rendering and maintain 60 FPS target on iPhone 8+.
