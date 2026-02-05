/**
 * Ship3D - 3D representation of player ship
 */

import * as THREE from 'three';
import GeometryFactory from '../renderer/GeometryFactory.js';
import MaterialFactory from '../renderer/MaterialFactory.js';

export class Ship3D {
  constructor(shipData, renderer3D) {
    this.renderer3D = renderer3D;
    this.shipData = shipData;
    this.group = new THREE.Group();
    this.engines = [];
    this.weaponMounts = [];
    this.cockpit = null;
    this.engineTrails = [];
    this.initialized = false;
  }

  /**
   * Initialize ship 3D model
   */
  init() {
    if (this.initialized) return;

    const { shape, scale, colors } = this.shipData;
    const size = 16 * scale;

    // Create hull
    const hullGeometry = GeometryFactory.createHullGeometry(shape, size);
    const hullMaterial = MaterialFactory.createShipMaterial(
      colors.primary,
      colors.accent
    );
    
    const hull = new THREE.Mesh(hullGeometry, hullMaterial);
    hull.castShadow = true;
    hull.receiveShadow = true;
    this.group.add(hull);

    // Create cockpit/canopy
    this.createCockpit(size, colors.canopy);

    // Create weapon hardpoints
    this.createWeaponHardpoints(size, colors.accent);

    // Create engine glows with trails
    this.createEngines(size, colors.thruster);

    // Add panel detailing
    this.addHullDetails(size, colors.trim);

    // Add to scene
    this.renderer3D.addToLayer(this.group, 'gameplay');
    
    this.initialized = true;
  }

  /**
   * Create engine glow effects
   * @param {number} size - Ship size
   * @param {string} color - Engine color
   */
  createEngines(size, color) {
    const engineGeometry = new THREE.SphereGeometry(size * 0.15, 8, 8);
    const engineMaterial = MaterialFactory.createEngineGlowMaterial(color);

    // Position engines at the back
    const enginePositions = [
      { x: -size * 0.5, y: 0, z: -size * 0.3 },
      { x: -size * 0.5, y: 0, z: size * 0.3 }
    ];

    enginePositions.forEach(pos => {
      const engine = new THREE.Mesh(engineGeometry, engineMaterial);
      engine.position.set(pos.x, pos.y, pos.z);
      
      // Add point light for engine glow
      const light = new THREE.PointLight(color, 0.5, 50);
      light.position.copy(engine.position);
      this.group.add(light);
      
      this.group.add(engine);
      this.engines.push({ mesh: engine, light: light });
    });
  }

