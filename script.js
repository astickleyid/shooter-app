// Main game script for VOID RIFT
// This file implements the game logic, rendering and UI interactions.

/* ====== DOM ELEMENTS ====== */
const startScreen = document.getElementById('startScreen');
const startButton = document.getElementById('startButton');
const openShopFromStart = document.getElementById('openShopFromStart');
const startGraphicCanvas = document.getElementById('startGraphicCanvas');
const gameContainer = document.getElementById('gameContainer');
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreValue = document.getElementById('scoreValue');
const levelValue = document.getElementById('levelValue');
const healthBar = document.getElementById('healthBar');
const ammoBar = document.getElementById('ammoBar');
const messageBox = document.getElementById('messageBox');
const messageTitle = document.getElementById('messageTitle');
const messageText = document.getElementById('messageText');
const messageButton = document.getElementById('messageButton');
const joystickMoveBase = document.getElementById('joystickMoveBase');
const joystickMoveStick = document.getElementById('joystickMoveStick');
const joystickShootBase = document.getElementById('joystickShootBase');
const joystickShootStick = document.getElementById('joystickShootStick');
const boostButton = document.getElementById('boostButton');
const creditsBadge = document.getElementById('creditsText');

const shopModal = document.getElementById('shopModal');
const shopGrid = document.getElementById('shopGrid');
const shopCreditsText = document.getElementById('shopCredits');
const closeShopBtn = document.getElementById('closeShop');

/* ====== GAME STATE ====== */
let player, enemies, bullets, coins, spawners, starsFar, starsMid, starsNear, particles, obstacles;
let score = 0;
let level = 1;
let enemiesToKill = 10;
let enemiesKilled = 0;
let lastTime = 0;
let gameRunning = false;
let paused = false;
let lastAmmoRegen = 0;
let lastShotTime = 0;
let shakeT = 0;

const input = {
  moveX: 0,
  moveY: 0,
  aimX: 0,
  aimY: 0,
  isAiming: false,
  isBoosting: false,
  mouseDown: false
};
const keyboard = {
  'w': false,
  'a': false,
  's': false,
  'd': false,
  'ArrowUp': false,
  'ArrowLeft': false,
  'ArrowDown': false,
  'ArrowRight': false,
  ' ': false
};

/* ====== HELPERS ====== */
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const rand = (a, b) => a + Math.random() * (b - a);
const chance = (p) => Math.random() < p;

/* ====== ECONOMY & SAVE ====== */
const SAVE_KEY = 'void_rift_v11';
const Save = {
  data: {
    credits: 0,
    bestScore: 0,
    highestLevel: 1,
    upgrades: {}
  },
  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) this.data = JSON.parse(raw);
    } catch (e) {
      console.warn('Failed to load save:', e);
    }
  },
  save() {
    localStorage.setItem(SAVE_KEY, JSON.stringify(this.data));
  },
  addCredits(n) {
    this.data.credits = Math.max(0, Math.floor(this.data.credits + n));
    this.sync();
    this.save();
  },
  spendCredits(n) {
    if (this.data.credits >= n) {
      this.data.credits -= n;
      this.sync();
      this.save();
      return true;
    }
    return false;
  },
  setBest(s, lvl) {
    if (s > this.data.bestScore) this.data.bestScore = s;
    if (lvl > this.data.highestLevel) this.data.highestLevel = lvl;
    this.save();
  },
  getUpgradeLevel(id) {
    return this.data.upgrades[id] || 0;
  },
  levelUp(id) {
    this.data.upgrades[id] = (this.data.upgrades[id] || 0) + 1;
    this.save();
  },
  sync() {
    creditsBadge.textContent = this.data.credits;
    shopCreditsText.textContent = this.data.credits;
  }
};
Save.load();
Save.sync();

/* ====== CONFIGURATION ====== */
const BASE = {
  PLAYER_SIZE: 16,
  PLAYER_SPEED: 2.7,
  PLAYER_BOOST_SPEED: 5.4,
  PLAYER_HEALTH: 100,
  PLAYER_AMMO: 50,
  AMMO_REGEN_MS: 900,
  INVULN_MS: 300,
  BULLET_SIZE: 4,
  BULLET_SPEED: 8.2,
  ENEMY_SIZE: 12,
  ENEMY_SPEED: 1.25,
  ENEMY_DAMAGE: 10,
  COIN_SIZE: 8,
  COIN_LIFETIME: 8000,
  SPAWNER_SIZE: 80,
  SPAWNER_RATE_MS: 2000,
  OBST_ASTEROIDS: 6,
  OBST_WALLS: 2
};

/* ====== UPGRADE DATA ====== */
const UPGRADES = [
  { id: 'firerate', name: 'Rapid Fire', cat: 'Offense', max: 5, base: 120, step: 15, desc: '+ Fire rate' },
  { id: 'damage',   name: 'Rail Rounds', cat: 'Offense', max: 5, base: 180, step: 25, desc: '+ Bullet damage' },
  { id: 'multi',    name: 'Multi-Shot', cat: 'Offense', max: 3, base: 260, step: 90, desc: 'Shoot extra bullets' },
  { id: 'shield',   name: 'Flux Shield', cat: 'Defense', max: 5, base: 160, step: 30, desc: '+ Shield capacity' },
  { id: 'regen',    name: 'Nanorepair', cat: 'Defense', max: 5, base: 140, step: 25, desc: 'HP regen per 5s' },
  { id: 'field',    name: 'Repulsor', cat: 'Defense', max: 3, base: 220, step: 80, desc: 'Knockback aura' },
  { id: 'magnet',   name: 'Credit Magnet', cat: 'Utility', max: 5, base: 130, step: 20, desc: '+ Pickup range' },
  { id: 'ammo',     name: 'Ammo Synth', cat: 'Utility', max: 5, base: 120, step: 20, desc: 'Faster ammo regen' },
  { id: 'boost',    name: 'Overthrusters', cat: 'Utility', max: 3, base: 180, step: 60, desc: '+ Boost speed' }
];

