/**
 * Player Module - Handles all player-related game logic
 * 
 * This module encapsulates the player entity, ship rendering, and player mechanics.
 * Designed for testability and maintainability.
 * 
 * Dependencies (must be defined in script.js before this module is used):
 * - BASE: config object with player constants
 * - SHIP_TEMPLATES: array of ship configurations
 * - Global game state: input, currentShip, Save, enemies, bullets, lastShotTime, lastAmmoRegen
 *   tookDamageThisLevel, gameRunning
 * - Utility functions: clamp, rand, chance
 * - Game functions: shipStat, getShipTemplate, currentPrimaryWeapon, currentSecondarySystem,
 *   currentDefenseSystem, currentUltimateSystem, addParticles, shakeScreen, 
 *   applyRadialDamage, applyBeamDamage, queueTimedEffect
 * 
 * Exports to global scope:
 * - PlayerEntity class
 * - drawShip function
 * 
 * @module player
 */

/**
 * Draws a ship on the canvas
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {string} shipId - Ship template ID
 * @param {number} size - Ship size
 */
const drawShip = (ctx, shipId, size) => {
  const template = window.getShipTemplate(shipId) || window.SHIP_TEMPLATES[0];
  const colors = template.colors || {};
  const primary = colors.primary || '#0ea5e9';
  const trim = colors.trim || '#ffffff';
  const accent = colors.accent || trim;
  const canopy = colors.canopy || '#7dd3fc';
  const shape = template.shape || 'spear';
  
  ctx.fillStyle = primary;
  ctx.strokeStyle = trim;
  ctx.lineWidth = Math.max(2, size * 0.14);
  ctx.beginPath();
  
  // Draw ship hull based on shape
  if (shape === 'needle') {
    ctx.moveTo(size * 1.28, 0);
    ctx.lineTo(-size * 0.45, -size * 0.42);
    ctx.lineTo(-size * 0.95, -size * 0.08);
    ctx.lineTo(-size * 0.95, size * 0.08);
    ctx.lineTo(-size * 0.45, size * 0.42);
  } else if (shape === 'bastion') {
    ctx.moveTo(size * 1.05, 0);
    ctx.lineTo(size * 0.42, -size * 1.05);
    ctx.lineTo(-size * 0.58, -size * 0.9);
    ctx.lineTo(-size * 1.05, -size * 0.28);
    ctx.lineTo(-size * 1.05, size * 0.28);
    ctx.lineTo(-size * 0.58, size * 0.9);
  } else if (shape === 'razor') {
    ctx.moveTo(size * 1.25, 0);
    ctx.lineTo(size * 0.42, -size * 0.72);
    ctx.lineTo(-size * 0.82, -size * 0.38);
    ctx.lineTo(-size * 0.28, 0);
    ctx.lineTo(-size * 0.82, size * 0.38);
    ctx.lineTo(size * 0.42, size * 0.72);
  } else {
    // Default spear shape
    ctx.moveTo(size * 1.15, 0);
    ctx.lineTo(-size * 0.94, -size * 0.82);
    ctx.lineTo(-size * 0.22, 0);
    ctx.lineTo(-size * 0.94, size * 0.82);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Draw accent lines
  ctx.strokeStyle = accent;
  if (shape === 'needle') {
    ctx.lineWidth = size * 0.12;
    ctx.beginPath();
    ctx.moveTo(-size * 0.2, -size * 0.55);
    ctx.quadraticCurveTo(size * 0.45, -size * 0.2, size * 0.95, -size * 0.05);
    ctx.moveTo(-size * 0.2, size * 0.55);
    ctx.quadraticCurveTo(size * 0.45, size * 0.2, size * 0.95, size * 0.05);
    ctx.stroke();
  } else if (shape === 'bastion') {
    ctx.lineWidth = size * 0.16;
    ctx.beginPath();
    ctx.moveTo(-size * 0.75, -size * 0.6);
    ctx.lineTo(size * 0.25, -size * 0.22);
    ctx.moveTo(-size * 0.75, size * 0.6);
    ctx.lineTo(size * 0.25, size * 0.22);
    ctx.stroke();
  } else if (shape === 'razor') {
    ctx.lineWidth = size * 0.12;
    ctx.beginPath();
    ctx.moveTo(-size * 0.55, -size * 0.28);
    ctx.lineTo(size * 0.78, -size * 0.15);
    ctx.moveTo(-size * 0.55, size * 0.28);
    ctx.lineTo(size * 0.78, size * 0.15);
    ctx.stroke();
  } else {
    ctx.lineWidth = size * 0.14;
    ctx.beginPath();
    ctx.moveTo(-size * 0.45, -size * 0.64);
    ctx.lineTo(size * 0.38, -size * 0.22);
    ctx.moveTo(-size * 0.45, size * 0.64);
    ctx.lineTo(size * 0.38, size * 0.22);
    ctx.stroke();
  }

  // Draw canopy
  const canopyX = shape === 'bastion' ? size * 0.15 : size * 0.3;
  const canopyW = size * (shape === 'bastion' ? 0.42 : 0.36);
  const canopyH = size * 0.28;
  ctx.fillStyle = canopy;
  ctx.beginPath();
  ctx.ellipse(canopyX, 0, canopyW, canopyH, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.45)';
  ctx.lineWidth = size * 0.05;
  ctx.beginPath();
  ctx.ellipse(canopyX - size * 0.08, -size * 0.08, canopyW * 0.35, canopyH * 0.35, 0, 0, Math.PI * 2);
  ctx.stroke();
};

/**
 * PlayerEntity Class - Represents the player character
 * 
 * Handles all player mechanics including movement, shooting, abilities, and upgrades.
 * 
 * @testable
 * - Constructor: Can test player creation
 * - reconfigureLoadout(): Can test loadout changes
 * - draw(): Can test rendering with mock canvas context
 * - update(): Can test player logic
 * - shoot(): Can test weapon firing
 * - takeDamage(): Can test damage handling
 */
class PlayerEntity {
  /**
   * Creates a new player entity
   * @param {number} x - Initial x position
   * @param {number} y - Initial y position
   */
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = window.BASE.PLAYER_SIZE;
    this.engineOffset = 1.1;
    this.lookAngle = 0;
    this.vel = { x: 0, y: 0 };
    this.lastRegenT = performance.now();
    this.invEnd = 0;
    this.flash = false;
    this.secondaryReadyAt = performance.now();
    this.secondaryCooldownMs = 0;
    this.secondaryAmmo = 0;
    this.secondaryCapacity = 0;
    this.defenseReadyAt = performance.now();
    this.defenseActiveUntil = 0;
    this.ultimateCharge = 0;
    this.ultimateChargeMax = 100;
    this.lastUltimateAt = 0;
    this.ammoPerShot = 1;
    this.secondaryLatch = false;
    this.defenseLatch = false;
    this.reconfigureLoadout(false);
  }

  /**
   * Reconfigures player loadout based on current selections
   * @param {boolean} preserveVitals - Whether to preserve health/ammo ratios
   */
  reconfigureLoadout(preserveVitals = true) {
    this.primary = window.currentPrimaryWeapon();
    this.secondary = window.currentSecondarySystem();
    this.defense = window.currentDefenseSystem();
    this.ultimate = window.currentUltimateSystem();
    window.currentShip = window.getShipTemplate(window.Save.data.selectedShip);
    const template = window.currentShip || window.SHIP_TEMPLATES[0];
    this.shipColors = template.colors || {};
    
    const prevHealthRatio = preserveVitals && this.hpMax ? this.health / this.hpMax : 1;
    const prevAmmoRatio = preserveVitals && this.ammoMax ? this.ammo / this.ammoMax : 1;
    const prevSecondaryRatio = preserveVitals && this.secondaryCapacity ? this.secondaryAmmo / this.secondaryCapacity : 1;
    const prevUltimateRatio = preserveVitals && this.ultimateChargeMax ? this.ultimateCharge / this.ultimateChargeMax : 0;
    
    this.size = window.BASE.PLAYER_SIZE * (template.scale || 1);
    this.engineOffset = template.engineOffset || 1.1;
    const weaponStats = (this.primary && this.primary.stats) || {};
    this.ammoPerShot = Math.max(1, Math.round(weaponStats.ammoPerShot || 1));
    this.ammoMax = Math.max(1, Math.round(window.BASE.PLAYER_AMMO * window.shipStat('ammo', 1) * (weaponStats.ammo || 1)));
    
    const stats = this.#dynamicStats();
    this.hpMax = stats.hpMax;
    
    if (preserveVitals) {
      this.health = window.clamp(this.hpMax * prevHealthRatio, 1, this.hpMax);
      this.ammo = window.clamp(Math.round(this.ammoMax * prevAmmoRatio), 0, this.ammoMax);
    } else {
      this.health = this.hpMax;
      this.ammo = this.ammoMax;
    }
    
    const secondaryStats = (this.secondary && this.secondary.stats) || {};
    const defenseStats = (this.defense && this.defense.stats) || {};
    const ultimateStats = (this.ultimate && this.ultimate.stats) || {};
    
    this.secondaryCapacity = Math.max(0, Math.round(secondaryStats.ammo || 0));
    this.secondaryCooldownMs = secondaryStats.cooldown || 9000;
    this.secondaryAmmo = preserveVitals ? window.clamp(Math.round(this.secondaryCapacity * prevSecondaryRatio), 0, this.secondaryCapacity) : this.secondaryCapacity;
    this.defenseStats = defenseStats;
    
    if (!preserveVitals) {
      this.defenseReadyAt = performance.now();
      this.defenseActiveUntil = 0;
    }
    
    this.ultimateChargeMax = Math.max(1, ultimateStats.charge || 100);
    this.ultimateCharge = window.clamp(this.ultimateChargeMax * prevUltimateRatio, 0, this.ultimateChargeMax);
  }

  /**
   * Calculates dynamic stats based on upgrades and loadout
   * @returns {Object} Stats object with all player stats
   * @private
   */
  #dynamicStats() {
    const L = (id) => window.Save.getUpgradeLevel(id);
    const weaponStats = (this.primary && this.primary.stats) || {};
    const fireBase = window.clamp(140 - L('firerate') * 18, 55, 999) * window.shipStat('fireRate', 1);
    const hpBase = (window.BASE.PLAYER_HEALTH + L('shield') * 22) * window.shipStat('hp', 1);
    const pickupBase = (26 + L('magnet') * 14) * window.shipStat('pickup', 1);
    const ammoRegenBase = window.clamp((window.BASE.AMMO_REGEN_MS - L('ammo') * 120) * window.shipStat('ammoRegen', 1), 280, 2200);
    const baseSpeed = window.BASE.PLAYER_SPEED * window.shipStat('speed', 1);
    const boostSpeed = (window.BASE.PLAYER_BOOST_SPEED + L('boost') * 0.9) * window.shipStat('boost', window.shipStat('speed', 1));
    
    return {
      fireCD: window.clamp(fireBase * (weaponStats.cd || 1), 35, 999),
      dmg: (1 + L('damage') * 0.6) * window.shipStat('damage', 1) * (weaponStats.damage || 1),
      multishot: 1 + L('multi') + (weaponStats.shots || 0),
      hpMax: hpBase,
      hpRegen5: L('regen') * 3,
      repulse: L('field') > 0 ? 2 + L('field') * 0.8 : 0,
      pickupR: pickupBase,
      ammoRegen: ammoRegenBase,
      boost: boostSpeed,
      speed: baseSpeed,
      weapon: weaponStats
    };
  }

  /**
   * Gets thruster color from ship template
   * @returns {string} Thruster color hex code
   */
  get thrusterColor() {
    return this.shipColors?.thruster || '#ff9a3c';
  }

  /**
   * Renders the player ship on the canvas
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   */
  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.lookAngle);
    
    const thrusterDist = this.size * (this.engineOffset || 1.1);
    if (window.chance(0.3)) {
      window.addParticles('thruster', this.x - Math.cos(this.lookAngle) * thrusterDist, this.y - Math.sin(this.lookAngle) * thrusterDist, 0, 1, this.thrusterColor);
    }
    
    drawShip(ctx, window.currentShip?.id || window.Save.data.selectedShip, this.size);
    
    const glow = Math.max(0, (this.invEnd - performance.now()) / window.BASE.INVULN_MS);
    if (glow > 0 || this.flash) {
      ctx.globalAlpha = glow > 0 ? 0.8 : 0.35;
      ctx.strokeStyle = glow > 0 ? '#93c5fd' : '#e5e7eb';
      ctx.lineWidth = glow > 0 ? 4 : 2;
      ctx.beginPath();
      ctx.arc(0, 0, this.size * 1.2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
      this.flash = false;
    }
    
    ctx.restore();
  }

  /**
   * Updates player state each frame
   * @param {number} dt - Delta time in milliseconds
   */
  update(dt) {
    const stats = this.#dynamicStats();
    const spd = window.input.isBoosting ? stats.boost : stats.speed;
    const moveMag = Math.hypot(window.input.moveX, window.input.moveY);
    let moving = false;
    
    if (moveMag > 0.01) {
      const nx = window.input.moveX / moveMag;
      const ny = window.input.moveY / moveMag;
      const step = spd * (dt / 16.67);
      this.x += nx * step;
      this.y += ny * step;
      this.vel.x = nx;
      this.vel.y = ny;
      moving = true;
    } else {
      this.vel.x = 0;
      this.vel.y = 0;
    }
    
    const hasAim = window.input.isAiming && (Math.abs(window.input.aimX) > 0.01 || Math.abs(window.input.aimY) > 0.01);
    if (hasAim) {
      this.lookAngle = Math.atan2(window.input.aimY, window.input.aimX);
      if (window.input.fireHeld && this.ammo >= this.ammoPerShot && performance.now() - window.lastShotTime > stats.fireCD) {
        this.shoot(stats);
        window.lastShotTime = performance.now();
      }
    } else if (moving) {
      this.lookAngle = Math.atan2(this.vel.y, this.vel.x);
    }

    if (this.ammo < this.ammoMax && performance.now() - window.lastAmmoRegen > stats.ammoRegen) {
      this.ammo = Math.min(this.ammoMax, this.ammo + 1);
      window.lastAmmoRegen = performance.now();
    }

    if (performance.now() - this.lastRegenT > 5000) {
      const heal = stats.hpRegen5;
      if (heal > 0) this.health = window.clamp(this.health + heal, 0, this.hpMax);
      this.lastRegenT = performance.now();
    }

    const knock = stats.repulse;
    if (knock > 0) {
      for (const enemy of window.enemies) {
        const dx = enemy.x - this.x;
        const dy = enemy.y - this.y;
        const dist = Math.hypot(dx, dy);
        if (dist < this.size + 18 + stats.pickupR * 0.4) {
          const nx = dx / (dist || 1);
          const ny = dy / (dist || 1);
          enemy.x += nx * knock;
          enemy.y += ny * knock;
        }
      }
    }
    
    const now = performance.now();
    
    // Automatic defense activation when enemies get close
    const defenseRange = this.size + 100;
    let enemyNearby = false;
    for (const enemy of window.enemies) {
      const dx = enemy.x - this.x;
      const dy = enemy.y - this.y;
      const dist = Math.hypot(dx, dy);
      if (dist < defenseRange) {
        enemyNearby = true;
        break;
      }
    }
    
    // Auto-activate defense if ready and enemies are close
    if (enemyNearby && !this.isDefenseActive(now) && now >= this.defenseReadyAt) {
      this.activateDefense(now);
    }

    if (window.input.altFireHeld && !this.secondaryLatch) {
      if (this.trySecondary(now)) window.input.altFireHeld = false;
      this.secondaryLatch = true;
    } else if (!window.input.altFireHeld) {
      this.secondaryLatch = false;
    }
    
    if (window.input.ultimateQueued) {
      this.fireUltimate(now);
      window.input.ultimateQueued = false;
    }
    
    if (now > this.defenseActiveUntil) this.defenseActiveUntil = 0;
  }

  /**
   * Fires the player's primary weapon
   * @param {Object} stats - Player stats object
   */
  shoot(stats) {
    const weaponStats = (this.primary && this.primary.stats) || {};
    if (this.ammo < this.ammoPerShot) return;
    
    this.ammo = Math.max(0, this.ammo - this.ammoPerShot);
    const shots = Math.max(1, Math.round(stats.multishot));
    const spread = weaponStats.spread || 0;
    const jitter = weaponStats.pelletJitter || 0;
    const color = this.primary?.color || window.currentShip?.colors?.accent || '#fde047';
    
    for (let i = 0; i < shots; i++) {
      const ratio = shots > 1 ? i / (shots - 1) - 0.5 : 0;
      let offset = spread ? spread * ratio : 0;
      if (jitter) offset += window.rand(-jitter, jitter);
      const angle = this.lookAngle + offset;
      const vel = { x: Math.cos(angle), y: Math.sin(angle) };
      const sx = this.x + Math.cos(angle) * this.size * 0.9;
      const sy = this.y + Math.sin(angle) * this.size * 0.9;
      const speed = window.BASE.BULLET_SPEED * (weaponStats.bulletSpeed || 1);
      const size = window.BASE.BULLET_SIZE * (weaponStats.bulletSize || 1);
      const pierce = weaponStats.pierce || 0;
      window.bullets.push(new window.Bullet(sx, sy, vel, stats.dmg, color, speed, size, pierce));
    }
    
    window.addParticles('muzzle', this.x, this.y, this.lookAngle, 6);
  }

  /**
   * Attempts to fire secondary weapon
   * @param {number} now - Current time
   * @returns {boolean} True if secondary was fired
   */
  trySecondary(now) {
    if (!this.secondary || this.secondaryCapacity <= 0) return false;
    if (this.secondaryAmmo <= 0) return false;
    if (now < this.secondaryReadyAt) return false;
    
    const stats = this.secondary.stats || {};
    this.secondaryAmmo--;
    this.secondaryReadyAt = now + (this.secondaryCooldownMs || 9000);
    
    const originX = this.x + Math.cos(this.lookAngle) * (this.size * 1.4);
    const originY = this.y + Math.sin(this.lookAngle) * (this.size * 1.4);
    
    window.addParticles('nova', originX, originY, 0, 24);
    window.shakeScreen(7, 220);
    
    if (this.secondary.id === 'cluster') {
      const clusters = stats.clusters || 5;
      for (let i = 0; i < clusters; i++) {
        window.queueTimedEffect(i * 90, () => {
          const ang = window.rand(0, Math.PI * 2);
          const dist = window.rand(24, stats.radius || 130);
          const cx = originX + Math.cos(ang) * dist;
          const cy = originY + Math.sin(ang) * dist;
          window.addParticles('nova', cx, cy, 0, 18);
          window.applyRadialDamage(cx, cy, (stats.radius || 130) * 0.55, stats.damage || 45, { knockback: 3.5, chargeMult: 0.5 });
        });
      }
    } else {
      window.applyRadialDamage(originX, originY, stats.radius || 150, stats.damage || 70, { knockback: 4.2, pull: 0.2, chargeMult: 0.6 });
    }
    
    return true;
  }

  /**
   * Activates defense system
   * @param {number} now - Current time
   * @returns {boolean} True if defense was activated
   */
  activateDefense(now) {
    if (!this.defense) return false;
    const stats = this.defense.stats || {};
    if (now < this.defenseReadyAt) return false;
    
    this.defenseReadyAt = now + (stats.cooldown || 12000);
    this.defenseActiveUntil = now + (stats.duration || 3000);
    window.addParticles('shield', this.x, this.y, 0, 24);
    window.shakeScreen(4, 140);
    
    return true;
  }

  /**
   * Checks if defense system is active
   * @param {number} now - Current time (default: performance.now())
   * @returns {boolean} True if defense is active
   */
  isDefenseActive(now = performance.now()) {
    return now < this.defenseActiveUntil;
  }

  /**
   * Fires ultimate ability
   * @param {number} now - Current time
   * @returns {boolean} True if ultimate was fired
   */
  fireUltimate(now) {
    if (!this.ultimate) return false;
    if (this.ultimateCharge < this.ultimateChargeMax) return false;
    if (now - this.lastUltimateAt < 600) return false;
    
    const stats = this.ultimate.stats || {};
    this.ultimateCharge = 0;
    this.lastUltimateAt = now;
    
    window.addParticles('ultimate', this.x, this.y, 0, 48);
    window.shakeScreen(12, 320);
    
    if (this.ultimate.id === 'solarbeam') {
      const length = stats.beamLength || 520;
      const width = stats.width || 90;
      window.applyBeamDamage(this.x, this.y, this.lookAngle, length, width, stats.damage || 220);
    } else {
      window.applyRadialDamage(this.x, this.y, stats.radius || 220, stats.damage || 160, { pull: stats.pull || 0.6, knockback: 8, chargeMult: 0 });
    }
    
    return true;
  }

  /**
   * Adds charge to ultimate meter
   * @param {number} amount - Amount of charge to add
   */
  addUltimateCharge(amount) {
    if (!amount || amount <= 0) return;
    this.ultimateCharge = window.clamp(this.ultimateCharge + amount, 0, this.ultimateChargeMax);
  }

  /**
   * Collects a supply crate
   * @param {string} kind - Supply type: 'ammo', 'secondary', or 'defense'
   */
  collectSupply(kind) {
    const now = performance.now();
    if (kind === 'ammo') {
      const gain = Math.max(1, Math.round(this.ammoMax * 0.45));
      this.ammo = window.clamp(this.ammo + gain, 0, this.ammoMax);
      window.lastAmmoRegen = now;
    } else if (kind === 'secondary') {
      if (this.secondaryCapacity > 0) {
        this.secondaryAmmo = window.clamp(this.secondaryAmmo + 1, 0, this.secondaryCapacity);
      }
    } else if (kind === 'defense') {
      this.defenseReadyAt = Math.min(this.defenseReadyAt, now + 400);
      this.defenseActiveUntil = Math.max(this.defenseActiveUntil, now + 600);
    }
    window.addParticles('shield', this.x, this.y, 0, 18);
    this.addUltimateCharge(12);
  }

  /**
   * Handles damage taken by player
   * @param {number} amount - Damage amount
   */
  takeDamage(amount) {
    const now = performance.now();
    if (now < this.invEnd) return;
    
    if (this.isDefenseActive(now)) {
      const absorb = this.defenseStats.absorb || 0;
      const mitigated = amount * absorb;
      amount = Math.max(0, amount - mitigated);
      if ((this.defenseStats.reflect || 0) > 0 && mitigated > 0) {
        window.applyRadialDamage(this.x, this.y, this.size * 4, mitigated * (this.defenseStats.reflect || 0.25), { knockback: 2, chargeMult: 0.2 });
      }
    }
    
    if (amount <= 0) return;
    
    window.tookDamageThisLevel = true;
    this.health -= amount;
    this.flash = true;
    this.invEnd = now + window.BASE.INVULN_MS;
    window.shakeScreen(4, 120);
    
    if (this.health <= 0) {
      this.health = 0;
      window.gameRunning = false;
    }
  }
}

// Export to global scope
window.PlayerEntity = PlayerEntity;
window.drawShip = drawShip;