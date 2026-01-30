/**
 * Asteroid3D - 3D representation of asteroids
 */

import * as THREE from 'three';
import GeometryFactory from '../renderer/GeometryFactory.js';
import MaterialFactory from '../renderer/MaterialFactory.js';

export class Asteroid3D {
  constructor(x, y, size, seed, renderer3D) {
    this.renderer3D = renderer3D;
    this.mesh = null;
    this.rotationSpeed = {
      x: (Math.random() - 0.5) * 0.02,
      y: (Math.random() - 0.5) * 0.02,
      z: (Math.random() - 0.5) * 0.02
    };
    this.initialized = false;
    
    this.init(x, y, size, seed);
  }

  /**
   * Initialize asteroid 3D model
   */
  init(x, y, size, seed) {
    if (this.initialized) return;

    const color = '#666666';

    // Create asteroid mesh
    const geometry = GeometryFactory.createAsteroidGeometry(size, seed);
    const material = MaterialFactory.createAsteroidMaterial(color);
    
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(x, 0, y);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;

    // Add to scene
    this.renderer3D.addToLayer(this.mesh, 'gameplay');

    this.initialized = true;
  }

  /**
   * Update asteroid position
   * @param {number} x - X position
   * @param {number} y - Y position (2D)
   */
  update(x, y) {
    if (!this.initialized) return;

    this.mesh.position.x = x;
    this.mesh.position.z = y;

    // Rotate asteroid
    this.mesh.rotation.x += this.rotationSpeed.x;
    this.mesh.rotation.y += this.rotationSpeed.y;
    this.mesh.rotation.z += this.rotationSpeed.z;
  }

  /**
   * Get asteroid position
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
   * Dispose of asteroid resources
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