function costOf(u) {
  const lvl = Save.getUpgradeLevel(u.id);
  return Math.floor(u.base + u.step * (lvl * 1.5 + lvl * lvl * 0.35));
}

function dStats() {
  const L = (id) => Save.getUpgradeLevel(id);
  return {
    fireCD: clamp(140 - L('firerate') * 18, 55, 999),
    dmg: 1 + L('damage') * 0.6,
    multishot: 1 + L('multi'),
    hpMax: BASE.PLAYER_HEALTH + L('shield') * 22,
    hpRegen5: L('regen') * 3,
    repulse: L('field') > 0 ? (2 + L('field') * 0.8) : 0,
    pickupR: 26 + L('magnet') * 14,
    ammoRegen: clamp(BASE.AMMO_REGEN_MS - L('ammo') * 120, 350, 2000),
    boost: BASE.PLAYER_BOOST_SPEED + L('boost') * 0.9
  };
}

/* ====== VECTOR CLASS ====== */
class V {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }
  mag() {
    return Math.hypot(this.x, this.y);
  }
  norm() {
    const m = this.mag();
    if (m > 0) {
      this.x /= m;
      this.y /= m;
    }
    return this;
  }
  scale(s) {
    this.x *= s;
    this.y *= s;
    return this;
  }
  add(v) {
    this.x += v.x;
    this.y += v.y;
    return this;
  }
  clone() {
    return new V(this.x, this.y);
  }
}

/* ====== PARTICLES & JUICE ====== */
particles = [];
function addParticles(kind, x, y, ang = 0, count = 8) {
  for (let i = 0; i < count; i++) {
    if (kind === 'muzzle') particles.push({ x: x + Math.cos(ang) * 10, y: y + Math.sin(ang) * 10, vx: rand(-1, 1), vy: rand(-1, 1), life: 220, c: '#ffd54f', s: 2 });
    if (kind === 'pop')    particles.push({ x: x, y: y, vx: rand(-2, 2), vy: rand(-2, 2), life: 320, c: '#fca5a5', s: 2 });
    if (kind === 'sparks') particles.push({ x: x, y: y, vx: rand(-2.6, 2.6), vy: rand(-2.6, 2.6), life: 160, c: '#ffffff', s: 1.5 });
    if (kind === 'debris') particles.push({ x: x, y: y, vx: rand(-1.5, 1.5), vy: rand(-1.5, 1.5), life: 400, c: '#9ca3af', s: 2 });
    if (kind === 'thruster') particles.push({ x: x, y: y, vx: rand(-0.6, 0.6), vy: rand(-0.6, 0.6), life: 180, c: '#ff9a3c', s: 1.8 });
  }
}
function drawParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life -= dt;
    if (p.life <= 0) {
      particles.splice(i, 1);
      continue;
    }
    ctx.globalAlpha = Math.max(0, p.life / 320);
    ctx.fillStyle = p.c;
    ctx.fillRect(p.x, p.y, p.s, p.s);
    ctx.globalAlpha = 1;
  }
}
function shake(power = 4, ms = 120) {
  shakeT = Math.max(shakeT, performance.now() + ms);
  shake.power = power;
}

/* ====== STARS PARALLAX ====== */
function makeStars(n) {
  const arr = [];
  for (let i = 0; i < n; i++) {
    arr.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, s: Math.random() * 2 + 0.4 });
  }
  return arr;
}
function drawStarsLayer(arr, speed) {
  ctx.fillStyle = '#fff';
  for (const s of arr) {
    ctx.globalAlpha = clamp(s.s / 2.6, 0.2, 0.9);
    ctx.fillRect(s.x, s.y, s.s, s.s);
    s.x -= speed;
    if (s.x < 0) {
      s.x = canvas.width;
      s.y = Math.random() * canvas.height;
    }
  }
  ctx.globalAlpha = 1;
}

