/**
 * GeometryFactory - Creates and caches 3D geometries for game entities
 */

import * as THREE from 'three';
import { BufferGeometryUtils } from 'three/addons/utils/BufferGeometryUtils.js';

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
      case 'bastion':
        geometry = this.createBastionHull(size);
        break;
      case 'dart':
        geometry = this.createDartHull(size);
        break;
      case 'fortress':
        geometry = this.createFortressHull(size);
        break;
      default:
        geometry = this.createSpearHull(size);
    }
    
    return geometry;
  }

  /**
   * Create spear-shaped hull (triangular, balanced fighter)
   * Enhanced with more detail and realistic proportions
   * @param {number} size - Ship size
   * @returns {THREE.BufferGeometry} Geometry
   */
  createSpearHull(size) {
    const group = new THREE.Group();
    
    // Main fuselage body
    const bodyShape = new THREE.Shape();
    bodyShape.moveTo(size * 1.3, 0);
    bodyShape.lineTo(size * 0.5, -size * 0.4);
    bodyShape.lineTo(-size * 0.4, -size * 0.38);
    bodyShape.lineTo(-size * 0.7, -size * 0.25);
    bodyShape.lineTo(-size * 0.8, 0);
    bodyShape.lineTo(-size * 0.7, size * 0.25);
    bodyShape.lineTo(-size * 0.4, size * 0.38);
    bodyShape.lineTo(size * 0.5, size * 0.4);
    bodyShape.lineTo(size * 1.3, 0);
    
    const bodyExtrudeSettings = {
      steps: 2,
      depth: size * 0.35,
      bevelEnabled: true,
      bevelThickness: size * 0.06,
      bevelSize: size * 0.06,
      bevelSegments: 3
    };
    
    const bodyGeometry = new THREE.ExtrudeGeometry(bodyShape, bodyExtrudeSettings);
    bodyGeometry.center();
    
    // Swept wings
    const wingShape = new THREE.Shape();
    wingShape.moveTo(size * 0.2, -size * 0.4);
    wingShape.lineTo(-size * 0.2, -size * 1.2);
    wingShape.lineTo(-size * 0.8, -size * 1.0);
    wingShape.lineTo(-size * 0.5, -size * 0.35);
    wingShape.lineTo(size * 0.2, -size * 0.4);
    
    const wingExtrudeSettings = {
      steps: 1,
      depth: size * 0.15,
      bevelEnabled: true,
      bevelThickness: size * 0.03,
      bevelSize: size * 0.03,
      bevelSegments: 2
    };
    
    const wingGeometry = new THREE.ExtrudeGeometry(wingShape, wingExtrudeSettings);
    wingGeometry.center();
    const wingGeometry2 = wingGeometry.clone();
    wingGeometry2.scale(1, -1, 1); // Mirror for bottom wing
    
    // Combine all geometries
    const geometries = [bodyGeometry, wingGeometry, wingGeometry2];
    const mergedGeometry = BufferGeometryUtils.mergeGeometries(geometries);
    
    return mergedGeometry;
  }

  /**
   * Create needle-shaped hull (thin, fast interceptor)
   * Enhanced with sleek aerodynamic profile
   * @param {number} size - Ship size
   * @returns {THREE.BufferGeometry} Geometry
   */
  createNeedleHull(size) {
    const bodyShape = new THREE.Shape();
    
    // Ultra-sleek pointed design
    bodyShape.moveTo(size * 1.4, 0);
    bodyShape.quadraticCurveTo(size * 0.8, -size * 0.15, size * 0.3, -size * 0.28);
    bodyShape.lineTo(-size * 0.5, -size * 0.24);
    bodyShape.lineTo(-size * 0.7, -size * 0.18);
    bodyShape.lineTo(-size * 0.75, 0);
    bodyShape.lineTo(-size * 0.7, size * 0.18);
    bodyShape.lineTo(-size * 0.5, size * 0.24);
    bodyShape.lineTo(size * 0.3, size * 0.28);
    bodyShape.quadraticCurveTo(size * 0.8, size * 0.15, size * 1.4, 0);
    
    const extrudeSettings = {
      steps: 2,
      depth: size * 0.22,
      bevelEnabled: true,
      bevelThickness: size * 0.04,
      bevelSize: size * 0.04,
      bevelSegments: 2
    };
    
    const geometry = new THREE.ExtrudeGeometry(bodyShape, extrudeSettings);
    geometry.center();
    
    return geometry;
  }

  /**
   * Create brick-shaped hull (bulky, armored gunship)
   * Enhanced with heavy plating and robust structure
   * @param {number} size - Ship size
   * @returns {THREE.BufferGeometry} Geometry
   */
  createBrickHull(size) {
    const bodyShape = new THREE.Shape();
    
    // Blunt, armored profile
    bodyShape.moveTo(size * 1.0, 0);
    bodyShape.lineTo(size * 0.8, -size * 0.55);
    bodyShape.lineTo(-size * 0.2, -size * 0.58);
    bodyShape.lineTo(-size * 0.5, -size * 0.48);
    bodyShape.lineTo(-size * 0.65, -size * 0.35);
    bodyShape.lineTo(-size * 0.7, 0);
    bodyShape.lineTo(-size * 0.65, size * 0.35);
    bodyShape.lineTo(-size * 0.5, size * 0.48);
    bodyShape.lineTo(-size * 0.2, size * 0.58);
    bodyShape.lineTo(size * 0.8, size * 0.55);
    bodyShape.lineTo(size * 1.0, 0);
    
    const extrudeSettings = {
      steps: 2,
      depth: size * 0.55,
      bevelEnabled: true,
      bevelThickness: size * 0.1,
      bevelSize: size * 0.1,
      bevelSegments: 3
    };
    
    const geometry = new THREE.ExtrudeGeometry(bodyShape, extrudeSettings);
    geometry.center();
    
    return geometry;
  }

  /**
   * Create razor-shaped hull (aggressive, forward-swept fighter)
   * Enhanced with sharp, aggressive lines
   * @param {number} size - Ship size
   * @returns {THREE.BufferGeometry} Geometry
   */
  createRazorHull(size) {
    const bodyShape = new THREE.Shape();
    
    // Sharp, aggressive forward-swept design
    bodyShape.moveTo(size * 1.5, 0);
    bodyShape.lineTo(size * 0.6, -size * 0.24);
    bodyShape.lineTo(size * 0.4, -size * 0.75);
    bodyShape.lineTo(-size * 0.3, -size * 0.58);
    bodyShape.lineTo(-size * 0.6, -size * 0.25);
    bodyShape.lineTo(-size * 0.8, 0);
    bodyShape.lineTo(-size * 0.6, size * 0.25);
    bodyShape.lineTo(-size * 0.3, size * 0.58);
    bodyShape.lineTo(size * 0.4, size * 0.75);
    bodyShape.lineTo(size * 0.6, size * 0.24);
    bodyShape.lineTo(size * 1.5, 0);
    
    const extrudeSettings = {
      steps: 2,
      depth: size * 0.28,
      bevelEnabled: true,
      bevelThickness: size * 0.05,
      bevelSize: size * 0.05,
      bevelSegments: 2
    };
    
    const geometry = new THREE.ExtrudeGeometry(bodyShape, extrudeSettings);
    geometry.center();
    
    return geometry;
  }

  /**
   * Create bastion-shaped hull (heavy tank, armored fortress)
   * Enhanced with thick armor plating and reinforced structure
   * @param {number} size - Ship size
   * @returns {THREE.BufferGeometry} Geometry
   */
  createBastionHull(size) {
    // Main armored body - thick and wide
    const bodyShape = new THREE.Shape();
    bodyShape.moveTo(size * 0.9, 0);
    bodyShape.lineTo(size * 0.7, -size * 0.6);
    bodyShape.lineTo(size * 0.2, -size * 0.65);
    bodyShape.lineTo(-size * 0.3, -size * 0.62);
    bodyShape.lineTo(-size * 0.6, -size * 0.4);
    bodyShape.lineTo(-size * 0.75, 0);
    bodyShape.lineTo(-size * 0.6, size * 0.4);
    bodyShape.lineTo(-size * 0.3, size * 0.62);
    bodyShape.lineTo(size * 0.2, size * 0.65);
    bodyShape.lineTo(size * 0.7, size * 0.6);
    bodyShape.lineTo(size * 0.9, 0);
    
    const bodyExtrudeSettings = {
      steps: 2,
      depth: size * 0.6,
      bevelEnabled: true,
      bevelThickness: size * 0.12,
      bevelSize: size * 0.12,
      bevelSegments: 3
    };
    
    const bodyGeometry = new THREE.ExtrudeGeometry(bodyShape, bodyExtrudeSettings);
    bodyGeometry.center();
    
    // Armor plates on sides
    const plateShape = new THREE.Shape();
    plateShape.moveTo(size * 0.4, -size * 0.65);
    plateShape.lineTo(size * 0.1, -size * 0.9);
    plateShape.lineTo(-size * 0.4, -size * 0.8);
    plateShape.lineTo(-size * 0.3, -size * 0.6);
    plateShape.lineTo(size * 0.4, -size * 0.65);
    
    const plateExtrudeSettings = {
      steps: 1,
      depth: size * 0.2,
      bevelEnabled: true,
      bevelThickness: size * 0.04,
      bevelSize: size * 0.04,
      bevelSegments: 2
    };
    
    const plateGeometry = new THREE.ExtrudeGeometry(plateShape, plateExtrudeSettings);
    plateGeometry.center();
    const plateGeometry2 = plateGeometry.clone();
    plateGeometry2.scale(1, -1, 1); // Mirror for bottom
    
    // Combine geometries
    const geometries = [bodyGeometry, plateGeometry, plateGeometry2];
    const mergedGeometry = BufferGeometryUtils.mergeGeometries(geometries);
    
    return mergedGeometry;
  }

  /**
   * Create dart-shaped hull (sleek interceptor, nimble and fast)
   * Enhanced with streamlined aerodynamic profile
   * @param {number} size - Ship size
   * @returns {THREE.BufferGeometry} Geometry
   */
  createDartHull(size) {
    const bodyShape = new THREE.Shape();
    
    // Very streamlined, dart-like design
    bodyShape.moveTo(size * 1.5, 0);
    bodyShape.quadraticCurveTo(size * 1.0, -size * 0.12, size * 0.4, -size * 0.22);
    bodyShape.lineTo(size * 0.1, -size * 0.35);
    bodyShape.lineTo(-size * 0.3, -size * 0.3);
    bodyShape.lineTo(-size * 0.6, -size * 0.2);
    bodyShape.lineTo(-size * 0.7, 0);
    bodyShape.lineTo(-size * 0.6, size * 0.2);
    bodyShape.lineTo(-size * 0.3, size * 0.3);
    bodyShape.lineTo(size * 0.1, size * 0.35);
    bodyShape.lineTo(size * 0.4, size * 0.22);
    bodyShape.quadraticCurveTo(size * 1.0, size * 0.12, size * 1.5, 0);
    
    const extrudeSettings = {
      steps: 2,
      depth: size * 0.18,
      bevelEnabled: true,
      bevelThickness: size * 0.03,
      bevelSize: size * 0.03,
      bevelSegments: 2
    };
    
    const geometry = new THREE.ExtrudeGeometry(bodyShape, extrudeSettings);
    geometry.center();
    
    return geometry;
  }

  /**
   * Create fortress-shaped hull (massive capital ship, overwhelming firepower)
   * Enhanced with imposing structure and heavy weapon mounts
   * @param {number} size - Ship size
   * @returns {THREE.BufferGeometry} Geometry
   */
  createFortressHull(size) {
    const group = new THREE.Group();
    
    // Massive central hull
    const bodyShape = new THREE.Shape();
    bodyShape.moveTo(size * 0.8, 0);
    bodyShape.lineTo(size * 0.6, -size * 0.7);
    bodyShape.lineTo(size * 0.3, -size * 0.75);
    bodyShape.lineTo(-size * 0.1, -size * 0.72);
    bodyShape.lineTo(-size * 0.4, -size * 0.55);
    bodyShape.lineTo(-size * 0.6, -size * 0.4);
    bodyShape.lineTo(-size * 0.7, 0);
    bodyShape.lineTo(-size * 0.6, size * 0.4);
    bodyShape.lineTo(-size * 0.4, size * 0.55);
    bodyShape.lineTo(-size * 0.1, size * 0.72);
    bodyShape.lineTo(size * 0.3, size * 0.75);
    bodyShape.lineTo(size * 0.6, size * 0.7);
    bodyShape.lineTo(size * 0.8, 0);
    
    const bodyExtrudeSettings = {
      steps: 3,
      depth: size * 0.7,
      bevelEnabled: true,
      bevelThickness: size * 0.15,
      bevelSize: size * 0.15,
      bevelSegments: 4
    };
    
    const bodyGeometry = new THREE.ExtrudeGeometry(bodyShape, bodyExtrudeSettings);
    bodyGeometry.center();
    
    // Heavy weapon hardpoints
    const hardpointShape = new THREE.Shape();
    hardpointShape.moveTo(size * 0.5, -size * 0.75);
    hardpointShape.lineTo(size * 0.4, -size * 1.1);
    hardpointShape.lineTo(size * 0.1, -size * 1.05);
    hardpointShape.lineTo(size * 0.2, -size * 0.7);
    hardpointShape.lineTo(size * 0.5, -size * 0.75);
    
    const hardpointExtrudeSettings = {
      steps: 1,
      depth: size * 0.25,
      bevelEnabled: true,
      bevelThickness: size * 0.05,
      bevelSize: size * 0.05,
      bevelSegments: 2
    };
    
    const hardpointGeometry = new THREE.ExtrudeGeometry(hardpointShape, hardpointExtrudeSettings);
    hardpointGeometry.center();
    const hardpointGeometry2 = hardpointGeometry.clone();
    hardpointGeometry2.scale(1, -1, 1); // Mirror for bottom
    
    // Combine geometries
    const geometries = [bodyGeometry, hardpointGeometry, hardpointGeometry2];
    const mergedGeometry = BufferGeometryUtils.mergeGeometries(geometries);
    
    return mergedGeometry;
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
   * Create enemy geometry based on type
   * Enhanced with unique shapes for each enemy type
   * @param {number} size - Enemy size
   * @param {string} type - Enemy type (drone, chaser, heavy, swarmer)
   * @returns {THREE.BufferGeometry} Geometry
   */
  createEnemyGeometry(size, type = 'default') {
    const key = `enemy_${size}_${type}`;
    return this.get(key, () => {
      switch(type) {
        case 'drone':
          // Angular mechanical design - diamond with extensions
          const droneGeometry = new THREE.BufferGeometry();
          const droneVertices = new Float32Array([
            // Front point
            size * 1.2, 0, 0,
            // Top wing tips
            0, -size * 0.8, 0,
            -size * 0.6, -size * 0.6, 0,
            // Bottom wing tips
            0, size * 0.8, 0,
            -size * 0.6, size * 0.6, 0,
            // Back center
            -size * 0.5, 0, 0
          ]);
          
          const droneIndices = [
            0, 1, 2,  // Top wing
            0, 3, 4,  // Bottom wing
            2, 5, 4,  // Back
            1, 2, 5,  // Top back
            3, 4, 5   // Bottom back
          ];
          
          droneGeometry.setAttribute('position', new THREE.BufferAttribute(droneVertices, 3));
          droneGeometry.setIndex(droneIndices);
          droneGeometry.computeVertexNormals();
          return droneGeometry;
          
        case 'chaser':
          // Organic insectoid shape - elongated with segments
          const chaserGroup = new THREE.Group();
          
          // Main body segments
          for (let i = 0; i < 3; i++) {
            const segmentSize = size * (1.0 - i * 0.2);
            const segmentGeom = new THREE.SphereGeometry(segmentSize * 0.5, 8, 8);
            const segment = new THREE.Mesh(segmentGeom);
            segment.position.x = -size * 0.6 * i;
            segment.scale.set(1.4, 0.8, 0.8); // Elongated
            chaserGroup.add(segment);
          }
          
          // Head with mandibles
          const headGeom = new THREE.ConeGeometry(size * 0.6, size * 0.8, 8);
          const head = new THREE.Mesh(headGeom);
          head.rotation.z = -Math.PI / 2;
          head.position.x = size * 0.6;
          chaserGroup.add(head);
          
          // Merge into single geometry
          const chaserGeometries = [];
          chaserGroup.traverse((child) => {
            if (child.geometry) {
              const geom = child.geometry.clone();
              geom.applyMatrix4(child.matrixWorld);
              chaserGeometries.push(geom);
            }
          });
          
          return BufferGeometryUtils.mergeGeometries(chaserGeometries);
          
        case 'heavy':
          // Crystalline fortress - complex polyhedron
          const heavyGeometry = new THREE.IcosahedronGeometry(size, 1);
          
          // Deform for crystal appearance
          const positions = heavyGeometry.attributes.position;
          for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const y = positions.getY(i);
            const z = positions.getZ(i);
            
            // Make it more angular/crystalline
            const scale = 1 + Math.abs(x) * 0.2;
            positions.setXYZ(i, x * scale, y * 0.8, z * 0.8);
          }
          
          heavyGeometry.computeVertexNormals();
          return heavyGeometry;
          
        case 'swarmer':
          // Organic blob - amoeba-like
          const swarmerGeometry = new THREE.TetrahedronGeometry(size, 2);
          
          // Deform for organic appearance
          const swarmerPositions = swarmerGeometry.attributes.position;
          for (let i = 0; i < swarmerPositions.count; i++) {
            const x = swarmerPositions.getX(i);
            const y = swarmerPositions.getY(i);
            const z = swarmerPositions.getZ(i);
            
            // Irregular wobble
            const wobble = 1 + Math.sin(i) * 0.3;
            swarmerPositions.setXYZ(i, x * wobble, y * wobble * 0.8, z * wobble * 0.8);
          }
          
          swarmerGeometry.computeVertexNormals();
          return swarmerGeometry;
          
        default:
          // Default octahedron for generic enemies
          return new THREE.OctahedronGeometry(size, 0);
      }
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
