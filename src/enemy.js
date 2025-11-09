/**
 * Enemy Module - Handles all enemy-related game logic
 * 
 * This module encapsulates enemy entities, spawning mechanics, and collision/damage handling.
 * Designed for testability with Jest framework.
 * 
 * Dependencies (must be defined in script.js before this module is used):
 * - BASE: config object with enemy constants
 * - Global game state: player, enemies, obstacles, level, spawners, enemiesKilled, enemiesToKill, score
 * - Utility functions: rand, chance, viewRadius, randomAround
 * - Game functions: dropCoin, dropSupply, addXP, addParticles, shakeScreen, addLogEntry
 * 
 * Exports to global scope:
 * - Enemy class
 * - Spawner class  
 * - spawnRate function
 * - createSpawners function
 * - handleEnemyDeath function
 * - applyRadialDamage function
 * - applyBeamDamage function
 * 
 * @module enemy
 */

/**
 * Enemy Class - Represents an enemy entity in the game
 * 
 * Enemy types:
 * - 'chaser': Standard purple organic alien (default)
 * - 'heavy': Large green crystalline tank (3 health)
 * - 'swarmer': Small orange bio-energy blob
 * - 'drone': Basic red triangle drone
 * 
 * @testable
 * - Constructor: Can test enemy creation with different types
 * - draw(): Can test rendering with mock canvas context
 * - update(): Can test movement logic with mock game state
 */
class Enemy {
  /**
   * Creates a new enemy entity
   * @param {number} x - Initial x position
   * @param {number} y - Initial y position
   * @param {string} kind - Enemy type: 'chaser', 'heavy', 'swarmer', or 'drone'
   */
  constructor(x, y, kind = 'chaser') {
    this.x = x;
    this.y = y;
    this.kind = kind;
    this.rot = 0;
    const sizeMap = { heavy: 1.45, swarmer: 0.9, drone: 0.75 };
    this.size = window.BASE.ENEMY_SIZE * (sizeMap[kind] || 1);
    const speedMap = { heavy: 0.85, swarmer: 1.45, drone: 1.2 };
    this.speed = window.BASE.ENEMY_SPEED * (speedMap[kind] || 1.05);
    this.health = kind === 'heavy' ? 3 : 1;
    this.animPhase = Math.random() * Math.PI * 2;
  }
  
  /**
   * Renders the enemy on the canvas
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @testable - Can mock canvas context to verify draw calls
   */
  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    
    const pulse = Math.sin(performance.now() / 180 + this.animPhase) * 0.15 + 1;
    
    // Enemy indicator - subtle glow effect
    ctx.shadowColor = '#dc2626';
    ctx.shadowBlur = 12;
    