/* ====== OBSTACLES ====== */
class Asteroid {
  constructor(x, y, r) {
    this.x = x;
    this.y = y;
    this.r = r;
    this.rot = rand(0, Math.PI * 2);
    this.vx = rand(-0.6, 0.6);
    this.vy = rand(-0.6, 0.6);
    this.vr = rand(-0.01, 0.01);
    this.hp = Math.max(3, Math.round(r / 10));
    // generate jagged polygon
    this.points = [];
    const seg = 8 + Math.floor(Math.random() * 4);
    for (let i = 0; i < seg; i++) {
      const a = (i / seg) * Math.PI * 2;
      const rr = r * rand(0.7, 1.15);
      this.points.push({ a, rr });
    }
  }
  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.strokeStyle = '#a3a3a3';
    ctx.fillStyle = '#1f2937';
    ctx.lineWidth = 2;
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
    ctx.restore();
  }
  update(dt) {
    this.x += this.vx * (dt / 16.67);
    this.y += this.vy * (dt / 16.67);
    this.rot += this.vr * (dt / 16.67);
    // wrap around horizontally and vertically
    if (this.x < -this.r) this.x = canvas.width + this.r;
    if (this.x > canvas.width + this.r) this.x = -this.r;
    if (this.y < -this.r) this.y = canvas.height + this.r;
    if (this.y > canvas.height + this.r) this.y = -this.r;
  }
}
class EnergyWall {
  constructor(x, y, w, h, ang = 0) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.ang = ang;
  }
  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.ang);
    const grd = ctx.createLinearGradient(-this.w / 2, 0, this.w / 2, 0);
    grd.addColorStop(0, 'rgba(0,255,255,0.15)');
    grd.addColorStop(0.5, 'rgba(0,255,255,0.6)');
    grd.addColorStop(1, 'rgba(0,255,255,0.15)');
    ctx.fillStyle = grd;
    ctx.fillRect(-this.w / 2, -this.h / 2, this.w, this.h);
    ctx.strokeStyle = 'rgba(0,255,255,0.8)';
    ctx.lineWidth = 2;
    ctx.strokeRect(-this.w / 2, -this.h / 2, this.w, this.h);
    ctx.restore();
  }
}
function spawnObstacles() {
  obstacles = [];
  // asteroids
  for (let i = 0; i < BASE.OBST_ASTEROIDS; i++) {
    const r = rand(18, 36);
    const x = rand(r, canvas.width - r);
    const y = rand(r, canvas.height - r);
    obstacles.push(new Asteroid(x, y, r));
  }
  // energy walls
  for (let i = 0; i < BASE.OBST_WALLS; i++) {
    const w = rand(140, 220);
    const h = rand(12, 18);
    const x = rand(80, canvas.width - 80);
    const y = rand(80, canvas.height - 80);
    const ang = rand(0, Math.PI);
    obstacles.push(new EnergyWall(x, y, w, h, ang));
  }
}

