/**
 * Asteroid obstacle class
 */

import { rand, randomAround } from '../utils/math.js';

/**
 * Asteroid class representing environmental obstacles
 */
export class Asteroid {
  /**
   * Create an asteroid
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} r - Radius
   * @param {string} variant - Visual variant ('rock', 'iron', 'ember')
   */
  constructor(x, y, r, variant = 'rock') {
    this.x = x;
    this.y = y;
    this.r = r;
    this.variant = variant;
    this.rot = rand(0, Math.PI * 2);
    this.vx = rand(-0.45, 0.45);
    this.vy = rand(-0.45, 0.45);
    this.vr = rand(-0.012, 0.012);
    this.hp = Math.max(3, Math.round(r / 10));
    this.points = [];

    // Generate random asteroid shape
    const seg = 8 + Math.floor(Math.random() * 4);
    for (let i = 0; i < seg; i++) {
      const a = (i / seg) * Math.PI * 2;
      const rr = r * rand(0.7, 1.15);
      this.points.push({ a, rr });
    }
  }

  /**
   * Draw the asteroid
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   */
  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);

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

    // Add gradient for depth
    const grd = ctx.createLinearGradient(-this.r, -this.r, this.r, this.r);
    grd.addColorStop(0, 'rgba(255,255,255,0.1)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.strokeStyle = grd;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Update asteroid position and rotation
   * @param {number} dt - Delta time
   * @param {Object} player - Player reference for boundary checking
   * @param {Function} viewRadius - Function to get view radius
   */
  update(dt, player, viewRadius) {
    const step = dt / 16.67;
    this.x += this.vx * step;
    this.y += this.vy * step;
    this.rot += this.vr * step;

    if (!player) return;

    const limit = viewRadius(1.8);
    const dx = this.x - player.x;
    const dy = this.y - player.y;
    
    if (dx * dx + dy * dy > limit * limit) {
      this.resetPosition(player, viewRadius);
    }
  }

  /**
   * Reset asteroid to a new position around player
   * @param {Object} player - Player reference
   * @param {Function} viewRadius - Function to get view radius
   */
  resetPosition(player, viewRadius) {
    if (!player) return;
    
    const outer = viewRadius(1.4);
    const inner = viewRadius(0.45);
    const pos = randomAround(player.x, player.y, inner, outer);
    
    this.x = pos.x;
    this.y = pos.y;
    this.vx = rand(-0.45, 0.45);
    this.vy = rand(-0.45, 0.45);
    this.hp = Math.max(3, Math.round(this.r / 10));
  }
}
