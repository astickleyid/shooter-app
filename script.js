(() => {
  /* ====== UTILS ====== */
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const rand = (min, max) => min + Math.random() * (max - min);
  const chance = (p) => Math.random() < p;

  // Expose utilities for enemy module
  window.rand = rand;
  window.chance = chance;

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
    ENEMY_SPEED: 1.35,
    ENEMY_DAMAGE: 12,
    COIN_SIZE: 8,
    COIN_LIFETIME: 8000,
    SPAWNER_SIZE: 80,
    SPAWNER_RATE_MS: 1500,
    OBST_ASTEROIDS: 6,
    INITIAL_SPAWN_DELAY_MIN: 4000,
    INITIAL_SPAWN_DELAY_MAX: 7000
  };

  // Expose BASE config for enemy module
  window.BASE = BASE;

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

  const UPGRADES = [
    // Offense
    { id: 'damage', name: 'Damage Amplifier', desc: 'Increase weapon damage output.', cat: 'Offense', base: 80, step: 40, max: 10 },
    { id: 'firerate', name: 'Fire Rate', desc: 'Reduce cooldown between shots.', cat: 'Offense', base: 100, step: 50, max: 8 },
    { id: 'multi', name: 'Multishot', desc: 'Fire additional projectiles per shot.', cat: 'Offense', base: 150, step: 80, max: 4 },
    // Defense
    { id: 'shield', name: 'Hull Plating', desc: 'Increase maximum health.', cat: 'Defense', base: 70, step: 35, max: 12 },
    { id: 'regen', name: 'Regenerator', desc: 'Passive health regeneration over time.', cat: 'Defense', base: 120, step: 60, max: 6 },
    { id: 'field', name: 'Repulse Field', desc: 'Push enemies away when they get close.', cat: 'Defense', base: 180, step: 90, max: 5 },
    // Utility
    { id: 'ammo', name: 'Ammo Regen', desc: 'Faster ammunition regeneration.', cat: 'Utility', base: 90, step: 45, max: 8 },
    { id: 'boost', name: 'Boost Speed', desc: 'Increase boost movement speed.', cat: 'Utility', base: 110, step: 55, max: 7 },
    { id: 'magnet', name: 'Magnet Range', desc: 'Increase pickup radius for coins and supplies.', cat: 'Utility', base: 85, step: 42, max: 8 }
  ];

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
    dom.leftTouchZone = document.getElementById('leftTouchZone');
    dom.rightTouchZone = document.getElementById('rightTouchZone');
    dom.abilityButton = document.getElementById('abilityButton');
    dom.controlSettingsButton = document.getElementById('controlSettingsButton');
    dom.controlSettingsModal = document.getElementById('controlSettingsModal');
    dom.closeControlSettings = document.getElementById('closeControlSettings');
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
  let countdownActive = false;
  let countdownValue = 3;
  let countdownEnd = 0;
  let countdownCompletedLevel = 0;
  const camera = { x: 0, y: 0 };

  // Expose game state for enemy module
  window.gameState = {
    get player() { return player; },
    get enemies() { return enemies; },
    set enemies(val) { enemies = val; },
    get spawners() { return spawners; },
    set spawners(val) { spawners = val; },
    get obstacles() { return obstacles; },
    get level() { return level; },
    get score() { return score; },
    set score(val) { score = val; },
    get enemiesKilled() { return enemiesKilled; },
    set enemiesKilled(val) { enemiesKilled = val; },
    get enemiesToKill() { return enemiesToKill; }
  };

  // Equipment tap system
  let lastTapTime = 0;
  let tapCount = 0;
  let currentEquipmentSlot = 0; // 0=primary, 1=slot2, 2=slot3, 3=slot4
  const TAP_TIMEOUT = 500; // ms between taps

  // Action logging system
  const actionLog = [];
  const MAX_LOG_ENTRIES = 5;
  const LOG_ENTRY_LIFETIME = 4000; // ms

  const addLogEntry = (message, color = '#fff') => {
    actionLog.push({
      message,
      color,
      timestamp: performance.now()
    });
    if (actionLog.length > MAX_LOG_ENTRIES) {
      actionLog.shift();
    }
  };

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

  // Expose needed game state for modules
  window.input = input;
  window.currentShip = null; // Will be updated during gameplay
  window.player = null; // Will be set during gameplay
  window.enemies = enemies;
  window.bullets = bullets;
  window.lastShotTime = 0;
  window.lastAmmoRegen = 0;
  window.tookDamageThisLevel = false;
  window.gameRunning = false;
  window.obstacles = obstacles;
  window.level = 1;

  // Setter accessors for variables that change
  Object.defineProperty(window, 'currentShip', {
    get() { return currentShip; },
    set(val) { currentShip = val; }
  });
  Object.defineProperty(window, 'player', {
    get() { return player; },
    set(val) { player = val; }
  });
  Object.defineProperty(window, 'lastShotTime', {
    get() { return lastShotTime; },
    set(val) { lastShotTime = val; }
  });
  Object.defineProperty(window, 'lastAmmoRegen', {
    get() { return lastAmmoRegen; },
    set(val) { lastAmmoRegen = val; }
  });
  Object.defineProperty(window, 'tookDamageThisLevel', {
    get() { return tookDamageThisLevel; },
    set(val) { tookDamageThisLevel = val; }
  });
  Object.defineProperty(window, 'gameRunning', {
    get() { return gameRunning; },
    set(val) { gameRunning = val; }
  });

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
    },
    // Equipment class system: 4 configurable slots
    equipmentClass: {
      slot1: { type: 'primary', id: 'pulse' }, // Required: primary weapon
      slot2: { type: 'defense', id: 'aegis' }, // Flexible
      slot3: { type: 'secondary', id: 'nova' }, // Flexible
      slot4: { type: 'boost', id: 'boost' } // Flexible (boost is special type)
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
      // Ensure equipment class exists
      if (!this.data.armory.equipmentClass) {
        this.data.armory.equipmentClass = defaultArmory().equipmentClass;
      }
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

  // Expose Save for modules
  window.Save = Save;

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

  // Expose functions and data for player module
  window.clamp = clamp;
  window.SHIP_TEMPLATES = SHIP_TEMPLATES;
  window.getShipTemplate = getShipTemplate;
  window.shipStat = shipStat;
  window.currentPrimaryWeapon = currentPrimaryWeapon;
  window.currentSecondarySystem = currentSecondarySystem;
  window.currentDefenseSystem = currentDefenseSystem;
  window.currentUltimateSystem = currentUltimateSystem;

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

  // Expose queueTimedEffect for player module
  window.queueTimedEffect = queueTimedEffect;

  // Expose queueTimedEffect for player module
  window.queueTimedEffect = queueTimedEffect;

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

  // Expose viewRadius for enemy module
  window.viewRadius = viewRadius;

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

  // Expose randomAround for enemy module
  window.randomAround = randomAround;

  // Asteroid class and spawnObstacles function moved to src/obstacles.js

  // Bullet class moved to src/projectile.js

  // Coin and SupplyCrate classes moved to src/collectibles.js

  // PlayerEntity class and drawShip function moved to src/player.js

  const dropCoin = (x, y) => coins.push(new Coin(x, y));
  const dropSupply = (x, y) => supplies.push(new SupplyCrate(x, y, SUPPLY_TYPES[Math.floor(Math.random() * SUPPLY_TYPES.length)] || 'ammo'));

  // Expose game functions for enemy module
  window.dropCoin = dropCoin;
  window.dropSupply = dropSupply;
  window.addXP = addXP;
  window.addParticles = addParticles;
  window.shakeScreen = shakeScreen;
  window.addLogEntry = addLogEntry;

  // Enemy death and damage functions moved to src/enemy.js

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
    
    // Update action log
    renderActionLog();
    
    // Update equipment indicator
    updateEquipmentIndicator();
  };

  const renderActionLog = () => {
    const logContainer = document.getElementById('actionLog');
    if (!logContainer) return;
    
    const now = performance.now();
    // Remove expired entries
    for (let i = actionLog.length - 1; i >= 0; i--) {
      if (now - actionLog[i].timestamp > LOG_ENTRY_LIFETIME) {
        actionLog.splice(i, 1);
      }
    }
    
    // Render log entries
    logContainer.innerHTML = '';
    actionLog.forEach(entry => {
      const div = document.createElement('div');
      div.className = 'log-entry';
      div.style.color = entry.color;
      div.textContent = entry.message;
      logContainer.appendChild(div);
    });
  };

  const updateEquipmentIndicator = () => {
    const slots = document.querySelectorAll('.equip-slot');
    slots.forEach((slot, index) => {
      if (index === currentEquipmentSlot) {
        slot.classList.add('active');
      } else {
        slot.classList.remove('active');
      }
    });
    
    // Update slot labels and icons based on equipment class
    const equipClass = Save.data.armory.equipmentClass || defaultArmory().equipmentClass;
    Object.keys(equipClass).forEach((slotKey, index) => {
      const slotData = equipClass[slotKey];
      const slotElement = document.querySelector(`.equip-slot[data-slot="${index}"]`);
      if (slotElement && slotData) {
        const iconSpan = slotElement.querySelector('.equip-icon');
        const labelSpan = slotElement.querySelector('.equip-label');
        
        // Set icon based on type
        const iconMap = {
          'primary': '🔫',
          'secondary': '💣',
          'defense': '🛡️',
          'boost': '🚀',
          'ultimate': '⭐'
        };
        
        if (iconSpan) iconSpan.textContent = iconMap[slotData.type] || '⚡';
        if (labelSpan) {
          if (index === 0) {
            labelSpan.textContent = 'Primary';
          } else {
            labelSpan.textContent = `${index + 1} taps`;
          }
        }
      }
    });
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
    
    const completedLevel = level; // Store current level before incrementing
    level += 1;
    enemiesKilled = 0;
    enemiesToKill = Math.floor(6 + level * 4.5);
    enemies = [];
    bullets = [];
    coins = [];
    supplies = [];
    spawners = [];
    particles = [];
    
    // Start countdown
    countdownActive = true;
    countdownValue = 3;
    countdownEnd = performance.now() + 4000; // 1 second for "LEVEL COMPLETE" + 3 seconds countdown
    countdownCompletedLevel = completedLevel;
    
    if (player) {
      player.reconfigureLoadout(false);
      player.x = window.innerWidth / 2 + camera.x;
      player.y = window.innerHeight / 2 + camera.y;
    }
    
    // Set up level after countdown
    queueTimedEffect(4000, () => {
      countdownActive = false;
      spawnObstacles();
      createSpawners(Math.min(1 + Math.floor(level / 2), 4), true);
      recenterStars();
      lastTime = performance.now();
    });
    
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
    
    // Draw countdown
    if (countdownActive) {
      const timeRemaining = countdownEnd - performance.now();
      const totalDuration = 4000;
      
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.85)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Use window dimensions for proper centering across all screen sizes
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      
      // First 1 second: Show "LEVEL COMPLETE"
      if (timeRemaining > 3000) {
        ctx.font = 'bold 48px Arial';
        ctx.fillStyle = '#4ade80';
        ctx.shadowColor = '#4ade80';
        ctx.shadowBlur = 25;
        ctx.fillText('LEVEL COMPLETE', centerX, centerY - 60);
        ctx.shadowBlur = 0;
        
        ctx.font = 'bold 32px Arial';
        ctx.fillStyle = '#fff';
        ctx.fillText(`Level ${countdownCompletedLevel}`, centerX, centerY);
        
        ctx.font = '20px Arial';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('Get Ready...', centerX, centerY + 50);
      } 
      // Next 3 seconds: Show countdown and next level
      else if (timeRemaining > 0) {
        const countdown = Math.ceil(timeRemaining / 1000);
        
        ctx.font = 'bold 36px Arial';
        ctx.fillStyle = '#60a5fa';
        ctx.fillText(`LEVEL ${level}`, centerX, centerY - 80);
        
        ctx.font = 'bold 120px Arial';
        ctx.fillStyle = '#4ade80';
        ctx.shadowColor = '#4ade80';
        ctx.shadowBlur = 30;
        ctx.fillText(countdown, centerX, centerY + 20);
        ctx.shadowBlur = 0;
        
        ctx.font = '18px Arial';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('Starting in...', centerX, centerY - 40);
      }
      
      ctx.restore();
    }
  };

  /* ====== MAIN LOOP ====== */
  let animationFrame = null;

  const loop = (timestamp) => {
    if (!gameRunning) {
      if (!gameOverHandled) handleGameOver();
      return;
    }
    
    // Always draw during countdown, but don't update game logic
    if (countdownActive) {
      drawGame();
      updateHUD();
      lastTime = timestamp; // Update lastTime during countdown to prevent huge dt when resuming
      consumeTimedEffects(timestamp); // Process timed effects to allow countdown to complete
      animationFrame = requestAnimationFrame(loop);
      return;
    }
    
    if (paused) {
      // Keep the animation frame going even when paused
      lastTime = timestamp; // Update lastTime during pause to prevent huge dt when resuming
      animationFrame = requestAnimationFrame(loop);
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
    enemiesToKill = Math.floor(6 + level * 4.5);
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
    createSpawners(Math.min(1 + Math.floor(level / 2), 4), resetScore);
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
    loadControlSettings(); // Load and apply control settings
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

  /* ====== CONTROL SETTINGS ====== */
  const CONTROL_SETTINGS_KEY = 'void_rift_controls_v1';
  
  const defaultControlSettings = () => ({
    opacity: 50, // Default to 50% opacity
    buttonSize: 100,
    joystickSize: 100,
    moveSensitivity: 100,
    aimSensitivity: 100,
    deadzone: 12,
    floatingJoysticks: false, // Default to non-floating so both are always visible
    hapticFeedback: true,
    gyroscopeAim: false,
    activeAbility: 'boost' // boost, secondary, or ultimate
  });

  let controlSettings = defaultControlSettings();

  const loadControlSettings = () => {
    try {
      const raw = localStorage.getItem(CONTROL_SETTINGS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        controlSettings = { ...defaultControlSettings(), ...parsed };
      }
    } catch (err) {
      console.warn('Failed to load control settings', err);
    }
    applyControlSettings();
  };

  const saveControlSettings = () => {
    try {
      localStorage.setItem(CONTROL_SETTINGS_KEY, JSON.stringify(controlSettings));
    } catch (err) {
      console.warn('Failed to save control settings', err);
    }
  };

  const applyControlSettings = () => {
    const mobileControls = document.getElementById('mobileControls');
    if (!mobileControls) return;

    // Apply opacity to both joysticks independently
    if (dom.joystickMoveBase) {
      dom.joystickMoveBase.style.opacity = controlSettings.opacity / 100;
    }
    if (dom.joystickShootBase) {
      dom.joystickShootBase.style.opacity = controlSettings.opacity / 100;
    }

    // Apply joystick sizing
    const bases = [dom.joystickMoveBase, dom.joystickShootBase];
    bases.forEach(base => {
      if (base) {
        const newSize = (110 * controlSettings.joystickSize) / 100;
        base.style.width = `${newSize}px`;
        base.style.height = `${newSize}px`;
        const stick = base.querySelector('.joystickStick');
        if (stick) {
          stick.style.width = `${newSize * 0.5}px`;
          stick.style.height = `${newSize * 0.5}px`;
        }
      }
    });
  };
  
  // updateAbilityButtonAppearance removed - no longer needed with tap-to-switch system

  /* ====== UNIFIED MENU ====== */
  
  const openUnifiedMenu = () => {
    if (!dom.controlSettingsModal) return;
    
    // Populate control settings
    document.getElementById('controlOpacity').value = controlSettings.opacity;
    document.getElementById('opacityValue').textContent = `${controlSettings.opacity}%`;
    document.getElementById('joystickSize').value = controlSettings.joystickSize;
    document.getElementById('joystickSizeValue').textContent = `${controlSettings.joystickSize}%`;
    document.getElementById('moveSensitivity').value = controlSettings.moveSensitivity;
    document.getElementById('moveSensValue').textContent = `${controlSettings.moveSensitivity}%`;
    document.getElementById('aimSensitivity').value = controlSettings.aimSensitivity;
    document.getElementById('aimSensValue').textContent = `${controlSettings.aimSensitivity}%`;
    document.getElementById('deadzone').value = controlSettings.deadzone;
    document.getElementById('deadzoneValue').textContent = `${controlSettings.deadzone}%`;
    document.getElementById('floatingJoysticks').checked = controlSettings.floatingJoysticks;
    document.getElementById('hapticFeedback').checked = controlSettings.hapticFeedback;
    
    // Populate equipment class settings
    loadEquipmentClassSettings();
    
    // Populate upgrades and weapons tabs
    renderUnifiedMenuTabs();
    
    // Show modal
    dom.controlSettingsModal.classList.add('active');
    dom.controlSettingsModal.style.display = 'flex';
    
    // Pause game if running
    if (gameRunning && !paused) {
      paused = true;
      cancelAnimationFrame(animationFrame);
    }
  };

  const closeUnifiedMenu = () => {
    if (dom.controlSettingsModal) {
      dom.controlSettingsModal.classList.remove('active');
      dom.controlSettingsModal.style.display = 'none';
    }
    
    // Resume game if it was running
    if (gameRunning && paused) {
      paused = false;
      lastTime = performance.now();
      animationFrame = requestAnimationFrame(loop);
    }
  };

  // Alias for backward compatibility
  const openControlSettings = () => openUnifiedMenu();
  const closeControlSettings = () => closeUnifiedMenu();

  const resetControlSettings = () => {
    controlSettings = defaultControlSettings();
    saveControlSettings();
    applyControlSettings();
    openUnifiedMenu(); // Reopen to show reset values
  };

  const switchMenuTab = (tabName) => {
    // Update tab buttons
    document.querySelectorAll('.menu-tab').forEach(tab => {
      if (tab.dataset.tab === tabName) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    
    const tabMap = {
      'equipment': 'equipmentTab',
      'upgrades': 'upgradesTab',
      'weapons': 'weaponsTab',
      'controls': 'controlsTab'
    };
    
    const contentId = tabMap[tabName];
    if (contentId) {
      const content = document.getElementById(contentId);
      if (content) content.classList.add('active');
    }
  };

  const renderUnifiedMenuTabs = () => {
    // Render upgrades tab (use existing shop rendering)
    const upgradesContent = document.getElementById('upgradesContent');
    if (upgradesContent) {
      upgradesContent.innerHTML = '';
      const tempGrid = document.createElement('div');
      tempGrid.className = 'shopGrid';
      
      ['Offense', 'Defense', 'Utility'].forEach((cat) => {
        const head = document.createElement('div');
        head.style.gridColumn = '1/-1';
        head.style.margin = '6px 0';
        head.innerHTML = `<div style="opacity:.8;border-bottom:1px solid #1f2937;padding:6px 2px;font-weight:900;color:#9ca3af">${cat}</div>`;
        tempGrid.appendChild(head);
        
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
                renderUnifiedMenuTabs();
                syncCredits();
              }
            });
          }
          tempGrid.appendChild(card);
        }
      });
      
      upgradesContent.appendChild(tempGrid);
    }
    
    // Render weapons tab (simplified hangar view)
    const weaponsContent = document.getElementById('weaponsContent');
    if (weaponsContent) {
      weaponsContent.innerHTML = '<div style="padding: 16px; color: #94a3b8;">Visit Ship Hangar from the start screen for full weapon and ship customization.</div>';
    }
  };

  const loadEquipmentClassSettings = () => {
    const equipClass = Save.data.armory.equipmentClass || defaultArmory().equipmentClass;
    
    ['equipSlot1', 'equipSlot2', 'equipSlot3', 'equipSlot4'].forEach((id, index) => {
      const select = document.getElementById(id);
      const slotKey = `slot${index + 1}`;
      const slotData = equipClass[slotKey];
      
      if (select && slotData) {
        const value = `${slotData.type}:${slotData.id}`;
        select.value = value;
      }
    });
  };

  const saveEquipmentClass = () => {
    const equipClass = {};
    
    ['equipSlot1', 'equipSlot2', 'equipSlot3', 'equipSlot4'].forEach((id, index) => {
      const select = document.getElementById(id);
      if (select) {
        const [type, itemId] = select.value.split(':');
        equipClass[`slot${index + 1}`] = { type, id: itemId };
      }
    });
    
    Save.data.armory.equipmentClass = equipClass;
    Save.save();
    
    // Update equipment indicator
    updateEquipmentIndicator();
  };

  const switchEquipmentSlot = (slotIndex) => {
    if (slotIndex < 0 || slotIndex > 3) return;
    
    currentEquipmentSlot = slotIndex;
    updateEquipmentIndicator();
    
    const equipClass = Save.data.armory.equipmentClass || defaultArmory().equipmentClass;
    const slotData = equipClass[`slot${slotIndex + 1}`];
    
    if (slotData) {
      // Log the switch
      const slotNames = ['Primary', 'Slot 2', 'Slot 3', 'Slot 4'];
      addLogEntry(`Switched to ${slotNames[slotIndex]}`, '#60a5fa');
      
      // Activate the equipment
      activateEquipmentSlot(slotData);
      
      // Haptic feedback
      if (controlSettings.hapticFeedback && navigator.vibrate) {
        navigator.vibrate(20);
      }
    }
  };

  const activateEquipmentSlot = (slotData) => {
    if (!slotData || !player) return;
    
    const { type, id } = slotData;
    
    switch (type) {
      case 'primary':
        // Primary is always active, no need to do anything
        addLogEntry(`Primary weapon active`, '#fde047');
        break;
        
      case 'boost':
        input.isBoosting = true;
        setTimeout(() => (input.isBoosting = false), 300);
        addLogEntry(`BOOST activated!`, '#4ade80');
        break;
        
      case 'secondary':
        input.altFireHeld = true;
        setTimeout(() => (input.altFireHeld = false), 150);
        addLogEntry(`${id.toUpperCase()} launched!`, '#f97316');
        break;
        
      case 'defense':
        input.defenseHeld = true;
        setTimeout(() => (input.defenseHeld = false), 150);
        addLogEntry(`${id.toUpperCase()} shield deployed!`, '#38bdf8');
        break;
        
      case 'ultimate':
        input.ultimateQueued = true;
        setTimeout(() => (input.ultimateQueued = false), 200);
        addLogEntry(`ULTIMATE: ${id.toUpperCase()}!`, '#a855f7');
        break;
    }
  };

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
    
    // Control Settings Modal handlers (now unified menu)
    dom.controlSettingsButton?.addEventListener('click', openUnifiedMenu);
    dom.closeControlSettings?.addEventListener('click', closeUnifiedMenu);
    
    document.getElementById('resetControls')?.addEventListener('click', resetControlSettings);
    document.getElementById('saveControls')?.addEventListener('click', () => {
      // Save all current values
      controlSettings.opacity = parseInt(document.getElementById('controlOpacity').value);
      controlSettings.joystickSize = parseInt(document.getElementById('joystickSize').value);
      controlSettings.moveSensitivity = parseInt(document.getElementById('moveSensitivity').value);
      controlSettings.aimSensitivity = parseInt(document.getElementById('aimSensitivity').value);
      controlSettings.deadzone = parseInt(document.getElementById('deadzone').value);
      controlSettings.floatingJoysticks = document.getElementById('floatingJoysticks').checked;
      controlSettings.hapticFeedback = document.getElementById('hapticFeedback').checked;
      
      saveControlSettings();
      applyControlSettings();
      saveEquipmentClass(); // Also save equipment configuration
      closeUnifiedMenu();
    });
    
    // Live preview of sliders
    const setupSlider = (id, valueId) => {
      const slider = document.getElementById(id);
      const valueDisplay = document.getElementById(valueId);
      if (slider && valueDisplay) {
        slider.addEventListener('input', () => {
          valueDisplay.textContent = `${slider.value}%`;
        });
      }
    };
    
    setupSlider('controlOpacity', 'opacityValue');
    setupSlider('joystickSize', 'joystickSizeValue');
    setupSlider('moveSensitivity', 'moveSensValue');
    setupSlider('aimSensitivity', 'aimSensValue');
    setupSlider('deadzone', 'deadzoneValue');
    
    // Unified menu button (replaces old settings and ability buttons)
    const unifiedMenuBtn = document.getElementById('unifiedMenuButton');
    if (unifiedMenuBtn) {
      const handler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        openUnifiedMenu();
      };
      unifiedMenuBtn.addEventListener('click', handler);
      unifiedMenuBtn.addEventListener('touchstart', handler, { passive: false });
    }
    
    // Tab navigation for unified menu
    document.querySelectorAll('.menu-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const tabName = tab.dataset.tab;
        switchMenuTab(tabName);
      });
    });
    
    // Equipment slot configuration
    ['equipSlot1', 'equipSlot2', 'equipSlot3', 'equipSlot4'].forEach((id, index) => {
      const select = document.getElementById(id);
      if (select) {
        select.addEventListener('change', () => {
          saveEquipmentClass();
        });
      }
    });
    
    // Tap-to-switch equipment logic
    // Detect taps on the main game canvas (not on joysticks or UI)
    let tapTimeout = null;
    
    const handleGameTap = (clientX, clientY) => {
      if (!gameRunning || paused || countdownActive) return;
      
      // Get viewport dimensions
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Check if tap is in left or right joystick zones (ignore those)
      const isLeftZone = clientX < viewportWidth * 0.35;
      const isRightZone = clientX > viewportWidth * 0.65;
      if (isLeftZone || isRightZone) return;
      
      // Check if tap is on UI elements (top portion)
      const isTopUI = clientY < 60;
      if (isTopUI) return;
      
      // Check if tap is on equipment indicator (right side)
      const isRightUI = clientX > viewportWidth - 80 && clientY > viewportHeight * 0.3 && clientY < viewportHeight * 0.7;
      if (isRightUI) return;
      
      // Check if tap is on unified menu button (top right)
      const isMenuButton = clientX > viewportWidth - 70 && clientY < 110;
      if (isMenuButton) return;
      
      const now = performance.now();
      if (now - lastTapTime > TAP_TIMEOUT) {
        tapCount = 0;
      }
      
      tapCount++;
      lastTapTime = now;
      
      clearTimeout(tapTimeout);
      tapTimeout = setTimeout(() => {
        if (tapCount >= 2 && tapCount <= 4) {
          // Switch to the equipment slot based on tap count
          const newSlot = tapCount - 1; // 2 taps = slot 1 (index 1), 3 taps = slot 2 (index 2), etc.
          switchEquipmentSlot(newSlot);
        }
        tapCount = 0;
      }, TAP_TIMEOUT);
    };
    
    if (dom.canvas) {
      dom.canvas.addEventListener('click', (e) => {
        handleGameTap(e.clientX, e.clientY);
      });
    }
    
    // Also handle touch taps
    let touchStartPos = null;
    document.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        touchStartPos = { x: touch.clientX, y: touch.clientY };
      }
    });
    
    document.addEventListener('touchend', (e) => {
      if (touchStartPos && e.changedTouches.length === 1) {
        const touch = e.changedTouches[0];
        const dx = touch.clientX - touchStartPos.x;
        const dy = touch.clientY - touchStartPos.y;
        const dist = Math.hypot(dx, dy);
        
        // Only count as tap if finger didn't move much
        if (dist < 20) {
          handleGameTap(touch.clientX, touch.clientY);
        }
      }
      touchStartPos = null;
    });
    
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
    dom.controlSettingsModal?.addEventListener('click', (e) => {
      if (e.target === dom.controlSettingsModal) closeControlSettings();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (dom.hangarModal?.classList.contains('active') || dom.hangarModal?.style.display === 'flex') {
          e.preventDefault();
          closeHangar();
          return;
        }
        if (dom.controlSettingsModal?.classList.contains('active')) {
          e.preventDefault();
          closeControlSettings();
          return;
        }
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

    // FLOATING JOYSTICK CONTROLS - Enhanced 2024
    let moveId = null;
    let moveStart = { x: 0, y: 0 };
    let shootId = null;
    let shootStart = { x: 0, y: 0 };
    let smoothMoveX = 0, smoothMoveY = 0;
    let smoothAimX = 0, smoothAimY = 0;
    let moveHapticTriggered = false;
    let shootHapticTriggered = false;
    
    const getDeadzone = () => controlSettings.deadzone / 100;
    const getMoveSens = () => controlSettings.moveSensitivity / 100;
    const getAimSens = () => controlSettings.aimSensitivity / 100;
    
    const updateMoveJoystick = (t, isFloating = false) => {
      if (!dom.joystickMoveBase) return;
      const max = dom.joystickMoveBase.clientWidth / 2;
      const dx = t.clientX - moveStart.x;
      const dy = t.clientY - moveStart.y;
      const dist = Math.hypot(dx, dy);
      let sx, sy, rawX, rawY;
      
      // Position joystick if floating
      if (isFloating && controlSettings.floatingJoysticks) {
        dom.joystickMoveBase.style.left = `${t.clientX}px`;
        dom.joystickMoveBase.style.top = `${t.clientY}px`;
        dom.joystickMoveBase.style.transform = 'translate(-50%, -50%)';
        dom.joystickMoveBase.style.opacity = '1';
      }
      
      if (dist > max) {
        sx = (dx / dist) * max;
        sy = (dy / dist) * max;
        rawX = dx / dist;
        rawY = dy / dist;
      } else {
        sx = dx;
        sy = dy;
        rawX = dx / max;
        rawY = dy / max;
      }
      
      // Apply deadzone
      const rawMag = Math.hypot(rawX, rawY);
      const deadZone = getDeadzone();
      
      if (rawMag < deadZone) {
        rawX = 0;
        rawY = 0;
      } else {
        const adjusted = (rawMag - deadZone) / (1 - deadZone);
        rawX = (rawX / rawMag) * adjusted;
        rawY = (rawY / rawMag) * adjusted;
      }
      
      // Apply sensitivity
      const sens = getMoveSens();
      rawX *= sens;
      rawY *= sens;
      
      // Smooth interpolation
      const smoothing = 0.25;
      smoothMoveX += (rawX - smoothMoveX) * smoothing;
      smoothMoveY += (rawY - smoothMoveY) * smoothing;
      
      input.moveX = smoothMoveX;
      input.moveY = smoothMoveY;
      
      // Visual feedback
      const scale = dist > max * 0.9 ? 1.1 : 1.0;
      dom.joystickMoveStick.style.transform = `translate(${sx}px, ${sy}px) scale(${scale})`;
      
      // Haptic feedback
      if (controlSettings.hapticFeedback && dist > max * 0.95 && !moveHapticTriggered) {
        if (navigator.vibrate) navigator.vibrate(10);
        moveHapticTriggered = true;
      } else if (dist < max * 0.9) {
        moveHapticTriggered = false;
      }
    };
    
    const resetMoveJoystick = () => {
      if (!dom.joystickMoveStick) return;
      dom.joystickMoveStick.style.transform = 'translate(-50%, -50%) scale(1)';
      
      // Only hide if floating joysticks are enabled
      if (controlSettings.floatingJoysticks && dom.joystickMoveBase) {
        dom.joystickMoveBase.style.opacity = '0';
      } else if (dom.joystickMoveBase) {
        // Restore to user's opacity setting
        dom.joystickMoveBase.style.opacity = controlSettings.opacity / 100;
      }
      
      const returnInterval = setInterval(() => {
        smoothMoveX *= 0.7;
        smoothMoveY *= 0.7;
        input.moveX = smoothMoveX;
        input.moveY = smoothMoveY;
        if (Math.abs(smoothMoveX) < 0.01 && Math.abs(smoothMoveY) < 0.01) {
          input.moveX = 0;
          input.moveY = 0;
          smoothMoveX = 0;
          smoothMoveY = 0;
          clearInterval(returnInterval);
        }
      }, 16);
      moveHapticTriggered = false;
    };
    
    const updateShootJoystick = (t, isFloating = false) => {
      if (!dom.joystickShootBase) return;
      const max = dom.joystickShootBase.clientWidth / 2;
      const dx = t.clientX - shootStart.x;
      const dy = t.clientY - shootStart.y;
      const dist = Math.hypot(dx, dy);
      let sx, sy, rawX, rawY;
      
      // Position joystick if floating, but keep it visible when not floating
      if (isFloating && controlSettings.floatingJoysticks) {
        dom.joystickShootBase.style.right = 'auto';
        dom.joystickShootBase.style.left = `${t.clientX}px`;
        dom.joystickShootBase.style.top = `${t.clientY}px`;
        dom.joystickShootBase.style.transform = 'translate(-50%, -50%)';
        dom.joystickShootBase.style.opacity = '1';
      } else {
        // Always keep shooter joystick visible
        dom.joystickShootBase.style.opacity = '1';
      }
      
      input.isAiming = true;
      input.fireHeld = true;
      
      if (dist > max) {
        sx = (dx / dist) * max;
        sy = (dy / dist) * max;
        rawX = dx / dist;
        rawY = dy / dist;
      } else {
        sx = dx;
        sy = dy;
        rawX = dx / max;
        rawY = dy / max;
      }
      
      // Smaller deadzone for aiming precision
      const rawMag = Math.hypot(rawX, rawY);
      const aimDeadzone = getDeadzone() * 0.8;
      
      if (rawMag < aimDeadzone) {
        rawX = 0;
        rawY = 0;
        input.isAiming = false;
        input.fireHeld = false;
      } else {
        const adjusted = (rawMag - aimDeadzone) / (1 - aimDeadzone);
        rawX = (rawX / rawMag) * adjusted;
        rawY = (rawY / rawMag) * adjusted;
      }
      
      // Apply aim sensitivity
      const sens = getAimSens();
      rawX *= sens;
      rawY *= sens;
      
      // Less smoothing for responsive aiming
      const aimSmoothing = 0.15;
      smoothAimX += (rawX - smoothAimX) * aimSmoothing;
      smoothAimY += (rawY - smoothAimY) * aimSmoothing;
      
      input.aimX = smoothAimX;
      input.aimY = smoothAimY;
      
      // Visual feedback
      const scale = dist > max * 0.9 ? 1.15 : 1.0;
      dom.joystickShootStick.style.transform = `translate(${sx}px, ${sy}px) scale(${scale})`;
      
      // Haptic feedback
      if (controlSettings.hapticFeedback && rawMag > aimDeadzone && !shootHapticTriggered) {
        if (navigator.vibrate) navigator.vibrate(5);
        shootHapticTriggered = true;
      }
    };
    
    const resetShootJoystick = () => {
      if (!dom.joystickShootStick) return;
      dom.joystickShootStick.style.transform = 'translate(-50%, -50%) scale(1)';
      
      // Only hide if floating joysticks are enabled
      if (controlSettings.floatingJoysticks && dom.joystickShootBase) {
        dom.joystickShootBase.style.opacity = '0';
      } else if (dom.joystickShootBase) {
        // Restore to user's opacity setting
        dom.joystickShootBase.style.opacity = controlSettings.opacity / 100;
      }
      
      const returnInterval = setInterval(() => {
        smoothAimX *= 0.55;
        smoothAimY *= 0.55;
        input.aimX = smoothAimX;
        input.aimY = smoothAimY;
        if (Math.abs(smoothAimX) < 0.01 && Math.abs(smoothAimY) < 0.01) {
          input.aimX = 0;
          input.aimY = 0;
          smoothAimX = 0;
          smoothAimY = 0;
          input.isAiming = false;
          input.fireHeld = false;
          clearInterval(returnInterval);
        }
      }, 16);
      shootHapticTriggered = false;
    };
    
    // Touch zone handlers for floating joysticks
    dom.leftTouchZone?.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (moveId !== null) return;
      const touch = e.changedTouches[0];
      moveId = touch.identifier;
      moveStart = { x: touch.clientX, y: touch.clientY };
      updateMoveJoystick(touch, true);
    }, { passive: false });
    
    dom.rightTouchZone?.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (shootId !== null) return;
      const touch = e.changedTouches[0];
      shootId = touch.identifier;
      shootStart = { x: touch.clientX, y: touch.clientY };
      updateShootJoystick(touch, true);
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
    
    document.addEventListener('touchcancel', (e) => {
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
})();
