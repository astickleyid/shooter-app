/**
 * MaterialFactory - Creates and caches 3D materials for game entities
 */

import * as THREE from 'three';

export class MaterialFactory {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Get or create material from cache
   * @param {string} key - Cache key
   * @param {Function} createFn - Function to create material if not cached
   * @returns {THREE.Material} Material
   */
  get(key, createFn) {
    if (!this.cache.has(key)) {
      this.cache.set(key, createFn());
    }
    return this.cache.get(key);
  }

  /**
   * Create ship material with glow effect
   * @param {string} primaryColor - Primary color (hex)
   * @param {string} emissiveColor - Emissive color (hex)
   * @returns {THREE.MeshStandardMaterial} Material
   */
  createShipMaterial(primaryColor, emissiveColor) {
    const key = `ship_${primaryColor}_${emissiveColor}`;
    return this.get(key, () => {
      return new THREE.MeshStandardMaterial({
        color: primaryColor,
        emissive: emissiveColor || primaryColor,
        emissiveIntensity: 0.3,
        metalness: 0.8,
        roughness: 0.2,
        flatShading: false
      });
    });
  }

  /**
   * Create bullet material with intense glow
   * @param {string} color - Bullet color (hex)
   * @returns {THREE.MeshStandardMaterial} Material
   */
  createBulletMaterial(color) {
    const key = `bullet_${color}`;
    return this.get(key, () => {
      return new THREE.MeshStandardMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 0.8,
        metalness: 0.3,
        roughness: 0.1
      });
    });
  }

  /**
   * Create enemy material
   * @param {string} color - Enemy color (hex)
   * @returns {THREE.MeshStandardMaterial} Material
   */
  createEnemyMaterial(color) {
    const key = `enemy_${color}`;
    return this.get(key, () => {
      return new THREE.MeshStandardMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 0.4,
        metalness: 0.5,
        roughness: 0.5
      });
    });
  }

  /**
   * Create asteroid material
   * @param {string} color - Asteroid color (hex)
   * @returns {THREE.MeshStandardMaterial} Material
   */
  createAsteroidMaterial(color = '#666666') {
    const key = `asteroid_${color}`;
    return this.get(key, () => {
      return new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.3,
        roughness: 0.9,
        flatShading: true
      });
    });
  }

  /**
   * Create spawner material with animated glow
   * @param {string} color - Spawner color (hex)
   * @returns {THREE.MeshStandardMaterial} Material
   */
  createSpawnerMaterial(color = '#ff0066') {
    const key = `spawner_${color}`;
    return this.get(key, () => {
      return new THREE.MeshStandardMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 0.6,
        metalness: 0.9,
        roughness: 0.1,
        transparent: true,
        opacity: 0.8
      });
    });
  }

  /**
   * Create coin material with metallic gold look
   * @returns {THREE.MeshStandardMaterial} Material
   */
  createCoinMaterial() {
    const key = 'coin_gold';
    return this.get(key, () => {
      return new THREE.MeshStandardMaterial({
        color: '#fbbf24',
        emissive: '#fbbf24',
        emissiveIntensity: 0.5,
        metalness: 1.0,
        roughness: 0.2
      });
    });
  }

  /**
   * Create supply crate material
   * @returns {THREE.MeshStandardMaterial} Material
   */
  createSupplyCrateMaterial() {
    const key = 'supply_crate';
    return this.get(key, () => {
      return new THREE.MeshStandardMaterial({
        color: '#60a5fa',
        emissive: '#60a5fa',
        emissiveIntensity: 0.3,
        metalness: 0.6,
        roughness: 0.4
      });
    });
  }

  /**
   * Create particle material
   * @param {string} color - Particle color (hex)
   * @returns {THREE.PointsMaterial} Material
   */
  createParticleMaterial(color) {
    const key = `particle_${color}`;
    return this.get(key, () => {
      return new THREE.PointsMaterial({
        color: color,
        size: 3,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
    });
  }

  /**
   * Create star material for background
   * @returns {THREE.PointsMaterial} Material
   */
  createStarMaterial() {
    const key = 'star_material';
    return this.get(key, () => {
      return new THREE.PointsMaterial({
        color: 0xffffff,
        size: 2,
        transparent: true,
        opacity: 0.8,
        sizeAttenuation: false
      });
    });
  }

  /**
   * Create explosion material
   * @param {string} color - Explosion color (hex)
   * @returns {THREE.MeshBasicMaterial} Material
   */
  createExplosionMaterial(color) {
    const key = `explosion_${color}`;
    return this.get(key, () => {
      return new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
    });
  }

  /**
   * Create engine glow material
   * @param {string} color - Engine color (hex)
   * @returns {THREE.MeshBasicMaterial} Material
   */
  createEngineGlowMaterial(color) {
    const key = `engine_${color}`;
    return this.get(key, () => {
      return new THREE.MeshBasicMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 1.0,
        transparent: true,
        opacity: 0.9
      });
    });
  }

  /**
   * Update material properties (for animations)
   * @param {THREE.Material} material - Material to update
   * @param {object} properties - Properties to update
   */
  updateMaterial(material, properties) {
    Object.assign(material, properties);
    material.needsUpdate = true;
  }

  /**
   * Clear all cached materials
   */
  clearCache() {
    this.cache.forEach(material => {
      if (material.dispose) {
        material.dispose();
      }
    });
    this.cache.clear();
  }
}

export default new MaterialFactory();