/* ====== ENTITIES ====== */
class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = BASE.PLAYER_SIZE;
    const d = dStats();
    this.health = d.hpMax;
    this.hpMax = d.hpMax;
    this.ammo = BASE.PLAYER_AMMO;
    this.lookAngle = 0;
    this.vel = new V(0, 0);
    this.lastRegenT = performance.now();
    this.invEnd = 0;
    this.flash = false;
  }
  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.lookAngle);
    // Thruster particles
    addParticles('thruster', this.x - Math.cos(this.lookAngle) * this.size * 1.1, this.y - Math.sin(this.lookAngle) * this.size * 1.1, 0, chance(0.25) ? 1 : 0);
    // Ship hull
    ctx.fillStyle = '#0ea5e9';
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.size, 0);
    ctx.lineTo(-this.size * 0.8, -this.size * 0.7);
    ctx.lineTo(-this.size * 0.2, 0);
    ctx.lineTo(-this.size * 0.8, this.size * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Canopy
    ctx.fillStyle = '#7dd3fc';
    ctx.beginPath();
    ctx.arc(this.size * 0.3, 0, this.size * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Shield ring
    const glow = Math.max(0, (this.invEnd - performance.now()) / BASE.INVULN_MS);
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
  update(dt) {
    const d = dStats();
    const spd = input.isBoosting ? d.boost : BASE.PLAYER_SPEED;
    this.vel.x = input.moveX;
    this.vel.y = input.moveY;
    if (this.vel.mag() > 0) {
      this.vel.norm();
      this.x += this.vel.x * spd * (dt / 16.67);
      this.y += this.vel.y * spd * (dt / 16.67);
    }
    // Aiming and shooting
    if (input.isAiming || input.mouseDown) {
      this.lookAngle = Math.atan2(input.aimY, input.aimX);
      if (this.ammo > 0 && performance.now() - lastShotTime > d.fireCD) {
        this.shoot(d);
        lastShotTime = performance.now();
      }
    } else if (this.vel.mag() > 0) {
      this.lookAngle = Math.atan2(this.vel.y, this.vel.x);
    }
    // Wrap horizontally; clamp vertically
    if (this.x < -this.size) this.x = canvas.width + this.size;
    if (this.x > canvas.width + this.size) this.x = -this.size;
    this.y = clamp(this.y, this.size, canvas.height - this.size);
    // Ammo regen
    if (this.ammo < BASE.PLAYER_AMMO && performance.now() - lastAmmoRegen > d.ammoRegen) {
      this.ammo++;
      lastAmmoRegen = performance.now();
    }
    // HP regen every 5s
    if (performance.now() - this.lastRegenT > 5000) {
      const heal = d.hpRegen5;
      if (heal > 0) this.health = clamp(this.health + heal, 0, this.hpMax);
      this.lastRegenT = performance.now();
    }
    // Repulsor field
    const knock = dStats().repulse;
    if (knock > 0) {
      for (const e of enemies) {
        const dx = e.x - this.x;
        const dy = e.y - this.y;
        const dist = Math.hypot(dx, dy);
        if (dist < this.size + 18 + dStats().pickupR * 0.4) {
          const nx = dx / (dist || 1);
          const ny = dy / (dist || 1);
          e.x += nx * knock;
          e.y += ny * knock;
        }
      }
    }
  }
  shoot(d) {
    this.ammo--;
    const n = d.multishot;
    const spread = (n - 1) * 0.12;
    for (let i = 0; i < n; i++) {
      const off = n === 1 ? 0 : -spread / 2 + (spread / (n - 1)) * i;
      const ang = this.lookAngle + off;
      const vel = new V(Math.cos(ang), Math.sin(ang));
      const sx = this.x + Math.cos(ang) * this.size;
      const sy = this.y + Math.sin(ang) * this.size;
      bullets.push(new Bullet(sx, sy, vel, d.dmg));
    }
    addParticles('muzzle', this.x, this.y, this.lookAngle, 6);
  }
  takeDamage(n) {
    if (performance.now() < this.invEnd) return;
    this.health -= n;
    this.flash = true;
    this.invEnd = performance.now() + BASE.INVULN_MS;
    shake(4, 120);
    if (this.health <= 0) {
      this.health = 0;
      gameOver();
    }
  }
}

class Bullet {
  constructor(x, y, vel, damage) {
    this.x = x;
    this.y = y;
    this.r = BASE.BULLET_SIZE;
    this.vel = vel;
    this.damage = damage;
  }
  draw() {
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fill();
  }
  update(dt) {
    this.x += this.vel.x * BASE.BULLET_SPEED * (dt / 16.67);
    this.y += this.vel.y * BASE.BULLET_SPEED * (dt / 16.67);
    // Wrap horizontally for bullets
    if (this.x < 0) this.x = canvas.width;
    if (this.x > canvas.width) this.x = 0;
  }
}

class Enemy {
  constructor(x, y, kind = 'chaser') {
    this.x = x;
    this.y = y;
    this.kind = kind;
    this.rot = 0;
    this.size = BASE.ENEMY_SIZE * (kind === 'heavy' ? 1.45 : kind === 'swarmer' ? 0.9 : 1);
    this.speed = BASE.ENEMY_SPEED * (kind === 'heavy' ? 0.85 : kind === 'swarmer' ? 1.45 : 1.05);
    this.health = kind === 'heavy' ? 3 : 1;
  }
  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    if (this.kind === 'chaser') {
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
    } else if (this.kind === 'heavy') {
      ctx.fillStyle = '#b91c1c';
      ctx.strokeStyle = '#fda4af';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(this.size * 1.1, 0);
      ctx.lineTo(-this.size * 0.8, -this.size * 0.9);
      ctx.lineTo(-this.size * 0.5, 0);
      ctx.lineTo(-this.size * 0.8, this.size * 0.9);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // plating lines
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.beginPath();
      ctx.moveTo(-this.size * 0.4, -this.size * 0.6);
      ctx.lineTo(this.size * 0.4, -this.size * 0.2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-this.size * 0.4, this.size * 0.6);
      ctx.lineTo(this.size * 0.4, this.size * 0.2);
      ctx.stroke();
    } else {
      const pulse = 0.8 + Math.sin(performance.now() / 120) / 5;
      ctx.fillStyle = '#f97316';
      ctx.strokeStyle = '#ffd7aa';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 0, this.size * pulse, this.size * 0.7 * pulse, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // tendrils
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      for (let i = 0; i < 4; i++) {
        const a = i * Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * this.size * 0.6, Math.sin(a) * this.size * 0.6);
        ctx.lineTo(Math.cos(a) * this.size * 1.1, Math.sin(a) * this.size * 1.1);
        ctx.stroke();
      }
    }
    ctx.restore();
  }
  update(dt) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy) || 1;
    // obstacle avoidance
    let ax = 0;
    let ay = 0;
    for (const o of obstacles) {
      let ox = 0, oy = 0, r = 0;
      if (o instanceof Asteroid) {
        ox = o.x;
        oy = o.y;
        r = o.r + this.size + 16;
      } else {
        ox = o.x;
        oy = o.y;
        r = Math.max(o.w, o.h) / 2 + this.size + 20;
      }
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
    // wrap horizontally
    if (this.x < -this.size) this.x = canvas.width + this.size;
    if (this.x > canvas.width + this.size) this.x = -this.size;
  }
}

