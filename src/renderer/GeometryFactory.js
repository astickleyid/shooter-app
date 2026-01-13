/**
 * GeometryFactory - Creates and caches 3D geometries for game entities
 */

import * as THREE from 'three';

export class GeometryFactory {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Get or create geometry from cache
   * @param {string} key - Cache key
   * @param {Function} createFn - Function to create geometry if not cached
   * @returns {THREE.BufferGeometry} Geometry
   */
  get(key, createFn) {
    if (!this.cache.has(key)) {
      this.cache.set(key, createFn());
    }
    return this.cache.get(key);
  }

  /**
   * Create ship geometry from 2D shape paths
   * @param {string} shipId - Ship identifier
   * @param {string} shape - Ship shape type
   * @param {number} size - Ship size
   * @returns {THREE.Group} Ship group with multiple meshes
   */
  createShipGeometry(shipId, shape, size) {
    const key = `ship_${shipId}_${size}`;
    return this.get(key, () => {
      const group = new THREE.Group();
      
      // Create main hull based on shape
      const hullGeometry = this.createHullGeometry(shape, size);
      group.add(hullGeometry);
      
      return group;
    });
  }

  /**
   * Create hull geometry based on ship shape
   * @param {string} shape - Ship shape type
   * @param {number} size - Ship size
   * @returns {THREE.Mesh} Hull mesh
   */
  createHullGeometry(shape, size) {
    let geometry;
    
    switch (shape) {
      case 'spear':
        geometry = this.createSpearHull(size);
        break;
      case 'needle':
        geometry = this.createNeedleHull(size);
        break;
      case 'brick':
        geometry = this.createBrickHull(size);
        break;
      case 'razor':
        geometry = this.createRazorHull(size);
        break;
      default:
        geometry = this.createSpearHull(size);
    }
    
    return geometry;
  }

  /**
   * Create spear-shaped hull (triangular, balanced)
   * @param {number} size - Ship size
   * @returns {THREE.BufferGeometry} Geometry
   */
  createSpearHull(size) {
    const shape = new THREE.Shape();
    
    // Front point
    shape.moveTo(size * 1.2, 0);
    // Top edge
    shape.lineTo(size * 0.4, -size * 0.4);
    // Back top
    shape.lineTo(-size * 0.5, -size * 0.35);
    // Back center (engine notch)
    shape.lineTo(-size * 0.6, 0);
    // Back bottom
    shape.lineTo(-size * 0.5, size * 0.35);
    // Bottom edge
    shape.lineTo(size * 0.4, size * 0.4);
    // Close
    shape.lineTo(size * 1.2, 0);
    
    // Extrude the shape to create 3D geometry
    const extrudeSettings = {
      steps: 1,
      depth: size * 0.3,
      bevelEnabled: true,
      bevelThickness: size * 0.05,
      bevelSize: size * 0.05,
      bevelSegments: 2
    };
    
    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  }

  /**
   * Create needle-shaped hull (thin, fast)
   * @param {number} size - Ship size
   * @returns {THREE.BufferGeometry} Geometry
   */
  createNeedleHull(size) {
    const shape = new THREE.Shape();
    
    // Very pointed front
    shape.moveTo(size * 1.3, 0);
    // Thin top edge
    shape.lineTo(size * 0.3, -size * 0.25);
    // Back
    shape.lineTo(-size * 0.6, -size * 0.2);
    shape.lineTo(-size * 0.65, 0);
    shape.lineTo(-size * 0.6, size * 0.2);
    // Thin bottom edge
    shape.lineTo(size * 0.3, size * 0.25);
    shape.lineTo(size * 1.3, 0);
    
    const extrudeSettings = {
      steps: 1,
      depth: size * 0.2,
      bevelEnabled: true,
      bevelThickness: size * 0.03,
      bevelSize: size * 0.03,
      bevelSegments: 1
    };
    
    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  }

  /**
   * Create brick-shaped hull (bulky, armored)
   * @param {number} size - Ship size
   * @returns {THREE.BufferGeometry} Geometry
   */
  createBrickHull(size) {
    const shape = new THREE.Shape();
    
    // Blunt front
    shape.moveTo(size * 0.9, 0);
    shape.lineTo(size * 0.7, -size * 0.5);
    // Flat top
    shape.lineTo(-size * 0.3, -size * 0.5);
    // Back
    shape.lineTo(-size * 0.5, -size * 0.4);
    shape.lineTo(-size * 0.6, 0);
    shape.lineTo(-size * 0.5, size * 0.4);
    // Flat bottom
    shape.lineTo(-size * 0.3, size * 0.5);
    shape.lineTo(size * 0.7, size * 0.5);
    shape.lineTo(size * 0.9, 0);
    
    const extrudeSettings = {
      steps: 1,
      depth: size * 0.5,
      bevelEnabled: true,
      bevelThickness: size * 0.08,
      bevelSize: size * 0.08,
      bevelSegments: 2
    };
    
    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  }

