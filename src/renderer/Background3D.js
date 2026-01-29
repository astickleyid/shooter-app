/**
 * Background3D - Creates 3D starfield and space environment
 */

import * as THREE from 'three';
import MaterialFactory from './MaterialFactory.js';

export class Background3D {
  constructor(renderer3D) {
    this.renderer3D = renderer3D;
    this.starLayers = [];
    this.initialized = false;
  }

  /**
   * Initialize 3D background
   */
  init() {
    if (this.initialized) return;

    this.createStarfield();
    this.initialized = true;
  }

  /**
   * Create multi-layer starfield
   */
  createStarfield() {
    // Create multiple layers of stars at different depths
    const layers = [
      { count: 1000, depth: -1000, size: 1.5, color: 0xffffff, opacity: 0.3 },
      { count: 500, depth: -500, size: 2.0, color: 0xccddff, opacity: 0.5 },
      { count: 300, depth: -300, size: 2.5, color: 0xffffcc, opacity: 0.7 },
      { count: 100, depth: -200, size: 3.0, color: 0x4ade80, opacity: 0.6 }
    ];

    layers.forEach((layerConfig, index) => {
      const starField = this.createStarLayer(
        layerConfig.count,
        layerConfig.depth,
        layerConfig.size,
        layerConfig.color,
        layerConfig.opacity
      );
      
      this.starLayers.push(starField);
      this.renderer3D.addToLayer(starField, 'background');
    });
  }

  /**
   * Create a single layer of stars
   * @param {number} count - Number of stars
   * @param {number} depth - Z-depth of layer
   * @param {number} size - Star size
   * @param {number} color - Star color
   * @param {number} opacity - Star opacity
   * @returns {THREE.Points} Star field
   */
  createStarLayer(count, depth, size, color, opacity) {
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const colors = [];
    const sizes = [];

    // Create random stars
    for (let i = 0; i < count; i++) {
      // Random position in a large area
      const x = (Math.random() - 0.5) * 4000;
      const y = (Math.random() - 0.5) * 200; // Keep Y range smaller
      const z = depth + (Math.random() - 0.5) * 200;

      positions.push(x, y, z);

      // Slight color variation
      const c = new THREE.Color(color);
      const variation = 0.1;
      c.r += (Math.random() - 0.5) * variation;
      c.g += (Math.random() - 0.5) * variation;
      c.b += (Math.random() - 0.5) * variation;
      
      colors.push(c.r, c.g, c.b);

      // Size variation
      sizes.push(size * (0.5 + Math.random() * 0.5));
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));

    // Create material
    const material = new THREE.PointsMaterial({
      size: size,
      vertexColors: true,
      transparent: true,
      opacity: opacity,
      sizeAttenuation: false,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    return new THREE.Points(geometry, material);
  }

  /**
   * Update background (parallax effect)
   * @param {number} cameraX - Camera X position
   * @param {number} cameraZ - Camera Z position
   */
  update(cameraX, cameraZ) {
    if (!this.initialized) return;

    // Apply parallax effect to star layers
    this.starLayers.forEach((layer, index) => {
      // Different parallax factors for different layers
      const parallaxFactor = 0.05 + (index * 0.05);
      layer.position.x = cameraX * parallaxFactor;
      layer.position.z = cameraZ * parallaxFactor;
    });
  }

  /**
   * Animate stars (twinkling effect)
   * @param {number} time - Current time
   */
  animate(time) {
    if (!this.initialized) return;

    // Subtle twinkling effect on brightest stars
    const brightestLayer = this.starLayers[this.starLayers.length - 1];
    if (brightestLayer && brightestLayer.material) {
      brightestLayer.material.opacity = 0.5 + Math.sin(time * 0.001) * 0.2;
    }
  }

  /**
   * Dispose of all resources
   */
  dispose() {
    this.starLayers.forEach(layer => {
      if (layer.geometry) {
        layer.geometry.dispose();
      }
      if (layer.material) {
        layer.material.dispose();
      }
      this.renderer3D.removeFromScene(layer);
    });

    this.starLayers = [];
    this.initialized = false;
  }
}