class Coin {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.r = BASE.COIN_SIZE;
    this.created = performance.now();
    this.life = BASE.COIN_LIFETIME;
  }
  draw() {
    const age = performance.now() - this.created;
    const rem = (this.life - age) / this.life;
    if (rem < 0.3 && (age / 100 | 0) % 2 === 0) return;
    ctx.globalAlpha = Math.max(0, rem);
    ctx.fillStyle = '#ffc107';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

/* ====== SPAWNERS ====== */
class Spawner {
  constructor(side) {
    this.side = side;
    this.size = BASE.SPAWNER_SIZE + Math.random() * 20;
    this.center = Math.random() * ((this.side % 2 === 0 ? canvas.width : canvas.height) - this.size * 2) + this.size;
    this.last = performance.now();
    this.rate = spawnRate();
  }
  draw() {
    ctx.strokeStyle = '#ffc107';
    ctx.lineWidth = 4;
    ctx.globalAlpha = 0.5 + Math.sin(performance.now() / 200) * 0.3;
    ctx.beginPath();
    if (this.side === 0) {
      ctx.moveTo(this.center - this.size, 0);
      ctx.lineTo(this.center + this.size, 0);
    } else if (this.side === 1) {
      ctx.moveTo(canvas.width, this.center - this.size);
      ctx.lineTo(canvas.width, this.center + this.size);
    } else if (this.side === 2) {
      ctx.moveTo(this.center - this.size, canvas.height);
      ctx.lineTo(this.center + this.size, canvas.height);
    } else {
      ctx.moveTo(0, this.center - this.size);
      ctx.lineTo(0, this.center + this.size);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  update(now) {
    if (now - this.last > this.rate) {
      this.spawn();
      this.last = now;
    }
  }
  spawn() {
    let x, y;
    if (this.side === 0) {
      x = this.center + (Math.random() - 0.5) * this.size;
      y = BASE.ENEMY_SIZE;
    } else if (this.side === 1) {
      x = canvas.width - BASE.ENEMY_SIZE;
      y = this.center + (Math.random() - 0.5) * this.size;
    } else if (this.side === 2) {
      x = this.center + (Math.random() - 0.5) * this.size;
      y = canvas.height - BASE.ENEMY_SIZE;
    } else {
      x = BASE.ENEMY_SIZE;
      y = this.center + (Math.random() - 0.5) * this.size;
    }
    const roll = Math.random();
    const kind = roll < 0.15 ? 'heavy' : roll > 0.75 ? 'swarmer' : 'chaser';
    enemies.push(new Enemy(x, y, kind));
  }
}
function spawnRate() {
  const base = BASE.SPAWNER_RATE_MS - level * 90 + Math.random() * 300;
  return Math.max(500, base);
}
function createSpawners(n) {
  spawners = [];
  for (let i = 0; i < n; i++) {
    spawners.push(new Spawner(i % 4));
  }
}

/* ====== GAME FLOW ====== */
function showGame() {
  startScreen.style.display = 'none';
  gameContainer.style.display = 'block';
  resizeCanvas();
  messageBox.style.display = 'block';
  messageTitle.textContent = 'LEVEL 1';
  enemiesToKill = 10;
  messageText.textContent = `Kill ${enemiesToKill} enemies to advance!`;
  messageButton.textContent = 'Start';
}

function startGame() {
  messageBox.style.display = 'none';
  if (gameRunning) return;
  startLevel(1, true);
}

function startLevel(newLevel, resetScore) {
  level = newLevel;
  if (resetScore) score = 0;
  enemiesKilled = 0;
  enemiesToKill = 8 + level * 6;
  player = new Player(canvas.width / 2, canvas.height / 2);
  enemies = [];
  bullets = [];
  coins = [];
  spawners = [];
  particles = [];
  spawnObstacles();
  createSpawners(Math.min(1 + Math.floor(level / 2), 4));
  if (!starsFar) {
    starsFar = makeStars(120);
    starsMid = makeStars(80);
    starsNear = makeStars(50);
  }
  lastTime = performance.now();
  lastAmmoRegen = lastTime;
  gameRunning = true;
  paused = false;
  requestAnimationFrame(gameLoop);
}

function nextLevel() {
  Save.addCredits(Math.floor(20 + level * 5 + enemiesKilled * 1.5));
  level++;
  enemiesKilled = 0;
  enemiesToKill = 8 + level * 6;
  enemies = [];
  bullets = [];
  coins = [];
  spawners = [];
  particles = [];
  spawnObstacles();
  createSpawners(Math.min(1 + Math.floor(level / 2), 4));
  player.x = canvas.width / 2;
  player.y = canvas.height / 2;
  const d = dStats();
  player.hpMax = d.hpMax;
  player.health = d.hpMax;
  player.ammo = BASE.PLAYER_AMMO;
  pauseAndOpenShop(`LEVEL ${level}`, `Spend your ₵ credits, then continue. Need ${enemiesToKill} kills to advance.`);
}

function gameOver() {
  gameRunning = false;
  Save.setBest(score, level);
  Save.addCredits(Math.floor(score / 25));
  messageBox.style.display = 'block';
  messageTitle.textContent = 'GAME OVER';
  messageTitle.style.color = '#dc3545';
  messageText.textContent = `Level ${level} — Score ${score}`;
  messageButton.textContent = 'Restart';
  const h = (e) => {
    e && e.preventDefault();
    messageTitle.style.color = '#4ade80';
    messageBox.style.display = 'none';
    openShop();
    startLevel(1, true);
    messageButton.removeEventListener('click', h);
    messageButton.removeEventListener('touchstart', h);
  };
  messageButton.addEventListener('click', h);
  messageButton.addEventListener('touchstart', h);
}

/* ====== COLLISIONS AND UPDATES ====== */
function update(dt, now) {
  if (!player) return;
  player.update(dt);
  for (const s of spawners) s.update(now);
  // bullets
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.update(dt);
    // wrap horizontally already handled; remove bullet if off vertical screen
    if (b.y < 0 || b.y > canvas.height) {
      bullets.splice(i, 1);
      continue;
    }
    // bullet vs asteroids/walls
    for (const o of obstacles) {
      if (o instanceof Asteroid) {
        const dx = b.x - o.x;
        const dy = b.y - o.y;
        if (Math.hypot(dx, dy) < b.r + o.r) {
          bullets.splice(i, 1);
          o.hp--;
          addParticles('sparks', b.x, b.y, 0, 5);
          if (o.hp <= 0) {
            addParticles('debris', o.x, o.y, 0, 16);
            // respawn asteroid elsewhere
            o.x = rand(0, canvas.width);
            o.y = rand(0, canvas.height);
            o.r = rand(18, 36);
            o.hp = Math.max(3, Math.round(o.r / 10));
          }
          break;
        }
      } else {
        // wall approximate
        const dx = b.x - o.x;
        const dy = b.y - o.y;
        const rad = Math.max(o.w, o.h) / 2;
        if (Math.hypot(dx, dy) < rad) {
          bullets.splice(i, 1);
          addParticles('sparks', b.x, b.y, 0, 4);
          break;
        }
      }
    }
  }
  // enemies
  for (let i = enemies.length - 1; i >= 0; i--) {
    enemies[i].update(dt);
  }
  // coins
  for (let i = coins.length - 1; i >= 0; i--) {
    const c = coins[i];
    if (now - c.created > BASE.COIN_LIFETIME) {
      coins.splice(i, 1);
      continue;
    }
    // magnet effect
    const pr = dStats().pickupR;
    const dx = player.x - c.x;
    const dy = player.y - c.y;
    const dist = Math.hypot(dx, dy);
    if (dist < pr * 3) {
      c.x += (dx / (dist || 1)) * 2;
      c.y += (dy / (dist || 1)) * 2;
    }
  }
  // bullet vs enemy collisions
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    let hit = false;
    for (let j = enemies.length - 1; j >= 0; j--) {
      const e = enemies[j];
      const dx = b.x - e.x;
      const dy = b.y - e.y;
      if (Math.hypot(dx, dy) < b.r + e.size) {
        hit = true;
        e.health -= b.damage;
        addParticles('sparks', b.x, b.y, 0, 6);
        if (e.health <= 0) {
          coins.push(new Coin(e.x, e.y));
          enemies.splice(j, 1);
          enemiesKilled++;
          score += 15;
          addParticles('pop', b.x, b.y, 0, 12);
          shake(3, 90);
        }
        break;
      }
    }
    if (hit) {
      bullets.splice(i, 1);
    }
  }
  // player vs enemies
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    const dx = player.x - e.x;
    const dy = player.y - e.y;
    if (Math.hypot(dx, dy) < player.size + e.size) {
      enemies.splice(i, 1);
      player.takeDamage(BASE.ENEMY_DAMAGE);
    }
  }
  // player vs coins
  for (let i = coins.length - 1; i >= 0; i--) {
    const c = coins[i];
    const dx = player.x - c.x;
    const dy = player.y - c.y;
    if (Math.hypot(dx, dy) < player.size + c.r) {
      coins.splice(i, 1);
      score += 10;
      Save.addCredits(1);
    }
  }
  // player vs obstacles
  for (const o of obstacles) {
    if (o instanceof Asteroid) {
      const dx = player.x - o.x;
      const dy = player.y - o.y;
      const d = Math.hypot(dx, dy);
      if (d < player.size + o.r) {
        const nx = dx / (d || 1);
        const ny = dy / (d || 1);
        const overlap = player.size + o.r - d + 0.5;
        player.x += nx * overlap;
        player.y += ny * overlap;
        player.takeDamage(6);
      }
    } else {
      // wall collision via SAT approximation (local space)
      const s = Math.sin(o.ang);
      const ccs = Math.cos(o.ang);
      const rx = (player.x - o.x) * ccs + (player.y - o.y) * s;
      const ry = -(player.x - o.x) * s + (player.y - o.y) * ccs;
      const hw = o.w / 2;
      const hh = o.h / 2;
      if (Math.abs(rx) < hw + player.size * 0.6 && Math.abs(ry) < hh + player.size * 0.6) {
        const dx = hw - Math.abs(rx);
        const dy = hh - Math.abs(ry);
        if (dx < dy) {
          const sign = Math.sign(rx);
          player.x += (dx + 1) * (ccs * sign);
          player.y += (dx + 1) * (-s * sign);
        } else {
          const sign = Math.sign(ry);
          player.x += (dy + 1) * (s * sign);
          player.y += (dy + 1) * (ccs * sign);
        }
        player.takeDamage(4);
      }
    }
  }
  if (enemiesKilled >= enemiesToKill) nextLevel();
}