  /**
   * Create razor-shaped hull (aggressive, forward-swept)
   * @param {number} size - Ship size
   * @returns {THREE.BufferGeometry} Geometry
   */
  createRazorHull(size) {
    const shape = new THREE.Shape();
    
    // Sharp front
    shape.moveTo(size * 1.4, 0);
    // Forward-swept top wing
    shape.lineTo(size * 0.5, -size * 0.2);
    shape.lineTo(size * 0.3, -size * 0.7);
    shape.lineTo(-size * 0.4, -size * 0.5);
    // Back
    shape.lineTo(-size * 0.7, 0);
    // Forward-swept bottom wing
    shape.lineTo(-size * 0.4, size * 0.5);
    shape.lineTo(size * 0.3, size * 0.7);
    shape.lineTo(size * 0.5, size * 0.2);
    shape.lineTo(size * 1.4, 0);
    
    const extrudeSettings = {
      steps: 1,
      depth: size * 0.25,
      bevelEnabled: true,
      bevelThickness: size * 0.04,
      bevelSize: size * 0.04,
      bevelSegments: 2
    };
    
    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  }

  /**
   * Create bullet geometry
   * @param {number} size - Bullet size
   * @returns {THREE.BufferGeometry} Geometry
   */
  createBulletGeometry(size) {
    const key = `bullet_${size}`;
    return this.get(key, () => {
      // Simple sphere for bullet
      return new THREE.SphereGeometry(size, 8, 8);
    });
  }

  /**
   * Create enemy geometry
   * @param {number} size - Enemy size
   * @returns {THREE.BufferGeometry} Geometry
   */
  createEnemyGeometry(size) {
    const key = `enemy_${size}`;
    return this.get(key, () => {
      // Octahedron for enemy (diamond shape)
      return new THREE.OctahedronGeometry(size, 0);
    });
  }

  /**
   * Create asteroid geometry
   * @param {number} size - Asteroid size
   * @param {number} seed - Random seed for variation
   * @returns {THREE.BufferGeometry} Geometry
   */
  createAsteroidGeometry(size, seed = 0) {
    const key = `asteroid_${size}_${seed}`;
    return this.get(key, () => {
      // Icosahedron with random deformation for asteroid look
      const geometry = new THREE.IcosahedronGeometry(size, 1);
      
      // Deform vertices for irregular shape
      const positions = geometry.attributes.position;
      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const y = positions.getY(i);
        const z = positions.getZ(i);
        
        // Apply random deformation
        const deform = 1 + (Math.sin(seed + i) * 0.3);
        positions.setXYZ(i, x * deform, y * deform, z * deform);
      }
      
      geometry.computeVertexNormals();
      return geometry;
    });
  }

  /**
   * Create spawner geometry
   * @param {number} size - Spawner size
   * @returns {THREE.BufferGeometry} Geometry
   */
  createSpawnerGeometry(size) {
    const key = `spawner_${size}`;
    return this.get(key, () => {
      // Torus for spawner portal
      return new THREE.TorusGeometry(size * 0.4, size * 0.1, 16, 32);
    });
  }

  /**
   * Create coin geometry
   * @param {number} size - Coin size
   * @returns {THREE.BufferGeometry} Geometry
   */
  createCoinGeometry(size) {
    const key = `coin_${size}`;
    return this.get(key, () => {
      // Cylinder for coin
      return new THREE.CylinderGeometry(size, size, size * 0.2, 16);
    });
  }

  /**
   * Create supply crate geometry
   * @param {number} size - Crate size
   * @returns {THREE.BufferGeometry} Geometry
   */
  createSupplyCrateGeometry(size) {
    const key = `supply_${size}`;
    return this.get(key, () => {
      // Box for supply crate
      return new THREE.BoxGeometry(size, size, size);
    });
  }

  /**
   * Clear all cached geometries
   */
  clearCache() {
    this.cache.forEach(geometry => {
      if (geometry.dispose) {
        geometry.dispose();
      }
    });
    this.cache.clear();
  }
}

export default new GeometryFactory();
