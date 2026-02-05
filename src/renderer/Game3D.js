/**
 * Game3D - Main 3D game coordinator
 * Manages 3D rendering and entity lifecycle
 */

import { Renderer3D } from './Renderer3D.js';
import { Background3D } from './Background3D.js';
import { Ship3D } from '../entities3d/Ship3D.js';
import { Bullet3D } from '../entities3d/Bullet3D.js';
import { Enemy3D } from '../entities3d/Enemy3D.js';
import { Asteroid3D } from '../entities3d/Asteroid3D.js';
import { Coin3D } from '../entities3d/Coin3D.js';
import { Particles3D } from '../entities3d/Particles3D.js';
import { supportsWebGL } from '../utils/webgl.js';

export class Game3D {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer3D = null;
    this.background3D = null;
    this.playerShip3D = null;
    this.particles3D = null;
    
    // Entity maps (2D entity -> 3D entity)
    this.bullets3D = new Map();
    this.enemies3D = new Map();
    this.asteroids3D = new Map();
    this.coins3D = new Map();
    
    this.enabled = false;
    this.initialized = false;
  }

  /**
   * Check if 3D mode is supported and enabled
   * @returns {boolean} True if 3D mode is available
   */
  isSupported() {
    return supportsWebGL();
  }

  /**
   * Initialize 3D rendering system
   * @returns {boolean} True if initialization succeeded
   */
  init() {
    if (this.initialized) return true;
    
    if (!this.isSupported()) {
      console.warn('WebGL not supported, 3D mode unavailable');
      return false;
    }

    try {
      // Create renderer
      this.renderer3D = new Renderer3D(this.canvas);
      this.renderer3D.init();

      // Create background
      this.background3D = new Background3D(this.renderer3D);
      this.background3D.init();

      // Create particle system
      this.particles3D = new Particles3D(this.renderer3D);
      this.particles3D.init();

      this.initialized = true;
      this.enabled = true;
      
      console.log('3D rendering initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize 3D rendering:', error);
      this.enabled = false;
      return false;
    }
  }

  /**
   * Enable/disable 3D mode
   * @param {boolean} enable - True to enable 3D
   */
  setEnabled(enable) {
    if (!this.initialized && enable) {
      this.init();
    }
    this.enabled = enable && this.initialized;
  }

  /**
   * Handle window resize
   */
  resize() {
    if (this.renderer3D) {
      this.renderer3D.resize();
    }
  }

  /**
   * Create 3D player ship
   * @param {object} player - 2D player entity
   * @param {object} shipData - Ship configuration data
   */
  createPlayerShip(player, shipData) {
    if (!this.enabled) return;

    // Dispose old ship if exists
    if (this.playerShip3D) {
      this.playerShip3D.dispose();
    }

    // Create new ship
    this.playerShip3D = new Ship3D(shipData, this.renderer3D);
    this.playerShip3D.init();
    this.playerShip3D.update(player.x, player.y, player.rotation);
  }

  /**
   * Update player ship
   * @param {object} player - 2D player entity
   * @param {boolean} boosting - Whether player is boosting
   */
  updatePlayerShip(player, boosting = false) {
    if (!this.enabled || !this.playerShip3D) return;

    // Pass velocity for banking/tilting effects
    const velocity = player.vel || { x: 0, y: 0 };
    this.playerShip3D.update(player.x, player.y, player.rotation, velocity);
    this.playerShip3D.animateEngines(performance.now(), boosting);
    
    if (boosting) {
      this.playerShip3D.setBoosting(true);
    } else {
      this.playerShip3D.setBoosting(false);
    }
  }

  /**
   * Trigger weapon fire visual effect
   * @param {string} weaponType - Type of weapon that fired
   */
  triggerWeaponFire(weaponType = 'primary') {
    if (!this.enabled || !this.playerShip3D) return;
    this.playerShip3D.showMuzzleFlash(weaponType);
  }

  /**
   * Sync 3D bullets with 2D bullets
   * @param {Array} bullets2D - Array of 2D bullet entities
   */
  syncBullets(bullets2D) {
    if (!this.enabled) return;

    // Track which bullets still exist
    const activeBullets = new Set();

    // Update or create bullets
    bullets2D.forEach(bullet => {
      const bulletId = bullet.id || bullet;
      activeBullets.add(bulletId);

      if (!this.bullets3D.has(bulletId)) {
        // Create new 3D bullet
        const bullet3D = new Bullet3D(
          bullet.x,
          bullet.y,
          bullet.color || '#4ade80',
          this.renderer3D
        );
        this.bullets3D.set(bulletId, bullet3D);
      } else {
        // Update existing bullet with velocity for orientation
        const bullet3D = this.bullets3D.get(bulletId);
        bullet3D.update(
          bullet.x, 
          bullet.y, 
          bullet.vx || 0, 
          bullet.vy || 0
        );
      }
    });

    // Remove bullets that no longer exist
    for (const [bulletId, bullet3D] of this.bullets3D.entries()) {
      if (!activeBullets.has(bulletId)) {
        bullet3D.dispose();
        this.bullets3D.delete(bulletId);
      }
    }
  }

  /**
   * Sync 3D enemies with 2D enemies
   * @param {Array} enemies2D - Array of 2D enemy entities
   */
  syncEnemies(enemies2D) {
    if (!this.enabled) return;

    // Track which enemies still exist
    const activeEnemies = new Set();

    // Update or create enemies
    enemies2D.forEach(enemy => {
      const enemyId = enemy.id || enemy;
      activeEnemies.add(enemyId);

      if (!this.enemies3D.has(enemyId)) {
        // Create new 3D enemy
        const enemy3D = new Enemy3D(
          enemy.x,
          enemy.y,
          this.renderer3D
        );
        this.enemies3D.set(enemyId, enemy3D);
      } else {
        // Update existing enemy
        const enemy3D = this.enemies3D.get(enemyId);
        enemy3D.update(enemy.x, enemy.y);
      }
    });

    // Remove enemies that no longer exist
    for (const [enemyId, enemy3D] of this.enemies3D.entries()) {
      if (!activeEnemies.has(enemyId)) {
        enemy3D.dispose();
        this.enemies3D.delete(enemyId);
      }
    }
  }

  /**
   * Sync 3D asteroids with 2D asteroids
   * @param {Array} asteroids2D - Array of 2D asteroid entities
   */
  syncAsteroids(asteroids2D) {
    if (!this.enabled) return;

    const activeAsteroids = new Set();

    asteroids2D.forEach(asteroid => {
      const asteroidId = asteroid.id || asteroid;
      activeAsteroids.add(asteroidId);

      if (!this.asteroids3D.has(asteroidId)) {
        const asteroid3D = new Asteroid3D(
          asteroid.x,
          asteroid.y,
          asteroid.size || 30,
          asteroid.seed || Math.random() * 1000,
          this.renderer3D
        );
        this.asteroids3D.set(asteroidId, asteroid3D);
      } else {
        const asteroid3D = this.asteroids3D.get(asteroidId);
        asteroid3D.update(asteroid.x, asteroid.y);
      }
    });

    for (const [asteroidId, asteroid3D] of this.asteroids3D.entries()) {
      if (!activeAsteroids.has(asteroidId)) {
        asteroid3D.dispose();
        this.asteroids3D.delete(asteroidId);
      }
    }
  }

  /**
   * Sync 3D coins with 2D coins
   * @param {Array} coins2D - Array of 2D coin entities
   */
  syncCoins(coins2D) {
    if (!this.enabled) return;

    const activeCoins = new Set();
    const currentTime = performance.now();

    coins2D.forEach(coin => {
      const coinId = coin.id || coin;
      activeCoins.add(coinId);

      if (!this.coins3D.has(coinId)) {
        const coin3D = new Coin3D(
          coin.x,
          coin.y,
          this.renderer3D
        );
        this.coins3D.set(coinId, coin3D);
      } else {
        const coin3D = this.coins3D.get(coinId);
        coin3D.update(coin.x, coin.y, currentTime);
      }
    });

    for (const [coinId, coin3D] of this.coins3D.entries()) {
      if (!activeCoins.has(coinId)) {
        coin3D.dispose();
        this.coins3D.delete(coinId);
      }
    }
  }

  /**
   * Add particle effect
   * @param {object} config - Particle configuration
   */
  addParticleEffect(config) {
    if (!this.enabled || !this.particles3D) return;

    this.particles3D.addParticles(config);
  }

  /**
   * Update particles
   * @param {number} dt - Delta time
   */
  updateParticles(dt) {
    if (!this.enabled || !this.particles3D) return;

    this.particles3D.update(dt);
  }

  /**
   * Update camera to follow player
   * @param {object} player - Player entity
   */
  updateCamera(player) {
    if (!this.enabled || !this.renderer3D) return;

    this.renderer3D.updateCamera(player.x, player.y);
    
    // Update background parallax
    if (this.background3D) {
      this.background3D.update(player.x, player.y);
      this.background3D.animate(performance.now());
    }
  }

  /**
   * Create screen shake effect
   * @param {number} intensity - Shake intensity
   */
  shake(intensity) {
    if (!this.enabled || !this.renderer3D) return;

    this.renderer3D.shake(intensity);
  }

  /**
   * Render the 3D scene
   */
  render() {
    if (!this.enabled || !this.renderer3D) return;

    this.renderer3D.render();
  }

  /**
   * Clear all 3D entities
   */
  clearAll() {
    // Clear player ship
    if (this.playerShip3D) {
      this.playerShip3D.dispose();
      this.playerShip3D = null;
    }

    // Clear bullets
    for (const bullet3D of this.bullets3D.values()) {
      bullet3D.dispose();
    }
    this.bullets3D.clear();

    // Clear enemies
    for (const enemy3D of this.enemies3D.values()) {
      enemy3D.dispose();
    }
    this.enemies3D.clear();

    // Clear asteroids
    for (const asteroid3D of this.asteroids3D.values()) {
      asteroid3D.dispose();
    }
    this.asteroids3D.clear();

    // Clear coins
    for (const coin3D of this.coins3D.values()) {
      coin3D.dispose();
    }
    this.coins3D.clear();

    // Clear particles
    if (this.particles3D) {
      this.particles3D.dispose();
    }
  }

  /**
   * Dispose of all 3D resources
   */
  dispose() {
    if (!this.initialized) return;

    this.clearAll();

    if (this.background3D) {
      this.background3D.dispose();
      this.background3D = null;
    }

    if (this.renderer3D) {
      this.renderer3D.dispose();
      this.renderer3D = null;
    }

    this.initialized = false;
    this.enabled = false;
  }

  /**
   * Get quality settings
   * @returns {object} Quality settings
   */
  getQualitySettings() {
    if (this.renderer3D) {
      return this.renderer3D.getQualitySettings();
    }
    return null;
  }

  /**
   * Set quality settings
   * @param {object} settings - Quality settings
   */
  setQualitySettings(settings) {
    if (this.renderer3D) {
      this.renderer3D.setQualitySettings(settings);
    }
  }
}
