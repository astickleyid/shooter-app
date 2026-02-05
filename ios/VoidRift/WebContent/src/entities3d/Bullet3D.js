/**
 * Bullet3D - 3D representation of bullets
 */

import * as THREE from 'three';
import GeometryFactory from '../renderer/GeometryFactory.js';
import MaterialFactory from '../renderer/MaterialFactory.js';

export class Bullet3D {
  constructor(x, y, color, renderer3D) {
    this.renderer3D = renderer3D;
    this.mesh = null;
    this.light = null;
    this.trail = null;
    this.initialized = false;
    
    this.init(x, y, color);
  }

  /**
   * Initialize bullet 3D model
   */
  init(x, y, color) {
    if (this.initialized) return;

    const size = 4;

    // Create bullet mesh - elongated for better projectile look
    const geometry = new THREE.CylinderGeometry(size * 0.3, size * 0.4, size * 2, 8);
    geometry.rotateZ(Math.PI / 2); // Orient horizontally
    const material = MaterialFactory.createBulletMaterial(color);
    
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(x, 0, y);

    // Add point light for glow with bloom effect
    this.light = new THREE.PointLight(color, 1.2, 40);
    this.mesh.add(this.light);

    // Create trail effect using line geometry
    const trailLength = 8;
    const trailGeometry = new THREE.BufferGeometry();
    const trailPositions = new Float32Array(trailLength * 3);
    for (let i = 0; i < trailLength; i++) {
      trailPositions[i * 3] = x;
      trailPositions[i * 3 + 1] = 0;
      trailPositions[i * 3 + 2] = y;
    }
    trailGeometry.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
    
    const trailMaterial = new THREE.LineBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.6,
      linewidth: 2
    });
    
    this.trail = new THREE.Line(trailGeometry, trailMaterial);
    this.renderer3D.addToLayer(this.trail, 'gameplay');

    // Add to scene
    this.renderer3D.addToLayer(this.mesh, 'gameplay');

    this.initialized = true;
  }

  /**
   * Update bullet position
   * @param {number} x - X position
   * @param {number} y - Y position (2D)
   * @param {number} vx - X velocity (for rotation)
   * @param {number} vy - Y velocity (for rotation)
   */
  update(x, y, vx = 0, vy = 0) {
    if (!this.initialized) return;

    // Update main bullet position
    this.mesh.position.x = x;
    this.mesh.position.z = y;

    // Rotate bullet to face direction of travel
    if (vx !== 0 || vy !== 0) {
      const angle = Math.atan2(vy, vx);
      this.mesh.rotation.y = -angle;
    }

    // Update trail positions (fade trail behind bullet)
    if (this.trail) {
      const positions = this.trail.geometry.attributes.position.array;
      // Shift trail positions back
      for (let i = positions.length - 3; i >= 3; i -= 3) {
        positions[i] = positions[i - 3];
        positions[i + 1] = positions[i - 2];
        positions[i + 2] = positions[i - 1];
      }
      // Set new front position
      positions[0] = x;
      positions[1] = 0;
      positions[2] = y;
      this.trail.geometry.attributes.position.needsUpdate = true;
    }
  }

  /**
   * Get bullet position
   * @returns {object} Position {x, y}
   */
  getPosition() {
    if (!this.initialized) return { x: 0, y: 0 };
    return {
      x: this.mesh.position.x,
      y: this.mesh.position.z
    };
  }

  /**
   * Dispose of bullet resources
   */
  dispose() {
    if (!this.initialized) return;

    this.renderer3D.removeFromScene(this.mesh);
    
    if (this.trail) {
      this.renderer3D.removeFromScene(this.trail);
      if (this.trail.geometry) {
        this.trail.geometry.dispose();
      }
      if (this.trail.material) {
        this.trail.material.dispose();
      }
    }
    
    if (this.mesh) {
      if (this.mesh.geometry) {
        this.mesh.geometry.dispose();
      }
      if (this.mesh.material) {
        this.mesh.material.dispose();
      }
    }

    this.initialized = false;
  }
}
