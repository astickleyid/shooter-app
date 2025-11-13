/**
 * Collectibles Module - Handles all collectible item game logic
 * 
 * This module encapsulates coin and supply crate entities.
 * Designed for testability and maintainability.
 * 
 * Dependencies (must be defined in script.js before this module is used):
 * - BASE: config object with coin/collectible constants
 * - Utility functions: rand
 * 
 * Exports to global scope:
 * - Coin class
 * - SupplyCrate class
 * 
 * @module collectibles
 */

/**
 * Coin Class - Represents a currency collectible
 * 
 * Coins have a limited lifetime and visual effects that indicate expiration.
 * 
 * @testable
 * - Constructor: Can test coin creation
 * - draw(): Can test rendering with mock canvas context
 */
class Coin {
  /**
   * Creates a new coin entity
   * @param {number} x - Initial x position
   * @param {number} y - Initial y position
   */
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.r = window.BASE.COIN_SIZE;
    this.created = performance.now();
    this.life = window.BASE.COIN_LIFETIME;
  }

  /**
   * Renders the coin on the canvas with animated effects
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @testable - Can mock canvas context to verify draw calls
   */
  draw(ctx) {
    const age = performance.now() - this.created;
    const rem = (this.life - age) / this.life;
    // Blink when near expiration
    if (rem < 0.3 && ((age / 100) | 0) % 2 === 0) return;
    ctx.globalAlpha = Math.max(0, rem);
    
    // Wobble animation
    const wobble = Math.sin((performance.now() + this.created) / 220) * 0.2;
    const rx = this.r * (1 + wobble * 0.08);
    const ry = this.r * (1 - wobble * 0.2);
    
    // Gradient fill
    const grd = ctx.createRadialGradient(this.x - rx * 0.3, this.y - ry * 0.3, 2, this.x, this.y, rx);
    grd.addColorStop(0, '#fff7b2');
    grd.addColorStop(0.4, '#facc15');
    grd.addColorStop(1, '#b45309');
    ctx.fillStyle = grd;
    ctx.strokeStyle = '#fde68a';
    ctx.lineWidth = 1.6;
    
    // Main coin body
    ctx.beginPath();
    ctx.ellipse(this.x, this.y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Inner ring
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(this.x, this.y, rx * 0.55, ry * 0.55, 0, 0, Math.PI * 2);
    ctx.stroke();
    
    // Highlight
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.beginPath();
    ctx.ellipse(this.x - rx * 0.2, this.y - ry * 0.4, rx * 0.18, ry * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.globalAlpha = 1;
  }
}

/**
 * SupplyCrate Class - Represents a supply drop collectible
 * 
 * Supply crates provide ammo, secondary charges, or defense boosts.
 * 
 * @testable
 * - Constructor: Can test crate creation with different kinds
 * - draw(): Can test rendering with mock canvas context
 */
class SupplyCrate {
  /**
   * Creates a new supply crate entity
   * @param {number} x - Initial x position
   * @param {number} y - Initial y position
   * @param {string} kind - Supply type: 'ammo', 'secondary', or 'defense' (default: 'ammo')
   */
  constructor(x, y, kind = 'ammo') {
    this.x = x;
    this.y = y;
    this.kind = kind;
    this.size = 12;
    this.created = performance.now();
    this.life = 12000;
    this.spin = window.rand(0, Math.PI * 2);
  }

  /**
   * Renders the supply crate on the canvas with animated effects
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @testable - Can mock canvas context to verify draw calls
   */
  draw(ctx) {
    const age = performance.now() - this.created;
    const pulse = 0.65 + Math.sin(age / 160) * 0.2;
    
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.spin + age / 500);
    
    // Color based on supply type
    const color = this.kind === 'ammo' ? '#bef264' : this.kind === 'secondary' ? '#38bdf8' : '#c084fc';
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.85;
    
    // Rounded rectangle dimensions
    const w = this.size * 2 * pulse;
    const h = this.size * 1.2;
    const r = 6;
    const x = -this.size * pulse;
    const y = -this.size * 0.6;
    
    // Draw rounded rectangle
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
    
    ctx.globalAlpha = 1;
    ctx.strokeStyle = 'rgba(17,24,39,0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.restore();
  }
}

// Export to global scope
window.Coin = Coin;
window.SupplyCrate = SupplyCrate;