function draw() {
  // apply screen shake
  if (shakeT > performance.now()) {
    const pwr = shake.power || 3;
    ctx.save();
    ctx.translate(rand(-pwr, pwr), rand(-pwr, pwr));
  }
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // parallax stars
  if (starsFar) {
    drawStarsLayer(starsFar, 0.3);
    drawStarsLayer(starsMid, 0.6);
    drawStarsLayer(starsNear, 1.1);
  }
  // obstacles
  for (const o of obstacles) {
    o.draw();
  }
  if (!player) {
    if (shakeT > performance.now()) ctx.restore();
    return;
  }
  for (const s of spawners) s.draw();
  for (const c of coins) c.draw();
  for (const b of bullets) b.draw();
  for (const e of enemies) e.draw();
  drawParticles(16.67);
  player.draw();
  if (shakeT > performance.now()) ctx.restore();
}

function updateUI() {
  if (!player) return;
  scoreValue.textContent = score;
  levelValue.textContent = level;
  healthBar.style.width = `${(player.health / player.hpMax) * 100}%`;
  ammoBar.style.width = `${(player.ammo / BASE.PLAYER_AMMO) * 100}%`;
}

function gameLoop(ts) {
  if (!gameRunning || paused) return;
  let dt = ts - lastTime;
  lastTime = ts;
  dt = clamp(dt, 0, 50);
  update(dt, ts);
  draw();
  updateUI();
  requestAnimationFrame(gameLoop);
}

