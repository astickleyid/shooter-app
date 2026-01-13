/**
 * Enemy3D - 3D representation of enemies
 */

import * as THREE from 'three';
import GeometryFactory from '../renderer/GeometryFactory.js';
import MaterialFactory from '../renderer/MaterialFactory.js';

export class Enemy3D {
  constructor(x, y, renderer3D) {
    this.renderer3D = renderer3D;
    this.mesh = null;
    this.light = null;
    this.initialized = false;
    
    this.init(x, y);
  }

  /**
   * Initialize enemy 3D model
   */
  init(x, y) {
    if (this.initialized) return;

    const size = 12;
    const color = '#ef4444';

    // Create enemy mesh
    const geometry = GeometryFactory.createEnemyGeometry(size);
    const material = MaterialFactory.createEnemyMaterial(color);
    
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(x, 0, y);
    this.mesh.castShadow = true;

    // Add point light
    this.light = new THREE.PointLight(color, 0.5, 40);
    this.mesh.add(this.light);

    // Add to scene
    this.renderer3D.addToLayer(this.mesh, 'gameplay');

    this.initialized = true;
  }

  /**
   * Update enemy position and rotation
   * @param {number} x - X position
   * @param {number} y - Y position (2D)
   */
  update(x, y) {
    if (!this.initialized) return;

    this.mesh.position.x = x;
    this.mesh.position.z = y;

    // Rotate enemy for visual interest
    this.mesh.rotation.x += 0.01;
    this.mesh.rotation.y += 0.02;
  }

  /**
   * Show damage effect
   */
  showDamage() {
    if (!this.initialized) return;

    // Flash white briefly
    if (this.mesh.material) {
      const originalEmissive = this.mesh.material.emissive.clone();
      this.mesh.material.emissive.setHex(0xffffff);
      
      setTimeout(() => {
        if (this.mesh.material) {
          this.mesh.material.emissive.copy(originalEmissive);
        }
      }, 50);
    }
  }

  /**
   * Get enemy position
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
   * Dispose of enemy resources
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
