(() => {
  /* ====== UTILS ====== */
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const rand = (min, max) => min + Math.random() * (max - min);
  const chance = (p) => Math.random() < p;

  /* ====== CONFIG ====== */
  const SAVE_KEY = 'void_rift_v11';

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
    OBST_ASTEROIDS: 6
  };

  const SHIP_TEMPLATES = [
    {
      id: 'vanguard',
      name: 'Vanguard Mk.I',
      desc: 'Balanced strike craft with reliable systems and shielded canopy.',
      shape: 'spear',
      scale: 1,
      engineOffset: 1.08,
      colors: {
        primary: '#0ea5e9',
        trim: '#f8fafc',
        canopy: '#7dd3fc',
        accent: '#38bdf8',
        thruster: '#f97316'
      },
      stats: {
        hp: 1,
        speed: 1,
        boost: 1,
        ammo: 1,
        damage: 1,
        fireRate: 1,
        pickup: 1,
        ammoRegen: 1
      }
    },
    {
      id: 'phantom',
      name: 'Phantom-X',
      desc: 'Prototype interceptor tuned for extreme velocity and evasive manoeuvres.',
      shape: 'needle',
      scale: 0.92,
      engineOffset: 1.2,
      colors: {
        primary: '#14b8a6',
        trim: '#f0fdfa',
        canopy: '#5eead4',
        accent: '#34d399',
        thruster: '#22d3ee'
      },
      stats: {
        hp: 0.85,
        speed: 1.22,
        boost: 1.28,
        ammo: 0.9,
        damage: 0.95,
        fireRate: 0.9,
        pickup: 1.1,
        ammoRegen: 0.9
      }
    },
    {
      id: 'bulwark',
      name: 'Bulwark-7',
      desc: 'Siege-rated assault pod with reinforced plating and extended magazine.',
      shape: 'bastion',
      scale: 1.1,
      engineOffset: 0.95,
      colors: {
        primary: '#475569',
        trim: '#f1f5f9',
        canopy: '#cbd5f5',
        accent: '#94a3b8',
        thruster: '#facc15'
      },
      stats: {
        hp: 1.35,
        speed: 0.86,
        boost: 0.92,
        ammo: 1.22,
        damage: 1.1,
        fireRate: 1.18,
        pickup: 0.95,
        ammoRegen: 0.85
      }
    },
    {
      id: 'emberwing',
      name: 'Emberwing',
      desc: 'Glass-cannon rail platform—fires volatile bursts and rides the flame.',
      shape: 'razor',
      scale: 0.98,
      engineOffset: 1.12,
      colors: {
        primary: '#ef4444',
        trim: '#fee2e2',
        canopy: '#fca5a5',
        accent: '#fb7185',
        thruster: '#f97316'
      },
      stats: {
        hp: 0.9,
        speed: 1.08,
        boost: 1.1,
        ammo: 0.82,
        damage: 1.28,
        fireRate: 0.94,
        pickup: 1,
        ammoRegen: 0.95
      }
    }
  ];

  const ARMORY = {
    primary: [
      {
        id: 'pulse',
        name: 'Pulse Blaster',
        desc: 'Standardized pulse cannon with reliable cadence and balanced impact.',
        unlock: 0,
        stats: { cd: 1, damage: 1, ammo: 1, shots: 0, spread: 0.06, pelletJitter: 0.04, bulletSpeed: 1, bulletSize: 1, ammoPerShot: 1, pierce: 0 },
        color: '#fde047'
      },
      {
        id: 'scatter',
        name: 'Scatter Coil',
        desc: 'Tri-barrel scatter assembly saturating a forward cone with flechettes.',
        unlock: 420,
        stats: { cd: 1.18, damage: 0.75, ammo: 1.15, shots: 3, spread: 0.32, pelletJitter: 0.18, bulletSpeed: 0.9, bulletSize: 0.9, ammoPerShot: 1, pierce: 0 },
        color: '#fbbf24'
      },
      {
        id: 'rail',
        name: 'Rail Lance',
        desc: 'Accelerated rail slug that punches through hulls with devastating force.',
        unlock: 620,
        stats: { cd: 1.45, damage: 2.8, ammo: 0.7, shots: 0, spread: 0.02, pelletJitter: 0, bulletSpeed: 2.1, bulletSize: 1.25, ammoPerShot: 1, pierce: 2 },
        color: '#a855f7'
      },
      {
        id: 'ionburst',
        name: 'Ion Burst Array',
        desc: 'Charged plates emit a fan of ionized shards that arc toward targets.',
        unlock: 520,
        stats: { cd: 0.92, damage: 0.9, ammo: 0.95, shots: 3, spread: 0.24, pelletJitter: 0.1, bulletSpeed: 1.2, bulletSize: 0.85, ammoPerShot: 1, pierce: 0 },
        color: '#38bdf8'
      }
    ],
    secondary: [
      {
        id: 'nova',
        name: 'Nova Bomb',
        desc: 'Deploy an antimatter core that detonates after a short fuse.',
        unlock: 0,
        color: '#f97316',
        stats: { ammo: 3, cooldown: 9000, radius: 150, damage: 70 }
      },
      {
        id: 'cluster',
        name: 'Cluster Barrage',
        desc: 'Launch micro warheads that scatter and detonate sequentially.',
        unlock: 540,
        color: '#38bdf8',
        stats: { ammo: 2, cooldown: 11000, radius: 130, damage: 45, clusters: 5 }
      }
    ],
    defense: [
      {
        id: 'aegis',
        name: 'Aegis Field',
        desc: 'Projects a forward arc shield absorbing incoming fire.',
        unlock: 0,
        color: '#38bdf8',
        stats: { duration: 3500, cooldown: 12000, absorb: 0.65 }
      },
      {
        id: 'reflector',
        name: 'Reflector Veil',
        desc: 'Phase shield that reflects a portion of damage back to attackers.',
        unlock: 600,
        color: '#a855f7',
        stats: { duration: 2600, cooldown: 9500, absorb: 0.45, reflect: 0.25 }
      }
    ],
    ultimate: [
      {
        id: 'voidstorm',
        name: 'Voidstorm Cascade',
        desc: 'Collapse a gravity well into a devastating omni-directional blast.',
        unlock: 0,
        color: '#f97316',
        stats: { charge: 100, radius: 220, damage: 160, pull: 0.6 }
      },
      {
        id: 'solarbeam',
        name: 'Solar Beam',
        desc: 'Channel orbital lances into a sweeping beam of plasma.',
        unlock: 780,
        color: '#facc15',
        stats: { charge: 120, beamLength: 520, width: 90, damage: 220 }
      }
    ]
  };

  const ARMORY_MAP = {
    primary: Object.fromEntries(ARMORY.primary.map((w) => [w.id, w])),
    secondary: Object.fromEntries(ARMORY.secondary.map((w) => [w.id, w])),
    defense: Object.fromEntries(ARMORY.defense.map((w) => [w.id, w])),
    ultimate: Object.fromEntries(ARMORY.ultimate.map((w) => [w.id, w]))
  };

  const HANGAR_STATS = [
    { key: 'hp', label: 'Hull' },
    { key: 'speed', label: 'Speed' },
    { key: 'damage', label: 'Damage' },
    { key: 'ammo', label: 'Magazine' },
    { key: 'fireRate', label: 'Rate of Fire', invert: true }
  ];

  const SUPPLY_TYPES = ['ammo', 'secondary', 'defense'];

  const XP_PER_LEVEL = (lvl) => Math.floor(160 + Math.pow(lvl, 1.65) * 55);

  /* ====== DOM ====== */
  const dom = {};
  const assignDomRefs = () => {
    dom.startScreen = document.getElementById('startScreen');
    dom.startButton = document.getElementById('startButton');
    dom.openShopFromStart = document.getElementById('openShopFromStart');
    dom.settingsButton = document.getElementById('settingsButton');
    dom.startGraphicCanvas = document.getElementById('startGraphicCanvas');
    dom.gameContainer = document.getElementById('gameContainer');
    dom.canvas = document.getElementById('gameCanvas');
    dom.ctx = dom.canvas ? dom.canvas.getContext('2d') : null;
    dom.scoreValue = document.getElementById('scoreValue');
    dom.levelValue = document.getElementById('levelValue');
    dom.healthBar = document.getElementById('healthBar');
    dom.ammoBar = document.getElementById('ammoBar');
    dom.creditsText = document.getElementById('creditsText');
    dom.pilotLevelValue = document.getElementById('pilotLevelValue');
    dom.xpBar = document.getElementById('xpBar');
    dom.xpText = document.getElementById('xpText');
    dom.ultBar = document.getElementById('ultBar');
    dom.ultText = document.getElementById('ultText');
    dom.secondaryText = document.getElementById('secondaryText');
    dom.defenseText = document.getElementById('defenseText');
    dom.messageBox = document.getElementById('messageBox');
    dom.messageTitle = document.getElementById('messageTitle');
    dom.messageText = document.getElementById('messageText');
    dom.messageButton = document.getElementById('messageButton');
    dom.joystickMoveBase = document.getElementById('joystickMoveBase');
    dom.joystickMoveStick = document.getElementById('joystickMoveStick');
    dom.joystickShootBase = document.getElementById('joystickShootBase');
    dom.joystickShootStick = document.getElementById('joystickShootStick');
    dom.boostButton = document.getElementById('boostButton');
    dom.secondaryButton = document.getElementById('secondaryButton');
    dom.defenseButton = document.getElementById('defenseButton');
    dom.ultimateButton = document.getElementById('ultimateButton');
    dom.shopModal = document.getElementById('shopModal');
    dom.shopGrid = document.getElementById('shopGrid');
    dom.shopCreditsText = document.getElementById('shopCredits');
    dom.closeShopBtn = document.getElementById('closeShop');
    dom.openHangarFromShop = document.getElementById('openHangarFromShop');
    dom.hangarModal = document.getElementById('hangarModal');
    dom.hangarGrid = document.getElementById('hangarGrid');
    dom.hangarClose = document.getElementById('closeHangar');
  };

  /* ====== STATE ====== */
  let player = null;
  let enemies = [];
  let bullets = [];
  let coins = [];
  let supplies = [];
  let spawners = [];
  let starsFar = null;
  let starsMid = null;
  let starsNear = null;
  let particles = [];
  let obstacles = [];
  let timedEffects = [];
  let score = 0;
  let level = 1;
  let enemiesToKill = 10;
  let enemiesKilled = 0;
  let lastTime = 0;
  let gameRunning = false;
  let paused = false;
  let lastAmmoRegen = 0;
  let lastShotTime = 0;
  let shakeUntil = 0;
  let shakePower = 3;
  let pilotLevel = 1;
  let pilotXP = 0;
  let tookDamageThisLevel = false;
  let gameOverHandled = false;
  const camera = { x: 0, y: 0 };

  let currentShip = null;

  const input = {
    moveX: 0,
    moveY: 0,
    aimX: 0,
    aimY: 0,
    isAiming: false,
    fireHeld: false,
    isBoosting: false,
    mouseDown: false,
    mouseAimActive: false,
    altFireHeld: false,
    defenseHeld: false,
    ultimateQueued: false
  };

  const keyboard = {
    w: false,
    a: false,
    s: false,
    d: false,
    ArrowUp: false,
    ArrowLeft: false,
    ArrowDown: false,
    ArrowRight: false,
    ' ': false,
    Shift: false,
    e: false,
    E: false,
    f: false,
    F: false,
    r: false,
    R: false
  };

  const defaultArmory = () => ({
    unlocked: {
      primary: ['pulse'],
      secondary: ['nova'],
      defense: ['aegis'],
      ultimate: ['voidstorm']
    },
    loadout: {
      primary: 'pulse',
      secondary: 'nova',
      defense: 'aegis',
      ultimate: 'voidstorm'
    }
  });

  const Save = {
    data: {
      credits: 0,
      bestScore: 0,
      highestLevel: 1,
      upgrades: {},
      pilotLevel: 1,
      pilotXp: 0,
      selectedShip: 'vanguard',
      armory: defaultArmory()
    },
    load() {
      try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            this.data = {
              ...this.data,
              ...parsed,
              armory: parsed.armory || defaultArmory()
            };
          }
        }
      } catch (err) {
        console.warn('Failed to load save', err);
      }
      this.data.pilotLevel = Math.max(1, this.data.pilotLevel || 1);
      this.data.pilotXp = Math.max(0, this.data.pilotXp || 0);
      if (!this.data.selectedShip) this.data.selectedShip = 'vanguard';
      if (!this.data.armory || typeof this.data.armory !== 'object') this.data.armory = defaultArmory();
      for (const key of ['primary', 'secondary', 'defense', 'ultimate']) {
        if (!Array.isArray(this.data.armory.unlocked[key])) this.data.armory.unlocked[key] = [];
        if (!this.data.armory.loadout[key]) this.data.armory.loadout[key] = defaultArmory().loadout[key];
        if (!this.data.armory.unlocked[key].includes(this.data.armory.loadout[key])) {
          this.data.armory.unlocked[key].push(this.data.armory.loadout[key]);
        }
      }
    },
    save() {
      try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(this.data));
      } catch (err) {
        console.warn('Failed to save game', err);
      }
    },
    addCredits(amount) {
      this.data.credits = Math.max(0, Math.floor(this.data.credits + amount));
      syncCredits();
      this.save();
    },
    spendCredits(amount) {
      if (this.data.credits >= amount) {
        this.data.credits -= amount;
        syncCredits();
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
    isUnlocked(type, id) {
      const bucket = this.data.armory.unlocked[type] || [];
      return bucket.includes(id);
    },
    unlockArmory(type, id) {
      const bucket = this.data.armory.unlocked[type];
      if (!bucket.includes(id)) bucket.push(id);
      this.save();
    },
    setLoadout(type, id) {
      this.data.armory.loadout[type] = id;
      if (!this.isUnlocked(type, id)) this.unlockArmory(type, id);
      this.save();
    }
  };

  const costOf = (upgrade) => {
    const lvl = Save.getUpgradeLevel(upgrade.id);
    return Math.floor(upgrade.base + upgrade.step * (lvl * 1.5 + lvl * lvl * 0.35));
  };

  const syncCredits = () => {
    if (dom.creditsText) dom.creditsText.textContent = Save.data.credits;
    if (dom.shopCreditsText) dom.shopCreditsText.textContent = Save.data.credits;
  };

  const initShipSelection = () => {
    currentShip = getShipTemplate(Save.data.selectedShip);
    if (!currentShip) {
      currentShip = SHIP_TEMPLATES[0];
      Save.data.selectedShip = currentShip.id;
      Save.save();
    }
  };

  const getShipTemplate = (id) => SHIP_TEMPLATES.find((ship) => ship.id === id) || null;

  const shipStat = (key, fallback = 1) => {
    if (!currentShip || !currentShip.stats) return fallback;
    const value = currentShip.stats[key];
    return value === undefined ? fallback : value;
  };

  const currentPrimaryWeapon = () => ARMORY_MAP.primary[Save.data.armory.loadout.primary] || ARMORY.primary[0];
  const currentSecondarySystem = () => ARMORY_MAP.secondary[Save.data.armory.loadout.secondary] || ARMORY.secondary[0];
  const currentDefenseSystem = () => ARMORY_MAP.defense[Save.data.armory.loadout.defense] || ARMORY.defense[0];
  const currentUltimateSystem = () => ARMORY_MAP.ultimate[Save.data.armory.loadout.ultimate] || ARMORY.ultimate[0];

  const resetRuntimeState = () => {
    enemies = [];
    bullets = [];
    coins = [];
    supplies = [];
    spawners = [];
    particles = [];
    obstacles = [];
    timedEffects = [];
    starsFar = starsMid = starsNear = null;
    score = 0;
    level = 1;
    enemiesToKill = 10;
    enemiesKilled = 0;
    lastTime = 0;
    gameRunning = false;
    paused = false;
    lastAmmoRegen = 0;
    lastShotTime = 0;
    shakeUntil = 0;
    shakePower = 3;
    pilotLevel = Save.data.pilotLevel;
    pilotXP = Save.data.pilotXp;
    tookDamageThisLevel = false;
    gameOverHandled = false;
    Object.keys(input).forEach((k) => {
      if (typeof input[k] === 'boolean') input[k] = false;
      else input[k] = 0;
    });
    input.mouseAimActive = false;
    Object.keys(keyboard).forEach((k) => (keyboard[k] = false));
  };

  const addXP = (amount) => {
    if (!amount || amount <= 0) return false;
    pilotXP += amount;
    let leveled = false;
    let needed = XP_PER_LEVEL(pilotLevel);
    while (pilotXP >= needed) {
      pilotXP -= needed;
      pilotLevel += 1;
      leveled = true;
      needed = XP_PER_LEVEL(pilotLevel);
    }
    Save.data.pilotLevel = pilotLevel;
    Save.data.pilotXp = pilotXP;
    Save.save();
    return leveled;
  };

  const queueTimedEffect = (delayMs, fn) => {
    timedEffects.push({ t: performance.now() + delayMs, fn });
  };

  const consumeTimedEffects = (now) => {
    for (let i = timedEffects.length - 1; i >= 0; i--) {
      if (now >= timedEffects[i].t) {
        try {
          timedEffects[i].fn();
        } catch (err) {
          console.warn('Timed effect failed', err);
        }
        timedEffects.splice(i, 1);
      }
    }
  };

  const shakeScreen = (power = 4, duration = 120) => {
    shakeUntil = Math.max(shakeUntil, performance.now() + duration);
    shakePower = power;
  };

  /* ====== PARTICLES ====== */
  const addParticles = (kind, x, y, ang = 0, count = 8, colorOverride) => {
    for (let i = 0; i < count; i++) {
      if (kind === 'muzzle') {
        particles.push({ x: x + Math.cos(ang) * 10, y: y + Math.sin(ang) * 10, vx: rand(-1, 1), vy: rand(-1, 1), life: 220, c: '#ffd54f', s: 2 });
        continue;
      }
      if (kind === 'pop') {
        particles.push({ x, y, vx: rand(-2, 2), vy: rand(-2, 2), life: 320, c: '#fca5a5', s: 2 });
        continue;
      }
      if (kind === 'sparks') {
        particles.push({ x, y, vx: rand(-2.6, 2.6), vy: rand(-2.6, 2.6), life: 160, c: '#ffffff', s: 1.5 });
        continue;
      }
      if (kind === 'debris') {
        particles.push({ x, y, vx: rand(-1.5, 1.5), vy: rand(-1.5, 1.5), life: 400, c: '#9ca3af', s: 2.4 });
        continue;
      }
      if (kind === 'thruster') {
        particles.push({ x, y, vx: rand(-0.6, 0.6), vy: rand(-0.6, 0.6), life: 180 + rand(-40, 60), c: colorOverride || '#ff9a3c', s: 1.8 + rand(-0.4, 0.6) });
        continue;
      }
      if (kind === 'levelup') {
        particles.push({ x, y, vx: rand(-2.2, 2.2), vy: rand(-2.2, 2.2), life: 420, c: chance(0.5) ? '#38bdf8' : '#a855f7', s: 3 });
        continue;
      }
      if (kind === 'nova') {
        const palette = ['#fde68a', '#f97316'];
        particles.push({ x, y, vx: rand(-3, 3), vy: rand(-3, 3), life: 260, c: palette[i % palette.length], s: 3 });
        continue;
      }
      if (kind === 'shield') {
        particles.push({ x: x + rand(-14, 14), y: y + rand(-14, 14), vx: rand(-0.5, 0.5), vy: rand(-0.5, 0.5), life: 220, c: 'rgba(148,163,246,0.8)', s: 2 });
        continue;
      }
      if (kind === 'ultimate') {
        const palette = ['#f97316', '#a855f7'];
        particles.push({ x: x + rand(-4, 4), y: y + rand(-4, 4), vx: rand(-4, 4), vy: rand(-4, 4), life: 320, c: palette[i % palette.length], s: 4 });
      }
    }
  };

  const drawParticles = (ctx, dt) => {
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
  };

  /* ====== ENVIRONMENT ====== */
  const viewRadius = (mult = 1) => Math.max(window.innerWidth, window.innerHeight) * 0.7 * mult;

  const makeStars = (n) => {
    const arr = [];
    const margin = viewRadius(1.6);
    const cx = camera.x + window.innerWidth / 2;
    const cy = camera.y + window.innerHeight / 2;
    for (let i = 0; i < n; i++) {
      arr.push({
        x: cx + (Math.random() - 0.5) * margin * 2,
        y: cy + (Math.random() - 0.5) * margin * 2,
        s: Math.random() * 2 + 0.4
      });
    }
    return arr;
  };

  const drawStarsLayer = (ctx, arr, speed) => {
    ctx.fillStyle = '#fff';
    for (const star of arr) {
      ctx.globalAlpha = clamp(star.s / 2.6, 0.2, 0.9);
      ctx.fillRect(star.x, star.y, star.s, star.s);
      star.x -= speed;
      const margin = viewRadius(1.8);
      if (star.x < camera.x - margin) {
        star.x = camera.x + margin;
        star.y = camera.y + (Math.random() - 0.5) * margin * 2;
      }
      if (star.x > camera.x + margin) {
        star.x = camera.x - margin;
        star.y = camera.y + (Math.random() - 0.5) * margin * 2;
      }
      if (star.y < camera.y - margin) {
        star.y = camera.y + margin;
        star.x = camera.x + (Math.random() - 0.5) * margin * 2;
      }
      if (star.y > camera.y + margin) {
        star.y = camera.y - margin;
        star.x = camera.x + (Math.random() - 0.5) * margin * 2;
      }
    }
    ctx.globalAlpha = 1;
  };

  const recenterStars = () => {
    const margin = viewRadius(1.6);
    const cx = camera.x + window.innerWidth / 2;
    const cy = camera.y + window.innerHeight / 2;
    const bundles = [starsFar, starsMid, starsNear];
    for (const layer of bundles) {
      if (!layer) continue;
      for (const star of layer) {
        star.x = cx + (Math.random() - 0.5) * margin * 2;
        star.y = cy + (Math.random() - 0.5) * margin * 2;
      }
    }
  };

  const randomAround = (cx, cy, min, max) => {
    const angle = rand(0, Math.PI * 2);
    const dist = rand(min, max);
    return {
      x: cx + Math.cos(angle) * dist,
      y: cy + Math.sin(angle) * dist
    };
  };

  class Asteroid {
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
      const seg = 8 + Math.floor(Math.random() * 4);
      for (let i = 0; i < seg; i++) {
        const a = (i / seg) * Math.PI * 2;
        const rr = r * rand(0.7, 1.15);
        this.points.push({ a, rr });
      }
    }
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
      const grd = ctx.createLinearGradient(-this.r, -this.r, this.r, this.r);
      grd.addColorStop(0, 'rgba(255,255,255,0.1)');
      grd.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.strokeStyle = grd;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }
    update(dt) {
      const step = dt / 16.67;
      this.x += this.vx * step;
      this.y += this.vy * step;
      this.rot += this.vr * step;
      if (!player) return;
      const limit = viewRadius(1.8);
      const dx = this.x - player.x;
      const dy = this.y - player.y;
      if (dx * dx + dy * dy > limit * limit) this.resetPosition();
    }
    resetPosition() {
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

  const spawnObstacles = () => {
    obstacles = [];
    if (!player) return;
    const count = BASE.OBST_ASTEROIDS + Math.floor(level / 2);
    const inner = viewRadius(0.35);
    const outer = viewRadius(1.2);
    for (let i = 0; i < count; i++) {
      const r = rand(18, 42);
      const pos = randomAround(player.x, player.y, inner, outer);
      const roll = Math.random();
      let variant = 'rock';
      if (roll < 0.25) variant = 'iron';
      else if (roll > 0.75) variant = 'ember';
      obstacles.push(new Asteroid(pos.x, pos.y, r, variant));
    }
  };

  /* ====== ENTITY CLASSES ====== */
  class Bullet {
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
    update(dt) {
      const step = dt / 16.67;
      this.x += this.vel.x * this.speed * step;
      this.y += this.vel.y * this.speed * step;
      this.life += dt;
    }
    expired(maxDistance) {
      if (this.life > this.maxLife) return true;
      if (!player) return false;
      const dx = this.x - player.x;
      const dy = this.y - player.y;
      return dx * dx + dy * dy > maxDistance * maxDistance;
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
      this.animPhase = Math.random() * Math.PI * 2;
    }
    draw(ctx) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rot);
      
      const pulse = Math.sin(performance.now() / 180 + this.animPhase) * 0.15 + 1;
      
      if (this.kind === 'chaser') {
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
        
        // Eyes
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(this.size * 0.3, -this.size * 0.3, this.size * 0.2, 0, Math.PI * 2);
        ctx.arc(this.size * 0.3, this.size * 0.3, this.size * 0.2, 0, Math.PI * 2);
        ctx.fill();
        
        // Pupils
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.arc(this.size * 0.35, -this.size * 0.3, this.size * 0.1, 0, Math.PI * 2);
        ctx.arc(this.size * 0.35, this.size * 0.3, this.size * 0.1, 0, Math.PI * 2);
        ctx.fill();
        
      } else if (this.kind === 'heavy') {
        // Heavy tank - green crystalline structure
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
        
        // Glowing core
        ctx.fillStyle = '#bbf7d0';
        ctx.shadowColor = '#22c55e';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 0.4 * pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
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
        
        // Nucleus spots
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(-this.size * 0.2, -this.size * 0.15, this.size * 0.2, 0, Math.PI * 2);
        ctx.arc(this.size * 0.1, this.size * 0.2, this.size * 0.15, 0, Math.PI * 2);
        ctx.fill();
        
        // Pulsing tendrils
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
      ctx.restore();
    }
    update(dt) {
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

  class Coin {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.r = BASE.COIN_SIZE;
      this.created = performance.now();
      this.life = BASE.COIN_LIFETIME;
    }
    draw(ctx) {
      const age = performance.now() - this.created;
      const rem = (this.life - age) / this.life;
      if (rem < 0.3 && ((age / 100) | 0) % 2 === 0) return;
      ctx.globalAlpha = Math.max(0, rem);
      const wobble = Math.sin((performance.now() + this.created) / 220) * 0.2;
      const rx = this.r * (1 + wobble * 0.08);
      const ry = this.r * (1 - wobble * 0.2);
      const grd = ctx.createRadialGradient(this.x - rx * 0.3, this.y - ry * 0.3, 2, this.x, this.y, rx);
      grd.addColorStop(0, '#fff7b2');
      grd.addColorStop(0.4, '#facc15');
      grd.addColorStop(1, '#b45309');
      ctx.fillStyle = grd;
      ctx.strokeStyle = '#fde68a';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.ellipse(this.x, this.y, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(this.x, this.y, rx * 0.55, ry * 0.55, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.65)';
      ctx.beginPath();
      ctx.ellipse(this.x - rx * 0.2, this.y - ry * 0.4, rx * 0.18, ry * 0.18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  class SupplyCrate {
    constructor(x, y, kind = 'ammo') {
      this.x = x;
      this.y = y;
      this.kind = kind;
      this.size = 12;
      this.created = performance.now();
      this.life = 12000;
      this.spin = rand(0, Math.PI * 2);
    }
    draw(ctx) {
      const age = performance.now() - this.created;
      const pulse = 0.65 + Math.sin(age / 160) * 0.2;
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.spin + age / 500);
      const color = this.kind === 'ammo' ? '#bef264' : this.kind === 'secondary' ? '#38bdf8' : '#c084fc';
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.85;
      const w = this.size * 2 * pulse;
      const h = this.size * 1.2;
      const r = 6;
      const x = -this.size * pulse;
      const y = -this.size * 0.6;
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

  class Spawner {
    constructor() {
      this.resetPosition();
      this.last = performance.now();
      this.rate = spawnRate();
    }
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
    update(now) {
      if (!player) return;
      if (Math.hypot(this.x - player.x, this.y - player.y) > viewRadius(1.8)) this.resetPosition();
      if (now - this.last > this.rate) {
        this.spawn();
        this.last = now;
        this.rate = spawnRate();
      }
    }
    spawn() {
      if (!player) return;
      const roll = Math.random();
      const kind = roll < 0.15 ? 'heavy' : roll > 0.75 ? 'swarmer' : 'chaser';
      const dir = Math.atan2(player.y - this.y, player.x - this.x);
      const dist = 70;
      const jitter = rand(-40, 40);
      const x = this.x + Math.cos(dir) * dist + Math.cos(dir + Math.PI / 2) * jitter;
      const y = this.y + Math.sin(dir) * dist + Math.sin(dir + Math.PI / 2) * jitter;
      enemies.push(new Enemy(x, y, kind));
      if (Math.random() < 0.4) this.resetPosition();
    }
    resetPosition() {
      if (!player) {
        this.x = rand(0, window.innerWidth);
        this.y = rand(0, window.innerHeight);
        return;
      }
      const inner = viewRadius(0.8);
      const outer = viewRadius(1.6);
      const pos = randomAround(player.x, player.y, inner, outer);
      this.x = pos.x;
      this.y = pos.y;
    }
  }

  const spawnRate = () => {
    const base = BASE.SPAWNER_RATE_MS - level * 90 + Math.random() * 300;
    return Math.max(500, base);
  };

  const createSpawners = (count) => {
    spawners = [];
    for (let i = 0; i < count; i++) spawners.push(new Spawner());
  };

  class PlayerEntity {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.size = BASE.PLAYER_SIZE;
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

    reconfigureLoadout(preserveVitals = true) {
      this.primary = currentPrimaryWeapon();
      this.secondary = currentSecondarySystem();
      this.defense = currentDefenseSystem();
      this.ultimate = currentUltimateSystem();
      currentShip = getShipTemplate(Save.data.selectedShip);
      const template = currentShip || SHIP_TEMPLATES[0];
      this.shipColors = template.colors || {};
      const prevHealthRatio = preserveVitals && this.hpMax ? this.health / this.hpMax : 1;
      const prevAmmoRatio = preserveVitals && this.ammoMax ? this.ammo / this.ammoMax : 1;
      const prevSecondaryRatio = preserveVitals && this.secondaryCapacity ? this.secondaryAmmo / this.secondaryCapacity : 1;
      const prevUltimateRatio = preserveVitals && this.ultimateChargeMax ? this.ultimateCharge / this.ultimateChargeMax : 0;
      this.size = BASE.PLAYER_SIZE * (template.scale || 1);
      this.engineOffset = template.engineOffset || 1.1;
      const weaponStats = (this.primary && this.primary.stats) || {};
      this.ammoPerShot = Math.max(1, Math.round(weaponStats.ammoPerShot || 1));
      this.ammoMax = Math.max(1, Math.round(BASE.PLAYER_AMMO * shipStat('ammo', 1) * (weaponStats.ammo || 1)));
      const stats = this.#dynamicStats();
      this.hpMax = stats.hpMax;
      if (preserveVitals) {
        this.health = clamp(this.hpMax * prevHealthRatio, 1, this.hpMax);
        this.ammo = clamp(Math.round(this.ammoMax * prevAmmoRatio), 0, this.ammoMax);
      } else {
        this.health = this.hpMax;
        this.ammo = this.ammoMax;
      }
      const secondaryStats = (this.secondary && this.secondary.stats) || {};
      const defenseStats = (this.defense && this.defense.stats) || {};
      const ultimateStats = (this.ultimate && this.ultimate.stats) || {};
      this.secondaryCapacity = Math.max(0, Math.round(secondaryStats.ammo || 0));
      this.secondaryCooldownMs = secondaryStats.cooldown || 9000;
      this.secondaryAmmo = preserveVitals ? clamp(Math.round(this.secondaryCapacity * prevSecondaryRatio), 0, this.secondaryCapacity) : this.secondaryCapacity;
      this.defenseStats = defenseStats;
      if (!preserveVitals) {
        this.defenseReadyAt = performance.now();
        this.defenseActiveUntil = 0;
      }
      this.ultimateChargeMax = Math.max(1, ultimateStats.charge || 100);
      this.ultimateCharge = clamp(this.ultimateChargeMax * prevUltimateRatio, 0, this.ultimateChargeMax);
    }

    #dynamicStats() {
      const L = (id) => Save.getUpgradeLevel(id);
      const weaponStats = (this.primary && this.primary.stats) || {};
      const fireBase = clamp(140 - L('firerate') * 18, 55, 999) * shipStat('fireRate', 1);
      const hpBase = (BASE.PLAYER_HEALTH + L('shield') * 22) * shipStat('hp', 1);
      const pickupBase = (26 + L('magnet') * 14) * shipStat('pickup', 1);
      const ammoRegenBase = clamp((BASE.AMMO_REGEN_MS - L('ammo') * 120) * shipStat('ammoRegen', 1), 280, 2200);
      const baseSpeed = BASE.PLAYER_SPEED * shipStat('speed', 1);
      const boostSpeed = (BASE.PLAYER_BOOST_SPEED + L('boost') * 0.9) * shipStat('boost', shipStat('speed', 1));
      return {
        fireCD: clamp(fireBase * (weaponStats.cd || 1), 35, 999),
        dmg: (1 + L('damage') * 0.6) * shipStat('damage', 1) * (weaponStats.damage || 1),
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

    get thrusterColor() {
      return this.shipColors?.thruster || '#ff9a3c';
    }

    draw(ctx) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.lookAngle);
      const thrusterDist = this.size * (this.engineOffset || 1.1);
      if (chance(0.3)) addParticles('thruster', this.x - Math.cos(this.lookAngle) * thrusterDist, this.y - Math.sin(this.lookAngle) * thrusterDist, 0, 1, this.thrusterColor);
      drawShip(ctx, currentShip?.id || Save.data.selectedShip, this.size);
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
      const stats = this.#dynamicStats();
      const spd = input.isBoosting ? stats.boost : stats.speed;
      const moveMag = Math.hypot(input.moveX, input.moveY);
      let moving = false;
      if (moveMag > 0.01) {
        const nx = input.moveX / moveMag;
        const ny = input.moveY / moveMag;
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
      const hasAim = input.isAiming && (Math.abs(input.aimX) > 0.01 || Math.abs(input.aimY) > 0.01);
      if (hasAim) {
        this.lookAngle = Math.atan2(input.aimY, input.aimX);
        if (input.fireHeld && this.ammo >= this.ammoPerShot && performance.now() - lastShotTime > stats.fireCD) {
          this.shoot(stats);
          lastShotTime = performance.now();
        }
      } else if (moving) {
        this.lookAngle = Math.atan2(this.vel.y, this.vel.x);
      }

      if (this.ammo < this.ammoMax && performance.now() - lastAmmoRegen > stats.ammoRegen) {
        this.ammo = Math.min(this.ammoMax, this.ammo + 1);
        lastAmmoRegen = performance.now();
      }

      if (performance.now() - this.lastRegenT > 5000) {
        const heal = stats.hpRegen5;
        if (heal > 0) this.health = clamp(this.health + heal, 0, this.hpMax);
        this.lastRegenT = performance.now();
      }

      const knock = stats.repulse;
      if (knock > 0) {
        for (const enemy of enemies) {
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
      if (input.altFireHeld && !this.secondaryLatch) {
        if (this.trySecondary(now)) input.altFireHeld = false;
        this.secondaryLatch = true;
      } else if (!input.altFireHeld) {
        this.secondaryLatch = false;
      }
      if (input.defenseHeld && !this.defenseLatch) {
        if (this.activateDefense(now)) input.defenseHeld = false;
        this.defenseLatch = true;
      } else if (!input.defenseHeld) {
        this.defenseLatch = false;
      }
      if (input.ultimateQueued) {
        this.fireUltimate(now);
        input.ultimateQueued = false;
      }
      if (now > this.defenseActiveUntil) this.defenseActiveUntil = 0;
    }

    shoot(stats) {
      const weaponStats = (this.primary && this.primary.stats) || {};
      if (this.ammo < this.ammoPerShot) return;
      this.ammo = Math.max(0, this.ammo - this.ammoPerShot);
      const shots = Math.max(1, Math.round(stats.multishot));
      const spread = weaponStats.spread || 0;
      const jitter = weaponStats.pelletJitter || 0;
      const color = this.primary?.color || currentShip?.colors?.accent || '#fde047';
      for (let i = 0; i < shots; i++) {
        const ratio = shots > 1 ? i / (shots - 1) - 0.5 : 0;
        let offset = spread ? spread * ratio : 0;
        if (jitter) offset += rand(-jitter, jitter);
        const angle = this.lookAngle + offset;
        const vel = { x: Math.cos(angle), y: Math.sin(angle) };
        const sx = this.x + Math.cos(angle) * this.size * 0.9;
        const sy = this.y + Math.sin(angle) * this.size * 0.9;
        const speed = BASE.BULLET_SPEED * (weaponStats.bulletSpeed || 1);
        const size = BASE.BULLET_SIZE * (weaponStats.bulletSize || 1);
        const pierce = weaponStats.pierce || 0;
        bullets.push(new Bullet(sx, sy, vel, stats.dmg, color, speed, size, pierce));
      }
      addParticles('muzzle', this.x, this.y, this.lookAngle, 6);
    }

    trySecondary(now) {
      if (!this.secondary || this.secondaryCapacity <= 0) return false;
      if (this.secondaryAmmo <= 0) return false;
      if (now < this.secondaryReadyAt) return false;
      const stats = this.secondary.stats || {};
      this.secondaryAmmo--;
      this.secondaryReadyAt = now + (this.secondaryCooldownMs || 9000);
      const originX = this.x + Math.cos(this.lookAngle) * (this.size * 1.4);
      const originY = this.y + Math.sin(this.lookAngle) * (this.size * 1.4);
      addParticles('nova', originX, originY, 0, 24);
      shakeScreen(7, 220);
      if (this.secondary.id === 'cluster') {
        const clusters = stats.clusters || 5;
        for (let i = 0; i < clusters; i++) {
          queueTimedEffect(i * 90, () => {
            const ang = rand(0, Math.PI * 2);
            const dist = rand(24, stats.radius || 130);
            const cx = originX + Math.cos(ang) * dist;
            const cy = originY + Math.sin(ang) * dist;
            addParticles('nova', cx, cy, 0, 18);
            applyRadialDamage(cx, cy, (stats.radius || 130) * 0.55, stats.damage || 45, { knockback: 3.5, chargeMult: 0.5 });
          });
        }
      } else {
        applyRadialDamage(originX, originY, stats.radius || 150, stats.damage || 70, { knockback: 4.2, pull: 0.2, chargeMult: 0.6 });
      }
      return true;
    }

    activateDefense(now) {
      if (!this.defense) return false;
      const stats = this.defense.stats || {};
      if (now < this.defenseReadyAt) return false;
      this.defenseReadyAt = now + (stats.cooldown || 12000);
      this.defenseActiveUntil = now + (stats.duration || 3000);
      addParticles('shield', this.x, this.y, 0, 24);
      shakeScreen(4, 140);
      return true;
    }

    isDefenseActive(now = performance.now()) {
      return now < this.defenseActiveUntil;
    }

    fireUltimate(now) {
      if (!this.ultimate) return false;
      if (this.ultimateCharge < this.ultimateChargeMax) return false;
      if (now - this.lastUltimateAt < 600) return false;
      const stats = this.ultimate.stats || {};
      this.ultimateCharge = 0;
      this.lastUltimateAt = now;
      addParticles('ultimate', this.x, this.y, 0, 48);
      shakeScreen(12, 320);
      if (this.ultimate.id === 'solarbeam') {
        const length = stats.beamLength || 520;
        const width = stats.width || 90;
        applyBeamDamage(this.x, this.y, this.lookAngle, length, width, stats.damage || 220);
      } else {
        applyRadialDamage(this.x, this.y, stats.radius || 220, stats.damage || 160, { pull: stats.pull || 0.6, knockback: 8, chargeMult: 0 });
      }
      return true;
    }

    addUltimateCharge(amount) {
      if (!amount || amount <= 0) return;
      this.ultimateCharge = clamp(this.ultimateCharge + amount, 0, this.ultimateChargeMax);
    }

    collectSupply(kind) {
      const now = performance.now();
      if (kind === 'ammo') {
        const gain = Math.max(1, Math.round(this.ammoMax * 0.45));
        this.ammo = clamp(this.ammo + gain, 0, this.ammoMax);
        lastAmmoRegen = now;
      } else if (kind === 'secondary') {
        if (this.secondaryCapacity > 0) this.secondaryAmmo = clamp(this.secondaryAmmo + 1, 0, this.secondaryCapacity);
      } else if (kind === 'defense') {
        this.defenseReadyAt = Math.min(this.defenseReadyAt, now + 400);
        this.defenseActiveUntil = Math.max(this.defenseActiveUntil, now + 600);
      }
      addParticles('shield', this.x, this.y, 0, 18);
      this.addUltimateCharge(12);
    }

    takeDamage(amount) {
      const now = performance.now();
      if (now < this.invEnd) return;
      if (this.isDefenseActive(now)) {
        const absorb = this.defenseStats.absorb || 0;
        const mitigated = amount * absorb;
        amount = Math.max(0, amount - mitigated);
        if ((this.defenseStats.reflect || 0) > 0 && mitigated > 0) {
          applyRadialDamage(this.x, this.y, this.size * 4, mitigated * (this.defenseStats.reflect || 0.25), { knockback: 2, chargeMult: 0.2 });
        }
      }
      if (amount <= 0) return;
      tookDamageThisLevel = true;
      this.health -= amount;
      this.flash = true;
      this.invEnd = now + BASE.INVULN_MS;
      shakeScreen(4, 120);
      if (this.health <= 0) {
        this.health = 0;
        gameRunning = false;
      }
    }
  }

  const drawShip = (ctx, shipId, size) => {
    const template = getShipTemplate(shipId) || SHIP_TEMPLATES[0];
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
      ctx.moveTo(size * 1.15, 0);
      ctx.lineTo(-size * 0.94, -size * 0.82);
      ctx.lineTo(-size * 0.22, 0);
      ctx.lineTo(-size * 0.94, size * 0.82);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

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

  const dropCoin = (x, y) => coins.push(new Coin(x, y));
  const dropSupply = (x, y) => supplies.push(new SupplyCrate(x, y, SUPPLY_TYPES[Math.floor(Math.random() * SUPPLY_TYPES.length)] || 'ammo'));

  const handleEnemyDeath = (index, xpBonus = 0) => {
    const enemy = enemies[index];
    if (!enemy) return;
    dropCoin(enemy.x, enemy.y);
    if (chance(0.22)) dropSupply(enemy.x, enemy.y);
    enemies.splice(index, 1);
    enemiesKilled++;
    score += 15;
    addXP(30 + level * 4 + xpBonus);
    addParticles('pop', enemy.x, enemy.y, 0, 14);
    shakeScreen(3.4, 110);
    if (player) player.addUltimateCharge(15 + level * 2);
  };

  const applyRadialDamage = (cx, cy, radius, damage, opts = {}) => {
    const { pull = 0, knockback = 0, chargeMult = 0.4 } = opts;
    let total = 0;
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
      addParticles('sparks', enemy.x, enemy.y, 0, 10);
      if (enemy.health <= 0) handleEnemyDeath(i, dealt * 0.6);
    }
    if (total > 0) {
      addXP(Math.round(total * 0.4));
      if (player) player.addUltimateCharge(total * chargeMult);
    }
  };

  const applyBeamDamage = (x, y, angle, length, width, damage) => {
    const dirX = Math.cos(angle);
    const dirY = Math.sin(angle);
    const perpX = -dirY;
    const perpY = dirX;
    const halfW = width / 2;
    let total = 0;
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
      addParticles('sparks', enemy.x, enemy.y, 0, 16);
      if (enemy.health <= 0) handleEnemyDeath(i, dealt * 0.5);
    }
    if (total > 0) {
      addXP(Math.round(total * 0.45));
      if (player) player.addUltimateCharge(total * 0.35);
    }
  };

  /* ====== UI / HUD ====== */
  const updateHUD = () => {
    if (!dom.scoreValue || !player) return;
    dom.scoreValue.textContent = score.toLocaleString();
    dom.levelValue.textContent = level;
    dom.healthBar.style.width = `${(player.health / player.hpMax) * 100}%`;
    dom.ammoBar.style.width = `${(player.ammo / player.ammoMax) * 100}%`;
    if (dom.ultBar && dom.ultText) {
      const pct = Math.min(100, Math.round((player.ultimateCharge / player.ultimateChargeMax) * 100));
      dom.ultBar.style.width = `${pct}%`;
      dom.ultText.textContent = `${pct}%`;
    }
    if (dom.secondaryText) {
      dom.secondaryText.textContent = player.secondaryCapacity > 0 ? `${player.secondaryAmmo}/${player.secondaryCapacity}` : '—';
    }
    if (dom.defenseText) {
      const now = performance.now();
      if (player.isDefenseActive(now)) dom.defenseText.textContent = 'Active';
      else {
        const cd = Math.max(0, player.defenseReadyAt - now);
        dom.defenseText.textContent = cd <= 0 ? 'Ready' : `${Math.ceil(cd / 1000)}s`;
      }
    }
    if (dom.pilotLevelValue) dom.pilotLevelValue.textContent = pilotLevel;
    if (dom.xpBar && dom.xpText) {
      const needed = XP_PER_LEVEL(pilotLevel);
      const pct = needed > 0 ? Math.min(100, Math.round((pilotXP / needed) * 100)) : 0;
      dom.xpBar.style.width = `${pct}%`;
      dom.xpText.textContent = `${pct}%`;
    }
  };

  const drawStartGraphic = () => {
    const canvas = dom.startGraphicCanvas;
    if (!canvas) return;
    const g = canvas.getContext('2d');
    const width = (canvas.width = canvas.clientWidth);
    const height = (canvas.height = canvas.clientHeight);
    g.fillStyle = '#000';
    g.fillRect(0, 0, width, height);
    g.fillStyle = '#fff';
    for (let i = 0; i < 30; i++) g.fillRect(Math.random() * width, Math.random() * height, 1.5, 1.5);
    g.save();
    g.translate(width / 2 - 30, height / 2);
    g.rotate(-0.5);
    drawShip(g, Save.data.selectedShip, 18);
    g.restore();
  };

  const showMessage = (title, html, button = 'Continue', handler) => {
    dom.messageTitle.textContent = title;
    dom.messageText.innerHTML = html;
    dom.messageButton.textContent = button;
    dom.messageBox.style.display = 'block';
    const once = (e) => {
      e.preventDefault();
      dom.messageBox.style.display = 'none';
      dom.messageButton.removeEventListener('click', once);
      dom.messageButton.removeEventListener('touchstart', once);
      handler && handler();
    };
    dom.messageButton.addEventListener('click', once);
    dom.messageButton.addEventListener('touchstart', once, { passive: false });
  };

  /* ====== SHOP ====== */
  const renderShop = () => {
    dom.shopGrid.innerHTML = '';
    ['Offense', 'Defense', 'Utility'].forEach((cat) => {
      const head = document.createElement('div');
      head.style.gridColumn = '1/-1';
      head.style.margin = '6px 0';
      head.innerHTML = `<div style="opacity:.8;border-bottom:1px solid #1f2937;padding:6px 2px;font-weight:900;color:#9ca3af">${cat}</div>`;
      dom.shopGrid.appendChild(head);
      for (const upgrade of UPGRADES.filter((x) => x.cat === cat)) {
        const lvl = Save.getUpgradeLevel(upgrade.id);
        const cost = lvl >= upgrade.max ? 'MAX' : costOf(upgrade);
        const card = document.createElement('div');
        card.className = 'item';
        card.innerHTML = `
          <h4>${upgrade.name} <span class="lvl">(Lv ${lvl}/${upgrade.max})</span></h4>
          <div class="tags">${cat}</div>
          <p>${upgrade.desc}</p>
          <div class="buyRow">
            <div>${cost === 'MAX' ? '—' : `Cost: CR ${cost}`}</div>
            <button class="btnBuy" ${cost === 'MAX' ? 'disabled' : ''}>${cost === 'MAX' ? 'Maxed' : 'Buy'}</button>
          </div>
        `;
        const btn = card.querySelector('.btnBuy');
        if (btn && cost !== 'MAX') {
          btn.addEventListener('click', () => {
            const price = costOf(upgrade);
            if (Save.spendCredits(price)) {
              Save.levelUp(upgrade.id);
              if (player) player.reconfigureLoadout(true);
              renderShop();
            }
          });
        }
        dom.shopGrid.appendChild(card);
      }
    });
  };

  const openShop = () => {
    renderShop();
    dom.shopModal.style.display = 'flex';
    syncCredits();
  };

  const closeShop = () => {
    dom.shopModal.style.display = 'none';
  };

  /* ====== HANGAR ====== */
  const formatMultiplier = (mult, invert = false) => {
    const effective = invert ? 1 / mult : mult;
    const delta = Math.round((effective - 1) * 100);
    if (!Number.isFinite(delta) || delta === 0) return 'Balanced';
    return `${delta > 0 ? '+' : ''}${delta}%`;
  };

  const drawWeaponPreview = (canvas, item) => {
    const ctx = canvas.getContext('2d');
    const width = (canvas.width = canvas.clientWidth || 160);
    const height = (canvas.height = canvas.clientHeight || 110);
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, width, height);
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.rotate(-Math.PI / 8);
    ctx.fillStyle = item.color || '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(-width * 0.28, -height * 0.14);
    ctx.lineTo(width * 0.35, 0);
    ctx.lineTo(-width * 0.28, height * 0.14);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-width * 0.15, -height * 0.22);
    ctx.lineTo(width * 0.28, -height * 0.04);
    ctx.moveTo(-width * 0.15, height * 0.22);
    ctx.lineTo(width * 0.28, height * 0.04);
    ctx.stroke();
    ctx.restore();
  };

  const createSectionHeader = (label) => {
    const div = document.createElement('div');
    div.className = 'hangarSectionHeader';
    div.textContent = label;
    return div;
  };

  const createShipCard = (ship) => {
    const card = document.createElement('div');
    card.className = 'hangarShip';
    if (Save.data.selectedShip === ship.id) card.classList.add('selected');
    const preview = document.createElement('canvas');
    preview.className = 'shipPreview';
    card.appendChild(preview);
    const meta = document.createElement('div');
    meta.className = 'shipMeta';
    meta.innerHTML = `<h3>${ship.name}</h3><p>${ship.desc}</p>`;
    card.appendChild(meta);
    const statsWrap = document.createElement('div');
    statsWrap.className = 'shipStats';
    for (const stat of HANGAR_STATS) {
      const mult = ship.stats && ship.stats[stat.key];
      if (mult === undefined) continue;
      const span = document.createElement('span');
      span.innerHTML = `<strong>${stat.label}</strong> ${formatMultiplier(mult, !!stat.invert)}`;
      statsWrap.appendChild(span);
    }
    card.appendChild(statsWrap);
    const btn = document.createElement('button');
    if (Save.data.selectedShip === ship.id) {
      btn.textContent = 'Equipped';
      btn.disabled = true;
    } else {
      btn.textContent = 'Equip';
      btn.addEventListener('click', () => {
        Save.data.selectedShip = ship.id;
        Save.save();
        initShipSelection();
        if (player) player.reconfigureLoadout(true);
        drawStartGraphic();
        renderHangar();
      });
    }
    card.appendChild(btn);
    requestAnimationFrame(() => drawShip(preview.getContext('2d'), ship.id, 14 * (ship.scale || 1)));
    return card;
  };

  const createArmoryCard = (type, item) => {
    const unlocked = Save.isUnlocked(type, item.id);
    const equipped = Save.data.armory.loadout[type] === item.id;
    const card = document.createElement('div');
    card.className = 'hangarShip armoryCard';
    if (equipped) card.classList.add('selected');
    const preview = document.createElement('canvas');
    preview.className = 'shipPreview weaponPreview';
    card.appendChild(preview);
    const meta = document.createElement('div');
    meta.className = 'shipMeta';
    meta.innerHTML = `<h3>${item.name}</h3><p>${item.desc}</p>`;
    card.appendChild(meta);
    const statsWrap = document.createElement('div');
    statsWrap.className = 'shipStats';
    const entries = [];
    if (type === 'primary') {
      entries.push(['Damage', formatMultiplier(item.stats.damage || 1)]);
      entries.push(['Cadence', formatMultiplier(item.stats.cd || 1, true)]);
      entries.push(['Shots', `${(item.stats.shots || 0) + 1}`]);
      entries.push(['Ammo', formatMultiplier(item.stats.ammo || 1)]);
    } else if (type === 'secondary') {
      entries.push(['Ammo', `${item.stats.ammo || 0}`]);
      entries.push(['Cooldown', `${((item.stats.cooldown || 0) / 1000).toFixed(1)}s`]);
      entries.push(['Radius', `${item.stats.radius || 0}`]);
    } else if (type === 'defense') {
      entries.push(['Duration', `${((item.stats.duration || 0) / 1000).toFixed(1)}s`]);
      entries.push(['Absorb', `${Math.round((item.stats.absorb || 0) * 100)}%`]);
      entries.push(['Cooldown', `${((item.stats.cooldown || 0) / 1000).toFixed(1)}s`]);
    } else if (type === 'ultimate') {
      entries.push(['Charge', `${item.stats.charge || 0}`]);
      if (item.stats.radius) entries.push(['Radius', `${item.stats.radius}`]);
      if (item.stats.damage) entries.push(['Damage', `${item.stats.damage}`]);
    }
    for (const [label, value] of entries) {
      const span = document.createElement('span');
      span.innerHTML = `<strong>${label}</strong> ${value}`;
      statsWrap.appendChild(span);
    }
    card.appendChild(statsWrap);
    const btn = document.createElement('button');
    if (!unlocked && item.unlock > 0) {
      btn.textContent = `Unlock — CR ${item.unlock}`;
      if (Save.data.credits < item.unlock) btn.disabled = true;
      btn.addEventListener('click', () => {
        if (Save.spendCredits(item.unlock)) {
          Save.unlockArmory(type, item.id);
          Save.setLoadout(type, item.id);
          if (player) player.reconfigureLoadout(true);
          renderHangar();
        }
      });
    } else {
      btn.textContent = equipped ? 'Equipped' : 'Equip';
      if (equipped) btn.disabled = true;
      btn.addEventListener('click', () => {
        Save.setLoadout(type, item.id);
        if (player) player.reconfigureLoadout(true);
        renderHangar();
      });
    }
    card.appendChild(btn);
    requestAnimationFrame(() => drawWeaponPreview(preview, item));
    return card;
  };

  const renderHangar = () => {
    dom.hangarGrid.innerHTML = '';
    dom.hangarGrid.appendChild(createSectionHeader('Starfighters'));
    SHIP_TEMPLATES.forEach((ship) => dom.hangarGrid.appendChild(createShipCard(ship)));
    dom.hangarGrid.appendChild(createSectionHeader('Primary Weapons'));
    ARMORY.primary.forEach((item) => dom.hangarGrid.appendChild(createArmoryCard('primary', item)));
    dom.hangarGrid.appendChild(createSectionHeader('Secondary Systems'));
    ARMORY.secondary.forEach((item) => dom.hangarGrid.appendChild(createArmoryCard('secondary', item)));
    dom.hangarGrid.appendChild(createSectionHeader('Defense Matrix'));
    ARMORY.defense.forEach((item) => dom.hangarGrid.appendChild(createArmoryCard('defense', item)));
    dom.hangarGrid.appendChild(createSectionHeader('Ultimate Arsenal'));
    ARMORY.ultimate.forEach((item) => dom.hangarGrid.appendChild(createArmoryCard('ultimate', item)));
  };

  const openHangar = () => {
    renderHangar();
    dom.hangarModal.style.display = 'flex';
  };

  const closeHangar = () => {
    dom.hangarModal.style.display = 'none';
  };
  /* ====== GAME UPDATE ====== */
  const updateGame = (dt, now) => {
    if (!player) return;
    player.update(dt);
    consumeTimedEffects(now);
    const targetX = player.x - window.innerWidth / 2;
    const targetY = player.y - window.innerHeight / 2;
    camera.x += (targetX - camera.x) * 0.12;
    camera.y += (targetY - camera.y) * 0.12;
    for (const spawner of spawners) spawner.update(now);
    const maxRange = viewRadius(2.2);
    for (let i = bullets.length - 1; i >= 0; i--) {
      const bullet = bullets[i];
      bullet.update(dt);
      if (bullet.expired(maxRange, player)) {
        bullets.splice(i, 1);
        continue;
      }
      let collision = false;
      for (const obstacle of obstacles) {
        const dx = bullet.x - obstacle.x;
        const dy = bullet.y - obstacle.y;
        if (Math.hypot(dx, dy) < bullet.size + obstacle.r) {
          collision = true;
          obstacle.hp--;
          addParticles('sparks', bullet.x, bullet.y, 0, 5);
          if (obstacle.hp <= 0) {
            addParticles('debris', obstacle.x, obstacle.y, 0, 16);
            obstacle.r = rand(18, 42);
            obstacle.resetPosition();
          }
          break;
        }
      }
      for (let j = enemies.length - 1; j >= 0; j--) {
        const enemy = enemies[j];
        const dx = bullet.x - enemy.x;
        const dy = bullet.y - enemy.y;
        if (Math.hypot(dx, dy) < bullet.size + enemy.size) {
          enemy.health -= bullet.damage;
          addParticles('sparks', bullet.x, bullet.y, 0, 6);
          if (player) player.addUltimateCharge(bullet.damage * 0.35);
          if (enemy.health <= 0) handleEnemyDeath(j);
          if (bullet.pierce > 0) {
            bullet.pierce--;
            continue;
          }
          collision = true;
          break;
        }
      }
      if (collision) bullets.splice(i, 1);
    }

    for (const enemy of enemies) enemy.update(dt);

    for (let i = coins.length - 1; i >= 0; i--) {
      const coin = coins[i];
      if (now - coin.created > BASE.COIN_LIFETIME) {
        coins.splice(i, 1);
        continue;
      }
      const pickupRadius = player ? player.size + 80 : 120;
      const dx = player.x - coin.x;
      const dy = player.y - coin.y;
      const dist = Math.hypot(dx, dy);
      if (dist < pickupRadius * 2) {
        coin.x += (dx / (dist || 1)) * 2;
        coin.y += (dy / (dist || 1)) * 2;
      }
      if (dist < player.size + coin.r) {
        coins.splice(i, 1);
        score += 10;
        Save.addCredits(1);
        addXP(6);
      }
    }

    for (let i = supplies.length - 1; i >= 0; i--) {
      const crate = supplies[i];
      if (now - crate.created > crate.life) {
        supplies.splice(i, 1);
        continue;
      }
      const dx = player.x - crate.x;
      const dy = player.y - crate.y;
      const dist = Math.hypot(dx, dy);
      if (dist < player.size + 120) {
        crate.x += (dx / (dist || 1)) * 1.6;
        crate.y += (dy / (dist || 1)) * 1.6;
      }
      if (dist < player.size + crate.size) {
        supplies.splice(i, 1);
        player.collectSupply(crate.kind);
        Save.addCredits(2);
        addXP(10);
      }
    }

    for (const obstacle of obstacles) obstacle.update(dt);

    for (let i = enemies.length - 1; i >= 0; i--) {
      const enemy = enemies[i];
      const dx = player.x - enemy.x;
      const dy = player.y - enemy.y;
      if (Math.hypot(dx, dy) < player.size + enemy.size) {
        enemies.splice(i, 1);
        player.takeDamage(BASE.ENEMY_DAMAGE);
      }
    }

    for (const obstacle of obstacles) {
      const dx = player.x - obstacle.x;
      const dy = player.y - obstacle.y;
      const dist = Math.hypot(dx, dy);
      if (dist < player.size + obstacle.r) {
        const nx = dx / (dist || 1);
        const ny = dy / (dist || 1);
        const overlap = player.size + obstacle.r - dist + 0.5;
        player.x += nx * overlap;
        player.y += ny * overlap;
        player.takeDamage(6);
      }
    }

    if (enemiesKilled >= enemiesToKill) advanceLevel();
  };

  const advanceLevel = () => {
    Save.addCredits(Math.floor(20 + level * 5 + enemiesKilled * 1.5));
    addXP(90 + level * 12);
    if (!tookDamageThisLevel) addXP(110 + level * 18);
    level += 1;
    enemiesKilled = 0;
    enemiesToKill = 8 + level * 6;
    enemies = [];
    bullets = [];
    coins = [];
    supplies = [];
    spawners = [];
    particles = [];
    if (player) {
      player.reconfigureLoadout(false);
      player.x = window.innerWidth / 2 + camera.x;
      player.y = window.innerHeight / 2 + camera.y;
    }
    spawnObstacles();
    createSpawners(Math.min(1 + Math.floor(level / 2), 4));
    recenterStars();
    tookDamageThisLevel = false;
  };

  /* ====== RENDERING ====== */
  const drawGame = () => {
    if (!dom.ctx) return;
    const ctx = dom.ctx;
    const canvas = dom.canvas;
    ctx.fillStyle = '#030712';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    let shakeX = 0;
    let shakeY = 0;
    if (performance.now() < shakeUntil) {
      shakeX = (Math.random() * 2 - 1) * shakePower;
      shakeY = (Math.random() * 2 - 1) * shakePower;
    }
    ctx.save();
    ctx.translate(-camera.x + shakeX, -camera.y + shakeY);
    if (starsFar) {
      drawStarsLayer(ctx, starsFar, 0.3);
      drawStarsLayer(ctx, starsMid, 0.6);
      drawStarsLayer(ctx, starsNear, 1.1);
    }
    for (const obstacle of obstacles) obstacle.draw(ctx);
    if (!player) {
      ctx.restore();
      return;
    }
    for (const spawner of spawners) spawner.draw(ctx);
    for (const coin of coins) coin.draw(ctx);
    for (const supply of supplies) supply.draw(ctx);
    for (const bullet of bullets) bullet.draw(ctx);
    for (const enemy of enemies) enemy.draw(ctx);
    drawParticles(ctx, 16.67);
    player.draw(ctx);
    ctx.restore();
  };

  /* ====== MAIN LOOP ====== */
  let animationFrame = null;

  const loop = (timestamp) => {
    if (!gameRunning || paused) {
      if (!gameRunning && !gameOverHandled) handleGameOver();
      return;
    }
    let dt = timestamp - lastTime;
    lastTime = timestamp;
    dt = Math.min(dt, 50);
    updateGame(dt, timestamp);
    if (!gameRunning && !gameOverHandled) {
      handleGameOver();
      return;
    }
    drawGame();
    updateHUD();
    animationFrame = requestAnimationFrame(loop);
  };

  const startLevel = (lvl, resetScore) => {
    level = lvl;
    if (resetScore) score = 0;
    enemiesKilled = 0;
    enemiesToKill = 8 + level * 6;
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    dom.canvas.width = Math.floor(window.innerWidth * dpr);
    dom.canvas.height = Math.floor(window.innerHeight * dpr);
    dom.canvas.style.width = '100%';
    dom.canvas.style.height = '100%';
    dom.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    player = new PlayerEntity(dom.canvas.width / 2, dom.canvas.height / 2);
    camera.x = player.x - dom.canvas.width / 2;
    camera.y = player.y - dom.canvas.height / 2;
    spawnObstacles();
    createSpawners(Math.min(1 + Math.floor(level / 2), 4));
    if (!starsFar) {
      starsFar = makeStars(120);
      starsMid = makeStars(80);
      starsNear = makeStars(50);
    } else {
      recenterStars();
    }
    lastTime = performance.now();
    lastAmmoRegen = lastTime;
    gameRunning = true;
    paused = false;
    loop(lastTime);
  };

  const startGame = () => {
    resetRuntimeState();
    initShipSelection();
    dom.startScreen.style.display = 'none';
    dom.gameContainer.style.display = 'block';
    dom.messageBox.style.display = 'none';
    startLevel(1, true);
  };

  const togglePause = () => {
    if (!gameRunning) {
      openShop();
      return;
    }
    paused = !paused;
    if (paused) {
      cancelAnimationFrame(animationFrame);
      openShop();
    } else {
      closeShop();
      lastTime = performance.now();
      animationFrame = requestAnimationFrame(loop);
    }
  };

  const resizeCanvas = () => {
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    dom.canvas.width = Math.floor(window.innerWidth * dpr);
    dom.canvas.height = Math.floor(window.innerHeight * dpr);
    dom.canvas.style.width = '100%';
    dom.canvas.style.height = '100%';
    dom.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (player) {
      camera.x = player.x - dom.canvas.width / 2;
      camera.y = player.y - dom.canvas.height / 2;
    }
    drawStartGraphic();
  };

  const handleGameOver = () => {
    gameOverHandled = true;
    Save.setBest(score, level);
    Save.addCredits(Math.floor(score / 25));
    showMessage('GAME OVER', `Level ${level} — Score ${score.toLocaleString()}`, 'Restart', () => startGame());
  };

  /* ====== INITIALISATION ====== */
  const ready = () => {
    assignDomRefs();
    Save.load();
    pilotLevel = Save.data.pilotLevel;
    pilotXP = Save.data.pilotXp;
    initShipSelection();
    syncCredits();
    setupInput();
    resizeCanvas();
    drawStartGraphic();
    updateHUD();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ready, { once: true });
  } else {
    ready();
  }

  window.addEventListener('resize', resizeCanvas);

  // expose for debugging if needed
  window.__VOID_RIFT__ = {
    startGame,
    togglePause,
    openShop,
    openHangar
  };
})();

  /* ====== INPUT ====== */
  const triggerSecondary = () => {
    input.altFireHeld = true;
    setTimeout(() => (input.altFireHeld = false), 150);
  };

  const triggerDefense = () => {
    input.defenseHeld = true;
    setTimeout(() => (input.defenseHeld = false), 150);
  };

  const triggerUltimate = () => {
    input.ultimateQueued = true;
    setTimeout(() => (input.ultimateQueued = false), 200);
  };

  const aimFromPointer = (clientX, clientY) => {
    if (!player || !dom.canvas) return;
    const rect = dom.canvas.getBoundingClientRect();
    const px = clientX - rect.left;
    const py = clientY - rect.top;
    const dx = px - player.x;
    const dy = py - player.y;
    const magnitude = Math.hypot(dx, dy) || 1;
    input.aimX = dx / magnitude;
    input.aimY = dy / magnitude;
    input.isAiming = true;
    input.mouseAimActive = true;
    input.fireHeld = input.mouseDown;
  };

  const updateFromKeyboard = () => {
    input.moveX = (keyboard.d ? 1 : 0) - (keyboard.a ? 1 : 0);
    input.moveY = (keyboard.s ? 1 : 0) - (keyboard.w ? 1 : 0);
    const moveMag = Math.hypot(input.moveX, input.moveY);
    if (moveMag > 0) {
      input.moveX /= moveMag;
      input.moveY /= moveMag;
    }
    const aimX = (keyboard.ArrowRight ? 1 : 0) - (keyboard.ArrowLeft ? 1 : 0);
    const aimY = (keyboard.ArrowDown ? 1 : 0) - (keyboard.ArrowUp ? 1 : 0);
    const aimMag = Math.hypot(aimX, aimY);
    if (aimMag > 0) {
      input.aimX = aimX / aimMag;
      input.aimY = aimY / aimMag;
      input.isAiming = true;
      input.fireHeld = true;
      input.mouseAimActive = false;
    } else if (!input.mouseAimActive) {
      input.isAiming = false;
      input.fireHeld = false;
    }
    input.altFireHeld = keyboard.Shift || keyboard.e || keyboard.E;
    input.defenseHeld = keyboard.f || keyboard.F;
    input.isBoosting = keyboard[' '];
  };

  const setupInput = () => {
    if (dom.startButton) {
      dom.startButton.addEventListener('click', startGame);
      dom.startButton.addEventListener('touchstart', (e) => {
        e.preventDefault();
        startGame();
      }, { passive: false });
    }
    if (dom.messageButton) {
      const handler = (e) => {
        e.preventDefault();
        startGame();
        dom.messageButton.removeEventListener('click', handler);
        dom.messageButton.removeEventListener('touchstart', handler);
      };
      dom.messageButton.addEventListener('click', handler);
      dom.messageButton.addEventListener('touchstart', handler, { passive: false });
    }
    dom.openShopFromStart?.addEventListener('click', openShop);
    dom.settingsButton?.addEventListener('click', openHangar);
    dom.closeShopBtn?.addEventListener('click', () => {
      closeShop();
      if (!gameRunning && dom.gameContainer?.style.display === 'block') requestAnimationFrame(() => {});
    });
    dom.openHangarFromShop?.addEventListener('click', () => {
      closeShop();
      openHangar();
    });
    dom.hangarClose?.addEventListener('click', closeHangar);
    dom.hangarModal?.addEventListener('click', (e) => {
      if (e.target === dom.hangarModal) closeHangar();
    });
    dom.secondaryButton?.addEventListener('mousedown', triggerSecondary);
    dom.secondaryButton?.addEventListener('touchstart', (e) => {
      e.preventDefault();
      triggerSecondary();
    }, { passive: false });
    dom.defenseButton?.addEventListener('mousedown', triggerDefense);
    dom.defenseButton?.addEventListener('touchstart', (e) => {
      e.preventDefault();
      triggerDefense();
    }, { passive: false });
    dom.ultimateButton?.addEventListener('mousedown', triggerUltimate);
    dom.ultimateButton?.addEventListener('touchstart', (e) => {
      e.preventDefault();
      triggerUltimate();
    }, { passive: false });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && dom.hangarModal?.style.display === 'flex') {
        e.preventDefault();
        closeHangar();
        return;
      }
      if (e.key === 'p' || e.key === 'P') togglePause();
      if (e.key === 'r' || e.key === 'R') input.ultimateQueued = true;
      if (keyboard.hasOwnProperty(e.key)) keyboard[e.key] = true;
      updateFromKeyboard();
    });
    document.addEventListener('keyup', (e) => {
      if (keyboard.hasOwnProperty(e.key)) keyboard[e.key] = false;
      updateFromKeyboard();
    });

    if (dom.canvas) {
      dom.canvas.addEventListener('mousedown', (e) => {
        if (e.button === 2) {
          e.preventDefault();
          triggerSecondary();
          return;
        }
        input.mouseDown = true;
        input.fireHeld = true;
        aimFromPointer(e.clientX, e.clientY);
      });
      dom.canvas.addEventListener('mouseup', (e) => {
        if (e.button === 2) {
          input.altFireHeld = false;
          return;
        }
        input.mouseDown = false;
        if (input.mouseAimActive) input.fireHeld = false;
      });
      dom.canvas.addEventListener('mousemove', (e) => {
        if (!player) return;
        aimFromPointer(e.clientX, e.clientY);
      });
      dom.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    // touch joysticks
    let moveId = null;
    let moveStart = { x: 0, y: 0 };
    let shootId = null;
    let shootStart = { x: 0, y: 0 };
    const updateMoveJoystick = (t) => {
      const max = dom.joystickMoveBase.clientWidth / 2;
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
      dom.joystickMoveStick.style.transform = `translate(${sx}px, ${sy}px)`;
    };
    const resetMoveJoystick = () => {
      dom.joystickMoveStick.style.transform = 'translate(0,0)';
      input.moveX = 0;
      input.moveY = 0;
    };
    const updateShootJoystick = (t) => {
      const max = dom.joystickShootBase.clientWidth / 2;
      const dx = t.clientX - shootStart.x;
      const dy = t.clientY - shootStart.y;
      const dist = Math.hypot(dx, dy);
      let sx, sy;
      input.isAiming = true;
      input.fireHeld = true;
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
      dom.joystickShootStick.style.transform = `translate(${sx}px, ${sy}px)`;
    };
    const resetShootJoystick = () => {
      dom.joystickShootStick.style.transform = 'translate(0,0)';
      input.aimX = 0;
      input.aimY = 0;
      input.isAiming = false;
      input.fireHeld = false;
    };
    dom.joystickMoveBase?.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (moveId !== null) return;
      const touch = e.changedTouches[0];
      moveId = touch.identifier;
      const rect = dom.joystickMoveBase.getBoundingClientRect();
      moveStart = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      updateMoveJoystick(touch);
    }, { passive: false });
    dom.joystickShootBase?.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (shootId !== null) return;
      const touch = e.changedTouches[0];
      shootId = touch.identifier;
      const rect = dom.joystickShootBase.getBoundingClientRect();
      shootStart = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      updateShootJoystick(touch);
    }, { passive: false });
    document.addEventListener('touchmove', (e) => {
      for (const touch of e.changedTouches) {
        if (touch.identifier === moveId) {
          e.preventDefault();
          updateMoveJoystick(touch);
        } else if (touch.identifier === shootId) {
          e.preventDefault();
          updateShootJoystick(touch);
        }
      }
    }, { passive: false });
    document.addEventListener('touchend', (e) => {
      for (const touch of e.changedTouches) {
        if (touch.identifier === moveId) {
          resetMoveJoystick();
          moveId = null;
        }
        if (touch.identifier === shootId) {
          resetShootJoystick();
          shootId = null;
        }
      }
    });
  };