  /**
   * Create cockpit/canopy with transparent glass material
   * @param {number} size - Ship size
   * @param {string} color - Canopy color
   */
  createCockpit(size, color) {
    // Create cockpit dome
    const cockpitGeometry = new THREE.SphereGeometry(size * 0.2, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    const cockpitMaterial = new THREE.MeshPhysicalMaterial({
      color: color,
      transparent: true,
      opacity: 0.6,
      metalness: 0.1,
      roughness: 0.1,
      transmission: 0.8,
      thickness: 0.5
    });
    
    this.cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
    this.cockpit.position.set(size * 0.3, size * 0.15, 0);
    this.cockpit.rotation.z = Math.PI / 2;
    this.group.add(this.cockpit);
  }

  /**
   * Create weapon hardpoints/gun barrels
   * @param {number} size - Ship size
   * @param {string} color - Weapon mount color
   */
  createWeaponHardpoints(size, color) {
    const barrelGeometry = new THREE.CylinderGeometry(size * 0.04, size * 0.05, size * 0.4, 8);
    const barrelMaterial = new THREE.MeshStandardMaterial({
      color: color,
      metalness: 0.9,
      roughness: 0.3
    });

    // Position weapon barrels on sides
    const mountPositions = [
      { x: size * 0.6, y: 0, z: -size * 0.35, rotation: Math.PI / 2 },
      { x: size * 0.6, y: 0, z: size * 0.35, rotation: Math.PI / 2 }
    ];

    mountPositions.forEach(pos => {
      const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
      barrel.position.set(pos.x, pos.y, pos.z);
      barrel.rotation.z = pos.rotation;
      this.group.add(barrel);
      this.weaponMounts.push(barrel);
    });
  }

  /**
   * Add hull detailing (panels, vents, markings)
   * @param {number} size - Ship size
   * @param {string} color - Detail color
   */
  addHullDetails(size, color) {
    // Add panel lines
    const panelGeometry = new THREE.BoxGeometry(size * 0.8, size * 0.02, size * 0.02);
    const panelMaterial = new THREE.MeshStandardMaterial({
      color: color,
      metalness: 0.5,
      roughness: 0.5
    });

    // Add ventral panel stripe
    const panel = new THREE.Mesh(panelGeometry, panelMaterial);
    panel.position.set(0, -size * 0.08, 0);
    this.group.add(panel);

    // Add dorsal panel stripe
    const panel2 = new THREE.Mesh(panelGeometry, panelMaterial);
    panel2.position.set(0, size * 0.08, 0);
    this.group.add(panel2);
  }

  /**
   * Update ship position and rotation
   * @param {number} x - X position
   * @param {number} y - Y position (2D)
   * @param {number} rotation - Rotation angle
   * @param {Object} velocity - Optional velocity object for banking effect
   */
  update(x, y, rotation, velocity = null) {
    if (!this.initialized) return;

    // Map 2D coordinates to 3D
    this.group.position.x = x;
    this.group.position.y = 0;
    this.group.position.z = y;

    // Apply rotation (convert from 2D rotation)
    this.group.rotation.z = -rotation;

    // Add banking effect based on velocity
    if (velocity) {
      // Bank left/right based on horizontal velocity
      const bankAmount = velocity.x * 0.15;
      this.group.rotation.y = THREE.MathUtils.clamp(bankAmount, -0.3, 0.3);

      // Pitch up/down based on vertical velocity
      const pitchAmount = velocity.y * 0.1;
      this.group.rotation.x = THREE.MathUtils.clamp(pitchAmount, -0.2, 0.2);
    }
  }

  /**
   * Animate engines (pulsing effect)
   * @param {number} time - Current time
   * @param {boolean} boosting - Whether ship is boosting
   */
  animateEngines(time, boosting = false) {
    if (!this.initialized) return;

    const pulseSpeed = boosting ? 0.01 : 0.005;
    const pulseIntensity = boosting ? 1.5 : 1.0;
    
    this.engines.forEach((engine, index) => {
      const phase = time * pulseSpeed + index * Math.PI;
      const intensity = (Math.sin(phase) * 0.3 + 0.7) * pulseIntensity;
      
      // Pulse engine brightness
      if (engine.light) {
        engine.light.intensity = 0.5 * intensity;
      }
      
      // Pulse engine size
      const scale = 0.8 + (intensity - 0.7) * 0.5;
      engine.mesh.scale.set(scale, scale, scale);
    });
  }

  /**
   * Set boost visual effect
   * @param {boolean} boosting - Whether ship is boosting
   */
  setBoosting(boosting) {
    if (!this.initialized) return;

    this.engines.forEach(engine => {
      if (engine.light) {
        engine.light.intensity = boosting ? 1.5 : 0.5;
      }
    });
  }

  /**
   * Show damage effect
   */
  showDamage() {
    if (!this.initialized) return;

    // Flash red briefly
    const hull = this.group.children[0];
    if (hull && hull.material) {
      const originalColor = hull.material.color.clone();
      hull.material.color.setHex(0xff0000);
      
      setTimeout(() => {
        hull.material.color.copy(originalColor);
      }, 100);
    }
  }

  /**
   * Show muzzle flash effect when weapons fire
   * @param {string} weaponType - Type of weapon firing
   */
  showMuzzleFlash(weaponType = 'primary') {
    if (!this.initialized || this.weaponMounts.length === 0) return;

    // Create muzzle flash effect on weapon barrels
    this.weaponMounts.forEach((barrel, index) => {
      const flashGeometry = new THREE.SphereGeometry(this.shipData.scale * 3, 8, 8);
      const flashColor = this.getWeaponFlashColor(weaponType);
      const flashMaterial = new THREE.MeshBasicMaterial({
        color: flashColor,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending
      });
      
      const flash = new THREE.Mesh(flashGeometry, flashMaterial);
      flash.position.copy(barrel.position);
      flash.position.x += this.shipData.scale * 8; // In front of barrel
      this.group.add(flash);

      // Animate and remove flash
      let opacity = 0.9;
      const fadeFlash = () => {
        opacity -= 0.15;
        flash.material.opacity = opacity;
        if (opacity > 0) {
          requestAnimationFrame(fadeFlash);
        } else {
          this.group.remove(flash);
          flash.geometry.dispose();
          flash.material.dispose();
        }
      };
      fadeFlash();
    });
  }

  /**
   * Get weapon flash color based on weapon type
   * @param {string} weaponType - Type of weapon
   * @returns {number} Color hex
   */
  getWeaponFlashColor(weaponType) {
    const colors = {
      pulse: 0xfde047,
      scatter: 0xfbbf24,
      rail: 0xa855f7,
      ionburst: 0x38bdf8,
      plasma: 0x4ade80,
      photon: 0xf0abfc,
      primary: 0xfde047
    };
    return colors[weaponType] || colors.primary;
  }
    return this.group.position.clone();
  }

  /**
   * Dispose of ship resources
   */
  dispose() {
    if (!this.initialized) return;

    this.renderer3D.removeFromScene(this.group);
    
    this.group.traverse((object) => {
      if (object.geometry) {
        object.geometry.dispose();
      }
      if (object.material) {
        object.material.dispose();
      }
    });

    this.initialized = false;
  }
}
