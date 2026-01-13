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

    // Create engine glows
    this.createEngines(size, colors.thruster);

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
   * Update ship position and rotation
   * @param {number} x - X position
   * @param {number} y - Y position (2D)
   * @param {number} rotation - Rotation angle
   */
  update(x, y, rotation) {
    if (!this.initialized) return;

    // Map 2D coordinates to 3D
    this.group.position.x = x;
    this.group.position.y = 0;
    this.group.position.z = y;

    // Apply rotation (convert from 2D rotation)
    this.group.rotation.z = -rotation;
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
   * Get ship position
   * @returns {THREE.Vector3} Position
   */
  getPosition() {
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
