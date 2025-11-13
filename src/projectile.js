/**
 * Projectile Module - Handles all projectile-related game logic
 * 
 * This module encapsulates bullet entities for both player and enemy projectiles.
 * Designed for testability and maintainability.
 * 
 * Dependencies (must be defined in script.js before this module is used):
 * - BASE: config object with bullet constants
 * - Global game state: player
 * - Utility functions: rand
 * 
 * Exports to global scope:
 * - Bullet class
 * 
 * @module projectile
 */

/**
 * Bullet Class - Represents a projectile entity in the game
 * 
 * Can be used for both player and enemy projectiles with different visual styles.
 * 
 * @testable
 * - Constructor: Can test bullet creation with different parameters
 * - draw(): Can test rendering with mock canvas context
 * - update(): Can test movement logic
 * - expired(): Can test expiration conditions
 */
class Bullet {
  /**
   * Creates a new bullet entity
   * @param {number} x - Initial x position
   * @param {number} y - Initial y position
   * @param {Object} vel - Velocity vector {x, y} (normalized direction)
   * @param {number} damage - Damage amount
   * @param {string} color - Bullet color (default: '#fde047')
   * @param {number} speed - Bullet speed multiplier (default: BASE.BULLET_SPEED)
   * @param {number} size - Bullet size (default: BASE.BULLET_SIZE)
   * @param {number} pierce - Pierce count (default: 0)
   * @param {boolean} isEnemy - Whether this is an enemy bullet (default: false)
   */
  constructor(x, y, vel, damage, color = '#fde047', speed = window.BASE.BULLET_SPEED, size = window.BASE.BULLET_SIZE, pierce = 0, isEnemy = false) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.vel = vel;
    this.damage = damage;
    this.life = 0;
    this.maxLife = 2200;
    this.color = color;
    this.speed = speed;
    this.pierce = pierce;
    this.isEnemy = isEnemy;
  }

  /**
   * Renders the bullet on the canvas
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @testable - Can mock canvas context to verify draw calls
   */
  draw(ctx) {
    if (this.isEnemy) {
      // Enemy bullets: glowing red plasma orbs
      ctx.shadowColor = '#dc2626';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * 1.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      
      // Inner core
      ctx.fillStyle = '#fca5a5';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * 0.6, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Player bullets: bright energy bolts with trail
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 6;
      ctx.fillStyle = this.color;
      
      // Elongated bullet shape
      const angle = Math.atan2(this.vel.y, this.vel.x);
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(angle);
      
      // Draw elongated diamond
      ctx.beginPath();
      ctx.moveTo(this.size * 2, 0);
      ctx.lineTo(0, -this.size);
      ctx.lineTo(-this.size, 0);
      ctx.lineTo(0, this.size);
      ctx.closePath();
      ctx.fill();
      
      // Bright core
      ctx.fillStyle = '#fff';
      ctx.fillRect(-this.size * 0.5, -this.size * 0.4, this.size, this.size * 0.8);
      
      ctx.restore();
      ctx.shadowBlur = 0;
    }
  }

  /**
   * Updates bullet position based on velocity
   * @param {number} dt - Delta time in milliseconds
   * @testable - Can test position updates
   */
  update(dt) {
    const step = dt / 16.67;
    this.x += this.vel.x * this.speed * step;
    this.y += this.vel.y * this.speed * step;
    this.life += dt;
  }

  /**
   * Checks if the bullet should be removed
   * @param {number} maxDistance - Maximum distance from player before removal
   * @returns {boolean} True if bullet should be removed
   * @testable - Can test expiration logic
   */
  expired(maxDistance) {
    if (this.life > this.maxLife) return true;
    if (!window.player) return false;
    const dx = this.x - window.player.x;
    const dy = this.y - window.player.y;
    return dx * dx + dy * dy > maxDistance * maxDistance;
  }
}

// Export to global scope
window.Bullet = Bullet;