    if (this.kind === 'drone') {
      // Basic red triangle drone
      ctx.fillStyle = '#ef4444';
      ctx.strokeStyle = '#fecaca';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(this.size, 0);
      ctx.lineTo(-this.size * 0.6, -this.size * 0.6);
      ctx.lineTo(-this.size * 0.3, 0);
      ctx.lineTo(-this.size * 0.6, this.size * 0.6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      
    } else if (this.kind === 'chaser') {
      // Alien organic creature - purple/magenta insectoid
      ctx.fillStyle = '#a21caf';
      ctx.strokeStyle = '#e879f9';
      ctx.lineWidth = 2;
      
      // Main body - organic oval
      ctx.beginPath();
      ctx.ellipse(0, 0, this.size * 1.2 * pulse, this.size * 0.8 * pulse, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      
      // Mandibles/claws
      ctx.strokeStyle = '#d946ef';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(this.size * 0.8, -this.size * 0.5);
      ctx.lineTo(this.size * 1.4, -this.size * 0.8);
      ctx.moveTo(this.size * 0.8, this.size * 0.5);
      ctx.lineTo(this.size * 1.4, this.size * 0.8);
      ctx.stroke();
      
      // Eyes - glowing red for enemy indicator
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(this.size * 0.3, -this.size * 0.3, this.size * 0.2, 0, Math.PI * 2);
      ctx.arc(this.size * 0.3, this.size * 0.3, this.size * 0.2, 0, Math.PI * 2);
      ctx.fill();
      
      // Pupils
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(this.size * 0.35, -this.size * 0.3, this.size * 0.1, 0, Math.PI * 2);
      ctx.arc(this.size * 0.35, this.size * 0.3, this.size * 0.1, 0, Math.PI * 2);
      ctx.fill();
      
    } else if (this.kind === 'heavy') {
      // Heavy tank - green crystalline structure with red core
      ctx.fillStyle = '#15803d';
      ctx.strokeStyle = '#86efac';
      ctx.lineWidth = 3;
      
      // Central crystal body
      ctx.beginPath();
      ctx.moveTo(this.size * 1.2, 0);
      ctx.lineTo(this.size * 0.4, -this.size);
      ctx.lineTo(-this.size * 0.8, -this.size * 0.7);
      ctx.lineTo(-this.size * 1.1, 0);
      ctx.lineTo(-this.size * 0.8, this.size * 0.7);
      ctx.lineTo(this.size * 0.4, this.size);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      
      // Inner crystal facets
      ctx.strokeStyle = '#4ade80';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(this.size * 0.4, -this.size * 0.6);
      ctx.lineTo(-this.size * 0.4, -this.size * 0.4);
      ctx.lineTo(-this.size * 0.4, this.size * 0.4);
      ctx.lineTo(this.size * 0.4, this.size * 0.6);
      ctx.stroke();
      
      // Glowing red core for enemy indicator
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#dc2626';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(0, 0, this.size * 0.35 * pulse, 0, Math.PI * 2);
      ctx.fill();
      
    } else {
      // Swarmer - orange/yellow bio-energy blob
      ctx.fillStyle = '#ea580c';
      ctx.strokeStyle = '#fb923c';
      ctx.lineWidth = 2;
      
      // Amoeba-like body
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const wobble = Math.sin(performance.now() / 100 + i + this.animPhase) * 0.2 + 0.9;
        const r = this.size * wobble * pulse;
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r * 0.8;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      
      // Red nucleus spots for enemy indicator
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#dc2626';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(-this.size * 0.2, -this.size * 0.15, this.size * 0.2, 0, Math.PI * 2);
      ctx.arc(this.size * 0.1, this.size * 0.2, this.size * 0.15, 0, Math.PI * 2);
      ctx.fill();
      
      // Pulsing tendrils
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#fdba74';
      ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 2 + this.rot;
        const extend = Math.sin(performance.now() / 150 + i) * 0.3 + 0.7;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * this.size * 0.6, Math.sin(a) * this.size * 0.6);
        ctx.lineTo(Math.cos(a) * this.size * (1 + extend), Math.sin(a) * this.size * (1 + extend));
        ctx.stroke();
      }
    }
    ctx.shadowBlur = 0;
    ctx.restore();
  }
  
  /**
   * Updates enemy position and rotation based on player position
   * Implements pathfinding with obstacle avoidance
   * @param {number} dt - Delta time in milliseconds
   * @testable - Can test movement logic with mock player and obstacles
   */
  update(dt) {
    const player = window.gameState.player;
    const obstacles = window.gameState.obstacles;
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy) || 1;
    let ax = 0;
    let ay = 0;
    for (const o of obstacles) {
      const ox = o.x;
      const oy = o.y;
      const r = o.r + this.size + 16;
      const ddx = this.x - ox;
      const ddy = this.y - oy;
      const d = Math.hypot(ddx, ddy);
      if (d < r) {
        const f = (r - d) / r;
        ax += (ddx / (d || 1)) * f * 2.4;
        ay += (ddy / (d || 1)) * f * 2.4;
      }
    }
    const nx = dx / dist + ax;
    const ny = dy / dist + ay;
    const nm = Math.hypot(nx, ny) || 1;
    this.x += (nx / nm) * this.speed * (dt / 16.67);
    this.y += (ny / nm) * this.speed * (dt / 16.67);
    this.rot = Math.atan2(ny, nx);
  }
}

/**
 * Spawner Class - Manages enemy spawning at strategic locations
 * 
 * Spawners place themselves around the player and periodically spawn enemies.
 * They reposition when the player moves too far away.
 * 
 * @testable
 * - Constructor: Can test spawner initialization
 * - draw(): Can test rendering with mock canvas context
 * - update(): Can test spawn timing and repositioning logic
 * - spawn(): Can test enemy creation and type distribution
 */
class Spawner {
  /**
   * Creates a new spawner
   * @param {boolean} isInitial - If true, adds initial delay before first spawn
   */
  constructor(isInitial = false) {
    this.resetPosition();
    const now = performance.now();
    this.last = isInitial ? now + window.rand(window.BASE.INITIAL_SPAWN_DELAY_MIN, window.BASE.INITIAL_SPAWN_DELAY_MAX) : now;
    this.rate = spawnRate();
  }
  
