/**
 * Utility functions for the Void Rift game
 * Extracted for testing purposes
 */

/**
 * Clamps a value between min and max
 * @param {number} value - The value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

/**
 * Generates a random number between min and max
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random number
 */
const rand = (min, max) => min + Math.random() * (max - min);

/**
 * Returns true with probability p
 * @param {number} p - Probability (0-1)
 * @returns {boolean} Random boolean based on probability
 */
const chance = (p) => Math.random() < p;

/**
 * Calculates XP required for a given level
 * @param {number} lvl - The level number
 * @returns {number} XP required for that level
 */
const XP_PER_LEVEL = (lvl) => Math.floor(160 + Math.pow(lvl, 1.65) * 55);

/**
 * Calculates the cost of an upgrade at a given level
 * @param {Object} upgrade - Upgrade object with base, step properties
 * @param {number} currentLevel - Current upgrade level
 * @returns {number} Cost of the upgrade
 */
const calculateUpgradeCost = (upgrade, currentLevel) => {
  return Math.floor(upgrade.base + upgrade.step * (currentLevel * 1.5 + currentLevel * currentLevel * 0.35));
};

/**
 * Generates a random position around a center point
 * @param {number} cx - Center X coordinate
 * @param {number} cy - Center Y coordinate
 * @param {number} min - Minimum distance
 * @param {number} max - Maximum distance
 * @returns {Object} Object with x and y coordinates
 */
const randomAround = (cx, cy, min, max) => {
  const angle = rand(0, Math.PI * 2);
  const dist = rand(min, max);
  return {
    x: cx + Math.cos(angle) * dist,
    y: cy + Math.sin(angle) * dist
  };
};

/**
 * Calculates distance between two points
 * @param {number} x1 - First point X
 * @param {number} y1 - First point Y
 * @param {number} x2 - Second point X
 * @param {number} y2 - Second point Y
 * @returns {number} Distance
 */
const distance = (x1, y1, x2, y2) => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.hypot(dx, dy);
};

/**
 * Checks if two circles collide
 * @param {number} x1 - First circle X
 * @param {number} y1 - First circle Y
 * @param {number} r1 - First circle radius
 * @param {number} x2 - Second circle X
 * @param {number} y2 - Second circle Y
 * @param {number} r2 - Second circle radius
 * @returns {boolean} True if circles collide
 */
const circleCollision = (x1, y1, r1, x2, y2, r2) => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy);
  return dist <= r1 + r2;
};

/**
 * Calculates the ground height at a given x position using linear interpolation
 * @param {Array} terrainPoints - Array of {x, y} terrain points
 * @param {number} x - X coordinate to get height at
 * @param {number} defaultY - Default Y value if no terrain
 * @returns {number} Ground Y coordinate at the given X
 */
const getTerrainHeightAt = (terrainPoints, x, defaultY = 0) => {
  if (!terrainPoints || terrainPoints.length < 2) return defaultY;
  
  for (let i = 0; i < terrainPoints.length - 1; i++) {
    const t1 = terrainPoints[i];
    const t2 = terrainPoints[i + 1];
    
    if (x >= t1.x && x < t2.x) {
      const t = (x - t1.x) / (t2.x - t1.x);
      return t1.y + (t2.y - t1.y) * t;
    }
  }
  
  return defaultY;
};

/**
 * Applies gravity to a velocity value
 * @param {number} velocityY - Current vertical velocity
 * @param {number} gravity - Gravity strength
 * @param {number} maxFallSpeed - Maximum fall speed
 * @param {number} dt - Delta time in ms
 * @returns {number} New vertical velocity
 */
const applyGravity = (velocityY, gravity, maxFallSpeed, dt) => {
  const newVelocity = velocityY + gravity * (dt / 16.67);
  return Math.min(newVelocity, maxFallSpeed);
};

/**
 * Checks if an entity is on ground
 * @param {number} entityY - Entity Y position
 * @param {number} entitySize - Entity size/radius
 * @param {number} groundY - Ground Y position
 * @returns {boolean} True if entity is on or below ground
 */
const isOnGround = (entityY, entitySize, groundY) => {
  return entityY + entitySize >= groundY;
};

/**
 * Planet configuration templates
 */
const PLANET_CONFIGS = {
  terra: { gravity: 0.4, name: 'Terra Prime' },
  mars: { gravity: 0.28, name: 'Crimson Dunes' },
  ice: { gravity: 0.45, name: 'Glacial Expanse' },
  volcanic: { gravity: 0.5, name: 'Inferno Core' },
  moon: { gravity: 0.15, name: 'Lunar Surface' }
};

// Export for CommonJS (Node/Jest)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    clamp,
    rand,
    chance,
    XP_PER_LEVEL,
    calculateUpgradeCost,
    randomAround,
    distance,
    circleCollision,
    getTerrainHeightAt,
    applyGravity,
    isOnGround,
    PLANET_CONFIGS
  };
}

// Export for browser (if needed in future)
if (typeof window !== 'undefined') {
  window.GameUtils = {
    clamp,
    rand,
    chance,
    XP_PER_LEVEL,
    calculateUpgradeCost,
    randomAround,
    distance,
    circleCollision,
    getTerrainHeightAt,
    applyGravity,
    isOnGround,
    PLANET_CONFIGS
  };
}
