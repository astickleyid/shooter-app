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
/* (file continues with the same content as provided) */