  /**
   * Renders the spawner visual indicator on canvas
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @testable - Can mock canvas context to verify draw calls
   */
  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    const pulse = 0.6 + Math.sin(performance.now() / 180) * 0.3;
    ctx.strokeStyle = 'rgba(147,197,253,0.8)';
    ctx.fillStyle = 'rgba(37,99,235,0.15)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 16 + pulse * 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  
  /**
   * Updates spawner state - repositions if too far, spawns enemies on timer
   * @param {number} now - Current timestamp
   * @testable - Can test spawn timing and positioning logic
   */
  update(now) {
    const player = window.gameState.player;
    if (!player) return;
    if (Math.hypot(this.x - player.x, this.y - player.y) > window.viewRadius(1.8)) this.resetPosition();
    if (now - this.last > this.rate) {
      this.spawn();
      this.last = now;
      this.rate = spawnRate();
    }
  }
  
  /**
   * Spawns a new enemy near the spawner, weighted by difficulty
   * Enemy type distribution:
   * - 15% heavy (3 health tank)
   * - 20% swarmer (fast blob)
   * - 20% chaser (standard alien)
   * - 45% drone (basic enemy)
   * 
   * @testable - Can verify enemy type distribution and positioning
   */
  spawn() {
    const player = window.gameState.player;
    if (!player) return;
    const roll = Math.random();
    // Add basic drones (50%), reduce complex enemies for performance
    const kind = roll < 0.15 ? 'heavy' : roll < 0.35 ? 'swarmer' : roll < 0.55 ? 'chaser' : 'drone';
    const dir = Math.atan2(player.y - this.y, player.x - this.x);
    const dist = 70;
    const jitter = window.rand(-40, 40);
    const x = this.x + Math.cos(dir) * dist + Math.cos(dir + Math.PI / 2) * jitter;
    const y = this.y + Math.sin(dir) * dist + Math.sin(dir + Math.PI / 2) * jitter;
    window.gameState.enemies.push(new Enemy(x, y, kind));
    if (Math.random() < 0.4) this.resetPosition();
  }
  
  /**
   * Repositions the spawner around the player at a safe distance
   * @testable - Can test positioning logic with mock player state
   */
  resetPosition() {
    const player = window.gameState.player;
    if (!player) {
      this.x = window.rand(0, window.innerWidth);
      this.y = window.rand(0, window.innerHeight);
      return;
    }
    const inner = window.viewRadius(0.8);
    const outer = window.viewRadius(1.6);
    const pos = window.randomAround(player.x, player.y, inner, outer);
    this.x = pos.x;
    this.y = pos.y;
  }
}

/**
 * Calculates spawn rate based on current game level
 * Higher levels spawn enemies faster
 * 
 * @returns {number} Milliseconds between spawns
 * @testable - Can verify spawn rate calculation for different levels
 */
const spawnRate = () => {
  const base = window.BASE.SPAWNER_RATE_MS - window.gameState.level * 90 + Math.random() * 300;
  return Math.max(500, base);
};

/**
 * Creates multiple spawners around the player
 * 
 * @param {number} count - Number of spawners to create
 * @param {boolean} isInitial - If true, spawners start with initial delay
 * @testable - Can verify spawner creation count
 */
const createSpawners = (count, isInitial = false) => {
  window.gameState.spawners = [];
  for (let i = 0; i < count; i++) window.gameState.spawners.push(new Spawner(isInitial));
};

/**
 * Handles enemy death - drops loot, updates score, and triggers effects
 * 
 * @param {number} index - Index of enemy in enemies array
 * @param {number} xpBonus - Additional XP to award (default 0)
 * @testable - Can verify score updates, loot drops, and state changes
 */
const handleEnemyDeath = (index, xpBonus = 0) => {
  const enemies = window.gameState.enemies;
  const enemy = enemies[index];
  if (!enemy) return;
  window.dropCoin(enemy.x, enemy.y);
  if (window.chance(0.22)) window.dropSupply(enemy.x, enemy.y);
  enemies.splice(index, 1);
  window.gameState.enemiesKilled++;
  window.gameState.score += 15;
  window.addXP(30 + window.gameState.level * 4 + xpBonus);
  window.addParticles('pop', enemy.x, enemy.y, 0, 14);
  window.shakeScreen(3.4, 110);
  const player = window.gameState.player;
  if (player) player.addUltimateCharge(15 + window.gameState.level * 2);
  
  // Check if all enemies eliminated
  if (window.gameState.enemiesKilled >= window.gameState.enemiesToKill) {
    window.addLogEntry('All enemies eliminated!', '#4ade80');
  }
};

