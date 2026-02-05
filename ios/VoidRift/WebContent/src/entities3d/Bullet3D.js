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

    // Create bullet mesh
    const geometry = GeometryFactory.createBulletGeometry(size);
    const material = MaterialFactory.createBulletMaterial(color);
    
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(x, 0, y);

    // Add point light for glow
    this.light = new THREE.PointLight(color, 0.8, 30);
    this.mesh.add(this.light);

    // Add to scene
    this.renderer3D.addToLayer(this.mesh, 'gameplay');

    this.initialized = true;
  }

  /**
   * Update bullet position
   * @param {number} x - X position
   * @param {number} y - Y position (2D)
   */
  update(x, y) {
    if (!this.initialized) return;

    this.mesh.position.x = x;
    this.mesh.position.z = y;
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
