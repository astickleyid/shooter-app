/**
 * Coin3D - 3D representation of coins/collectibles
 */

import * as THREE from 'three';
import GeometryFactory from '../renderer/GeometryFactory.js';
import MaterialFactory from '../renderer/MaterialFactory.js';

export class Coin3D {
  constructor(x, y, renderer3D) {
    this.renderer3D = renderer3D;
    this.mesh = null;
    this.light = null;
    this.initialized = false;
    
    this.init(x, y);
  }

  /**
   * Initialize coin 3D model
   */
  init(x, y) {
    if (this.initialized) return;

    const size = 8;

    // Create coin mesh
    const geometry = GeometryFactory.createCoinGeometry(size);
    const material = MaterialFactory.createCoinMaterial();
    
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(x, 0, y);
    this.mesh.rotation.x = Math.PI / 2; // Lay flat

    // Add point light for glow
    this.light = new THREE.PointLight(0xfbbf24, 0.6, 40);
    this.mesh.add(this.light);

    // Add to scene
    this.renderer3D.addToLayer(this.mesh, 'gameplay');

    this.initialized = true;
  }

  /**
   * Update coin position and animation
   * @param {number} x - X position
   * @param {number} y - Y position (2D)
   * @param {number} time - Current time for animation
   */
  update(x, y, time) {
    if (!this.initialized) return;

    this.mesh.position.x = x;
    this.mesh.position.z = y;

    // Spin animation
    this.mesh.rotation.z += 0.05;
    
    // Bob up and down
    this.mesh.position.y = Math.sin(time * 0.003) * 5;
  }

  /**
   * Get coin position
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
   * Dispose of coin resources
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