/**
 * Applies radial damage to all enemies within a radius
 * Used for explosions, bombs, and area attacks
 * 
 * @param {number} cx - Center x coordinate
 * @param {number} cy - Center y coordinate
 * @param {number} radius - Damage radius
 * @param {number} damage - Damage amount per enemy
 * @param {Object} opts - Additional options
 * @param {number} opts.pull - Pull force towards center (default 0)
 * @param {number} opts.knockback - Knockback force from center (default 0)
 * @param {number} opts.chargeMult - Ultimate charge multiplier (default 0.4)
 * @returns {void}
 * @testable - Can verify damage calculation, force application, and enemy removal
 */
const applyRadialDamage = (cx, cy, radius, damage, opts = {}) => {
  const { pull = 0, knockback = 0, chargeMult = 0.4 } = opts;
  let total = 0;
  const enemies = window.gameState.enemies;
  for (let i = enemies.length - 1; i >= 0; i--) {
    const enemy = enemies[i];
    const dx = enemy.x - cx;
    const dy = enemy.y - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > radius) continue;
    const prev = enemy.health;
    enemy.health -= damage;
    const dealt = Math.min(prev, damage);
    total += dealt;
    if (pull) {
      enemy.x -= (dx / (dist || 1)) * pull * 12;
      enemy.y -= (dy / (dist || 1)) * pull * 12;
    }
    if (knockback) {
      enemy.x += (dx / (dist || 1)) * knockback;
      enemy.y += (dy / (dist || 1)) * knockback;
    }
    window.addParticles('sparks', enemy.x, enemy.y, 0, 10);
    if (enemy.health <= 0) handleEnemyDeath(i, dealt * 0.6);
  }
  if (total > 0) {
    window.addXP(Math.round(total * 0.4));
    const player = window.gameState.player;
    if (player) player.addUltimateCharge(total * chargeMult);
  }
};

/**
 * Applies beam damage to enemies in a rectangular beam area
 * Used for laser weapons and beam attacks
 * 
 * @param {number} x - Beam origin x
 * @param {number} y - Beam origin y
 * @param {number} angle - Beam angle in radians
 * @param {number} length - Beam length
 * @param {number} width - Beam width
 * @param {number} damage - Damage amount per enemy
 * @testable - Can verify beam collision detection and damage application
 */
const applyBeamDamage = (x, y, angle, length, width, damage) => {
  const dirX = Math.cos(angle);
  const dirY = Math.sin(angle);
  const perpX = -dirY;
  const perpY = dirX;
  const halfW = width / 2;
  let total = 0;
  const enemies = window.gameState.enemies;
  for (let i = enemies.length - 1; i >= 0; i--) {
    const enemy = enemies[i];
    const relX = enemy.x - x;
    const relY = enemy.y - y;
    const forward = relX * dirX + relY * dirY;
    if (forward < -20 || forward > length) continue;
    const lateral = Math.abs(relX * perpX + relY * perpY);
    if (lateral > halfW) continue;
    const prev = enemy.health;
    enemy.health -= damage;
    const dealt = Math.min(prev, damage);
    total += dealt;
    window.addParticles('sparks', enemy.x, enemy.y, 0, 16);
    if (enemy.health <= 0) handleEnemyDeath(i, dealt * 0.5);
  }
  if (total > 0) {
    window.addXP(Math.round(total * 0.45));
    const player = window.gameState.player;
    if (player) player.addUltimateCharge(total * 0.35);
  }
};

/**
 * TEST UTILITIES
 * 
 * The following functions can be used for Jest testing:
 * 
 * 1. Enemy Creation Tests:
 *    - Test different enemy types (chaser, heavy, swarmer, drone)
 *    - Verify size, speed, and health values
 * 
 * 2. Enemy Movement Tests:
 *    - Test update() with mock player and obstacles
 *    - Verify pathfinding and obstacle avoidance
 * 
 * 3. Spawner Tests:
 *    - Test spawn timing with controlled timestamps
 *    - Verify enemy type distribution
 *    - Test repositioning logic
 * 
 * 4. Damage Application Tests:
 *    - Test applyRadialDamage with various radii
 *    - Test applyBeamDamage collision detection
 *    - Verify damage calculation and death handling
 * 
 * 5. Integration Tests:
 *    - Test full spawn-to-death lifecycle
 *    - Test collision detection with player/bullets
 */
