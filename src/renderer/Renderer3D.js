/**
 * Renderer3D - Main 3D rendering system using Three.js
 * Manages scene, camera, lighting, and rendering for the 3D game
 */

import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { getRecommendedQualitySettings } from '../utils/webgl.js';

export class Renderer3D {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.composer = null;
    this.qualitySettings = getRecommendedQualitySettings();
    
    // Scene layers for organized rendering
    this.layers = {
      background: new THREE.Group(),
      gameplay: new THREE.Group(),
      effects: new THREE.Group()
    };
    
    // Object pools for performance
    this.pools = {
      bullets: [],
      particles: [],
      enemies: []
    };
    
    this.initialized = false;
  }

  /**
   * Initialize the 3D renderer
   */
  init() {
    if (this.initialized) return;

    // Create renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: this.qualitySettings.antialias,
      alpha: false,
      powerPreference: 'high-performance'
    });
    
    this.renderer.setPixelRatio(this.qualitySettings.pixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x030712, 1); // Match 2D background color
    
    // Enable shadows if supported
    if (this.qualitySettings.shadows) {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    // Create scene
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x030712, 500, 2000);
    
    // Add layers to scene
    this.scene.add(this.layers.background);
    this.scene.add(this.layers.gameplay);
    this.scene.add(this.layers.effects);

    // Set up camera
    this.setupCamera();
    
    // Set up lighting
    this.setupLighting();
    
    // Set up post-processing
    if (this.qualitySettings.postProcessing) {
      this.setupPostProcessing();
    }

    this.initialized = true;
  }

  /**
   * Set up camera system
   */
  setupCamera() {
    const aspect = window.innerWidth / window.innerHeight;
    const viewSize = 800; // Units visible in viewport
    
    // Use orthographic camera for maintaining 2D-like gameplay
    this.camera = new THREE.OrthographicCamera(
      -viewSize * aspect / 2,  // left
      viewSize * aspect / 2,   // right
      viewSize / 2,            // top
      -viewSize / 2,           // bottom
      1,                       // near
      3000                     // far
    );
    
    // Position camera for slight angle view
    this.camera.position.set(0, -200, 600);
    this.camera.lookAt(0, 0, 0);
    this.camera.up.set(0, 0, 1); // Z is up in our coordinate system
  }

  /**
   * Set up scene lighting
   */
  setupLighting() {
    // Ambient light for base illumination
    const ambientLight = new THREE.AmbientLight(0x404060, 0.6);
    this.scene.add(ambientLight);

    // Main directional light (simulating distant light source)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(100, -200, 500);
    directionalLight.castShadow = this.qualitySettings.shadows;
    
    if (this.qualitySettings.shadows) {
      directionalLight.shadow.mapSize.width = 1024;
      directionalLight.shadow.mapSize.height = 1024;
      directionalLight.shadow.camera.near = 0.5;
      directionalLight.shadow.camera.far = 2000;
    }
    
    this.scene.add(directionalLight);

    // Rim light for edge definition
    const rimLight = new THREE.DirectionalLight(0x4ade80, 0.3);
    rimLight.position.set(-100, 200, 300);
    this.scene.add(rimLight);
  }

  /**
   * Set up post-processing effects
   */
  setupPostProcessing() {
    this.composer = new EffectComposer(this.renderer);
    
    // Main render pass
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);
    
    // Bloom pass for glow effect
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.2,  // strength
      0.4,  // radius
      0.85  // threshold
    );
    this.composer.addPass(bloomPass);
  }

  /**
   * Handle window resize
   */
  resize() {
    if (!this.initialized) return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const aspect = width / height;
    const viewSize = 800;

    // Update camera
    this.camera.left = -viewSize * aspect / 2;
    this.camera.right = viewSize * aspect / 2;
    this.camera.top = viewSize / 2;
    this.camera.bottom = -viewSize / 2;
    this.camera.updateProjectionMatrix();

    // Update renderer
    this.renderer.setSize(width, height);
    
    // Update composer
    if (this.composer) {
      this.composer.setSize(width, height);
    }
  }

  /**
   * Render the scene
   */
  render() {
    if (!this.initialized) return;

    if (this.composer) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }

  /**
   * Update camera to follow target (player)
   * @param {number} x - Target X position
   * @param {number} y - Target Y position
   */
  updateCamera(x, y) {
    if (!this.camera) return;
    
    // Smooth camera follow
    const targetX = x;
    const targetY = 0; // Keep Y centered
    const targetZ = y; // Map 2D Y to 3D Z
    
    this.camera.position.x += (targetX - this.camera.position.x) * 0.1;
    this.camera.position.z += (targetZ + 600 - this.camera.position.z) * 0.1;
    
    this.camera.lookAt(targetX, 0, targetZ);
  }

  /**
   * Add object to scene layer
   * @param {THREE.Object3D} object - Object to add
   * @param {string} layer - Layer name ('background', 'gameplay', 'effects')
   */
  addToLayer(object, layer = 'gameplay') {
    if (this.layers[layer]) {
      this.layers[layer].add(object);
    }
  }

  /**
   * Remove object from scene
   * @param {THREE.Object3D} object - Object to remove
   */
  removeFromScene(object) {
    if (object.parent) {
      object.parent.remove(object);
    }
  }

  /**
   * Clear all objects from a layer
   * @param {string} layer - Layer to clear
   */
  clearLayer(layer) {
    if (this.layers[layer]) {
      while (this.layers[layer].children.length > 0) {
        this.removeFromScene(this.layers[layer].children[0]);
      }
    }
  }

  /**
   * Create screen shake effect
   * @param {number} intensity - Shake intensity
   */
  shake(intensity = 5) {
    if (!this.camera) return;
    
    const originalX = this.camera.position.x;
    const originalY = this.camera.position.y;
    const originalZ = this.camera.position.z;
    
    this.camera.position.x += (Math.random() - 0.5) * intensity;
    this.camera.position.y += (Math.random() - 0.5) * intensity;
    this.camera.position.z += (Math.random() - 0.5) * intensity;
    
    // Reset after a frame
    requestAnimationFrame(() => {
      if (this.camera) {
        this.camera.position.x = originalX;
        this.camera.position.y = originalY;
        this.camera.position.z = originalZ;
      }
    });
  }

  /**
   * Dispose of all resources
   */
  dispose() {
    if (!this.initialized) return;

    // Dispose of all geometries and materials
    this.scene.traverse((object) => {
      if (object.geometry) {
        object.geometry.dispose();
      }
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach(material => material.dispose());
        } else {
          object.material.dispose();
        }
      }
    });

    // Dispose renderer
    if (this.renderer) {
      this.renderer.dispose();
    }

    // Dispose composer
    if (this.composer) {
      this.composer = null;
    }

    this.initialized = false;
  }

  /**
   * Get current quality settings
   * @returns {object} Quality settings
   */
  getQualitySettings() {
    return { ...this.qualitySettings };
  }

  /**
   * Update quality settings
   * @param {object} settings - New quality settings
   */
  setQualitySettings(settings) {
    this.qualitySettings = { ...this.qualitySettings, ...settings };
    
    // Reinitialize if needed
    if (this.initialized) {
      this.dispose();
      this.init();
    }
  }
}
