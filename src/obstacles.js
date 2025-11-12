/**
 * Obstacles Module - Handles all obstacle-related game logic
 * 
 * This module encapsulates asteroid entities and spawning mechanics.
 * Designed for testability and maintainability.
 * 
 * Dependencies (must be defined in script.js before this module is used):
 * - BASE: config object with obstacle constants
 * - Global game state: player, level
 * - Utility functions: rand, viewRadius, randomAround
 * 
 * Exports to global scope:
 * - Asteroid class
 * - spawnObstacles function
 * 
 * @module obstacles
 */

/**
 * Asteroid Class - Represents an obstacle entity in the game
 * 
 * Asteroids drift through space and can be damaged by weapons.
 * They come in different variants: rock, ember, and iron.
 * 
 * @testable
 * - Constructor: Can test asteroid creation with different variants
 * - draw(): Can test rendering with mock canvas context
 * - update(): Can test movement and boundary logic
 * - resetPosition(): Can test repositioning logic
 */
class Asteroid {
  /**
   * Creates a new asteroid entity
   * @param {number} x - Initial x position
   * @param {number} y - Initial y position
   * @param {number} r - Asteroid radius
   * @param {string} variant - Asteroid type: 'rock', 'ember', or 'iron' (default: 'rock')
   */
  constructor(x, y, r, variant = 'rock') {
    this.x = x;
    this.y = y;
    this.r = r;
    this.variant = variant;
    this.rot = window.rand(0, Math.PI * 2);
    this.vx = window.rand(-0.45, 0.45);
    this.vy = window.rand(-0.45, 0.45);
    this.vr = window.rand(-0.012, 0.012);
    this.hp = Math.max(3, Math.round(r / 10));
    
    // Generate irregular shape
    this.points = [];
    const seg = 8 + Math.floor(Math.random() * 4);
    for (let i = 0; i < seg; i++) {
      const a = (i / seg) * Math.PI * 2;
      const rr = r * window.rand(0.7, 1.15);
      this.points.push({ a, rr });
    }
  }

  /**
   * Renders the asteroid on the canvas
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @testable - Can mock canvas context to verify draw calls
   */
  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    
    // Color based on variant
    let fill = '#1f2937';
    let stroke = '#9ca3af';
    if (this.variant === 'ember') {
      fill = '#3b0d0d';
      stroke = '#f87171';
    } else if (this.variant === 'iron') {
      fill = '#111827';
      stroke = '#94a3b8';
    }
    
    ctx.strokeStyle = stroke;
    ctx.fillStyle = fill;
    ctx.lineWidth = 2.2;
    
    // Draw irregular polygon
    ctx.beginPath();
    for (let i = 0; i < this.points.length; i++) {
      const { a, rr } = this.points[i];
      const px = Math.cos(a) * rr;
      const py = Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // Add highlight gradient
    const grd = ctx.createLinearGradient(-this.r, -this.r, this.r, this.r);
    grd.addColorStop(0, 'rgba(255,255,255,0.1)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.strokeStyle = grd;
    ctx.lineWidth = 1;
    ctx.stroke();
    
    ctx.restore();
  }

  /**
   * Updates asteroid position and rotation
   * @param {number} dt - Delta time in milliseconds
   * @testable - Can test movement updates
   */
  update(dt) {
    const step = dt / 16.67;
    this.x += this.vx * step;
    this.y += this.vy * step;
    this.rot += this.vr * step;
    
    if (!window.player) return;
    
    // Reset position if too far from player
    const limit = window.viewRadius(1.8);
    const dx = this.x - window.player.x;
    const dy = this.y - window.player.y;
    if (dx * dx + dy * dy > limit * limit) {
      this.resetPosition();
    }
  }

  /**
   * Repositions the asteroid around the player
   * @testable - Can test repositioning logic
   */
  resetPosition() {
    if (!window.player) return;
    const outer = window.viewRadius(1.4);
    const inner = window.viewRadius(0.45);
    const pos = window.randomAround(window.player.x, window.player.y, inner, outer);
    this.x = pos.x;
    this.y = pos.y;
    this.vx = window.rand(-0.45, 0.45);
    this.vy = window.rand(-0.45, 0.45);
    this.hp = Math.max(3, Math.round(this.r / 10));
  }
}

/**
 * Spawns asteroids around the player
 * Populates the global obstacles array.
 * 
 * @testable - Can test obstacle spawning with mock dependencies
 */
const spawnObstacles = () => {
  window.obstacles = [];
  if (!window.player) return;
  
  const count = window.BASE.OBST_ASTEROIDS + Math.floor(window.level / 2);
  const inner = window.viewRadius(0.35);
  const outer = window.viewRadius(1.2);
  
  for (let i = 0; i < count; i++) {
    const r = window.rand(18, 42);
    const pos = window.randomAround(window.player.x, window.player.y, inner, outer);
    const roll = Math.random();
    let variant = 'rock';
    if (roll < 0.25) variant = 'iron';
    else if (roll > 0.75) variant = 'ember';
    window.obstacles.push(new Asteroid(pos.x, pos.y, r, variant));
  }
};

// Export to global scope
window.Asteroid = Asteroid;
window.spawnObstacles = spawnObstacles;