/* ====== INPUT HANDLERS ====== */
function addInputListeners() {
  let moveId = null;
  let moveStart = { x: 0, y: 0 };
  let shootId = null;
  let shootStart = { x: 0, y: 0 };
  // Move joystick
  joystickMoveBase.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (moveId === null) {
      const t = e.changedTouches[0];
      moveId = t.identifier;
      const r = joystickMoveBase.getBoundingClientRect();
      moveStart = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      updateMoveJoystick(t);
    }
  }, { passive: false });
  document.addEventListener('touchmove', (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier === moveId) {
        e.preventDefault();
        updateMoveJoystick(t);
        break;
      }
    }
  }, { passive: false });
  document.addEventListener('touchend', (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier === moveId) {
        e.preventDefault();
        resetMoveJoystick();
        moveId = null;
        break;
      }
    }
  });
  // Shoot joystick
  joystickShootBase.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (shootId === null) {
      const t = e.changedTouches[0];
      shootId = t.identifier;
      const r = joystickShootBase.getBoundingClientRect();
      shootStart = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      updateShootJoystick(t);
    }
  }, { passive: false });
  document.addEventListener('touchmove', (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier === shootId) {
        e.preventDefault();
        updateShootJoystick(t);
        break;
      }
    }
  }, { passive: false });
  document.addEventListener('touchend', (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier === shootId) {
        e.preventDefault();
        resetShootJoystick();
        shootId = null;
        break;
      }
    }
  });
  function updateMoveJoystick(t) {
    const max = joystickMoveBase.clientWidth / 2;
    const dx = t.clientX - moveStart.x;
    const dy = t.clientY - moveStart.y;
    const dist = Math.hypot(dx, dy);
    let sx, sy;
    if (dist > max) {
      sx = (dx / dist) * max;
      sy = (dy / dist) * max;
      input.moveX = dx / dist;
      input.moveY = dy / dist;
    } else {
      sx = dx;
      sy = dy;
      input.moveX = dx / max;
      input.moveY = dy / max;
    }
    joystickMoveStick.style.transform = `translate(${sx}px, ${sy}px)`;
  }
  function resetMoveJoystick() {
    joystickMoveStick.style.transform = 'translate(0, 0)';
    input.moveX = 0;
    input.moveY = 0;
  }
  function updateShootJoystick(t) {
    const max = joystickShootBase.clientWidth / 2;
    const dx = t.clientX - shootStart.x;
    const dy = t.clientY - shootStart.y;
    const dist = Math.hypot(dx, dy);
    let sx, sy;
    input.isAiming = true;
    if (dist > max) {
      sx = (dx / dist) * max;
      sy = (dy / dist) * max;
      input.aimX = dx / dist;
      input.aimY = dy / dist;
    } else {
      sx = dx;
      sy = dy;
      input.aimX = dx / max;
      input.aimY = dy / max;
    }
    joystickShootStick.style.transform = `translate(${sx}px, ${sy}px)`;
  }
  function resetShootJoystick() {
    joystickShootStick.style.transform = 'translate(0, 0)';
    input.aimX = 0;
    input.aimY = 0;
    input.isAiming = false;
  }
  // Boost button
  boostButton.addEventListener('touchstart', (e) => {
    e.preventDefault();
    input.isBoosting = true;
  }, { passive: false });
  boostButton.addEventListener('touchend', (e) => {
    e.preventDefault();
    input.isBoosting = false;
  });
  // Keyboard and mouse
  document.addEventListener('keydown', (e) => {
    if (keyboard.hasOwnProperty(e.key)) keyboard[e.key] = true;
    if (e.key === 'p' || e.key === 'P') {
      togglePauseShop();
    }
    updateFromKeyboard();
  });
  document.addEventListener('keyup', (e) => {
    if (keyboard.hasOwnProperty(e.key)) keyboard[e.key] = false;
    updateFromKeyboard();
  });
  canvas.addEventListener('mousedown', (e) => {
    input.mouseDown = true;
    aimFromMouse(e);
  });
  canvas.addEventListener('mouseup', () => {
    input.mouseDown = false;
  });
  canvas.addEventListener('mousemove', aimFromMouse);
  function updateFromKeyboard() {
    input.moveX = 0;
    input.moveY = 0;
    if (keyboard['w']) input.moveY = -1;
    if (keyboard['s']) input.moveY = 1;
    if (keyboard['a']) input.moveX = -1;
    if (keyboard['d']) input.moveX = 1;
    const m = Math.hypot(input.moveX, input.moveY);
    if (m > 0) {
      input.moveX /= m;
      input.moveY /= m;
    }
    input.aimX = 0;
    input.aimY = 0;
    if (keyboard['ArrowUp']) input.aimY = -1;
    if (keyboard['ArrowDown']) input.aimY = 1;
    if (keyboard['ArrowLeft']) input.aimX = -1;
    if (keyboard['ArrowRight']) input.aimX = 1;
    const a = Math.hypot(input.aimX, input.aimY);
    input.isAiming = a > 0;
    input.isBoosting = keyboard[' '];
  }
  function aimFromMouse(e) {
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const dx = px - player.x;
    const dy = py - player.y;
    const m = Math.hypot(dx, dy) || 1;
    input.aimX = dx / m;
    input.aimY = dy / m;
    input.isAiming = input.mouseDown;
  }
  // Start and message button
  startButton.addEventListener('click', showGame);
  startButton.addEventListener('touchstart', (e) => {
    e.preventDefault();
    showGame();
  });
  const first = (e) => {
    e.preventDefault();
    startGame();
    messageButton.removeEventListener('click', first);
    messageButton.removeEventListener('touchstart', first);
  };
  messageButton.addEventListener('click', first);
  messageButton.addEventListener('touchstart', first);
  // Open shop from start
  openShopFromStart.addEventListener('click', () => openShop());
  closeShopBtn.addEventListener('click', () => {
    closeShop();
    if (!gameRunning && document.getElementById('gameContainer').style.display === 'block') {
      requestAnimationFrame(gameLoop);
    }
  });
}

