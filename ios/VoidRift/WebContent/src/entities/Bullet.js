/**
 * Bullet entity class
 */

import { BASE } from '../core/config.js';

/**
 * Bullet class representing projectiles in the game
 */
export class Bullet {
  /**
   * Create a bullet
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {Object} vel - Velocity vector {x, y}
   * @param {number} damage - Damage amount
   * @param {string} color - Bullet color
   * @param {number} speed - Speed multiplier
   * @param {number} size - Bullet size
   * @param {number} pierce - Pierce count (how many enemies it can hit)
   * @param {boolean} isEnemy - Whether this is an enemy bullet
   */
  constructor(x, y, vel, damage, color = '#fde047', speed = BASE.BULLET_SPEED, size = BASE.BULLET_SIZE, pierce = 0, isEnemy = false) {
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
   * Draw the bullet
   * @param {CanvasRenderingContext2D} ctx - Canvas context
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
   * Update bullet position
   * @param {number} dt - Delta time in milliseconds
   */
  update(dt) {
    const step = dt / 16.67;
    this.x += this.vel.x * this.speed * step;
    this.y += this.vel.y * this.speed * step;
    this.life += dt;
  }

  /**
   * Check if bullet has expired
   * @param {number} maxDistance - Maximum distance from player
   * @param {Object} player - Player reference for distance check
   * @returns {boolean} True if expired
   */
  expired(maxDistance, player) {
    if (this.life > this.maxLife) return true;
    if (!player) return false;
    const dx = this.x - player.x;
    const dy = this.y - player.y;
    return dx * dx + dy * dy > maxDistance * maxDistance;
  }
}
