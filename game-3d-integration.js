/**
 * 3D Game Integration
 * This module integrates 3D rendering with the existing 2D game
 * Can be toggled on/off without breaking the game
 */

import { Game3D } from './src/renderer/Game3D.js';

// Global 3D game instance
let game3D = null;
let use3DMode = true; // Can be toggled via settings

/**
 * Initialize 3D rendering
 * @param {HTMLCanvasElement} canvas - Game canvas
 * @returns {boolean} True if 3D initialized successfully
 */
function init3DMode(canvas) {
  if (game3D) {
    return game3D.enabled;
  }

  try {
    game3D = new Game3D(canvas);
    const success = game3D.init();
    
    if (success) {
      console.log('3D mode initialized successfully');
      
      // Try to load 3D preference from localStorage
      try {
        const saved3DPref = localStorage.getItem('void_rift_3d_mode');
        if (saved3DPref !== null) {
          use3DMode = saved3DPref === 'true';
        }
      } catch (e) {
        console.warn('Could not load 3D preference:', e);
      }
      
      game3D.setEnabled(use3DMode);
    } else {
      console.warn('3D mode initialization failed, falling back to 2D');
      use3DMode = false;
    }
    
    return success;
  } catch (error) {
    console.error('Error initializing 3D mode:', error);
    use3DMode = false;
    return false;
  }
}

/**
 * Toggle between 2D and 3D modes
 * @returns {boolean} New mode state (true = 3D, false = 2D)
 */
function toggle3DMode() {
  if (!game3D) {
    console.warn('3D mode not initialized');
    return false;
  }

  use3DMode = !use3DMode;
  game3D.setEnabled(use3DMode);

  // Save preference
  try {
    localStorage.setItem('void_rift_3d_mode', use3DMode.toString());
  } catch (e) {
    console.warn('Could not save 3D preference:', e);
  }

  console.log(`Switched to ${use3DMode ? '3D' : '2D'} mode`);
  return use3DMode;
}

/**
 * Check if 3D mode is currently active
 * @returns {boolean} True if 3D mode is active
 */
function is3DModeActive() {
  return game3D && game3D.enabled;
}

/**
 * Update 3D game state
 * This should be called from the main game loop
 * @param {object} gameState - Current game state with entities
 */
function update3D(gameState) {
  if (!is3DModeActive()) return;

  const { player, bullets, enemies, camera, boosting } = gameState;

  // Update player ship
  if (player) {
    if (!game3D.playerShip3D) {
      // Create player ship if it doesn't exist
      // This will be called with proper ship data from the main game
      const shipData = gameState.shipData || {
        shape: 'spear',
        scale: 1,
        colors: {
          primary: '#0ea5e9',
          accent: '#38bdf8',
          thruster: '#f97316'
        }
      };
      game3D.createPlayerShip(player, shipData);
    }
    
    game3D.updatePlayerShip(player, boosting || false);
    game3D.updateCamera(player);
  }

  // Sync bullets
  if (bullets) {
    game3D.syncBullets(bullets);
  }

  // Sync enemies
  if (enemies) {
    game3D.syncEnemies(enemies);
  }
}

/**
 * Render 3D scene
 * This should be called from the main game loop INSTEAD of 2D rendering when active
 */
function render3D() {
  if (!is3DModeActive()) return false;

  game3D.render();
  return true; // Indicates 3D rendering was performed
}

/**
 * Handle window resize
 */
function resize3D() {
  if (game3D) {
    game3D.resize();
  }
}

/**
 * Create screen shake effect
 * @param {number} intensity - Shake intensity
 */
function shake3D(intensity) {
  if (is3DModeActive()) {
    game3D.shake(intensity);
  }
}

/**
 * Clean up 3D resources
 */
function dispose3D() {
  if (game3D) {
    game3D.dispose();
    game3D = null;
  }
}

/**
 * Get quality settings
 * @returns {object|null} Quality settings or null
 */
function get3DQualitySettings() {
  return game3D ? game3D.getQualitySettings() : null;
}

/**
 * Set quality settings
 * @param {object} settings - Quality settings
 */
function set3DQualitySettings(settings) {
  if (game3D) {
    game3D.setQualitySettings(settings);
  }
}

// Export functions for use in main game
if (typeof window !== 'undefined') {
  window.__VOID_RIFT_3D__ = {
    init: init3DMode,
    toggle: toggle3DMode,
    isActive: is3DModeActive,
    update: update3D,
    render: render3D,
    resize: resize3D,
    shake: shake3D,
    dispose: dispose3D,
    getQualitySettings: get3DQualitySettings,
    setQualitySettings: set3DQualitySettings
  };
}

export {
  init3DMode,
  toggle3DMode,
  is3DModeActive,
  update3D,
  render3D,
  resize3D,
  shake3D,
  dispose3D,
  get3DQualitySettings,
  set3DQualitySettings
};
