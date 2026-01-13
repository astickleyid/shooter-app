/**
 * Particles3D - 3D particle system
 */

import * as THREE from 'three';
import MaterialFactory from '../renderer/MaterialFactory.js';

export class Particles3D {
  constructor(renderer3D) {
    this.renderer3D = renderer3D;
    this.particleSystems = new Map();
    this.initialized = false;
  }

  /**
   * Initialize particle system
   */
  init() {
    if (this.initialized) return;
    this.initialized = true;
  }

  /**
   * Add particle effect
   * @param {object} config - Particle configuration
   */
  addParticles(config) {
    if (!this.initialized) return;

    const {
      x,
      y,
      count = 20,
      color = '#ffffff',
      lifetime = 1000,
      speed = 2,
      spread = Math.PI * 2,
      size = 3
    } = config;

    const particleId = Date.now() + Math.random();
    
    // Create particle geometry
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const velocities = [];
    const colors = [];
    const sizes = [];

    for (let i = 0; i < count; i++) {
      // Position
      positions.push(x, 0, y);

      // Velocity
      const angle = (Math.random() * spread) - (spread / 2);
      const velocity = speed * (0.5 + Math.random() * 0.5);
      velocities.push(
        Math.cos(angle) * velocity,
        (Math.random() - 0.5) * velocity * 0.5, // Y velocity
        Math.sin(angle) * velocity
      );

      // Color
      const c = new THREE.Color(color);
      colors.push(c.r, c.g, c.b);

      // Size
      sizes.push(size * (0.5 + Math.random() * 0.5));
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.Float32BufferAttribute(velocities, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));

    // Create material
    const material = new THREE.PointsMaterial({
      size: size,
      vertexColors: true,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const particles = new THREE.Points(geometry, material);
    this.renderer3D.addToLayer(particles, 'effects');

    // Store particle system
    this.particleSystems.set(particleId, {
      mesh: particles,
      geometry: geometry,
      material: material,
      startTime: Date.now(),
      lifetime: lifetime
    });
  }

  /**
   * Update all particle systems
   * @param {number} dt - Delta time
   */
  update(dt) {
    if (!this.initialized) return;

    const currentTime = Date.now();

    // Update each particle system
    for (const [id, system] of this.particleSystems.entries()) {
      const age = currentTime - system.startTime;
      
      // Remove expired systems
      if (age > system.lifetime) {
        this.removeParticleSystem(id);
        continue;
      }

      // Update particles
      const positions = system.geometry.attributes.position.array;
      const velocities = system.geometry.attributes.velocity.array;

      for (let i = 0; i < positions.length; i += 3) {
        positions[i] += velocities[i] * dt * 0.01;
        positions[i + 1] += velocities[i + 1] * dt * 0.01;
        positions[i + 2] += velocities[i + 2] * dt * 0.01;

        // Apply gravity
        velocities[i + 1] -= 0.05 * dt * 0.01;
      }

      system.geometry.attributes.position.needsUpdate = true;

      // Fade out
      const fadeProgress = age / system.lifetime;
      system.material.opacity = 1.0 - fadeProgress;
    }
  }

  /**
   * Remove particle system
   * @param {number} id - Particle system ID
   */
  removeParticleSystem(id) {
    const system = this.particleSystems.get(id);
    if (system) {
      this.renderer3D.removeFromScene(system.mesh);
      system.geometry.dispose();
      system.material.dispose();
      this.particleSystems.delete(id);
    }
  }

  /**
   * Dispose of all particle systems
   */
  dispose() {
    for (const [id] of this.particleSystems.entries()) {
      this.removeParticleSystem(id);
    }
    this.particleSystems.clear();
    this.initialized = false;
  }
}
