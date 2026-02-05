/**
 * Math utility functions for game calculations
 */

/**
 * Clamp a value between min and max
 * @param {number} value - The value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

/**
 * Generate a random number between min and max
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random number
 */
export const rand = (min, max) => min + Math.random() * (max - min);

/**
 * Check if random chance succeeds
 * @param {number} probability - Probability between 0 and 1
 * @returns {boolean} True if chance succeeds
 */
export const chance = (probability) => Math.random() < probability;

/**
 * Generate a random position around a center point
 * @param {number} cx - Center X coordinate
 * @param {number} cy - Center Y coordinate
 * @param {number} min - Minimum distance from center
 * @param {number} max - Maximum distance from center
 * @returns {{x: number, y: number}} Random position
 */
export const randomAround = (cx, cy, min, max) => {
  const angle = rand(0, Math.PI * 2);
  const dist = rand(min, max);
  return {
    x: cx + Math.cos(angle) * dist,
    y: cy + Math.sin(angle) * dist
  };
};

/**
 * Calculate distance between two points
 * @param {number} x1 - First point X
 * @param {number} y1 - First point Y
 * @param {number} x2 - Second point X
 * @param {number} y2 - Second point Y
 * @returns {number} Distance
 */
export const distance = (x1, y1, x2, y2) => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Calculate distance squared (faster than distance for comparisons)
 * @param {number} x1 - First point X
 * @param {number} y1 - First point Y
 * @param {number} x2 - Second point X
 * @param {number} y2 - Second point Y
 * @returns {number} Distance squared
 */
export const distanceSquared = (x1, y1, x2, y2) => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return dx * dx + dy * dy;
};
