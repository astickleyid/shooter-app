/**
 * Particle System - Manages visual effects particles
 */

import { rand, chance } from '../utils/math.js';

/**
 * ParticleSystem class for managing visual effect particles
 */
export class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  /**
   * Add particles to the system
   * @param {string} kind - Type of particles
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} angle - Angle for directional particles
   * @param {number} count - Number of particles
   * @param {string} colorOverride - Optional color override
   */
  add(kind, x, y, angle = 0, count = 8, colorOverride = null) {
    for (let i = 0; i < count; i++) {
      const particle = this._createParticle(kind, x, y, angle, i, colorOverride);
      if (particle) {
        this.particles.push(particle);
      }
    }
  }

  /**
   * Create a single particle
   * @private
   */
  _createParticle(kind, x, y, angle, index, colorOverride) {
    switch (kind) {
      case 'muzzle':
        return {
          x: x + Math.cos(angle) * 10,
          y: y + Math.sin(angle) * 10,
          vx: rand(-1, 1),
          vy: rand(-1, 1),
          life: 220,
          c: '#ffd54f',
          s: 2
        };

      case 'pop':
        return {
          x,
          y,
          vx: rand(-2, 2),
          vy: rand(-2, 2),
          life: 320,
          c: '#fca5a5',
          s: 2
        };

      case 'sparks':
        return {
          x,
          y,
          vx: rand(-2.6, 2.6),
          vy: rand(-2.6, 2.6),
          life: 160,
          c: '#ffffff',
          s: 1.5
        };

      case 'debris':
        return {
          x,
          y,
          vx: rand(-1.5, 1.5),
          vy: rand(-1.5, 1.5),
          life: 400,
          c: '#9ca3af',
          s: 2.4
        };

      case 'thruster':
        return {
          x,
          y,
          vx: rand(-0.6, 0.6),
          vy: rand(-0.6, 0.6),
          life: 180 + rand(-40, 60),
          c: colorOverride || '#ff9a3c',
          s: 1.8 + rand(-0.4, 0.6)
        };

      case 'levelup':
        return {
          x,
          y,
          vx: rand(-2.2, 2.2),
          vy: rand(-2.2, 2.2),
          life: 420,
          c: chance(0.5) ? '#38bdf8' : '#a855f7',
          s: 3
        };

      case 'nova':
        {
          const palette = ['#fde68a', '#f97316'];
          return {
            x,
            y,
            vx: rand(-3, 3),
            vy: rand(-3, 3),
            life: 260,
            c: palette[index % palette.length],
            s: 3
          };
        }

      case 'shield':
        return {
          x: x + rand(-14, 14),
          y: y + rand(-14, 14),
          vx: rand(-0.5, 0.5),
          vy: rand(-0.5, 0.5),
          life: 220,
          c: 'rgba(148,163,246,0.8)',
          s: 2
        };

      case 'ultimate':
        {
          const palette = ['#f97316', '#a855f7'];
          return {
            x: x + rand(-4, 4),
            y: y + rand(-4, 4),
            vx: rand(-4, 4),
            vy: rand(-4, 4),
            life: 320,
            c: palette[index % palette.length],
            s: 4
          };
        }

      default:
        return null;
    }
  }

  /**
   * Update all particles
   * @param {number} dt - Delta time in milliseconds
   */
  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= dt;
      
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  /**
   * Draw all particles
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   */
  draw(ctx) {
    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, p.life / 320);
      ctx.fillStyle = p.c;
      ctx.fillRect(p.x, p.y, p.s, p.s);
    }
    ctx.globalAlpha = 1;
  }

  /**
   * Clear all particles
   */
  clear() {
    this.particles = [];
  }

  /**
   * Get particle count
   * @returns {number} Number of active particles
   */
  count() {
    return this.particles.length;
  }
}