/* ====== SHOP FUNCTIONS ====== */
function renderShop() {
  Save.sync();
  shopGrid.innerHTML = '';
  for (const cat of ['Offense', 'Defense', 'Utility']) {
    const head = document.createElement('div');
    head.style.gridColumn = '1/-1';
    head.style.margin = '6px 0';
    head.innerHTML = `<div style="opacity:.8;border-bottom:1px solid #1f2937;padding:6px 2px;font-weight:900;color:#9ca3af">${cat}</div>`;
    shopGrid.appendChild(head);
    for (const u of UPGRADES.filter(x => x.cat === cat)) {
      const lvl = Save.getUpgradeLevel(u.id);
      const cost = lvl >= u.max ? 'MAX' : costOf(u);
      const card = document.createElement('div');
      card.className = 'item';
      card.innerHTML = `
        <h4>${u.name} <span class="lvl">(Lv ${lvl}/${u.max})</span></h4>
        <div class="tags">${cat}</div>
        <p>${u.desc}</p>
        <div class="buyRow">
          <div>${cost === 'MAX' ? '—' : `Cost: ₵ ${cost}`}</div>
          <button class="btnBuy" ${cost === 'MAX' ? 'disabled' : ''}>${cost === 'MAX' ? 'Maxed' : 'Buy'}</button>
        </div>
      `;
      const btn = card.querySelector('.btnBuy');
      if (btn) {
        btn.addEventListener('click', () => {
          const price = costOf(u);
          if (Save.spendCredits(price)) {
            Save.levelUp(u.id);
            applyUpgrades();
            renderShop();
          }
        });
      }
      shopGrid.appendChild(card);
    }
  }
}
function openShop() {
  renderShop();
  shopModal.style.display = 'flex';
  Save.sync();
}
function closeShop() {
  shopModal.style.display = 'none';
}
function togglePauseShop() {
  if (!gameRunning) {
    openShop();
    return;
  }
  paused = !paused;
  if (paused) {
    openShop();
  } else {
    closeShop();
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
  }
}
function pauseAndOpenShop(title, text) {
  paused = true;
  messageBox.style.display = 'block';
  messageTitle.textContent = title;
  messageText.textContent = text;
  messageButton.textContent = 'Resume';
  const h = (e) => {
    e && e.preventDefault();
    messageBox.style.display = 'none';
    openShop();
    messageButton.removeEventListener('click', h);
    messageButton.removeEventListener('touchstart', h);
  };
  messageButton.addEventListener('click', h);
  messageButton.addEventListener('touchstart', h);
}
function applyUpgrades() {
  if (!player) return;
  const d = dStats();
  player.hpMax = d.hpMax;
  if (player.health > player.hpMax) player.health = player.hpMax;
}

/* ====== RESIZE & START ART ====== */
function resizeCanvas() {
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (starsFar) {
    starsFar = makeStars(120);
    starsMid = makeStars(80);
    starsNear = makeStars(50);
  }
  drawStartGraphic();
}
function drawStartGraphic() {
  const g = startGraphicCanvas.getContext('2d');
  const w = startGraphicCanvas.width = startGraphicCanvas.clientWidth;
  const h = startGraphicCanvas.height = startGraphicCanvas.clientHeight;
  g.fillStyle = '#000';
  g.fillRect(0, 0, w, h);
  g.fillStyle = '#fff';
  for (let i = 0; i < 30; i++) {
    g.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5);
  }
  g.save();
  g.translate(w / 2 - 30, h / 2);
  g.rotate(-0.5);
  g.fillStyle = '#007bff';
  g.strokeStyle = '#fff';
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(15, 0);
  g.lineTo(-15, -12);
  g.lineTo(-12, 0);
  g.lineTo(-15, 12);
  g.closePath();
  g.fill();
  g.stroke();
  g.restore();
  g.fillStyle = '#dc3545';
  g.beginPath();
  g.arc(w / 2 + 40, h / 2 - 30, 8, 0, Math.PI * 2);
  g.fill();
  g.beginPath();
  g.arc(w / 2 + 60, h / 2 + 20, 8, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#ffc107';
  g.beginPath();
  g.arc(w / 2, h / 2 + 40, 6, 0, Math.PI * 2);
  g.fill();
}

/* ====== BOOT ====== */
function init() {
  resizeCanvas();
  drawStartGraphic();
  addInputListeners();
}
window.addEventListener('resize', resizeCanvas);

init();