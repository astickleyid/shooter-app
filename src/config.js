/**
 * Configuration Module - All game configuration data
 * 
 * This module contains all static configuration including:
 * - Game balance constants (BASE)
 * - Ship templates and stats
 * - Weapon/ability armory definitions
 * - Upgrade system configuration
 * 
 * Exports to global scope:
 * - BASE, SHIP_TEMPLATES, ARMORY, ARMORY_MAP
 * - HANGAR_STATS, SUPPLY_TYPES, UPGRADES, XP_PER_LEVEL
 * - SAVE_KEY
 * 
 * @module config
 */

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
    desc: 'Prototype interceptor tuned for extreme velocity and evasive maneuvers.',
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

// Export to global scope
window.SAVE_KEY = SAVE_KEY;
window.BASE = BASE;
window.SHIP_TEMPLATES = SHIP_TEMPLATES;
window.ARMORY = ARMORY;
window.ARMORY_MAP = ARMORY_MAP;
window.HANGAR_STATS = HANGAR_STATS;
window.SUPPLY_TYPES = SUPPLY_TYPES;
window.UPGRADES = UPGRADES;
window.XP_PER_LEVEL = XP_PER_LEVEL;
