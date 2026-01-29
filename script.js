/* global AudioManager, SocialAPI, SocialHub, GlobalLeaderboard, updateSocialUI */
(() => {
  /* ====== UTILS ====== */
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const rand = (min, max) => min + Math.random() * (max - min);
  const chance = (p) => Math.random() < p;

  /* ====== CONFIG ====== */
  const SAVE_KEY = 'void_rift_v11';
  const AUTH_KEY = 'void_rift_auth';
  const LEADERBOARD_KEY = 'void_rift_leaderboard';

  const DIFFICULTY_PRESETS = {
    easy: {
      name: 'Easy',
      desc: 'Relaxed pace for learning the game',
      enemySpawnRate: 0.75,      // Slower spawns
      enemyHealth: 0.8,           // Less enemy health
      enemySpeed: 0.9,            // Slower enemies
      enemyDamage: 0.8,           // Less damage
      enemiesToKill: 0.75,        // Fewer enemies per level
      spawnerCount: 0.75          // Fewer spawners
    },
    normal: {
      name: 'Normal',
      desc: 'Balanced challenge for most players',
      enemySpawnRate: 1.0,        // Standard spawn rate
      enemyHealth: 1.0,           // Standard health
      enemySpeed: 1.0,            // Standard speed
      enemyDamage: 1.0,           // Standard damage
      enemiesToKill: 1.0,         // Standard enemy count
      spawnerCount: 1.0           // Standard spawners
    },
    hard: {
      name: 'Hard',
      desc: 'Intense action for experienced pilots',
      enemySpawnRate: 1.4,        // Much faster spawns
      enemyHealth: 1.3,           // More enemy health
      enemySpeed: 1.15,           // Faster enemies
      enemyDamage: 1.25,          // More damage
      enemiesToKill: 1.35,        // More enemies per level
      spawnerCount: 1.25          // More spawners
    }
  };

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
    SPAWNER_RATE_MS: 1200,       // Reduced from 1500 for faster gameplay
    OBST_ASTEROIDS: 6,
    INITIAL_SPAWN_DELAY_MIN: 3000, // Reduced from 4000
    INITIAL_SPAWN_DELAY_MAX: 5000  // Reduced from 7000
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
    },
    {
      id: 'spectre',
      name: 'Spectre-9',
      desc: 'Stealth reconnaissance craft with enhanced sensors and cloaking matrix.',
      shape: 'dart',
      scale: 0.88,
      engineOffset: 1.15,
      colors: {
        primary: '#6366f1',
        trim: '#e0e7ff',
        canopy: '#a5b4fc',
        accent: '#818cf8',
        thruster: '#c084fc'
      },
      stats: {
        hp: 0.75,
        speed: 1.35,
        boost: 1.4,
        ammo: 0.85,
        damage: 0.88,
        fireRate: 0.85,
        pickup: 1.25,
        ammoRegen: 1.1
      }
    },
    {
      id: 'titan',
      name: 'Titan Heavy',
      desc: 'Capital-class gunship with devastating firepower and armored hull.',
      shape: 'fortress',
      scale: 1.25,
      engineOffset: 0.85,
      colors: {
        primary: '#78716c',
        trim: '#d6d3d1',
        canopy: '#a8a29e',
        accent: '#57534e',
        thruster: '#dc2626'
      },
      stats: {
        hp: 1.6,
        speed: 0.72,
        boost: 0.78,
        ammo: 1.45,
        damage: 1.35,
        fireRate: 1.3,
        pickup: 0.8,
        ammoRegen: 0.75
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
      },
      {
        id: 'plasma',
        name: 'Plasma Cutter',
        desc: 'Superheated plasma stream with sustained damage over time.',
        unlock: 720,
        stats: { cd: 0.78, damage: 0.65, ammo: 0.85, shots: 0, spread: 0.04, pelletJitter: 0.02, bulletSpeed: 1.5, bulletSize: 0.7, ammoPerShot: 1, pierce: 1 },
        color: '#4ade80'
      },
      {
        id: 'photon',
        name: 'Photon Repeater',
        desc: 'High-velocity light projectiles with extreme rate of fire.',
        unlock: 850,
        stats: { cd: 0.55, damage: 0.45, ammo: 1.3, shots: 0, spread: 0.08, pelletJitter: 0.06, bulletSpeed: 2.5, bulletSize: 0.6, ammoPerShot: 1, pierce: 0 },
        color: '#f0abfc'
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
      },
      {
        id: 'seeker',
        name: 'Seeker Swarm',
        desc: 'Release homing micro-drones that track and eliminate targets.',
        unlock: 680,
        color: '#22d3ee',
        stats: { ammo: 4, cooldown: 8000, radius: 80, damage: 35, seekers: 6 }
      },
      {
        id: 'gravity',
        name: 'Gravity Well',
        desc: 'Creates a localized gravity anomaly pulling enemies together.',
        unlock: 820,
        color: '#8b5cf6',
        stats: { ammo: 2, cooldown: 15000, radius: 180, damage: 25, pull: 0.8, duration: 3000 }
      },
      {
        id: 'charge',
        name: 'Ramming Charge',
        desc: 'Charge at high speed into enemies, dealing collision damage without taking hits.',
        unlock: 450,
        color: '#eab308',
        stats: { ammo: 3, cooldown: 10000, duration: 2500, speedMult: 3.5, damage: 45, invulnerable: true }
      },
      {
        id: 'reinforcement',
        name: 'Orbital Strike',
        desc: 'Call in a missile strike from command - aim to designate the target zone.',
        unlock: 750,
        color: '#dc2626',
        stats: { ammo: 2, cooldown: 18000, radius: 120, damage: 90, missiles: 5, delay: 800 }
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
      },
      {
        id: 'phaseshift',
        name: 'Phase Shift',
        desc: 'Temporarily phase out of reality, becoming invulnerable.',
        unlock: 750,
        color: '#06b6d4',
        stats: { duration: 1800, cooldown: 8000, absorb: 1.0 }
      },
      {
        id: 'overcharge',
        name: 'Overcharge Matrix',
        desc: 'Converts incoming damage into temporary weapon power boost.',
        unlock: 900,
        color: '#eab308',
        stats: { duration: 4000, cooldown: 14000, absorb: 0.35, damageBoost: 0.5 }
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
      },
      {
        id: 'timewarp',
        name: 'Temporal Rift',
        desc: 'Slows time around the ship while maintaining normal speed.',
        unlock: 950,
        color: '#c084fc',
        stats: { charge: 140, radius: 350, damage: 0, slowFactor: 0.3, duration: 5000 }
      },
      {
        id: 'supernova',
        name: 'Supernova Burst',
        desc: 'Channel all energy into a cataclysmic explosion clearing the field.',
        unlock: 1100,
        color: '#fb923c',
        stats: { charge: 180, radius: 400, damage: 350, selfDamage: 0.15 }
      }
    ]
  };

  const ARMORY_MAP = {
    primary: Object.fromEntries(ARMORY.primary.map((w) => [w.id, w])),
    secondary: Object.fromEntries(ARMORY.secondary.map((w) => [w.id, w])),
    defense: Object.fromEntries(ARMORY.defense.map((w) => [w.id, w])),
    ultimate: Object.fromEntries(ARMORY.ultimate.map((w) => [w.id, w]))
  };

  // Shared equipment icon paths and weapon info
  const EQUIPMENT_ICONS = {
    paths: {
      'primary:pulse': 'assets/icons/primary-pulse.svg',
      'primary:scatter': 'assets/icons/primary-scatter.svg',
      'primary:rail': 'assets/icons/primary-rail.svg',
      'primary:ionburst': 'assets/icons/primary-ionburst.svg',
      'primary:plasma': 'assets/icons/primary-plasma.svg',
      'primary:photon': 'assets/icons/primary-photon.svg',
      'secondary:nova': 'assets/icons/secondary-nova.svg',
      'secondary:cluster': 'assets/icons/secondary-cluster.svg',
      'secondary:seeker': 'assets/icons/secondary-seeker.svg',
      'secondary:gravity': 'assets/icons/secondary-gravity.svg',
      'secondary:charge': 'assets/icons/secondary-charge.svg',
      'secondary:reinforcement': 'assets/icons/secondary-reinforcement.svg',
      'defense:aegis': 'assets/icons/defense-aegis.svg',
      'defense:reflector': 'assets/icons/defense-reflector.svg',
      'defense:phaseshift': 'assets/icons/defense-phaseshift.svg',
      'defense:overcharge': 'assets/icons/defense-overcharge.svg',
      'boost': 'assets/icons/boost-icon.svg',
      'ultimate:voidstorm': 'assets/icons/ultimate-voidstorm.svg',
      'ultimate:solarbeam': 'assets/icons/ultimate-solarbeam.svg',
      'ultimate:timewarp': 'assets/icons/ultimate-timewarp.svg',
      'ultimate:supernova': 'assets/icons/ultimate-supernova.svg'
    },
    info: {
      'primary:pulse': { name: 'Pulse Blaster', desc: 'Standard pulse cannon' },
      'primary:scatter': { name: 'Scatter Coil', desc: 'Tri-barrel scatter assembly' },
      'primary:rail': { name: 'Rail Lance', desc: 'Accelerated rail slug' },
      'primary:ionburst': { name: 'Ion Burst Array', desc: 'Ionized shard fan' },
      'primary:plasma': { name: 'Plasma Cutter', desc: 'Sustained plasma stream' },
      'primary:photon': { name: 'Photon Repeater', desc: 'High-velocity light shots' },
      'secondary:nova': { name: 'Nova Bomb', desc: 'Antimatter detonation' },
      'secondary:cluster': { name: 'Cluster Barrage', desc: 'Micro warhead scatter' },
      'secondary:seeker': { name: 'Seeker Swarm', desc: 'Homing micro-drones' },
      'secondary:gravity': { name: 'Gravity Well', desc: 'Enemy pull anomaly' },
      'secondary:charge': { name: 'Ramming Charge', desc: 'High-speed ram attack' },
      'secondary:reinforcement': { name: 'Orbital Strike', desc: 'Command missile strike' },
      'defense:aegis': { name: 'Aegis Field', desc: 'Forward arc shield' },
      'defense:reflector': { name: 'Reflector Veil', desc: 'Damage reflection' },
      'defense:phaseshift': { name: 'Phase Shift', desc: 'Invulnerability phase' },
      'defense:overcharge': { name: 'Overcharge Matrix', desc: 'Damage to power' },
      'boost': { name: 'Boost', desc: 'Speed burst' },
      'ultimate:voidstorm': { name: 'Voidstorm Cascade', desc: 'Gravity well blast' },
      'ultimate:solarbeam': { name: 'Solar Beam', desc: 'Orbital plasma sweep' },
      'ultimate:timewarp': { name: 'Temporal Rift', desc: 'Time slow field' },
      'ultimate:supernova': { name: 'Supernova Burst', desc: 'Massive explosion' }
    },
    getKey: (slotData) => {
      if (!slotData) return 'boost';
      return slotData.type === 'boost' ? 'boost' : `${slotData.type}:${slotData.id}`;
    },
    getPath: (slotData) => {
      const key = EQUIPMENT_ICONS.getKey(slotData);
      return EQUIPMENT_ICONS.paths[key] || 'assets/icons/boost-icon.svg';
    },
    getInfo: (slotData) => {
      const key = EQUIPMENT_ICONS.getKey(slotData);
      const info = EQUIPMENT_ICONS.info[key] || { name: slotData?.id || slotData?.type || 'Unknown', desc: '' };
      return { ...info, icon: EQUIPMENT_ICONS.getPath(slotData) };
    }
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
    { id: 'crit', name: 'Critical Strike', desc: 'Chance for double damage on hits.', cat: 'Offense', base: 130, step: 65, max: 6 },
    // Defense
    { id: 'shield', name: 'Hull Plating', desc: 'Increase maximum health.', cat: 'Defense', base: 70, step: 35, max: 12 },
    { id: 'regen', name: 'Regenerator', desc: 'Passive health regeneration over time.', cat: 'Defense', base: 120, step: 60, max: 6 },
    { id: 'field', name: 'Repulse Field', desc: 'Push enemies away when they get close.', cat: 'Defense', base: 180, step: 90, max: 5 },
    { id: 'armor', name: 'Reactive Armor', desc: 'Reduce incoming damage percentage.', cat: 'Defense', base: 140, step: 70, max: 5 },
    // Utility
    { id: 'ammo', name: 'Ammo Regen', desc: 'Faster ammunition regeneration.', cat: 'Utility', base: 90, step: 45, max: 8 },
    { id: 'boost', name: 'Boost Speed', desc: 'Increase boost movement speed.', cat: 'Utility', base: 110, step: 55, max: 7 },
    { id: 'magnet', name: 'Magnet Range', desc: 'Increase pickup radius for coins and supplies.', cat: 'Utility', base: 85, step: 42, max: 8 },
    { id: 'luck', name: 'Fortune Module', desc: 'Increase credits earned from enemies.', cat: 'Utility', base: 100, step: 50, max: 6 },
    // Special - new category
    { id: 'ultimate', name: 'Ultimate Charger', desc: 'Faster ultimate ability charge rate.', cat: 'Special', base: 160, step: 80, max: 5 },
    { id: 'cooldown', name: 'System Coolant', desc: 'Reduce all ability cooldowns.', cat: 'Special', base: 175, step: 88, max: 5 },
    { id: 'pierce', name: 'Armor Piercing', desc: 'Projectiles pass through additional enemies.', cat: 'Special', base: 200, step: 100, max: 3 }
  ];

  // Adaptive difficulty - scales challenge based on player power
  // Adaptive difficulty constants
  const ADAPTIVE_CONSTANTS = {
    // Scaling weights - increased to make upgrades less dominant
    POWER_WEIGHT: 0.5,
    LEVEL_WEIGHT: 0.5,
    MAX_LEVEL_FOR_SCALING: 25,
    
    // Progressive difficulty thresholds
    EASY_LEVELS: 3,           // REDUCED from 5: First N levels are easier, ramps up faster
    LATE_GAME_START: 15,      // When difficulty becomes challenging
    
    // Diminishing returns on player upgrades
    POWER_EFFECTIVENESS_THRESHOLD: 0.5,  // Power ratio above which diminishing returns kick in
    POWER_EFFECTIVENESS_REDUCTION: 0.6,  // Multiplier for effectiveness reduction above threshold
    
    // Late game exponential scaling parameters
    LATE_GAME_SCALING_FACTOR: 0.15,      // Base factor for exponential growth
    LATE_GAME_SCALING_EXPONENT: 1.3,     // Exponent for late game difficulty curve
    
    // Enemy damage scaling - increased for better challenge
    MAX_DAMAGE_MULTIPLIER: 2.5,
    
    // Shield penetration - increased to counter high defense builds
    MAX_SHIELD_PENETRATION: 0.65,
    PENETRATION_SCALE: 0.75,
    ELITE_PENETRATION_BONUS: 0.25,
    BOSS_PENETRATION_BONUS: 0.4,
    BULLET_PENETRATION_FACTOR: 0.7,
    
    // Repulse field - more aggressive reduction
    MIN_REPULSE_EFFECTIVENESS: 0.2,
    REPULSE_SCALE: 0.8,
    ELITE_REPULSE_RESISTANCE: 0.6,
    BOSS_REPULSE_RESISTANCE: 0.85,
    
    // Enemy speed - increased scaling
    MAX_SPEED_BOOST: 0.6,
    
    // Elite/Boss spawn rates - more elites at higher levels
    MAX_ELITE_CHANCE: 0.5,
    ELITE_CHANCE_SCALE: 0.55,
    MIN_BOSS_INTERVAL: 3,
    MAX_BOSS_INTERVAL: 7,
    
    // Elite stats - stronger elites
    ELITE_SIZE_MULT: 1.35,
    ELITE_SPEED_MULT: 1.2,
    ELITE_HEALTH_MULT: 4,
    ELITE_DAMAGE_MULT: 1.75,
    
    // Boss stats - more challenging bosses
    BOSS_SIZE_MULT: 2.5,
    BOSS_SPEED_MULT: 0.75,
    BOSS_BASE_HEALTH_MULT: 20,
    BOSS_HEALTH_PER_LEVEL: 3,
    BOSS_DAMAGE_MULT: 2.5,
    
    // Ranged attack scaling
    RANGED_DAMAGE_MULT: 0.7,
    BOSS_BULLET_SPEED_MULT: 0.85,
    ELITE_BULLET_SPEED_MULT: 0.65,
    
    // Progressive enemy stat scaling per level (after early game)
    HEALTH_PER_LEVEL: 0.12,      // +12% health per level after early game
    DAMAGE_PER_LEVEL: 0.08,      // +8% damage per level after early game
    SPEED_PER_LEVEL: 0.03        // +3% speed per level after early game
  };

  // Cached power calculations (invalidated when upgrades change)
  let cachedPowerLevel = null;
  let cachedPowerRatio = null;

  const invalidatePowerCache = () => {
    cachedPowerLevel = null;
    cachedPowerRatio = null;
  };

  const getPlayerPowerLevel = () => {
    if (cachedPowerLevel !== null) return cachedPowerLevel;
    let total = 0;
    UPGRADES.forEach(u => {
      total += Save.getUpgradeLevel(u.id);
    });
    cachedPowerLevel = total;
    return total;
  };

  const getMaxPossiblePower = () => {
    return UPGRADES.reduce((sum, u) => sum + u.max, 0);
  };

  // Returns 0-1 scale of how powered up the player is
  const getPowerRatio = () => {
    if (cachedPowerRatio !== null) return cachedPowerRatio;
    const max = getMaxPossiblePower();
    cachedPowerRatio = max > 0 ? getPlayerPowerLevel() / max : 0;
    return cachedPowerRatio;
  };

  // Get progressive level scaling factor
  // Returns a multiplier that increases difficulty after the easy early levels
  const getLevelProgressionFactor = () => {
    const { EASY_LEVELS, LATE_GAME_START, LATE_GAME_SCALING_FACTOR, LATE_GAME_SCALING_EXPONENT } = ADAPTIVE_CONSTANTS;
    const MID_GAME_START = EASY_LEVELS + 1; // Mid game starts right after easy levels
    
    if (level <= EASY_LEVELS) {
      // Early game: reduced difficulty (0.6 to 0.9 scaling)
      return 0.6 + (level / EASY_LEVELS) * 0.3;
    } else if (level <= LATE_GAME_START) {
      // Mid game: steady ramp up (1.0 to 1.5)
      const midProgress = (level - MID_GAME_START) / (LATE_GAME_START - MID_GAME_START);
      return 1.0 + midProgress * 0.5;
    } else {
      // Late game: aggressive scaling (1.5+ with exponential growth)
      const lateProgress = level - LATE_GAME_START;
      return 1.5 + Math.pow(lateProgress * LATE_GAME_SCALING_FACTOR, LATE_GAME_SCALING_EXPONENT);
    }
  };
  
  // Adaptive scaling factors based on player power and level progression
  const getAdaptiveScaling = () => {
    const powerRatio = getPowerRatio();
    const levelFactor = Math.min(level / ADAPTIVE_CONSTANTS.MAX_LEVEL_FOR_SCALING, 1);
    const progressionFactor = getLevelProgressionFactor();
    const combinedFactor = (powerRatio * ADAPTIVE_CONSTANTS.POWER_WEIGHT + levelFactor * ADAPTIVE_CONSTANTS.LEVEL_WEIGHT);
    
    // Apply diminishing returns to high power levels
    // At max power, effectiveness is reduced based on configured threshold and reduction
    const { POWER_EFFECTIVENESS_THRESHOLD, POWER_EFFECTIVENESS_REDUCTION } = ADAPTIVE_CONSTANTS;
    const powerEffectiveness = powerRatio > POWER_EFFECTIVENESS_THRESHOLD 
      ? 1 - (powerRatio - POWER_EFFECTIVENESS_THRESHOLD) * POWER_EFFECTIVENESS_REDUCTION 
      : 1;
    
    // Calculate progressive enemy stat bonuses (kicks in after early game)
    const levelsAfterEasy = Math.max(0, level - ADAPTIVE_CONSTANTS.EASY_LEVELS);
    const progressiveHealthBonus = 1 + levelsAfterEasy * ADAPTIVE_CONSTANTS.HEALTH_PER_LEVEL;
    const progressiveDamageBonus = 1 + levelsAfterEasy * ADAPTIVE_CONSTANTS.DAMAGE_PER_LEVEL;
    const progressiveSpeedBonus = 1 + levelsAfterEasy * ADAPTIVE_CONSTANTS.SPEED_PER_LEVEL;
    
    return {
      // Progressive level scaling factor
      progressionFactor,
      // Player upgrade effectiveness (diminishing returns at high power)
      powerEffectiveness,
      // Enemy damage scales up to bypass high defenses (enhanced with progression)
      enemyDamageMultiplier: (1 + combinedFactor * ADAPTIVE_CONSTANTS.MAX_DAMAGE_MULTIPLIER) * progressiveDamageBonus,
      // Shield penetration increases (% of damage that bypasses shields)
      shieldPenetration: Math.min(ADAPTIVE_CONSTANTS.MAX_SHIELD_PENETRATION, combinedFactor * ADAPTIVE_CONSTANTS.PENETRATION_SCALE * progressionFactor),
      // Repulse field becomes less effective at higher power levels
      repulseEffectiveness: Math.max(ADAPTIVE_CONSTANTS.MIN_REPULSE_EFFECTIVENESS, 1 - combinedFactor * ADAPTIVE_CONSTANTS.REPULSE_SCALE * progressionFactor),
      // Enemy speed increases (enhanced with progression)
      enemySpeedBoost: (1 + combinedFactor * ADAPTIVE_CONSTANTS.MAX_SPEED_BOOST) * progressiveSpeedBonus,
      // Elite enemy spawn chance increases (more at higher levels)
      eliteChance: Math.min(ADAPTIVE_CONSTANTS.MAX_ELITE_CHANCE, combinedFactor * ADAPTIVE_CONSTANTS.ELITE_CHANCE_SCALE * progressionFactor),
      // Boss spawn threshold (every N levels, more frequent at high power)
      bossInterval: Math.max(ADAPTIVE_CONSTANTS.MIN_BOSS_INTERVAL, ADAPTIVE_CONSTANTS.MAX_BOSS_INTERVAL - Math.floor(powerRatio * 5)),
      // Environment hazard intensity
      hazardIntensity: combinedFactor * progressionFactor,
      // Progressive enemy health bonus (for enemy constructor)
      progressiveHealthBonus
    };
  };

  // Wave/Mission types for gameplay variety
  const WAVE_TYPES = {
    standard: { name: 'Standard', desc: 'Eliminate all enemies', enemyMultiplier: 1 },
    swarm: { name: 'Swarm', desc: 'Survive the swarm!', enemyMultiplier: 2.5, spawnRateBoost: 2 },
    elite: { name: 'Elite Strike', desc: 'Elite enemies inbound', eliteBoost: 3 },
    boss: { name: 'Boss Wave', desc: 'Defeat the boss!', hasBoss: true },
    survival: { name: 'Survival', desc: 'Survive for 60 seconds', timerBased: true, duration: 60000 },
    hazard: { name: 'Hazard Zone', desc: 'Navigate the danger zone', hazards: true }
  };

  let currentWaveType = 'standard';
  let waveTimer = 0;
  let waveStartTime = 0;
  let bossActive = false;
  let bossEntity = null;

  /* ====== PLANETARY GAME MODE SYSTEM ====== */
  // Game modes - space (default twin-stick) and planetary (side-scrolling with gravity)
  const GAME_MODES = {
    space: {
      id: 'space',
      name: 'Space Combat',
      desc: 'Classic twin-stick shooter in zero gravity',
      gravity: 0,
      hasGround: false,
      jumpEnabled: false
    },
    planetary: {
      id: 'planetary',
      name: 'Planetary Assault',
      desc: 'Surface combat with gravity physics',
      gravity: 0.4,
      hasGround: true,
      jumpEnabled: true,
      jumpForce: -12,
      maxFallSpeed: 15
    }
  };

  // Terrain generation constants
  const TERRAIN_CONFIG = {
    GRASSY_WAVE_1: 0.3,
    GRASSY_WAVE_2: 0.7,
    GRASSY_AMPLITUDE_1: 20,
    GRASSY_AMPLITUDE_2: 10,
    ROCKY_VARIATION: 30,
    CRATER_DEPTH: 40,
    CRATER_SLOPE: 3,
    VOLCANIC_WAVE: 0.5,
    VOLCANIC_AMPLITUDE: 15,
    ICY_WAVE: 0.2,
    ICY_AMPLITUDE: 8,
    PLATFORM_MIN_WIDTH: 80,
    PLATFORM_MAX_WIDTH: 200,
    PLATFORM_MIN_HEIGHT: 15,
    PLATFORM_MAX_HEIGHT: 30,
    PLATFORM_Y_MIN: 0.3,
    PLATFORM_Y_MAX: 0.7,
    MOVING_PLATFORM_CHANCE: 0.15,
    PASSTHROUGH_PLATFORM_CHANCE: 0.3,
    CRUMBLING_PLATFORM_CHANCE: 0.4,
    PLATFORM_RESPAWN_DELAY: 5000,
    JUMP_COOLDOWN_MS: 100
  };

  // Current game mode state
  let currentGameMode = 'space';
  let currentPlanet = null;
  let planetaryTerrain = [];
  let planetaryPlatforms = [];
  let groundLevel = 0;

  const XP_PER_LEVEL = (lvl) => Math.floor(160 + Math.pow(lvl, 1.65) * 55);

  /* ====== DOM ====== */
  const dom = {};
  const assignDomRefs = () => {
    dom.startScreen = document.getElementById('startScreen');
    dom.startButton = document.getElementById('startButton');
    dom.openShopFromStart = document.getElementById('openShopFromStart');
    dom.settingsButton = document.getElementById('settingsButton');
    dom.difficultySelect = document.getElementById('difficultySelect');
    dom.startGraphicCanvas = document.getElementById('startGraphicCanvas');
    dom.gameContainer = document.getElementById('gameContainer');
    dom.canvas = document.getElementById('gameCanvas');
    // Note: Don't create 2D context yet - wait for 3D check first
    dom.ctx = null;
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
    dom.leaderboardButton = document.getElementById('leaderboardButton');
    dom.authModal = document.getElementById('authModal');
    dom.closeAuth = document.getElementById('closeAuth');
    dom.authUsername = document.getElementById('authUsername');
    dom.authPassword = document.getElementById('authPassword');
    dom.authLogin = document.getElementById('authLogin');
    dom.authRegister = document.getElementById('authRegister');
    dom.authError = document.getElementById('authError');
    dom.leaderboardModal = document.getElementById('leaderboardModal');
    dom.closeLeaderboard = document.getElementById('closeLeaderboard');
    dom.leaderboardUsername = document.getElementById('leaderboardUsername');
    dom.leaderboardLogin = document.getElementById('leaderboardLogin');
    dom.leaderboardLogout = document.getElementById('leaderboardLogout');
    dom.leaderboardList = document.getElementById('leaderboardList');
    dom.leaderboardStatus = document.getElementById('leaderboardStatus');
    dom.pauseMenuModal = document.getElementById('pauseMenuModal');
    dom.resumeGameBtn = document.getElementById('resumeGameBtn');
    dom.restartGameBtn = document.getElementById('restartGameBtn');
    dom.saveGameBtn = document.getElementById('saveGameBtn');
    dom.loadGameBtn = document.getElementById('loadGameBtn');
    dom.exitToMenuBtn = document.getElementById('exitToMenuBtn');
    dom.pauseMenuMessage = document.getElementById('pauseMenuMessage');
    dom.gameModeSelect = document.getElementById('gameModeSelect');
    dom.planetSelect = document.getElementById('planetSelect');
    dom.planetSelectContainer = document.getElementById('planetSelectContainer');
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
  // Enhanced realistic star layers for deep space aesthetic
  let starsDeepSpace = null;     // Very distant, faint stars (nearly static)
  let starsBright = null;        // Occasional bright stars with subtle twinkle
  let particles = [];
  let obstacles = [];
  let hazards = [];          // Environmental hazards (black holes, portals, etc.)
  let celestialBodies = [];  // Background celestial objects (moons, planets)
  let timedEffects = [];
  let score = 0;
  let level = 1;
  let enemiesToKill = 15;  // Increased from 10 for better pacing
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
  let countdownEnd = 0;
  let countdownCompletedLevel = 0;
  let readyUpPhase = false; // NEW: Phase where player can shop before countdown
  let readyUpLevel = 0; // Level displayed during ready-up
  const camera = { x: 0, y: 0 };

  // 3D Rendering System
  let game3DInstance = null;
  let use3DMode = true; // Enable 3D by default

  // Difficulty system
  let currentDifficulty = 'normal';
  let currentLeaderboardFilter = 'all';
  
  // FPS tracking
  let fps = 0;
  let fpsFrames = 0;
  let fpsLastTime = 0;
  let showFPS = false;
  
  // Fullscreen state
  let isFullscreen = false;

  // Equipment interaction system - Enhanced secondary weapons dock
  let lastTapTime = 0;
  let tapCount = 0;
  let currentEquipmentSlot = 0; // 0=primary, 1=slot2, 2=slot3, 3=slot4
  const TAP_TIMEOUT = 500; // ms between taps
  const LONG_PRESS_THRESHOLD = 300; // ms for long-press to open radial menu
  const DEBOUNCE_DELAY = 100; // ms debounce for preventing accidental activations
  
  // Equipment dock state
  const equipmentInteractionState = {
    longPressTimer: null,
    isLongPressing: false,
    isDragging: false,
    dragStartSlot: null,
    radialMenuOpen: false,
    previewSlot: null,
    previewTimer: null,
    lastInteractionTime: 0,
    pointerStartPos: null,
    activePointerId: null,
    keyboardFocusIndex: 0 // For arrow key navigation
  };

  // Action logging system
  const actionLog = [];
  const MAX_LOG_ENTRIES = 5;
  const LOG_ENTRY_LIFETIME = 4000; // ms

  // Phase 1: Combo & Kill Streak System
  let comboCount = 0;
  let comboTimer = 0;
  const COMBO_TIMEOUT = 2500; // ms - time between kills to maintain combo
  let totalKillsThisRun = 0;
  let lastKillStreakNotification = 0;
  const KILL_STREAK_MILESTONES = [5, 10, 25, 50, 100, 200];

  // Phase 1: Floating Damage Numbers
  const damageNumbers = [];
  
  // Phase 1: Level Up Animation
  let levelUpAnimationActive = false;
  let levelUpAnimationStart = 0;
  const LEVEL_UP_DURATION = 2000; // ms

  // Kill Streak Pop-up System - Stylish centered notifications
  let killStreakPopup = null;
  const KILL_STREAK_POPUP_DURATION = 2500; // ms

  // Visual constants for combo and kill streak displays
  const COMBO_VISUAL_CONFIG = {
    PANEL_WIDTH_RATIO: 0.5,          // Max panel width as ratio of canvas width
    PANEL_MAX_WIDTH: 200,            // Max panel width in pixels
    FONT_SIZE_RATIO: 0.08,           // Font size as ratio of canvas width
    FONT_SIZE_MAX: 36,               // Max font size in pixels
    TIER_THRESHOLDS: [5, 10, 20, 50] // Combo counts for tier upgrades
  };

  const KILL_STREAK_VISUAL_CONFIG = {
    PANEL_WIDTH_RATIO: 0.75,         // Max panel width as ratio of canvas width
    PANEL_MAX_WIDTH: 280,            // Max panel width in pixels
    SHAKE_BASE_INTENSITY: 6,         // Base screen shake intensity
    SHAKE_MILESTONE_DIVISOR: 25,     // Divides milestone for additional shake
    SHAKE_BASE_DURATION: 200,        // Base screen shake duration in ms
    SHAKE_DURATION_MULTIPLIER: 2,    // Multiplier for milestone-based duration
    PARTICLE_BASE_COUNT: 30          // Base particle count for celebration
  };

  // Calculate tier level from a count value with given thresholds
  const getTierFromCount = (count, thresholds) => {
    let tier = 1;
    for (let i = 0; i < thresholds.length; i++) {
      if (count >= thresholds[i]) tier = i + 2;
    }
    return tier;
  };

  // Kill streak popup data structure
  const createKillStreakPopup = (milestone, message) => {
    killStreakPopup = {
      milestone,
      message,
      startTime: performance.now(),
      tier: getTierFromCount(milestone, [10, 25, 50, 100])
    };
  };

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

  // Helper function to get current difficulty settings
  const getDifficulty = () => DIFFICULTY_PRESETS[currentDifficulty] || DIFFICULTY_PRESETS.normal;

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
      armory: defaultArmory(),
      difficulty: 'normal'  // Add difficulty preference
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
        // Reset to defaults on corruption
        this.data = {
          credits: 0,
          bestScore: 0,
          highestLevel: 1,
          upgrades: {},
          pilotLevel: 1,
          pilotXp: 0,
          selectedShip: 'vanguard',
          armory: defaultArmory(),
          difficulty: 'normal'
        };
      }
      // Validate and sanitize loaded data
      this.data.credits = Math.max(0, Math.floor(this.data.credits || 0));
      this.data.bestScore = Math.max(0, Math.floor(this.data.bestScore || 0));
      this.data.highestLevel = Math.max(1, Math.floor(this.data.highestLevel || 1));
      this.data.pilotLevel = Math.max(1, Math.floor(this.data.pilotLevel || 1));
      this.data.pilotXp = Math.max(0, Math.floor(this.data.pilotXp || 0));
      if (!this.data.selectedShip || !SHIP_TEMPLATES.find(s => s.id === this.data.selectedShip)) {
        this.data.selectedShip = 'vanguard';
      }
      if (!this.data.difficulty || !DIFFICULTY_PRESETS[this.data.difficulty]) {
        this.data.difficulty = 'normal';
      }
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
      invalidatePowerCache(); // Invalidate cached power calculations
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

  /* ====== UNIFIED AUTHENTICATION SYSTEM ====== */
  /**
   * Simple SHA-256 hash implementation using Web Crypto API
   * @param {string} message - The message to hash
   * @returns {Promise<string>} Hex string of the hash
   */
  const hashPassword = async (message) => {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  /* ====== PRESTIGE & ACHIEVEMENT SYSTEM ====== */
  const PRESTIGE_LEVELS_PER_TIER = 50;
  const MAX_PRESTIGE = 10;
  
  const PRESTIGE_REWARDS = {
    1: { rareWeapon: 'plasma', ship: null, title: 'Void Walker' },
    2: { rareWeapon: 'photon', ship: 'spectre', title: 'Star Pilot' },
    3: { rareWeapon: 'seeker', ship: null, title: 'Ace Commander' },
    4: { rareWeapon: 'gravity', ship: 'titan', title: 'Elite Hunter' },
    5: { rareWeapon: 'phaseshift', ship: null, title: 'Legendary Pilot' },
    6: { rareWeapon: 'overcharge', ship: null, title: 'Mythic Warrior' },
    7: { rareWeapon: 'timewarp', ship: null, title: 'Time Bender' },
    8: { rareWeapon: 'supernova', ship: null, title: 'Galaxy Master' },
    9: { rareWeapon: null, ship: null, title: 'Cosmic Legend' },
    10: { rareWeapon: null, ship: null, title: 'VOID RIFT Champion' }
  };

  const ACHIEVEMENTS = [
    // Combat achievements
    { id: 'first_blood', name: 'First Blood', desc: 'Kill your first enemy', icon: 'assets/icons/achievement-target.svg', category: 'combat', requirement: { kills: 1 } },
    { id: 'centurion', name: 'Centurion', desc: 'Kill 100 enemies in total', icon: 'assets/icons/achievement-sword.svg', category: 'combat', requirement: { totalKills: 100 } },
    { id: 'slayer', name: 'Slayer', desc: 'Kill 1000 enemies in total', icon: 'assets/icons/achievement-skull.svg', category: 'combat', requirement: { totalKills: 1000 } },
    { id: 'boss_hunter', name: 'Boss Hunter', desc: 'Defeat your first boss', icon: 'assets/icons/achievement-boss.svg', category: 'combat', requirement: { bossKills: 1 } },
    { id: 'elite_destroyer', name: 'Elite Destroyer', desc: 'Kill 50 elite enemies', icon: 'assets/icons/achievement-diamond.svg', category: 'combat', requirement: { eliteKills: 50 } },
    
    // Survival achievements
    { id: 'survivor', name: 'Survivor', desc: 'Reach level 5', icon: 'assets/icons/achievement-shield.svg', category: 'survival', requirement: { level: 5 } },
    { id: 'veteran', name: 'Veteran', desc: 'Reach level 10', icon: 'assets/icons/achievement-star.svg', category: 'survival', requirement: { level: 10 } },
    { id: 'champion', name: 'Champion', desc: 'Reach level 20', icon: 'assets/icons/icon-trophy.svg', category: 'survival', requirement: { level: 20 } },
    { id: 'legend', name: 'Legend', desc: 'Reach level 30', icon: 'assets/icons/achievement-crown.svg', category: 'survival', requirement: { level: 30 } },
    { id: 'flawless', name: 'Flawless Victory', desc: 'Complete a level without taking damage', icon: 'assets/icons/achievement-sparkle.svg', category: 'survival', requirement: { flawlessLevel: 1 } },
    
    // Score achievements
    { id: 'scorer', name: 'Point Scorer', desc: 'Score 10,000 points', icon: 'assets/icons/achievement-chart.svg', category: 'score', requirement: { score: 10000 } },
    { id: 'high_roller', name: 'High Roller', desc: 'Score 50,000 points', icon: 'assets/icons/achievement-coin.svg', category: 'score', requirement: { score: 50000 } },
    { id: 'millionaire', name: 'Millionaire', desc: 'Score 100,000 points', icon: 'assets/icons/achievement-diamond.svg', category: 'score', requirement: { score: 100000 } },
    
    // Pilot achievements  
    { id: 'pilot_10', name: 'Experienced Pilot', desc: 'Reach Pilot Level 10', icon: 'assets/icons/achievement-medal.svg', category: 'pilot', requirement: { pilotLevel: 10 } },
    { id: 'pilot_25', name: 'Ace Pilot', desc: 'Reach Pilot Level 25', icon: 'assets/icons/achievement-badge.svg', category: 'pilot', requirement: { pilotLevel: 25 } },
    { id: 'pilot_50', name: 'Master Pilot', desc: 'Reach Pilot Level 50', icon: 'assets/icons/achievement-gold.svg', category: 'pilot', requirement: { pilotLevel: 50 } },
    
    // Prestige achievements
    { id: 'prestige_1', name: 'Ascended', desc: 'Reach Prestige 1', icon: 'assets/icons/achievement-prestige.svg', category: 'prestige', requirement: { prestige: 1 } },
    { id: 'prestige_5', name: 'Transcendent', desc: 'Reach Prestige 5', icon: 'assets/icons/achievement-cosmic.svg', category: 'prestige', requirement: { prestige: 5 } },
    { id: 'prestige_10', name: 'Immortal', desc: 'Reach Prestige 10 (Max)', icon: 'assets/icons/achievement-trident.svg', category: 'prestige', requirement: { prestige: 10 } },
    
    // Special achievements
    { id: 'collector', name: 'Collector', desc: 'Unlock 5 different weapons', icon: 'assets/icons/achievement-collection.svg', category: 'special', requirement: { unlockedWeapons: 5 } },
    { id: 'arsenal', name: 'Arsenal Master', desc: 'Unlock all weapons', icon: 'assets/icons/achievement-arsenal.svg', category: 'special', requirement: { unlockedWeapons: 20 } },
    { id: 'ship_collector', name: 'Ship Collector', desc: 'Unlock 3 different ships', icon: 'assets/icons/icon-hangar.svg', category: 'special', requirement: { unlockedShips: 3 } },
    { id: 'wealthy', name: 'Wealthy', desc: 'Accumulate 10,000 credits', icon: 'assets/icons/achievement-money.svg', category: 'special', requirement: { credits: 10000 } },
    { id: 'upgrader', name: 'Upgrader', desc: 'Purchase 10 upgrades', icon: 'assets/icons/achievement-upgrade.svg', category: 'special', requirement: { totalUpgrades: 10 } }
  ];

  // Achievement categories for UI grouping (used by profile renderer)
  // eslint-disable-next-line no-unused-vars
  const ACHIEVEMENT_CATEGORIES = {
    combat: { name: 'Combat', icon: 'assets/icons/achievement-sword.svg' },
    survival: { name: 'Survival', icon: 'assets/icons/achievement-shield.svg' },
    score: { name: 'Score', icon: 'assets/icons/achievement-chart.svg' },
    pilot: { name: 'Pilot', icon: 'assets/icons/achievement-medal.svg' },
    prestige: { name: 'Prestige', icon: 'assets/icons/achievement-prestige.svg' },
    special: { name: 'Special', icon: 'assets/icons/achievement-sparkle.svg' }
  };

  /**
   * Unified Authentication Manager
   * Syncs local Auth with SocialAPI for a single login experience
   */
  const Auth = {
    users: {},
    currentUser: null,
    
    // Player profile data (unified across all features)
    playerProfile: {
      prestige: 0,
      prestigeLevel: 1,
      achievements: [],
      unlockedAchievements: [],
      totalKills: 0,
      bossKills: 0,
      eliteKills: 0,
      gamesPlayed: 0,
      totalPlayTime: 0,
      flawlessLevels: 0,
      unlockedShips: ['vanguard'],
      customShipColors: {},
      title: 'Rookie Pilot'
    },
    
    load() {
      try {
        const raw = localStorage.getItem(AUTH_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          this.users = parsed.users || {};
          this.currentUser = parsed.currentUser || null;
          // Validate that currentUser actually exists in users
          if (this.currentUser && !this.users[this.currentUser]) {
            console.warn('Current user not found in users, resetting');
            this.currentUser = null;
          }
        }
      } catch (err) {
        console.warn('Failed to load auth data', err);
        this.users = {};
        this.currentUser = null;
      }
      
      // Load player profile data
      this.loadProfile();
      
      // Sync with SocialAPI if available
      this.syncWithSocial();
    },
    
    loadProfile() {
      try {
        const profileKey = `${AUTH_KEY}_profile_${this.currentUser || 'guest'}`;
        const raw = localStorage.getItem(profileKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          this.playerProfile = { ...this.playerProfile, ...parsed };
        }
      } catch (err) {
        console.warn('Failed to load player profile', err);
      }
    },
    
    saveProfile() {
      try {
        const profileKey = `${AUTH_KEY}_profile_${this.currentUser || 'guest'}`;
        localStorage.setItem(profileKey, JSON.stringify(this.playerProfile));
      } catch (err) {
        console.warn('Failed to save player profile', err);
      }
    },
    
    save() {
      try {
        localStorage.setItem(AUTH_KEY, JSON.stringify({
          users: this.users,
          currentUser: this.currentUser
        }));
        this.saveProfile();
      } catch (err) {
        console.warn('Failed to save auth data', err);
      }
    },
    
    /**
     * Sync authentication state with SocialAPI
     * This ensures one login works for all features
     */
    syncWithSocial() {
      if (typeof SocialAPI !== 'undefined') {
        // Check if SocialAPI has a session
        SocialAPI.loadSession();
        
        if (SocialAPI.isLoggedIn() && !this.currentUser) {
          // SocialAPI is logged in but local Auth isn't - sync local auth
          const socialUser = SocialAPI.currentUser;
          if (socialUser && socialUser.username) {
            const cleanUsername = socialUser.username.trim().toLowerCase();
            if (!this.users[cleanUsername]) {
              // Create local user entry
              this.users[cleanUsername] = {
                username: socialUser.username,
                passwordHash: 'social_sync', // Special marker for socially synced accounts
                createdAt: Date.now(),
                socialId: socialUser.id
              };
            }
            this.currentUser = cleanUsername;
            this.loadProfile();
            this.save();
          }
        } else if (this.currentUser && !SocialAPI.isLoggedIn()) {
          // Local Auth is logged in but SocialAPI isn't - could be offline mode
          // Leave as-is for offline play
        }
      }
    },
    
    async register(username, password) {
      if (!username || username.trim().length === 0) {
        return { success: false, error: 'Username is required' };
      }
      if (!password || password.length < 4) {
        return { success: false, error: 'Password must be at least 4 characters' };
      }
      
      const cleanUsername = username.trim().toLowerCase();
      
      if (this.users[cleanUsername]) {
        return { success: false, error: 'Username already exists' };
      }
      
      // Try to register with SocialAPI first (if available)
      if (typeof SocialAPI !== 'undefined') {
        try {
          const socialResult = await SocialAPI.register(username, password);
          if (socialResult && socialResult.success) {
            // Social registration successful - create local entry
            this.users[cleanUsername] = {
              username: username.trim(),
              passwordHash: await hashPassword(password),
              createdAt: Date.now(),
              socialId: socialResult.user?.id
            };
            this.currentUser = cleanUsername;
            this.loadProfile();
            this.save();
            this.updateAllUI();
            return { success: true };
          }
        } catch (err) {
          // Social registration failed - continue with local registration
          console.warn('Social registration failed, using local:', err.message);
        }
      }
      
      // Fallback to local-only registration
      const hashedPassword = await hashPassword(password);
      
      this.users[cleanUsername] = {
        username: username.trim(),
        passwordHash: hashedPassword,
        createdAt: Date.now()
      };
      
      this.currentUser = cleanUsername;
      this.loadProfile();
      this.save();
      this.updateAllUI();
      
      return { success: true };
    },
    
    async login(username, password) {
      if (!username || !password) {
        return { success: false, error: 'Username and password are required' };
      }
      
      const cleanUsername = username.trim().toLowerCase();
      
      // Try to login with SocialAPI first (if available)
      if (typeof SocialAPI !== 'undefined') {
        try {
          const socialResult = await SocialAPI.login(username, password);
          if (socialResult && socialResult.success) {
            // Social login successful - sync local entry
            if (!this.users[cleanUsername]) {
              this.users[cleanUsername] = {
                username: username.trim(),
                passwordHash: await hashPassword(password),
                createdAt: Date.now(),
                socialId: socialResult.user?.id
              };
            } else {
              this.users[cleanUsername].socialId = socialResult.user?.id;
            }
            this.currentUser = cleanUsername;
            this.loadProfile();
            this.save();
            this.updateAllUI();
            return { success: true };
          }
        } catch (err) {
          // Social login failed - try local login
          console.warn('Social login failed, trying local:', err.message);
        }
      }
      
      // Fallback to local login
      const user = this.users[cleanUsername];
      
      if (!user) {
        return { success: false, error: 'Invalid username or password' };
      }
      
      // Support legacy plaintext passwords and migrate them
      if (user.password && !user.passwordHash) {
        if (user.password === password) {
          // Migrate to hashed password
          user.passwordHash = await hashPassword(password);
          delete user.password;
          this.currentUser = cleanUsername;
          this.loadProfile();
          this.save();
          this.updateAllUI();
          return { success: true };
        }
        return { success: false, error: 'Invalid username or password' };
      }
      
      // Special case: socially synced accounts can login if they exist
      if (user.passwordHash === 'social_sync') {
        // Try re-validating with social
        return { success: false, error: 'Please login through the social system' };
      }
      
      // Verify hashed password
      const hashedPassword = await hashPassword(password);
      if (user.passwordHash !== hashedPassword) {
        return { success: false, error: 'Invalid username or password' };
      }
      
      this.currentUser = cleanUsername;
      this.loadProfile();
      this.save();
      this.updateAllUI();
      
      return { success: true };
    },
    
    logout() {
      this.currentUser = null;
      this.playerProfile = {
        prestige: 0,
        prestigeLevel: 1,
        achievements: [],
        unlockedAchievements: [],
        totalKills: 0,
        bossKills: 0,
        eliteKills: 0,
        gamesPlayed: 0,
        totalPlayTime: 0,
        flawlessLevels: 0,
        unlockedShips: ['vanguard'],
        customShipColors: {},
        title: 'Rookie Pilot'
      };
      this.save();
      
      // Also logout from SocialAPI
      if (typeof SocialAPI !== 'undefined') {
        SocialAPI.logout();
      }
      
      this.updateAllUI();
    },
    
    isLoggedIn() {
      // Check both local and social login states
      if (this.currentUser && this.users[this.currentUser]) {
        return true;
      }
      // Also check SocialAPI
      if (typeof SocialAPI !== 'undefined' && SocialAPI.isLoggedIn()) {
        this.syncWithSocial();
        return true;
      }
      return false;
    },
    
    getCurrentUsername() {
      if (this.currentUser) {
        const user = this.users[this.currentUser];
        return user ? user.username : null;
      }
      // Fallback to SocialAPI
      if (typeof SocialAPI !== 'undefined' && SocialAPI.currentUser) {
        return SocialAPI.currentUser.username;
      }
      return null;
    },
    
    // Get current user's full profile data
    getProfile() {
      return {
        username: this.getCurrentUsername(),
        ...this.playerProfile,
        pilotLevel: Save.data.pilotLevel,
        pilotXp: Save.data.pilotXp,
        credits: Save.data.credits,
        bestScore: Save.data.bestScore,
        highestLevel: Save.data.highestLevel
      };
    },
    
    // Update all UI elements across the game
    updateAllUI() {
      // Update local auth UI
      if (typeof updateAuthUI === 'function') {
        updateAuthUI();
      }
      // Update social UI if available
      if (typeof updateSocialUI === 'function') {
        updateSocialUI();
      }
      // Update login button in footer
      const loginBtn = document.getElementById('loginButton');
      if (loginBtn) {
        if (this.isLoggedIn()) {
          const username = this.getCurrentUsername();
          loginBtn.textContent = username || 'Profile';
          loginBtn.onclick = () => {
            if (typeof SocialHub !== 'undefined') {
              SocialHub.showProfile();
            }
          };
        } else {
          loginBtn.textContent = 'Login';
          loginBtn.onclick = () => {
            if (typeof SocialHub !== 'undefined') {
              SocialHub.showAuthModal('login');
            }
          };
        }
      }
    },
    
    // Prestige system functions
    canPrestige() {
      return Save.data.pilotLevel >= PRESTIGE_LEVELS_PER_TIER && this.playerProfile.prestige < MAX_PRESTIGE;
    },
    
    doPrestige() {
      if (!this.canPrestige()) return false;
      
      this.playerProfile.prestige++;
      this.playerProfile.prestigeLevel = 1;
      
      // Award prestige rewards
      const rewards = PRESTIGE_REWARDS[this.playerProfile.prestige];
      if (rewards) {
        this.playerProfile.title = rewards.title;
        
        if (rewards.rareWeapon) {
          // Unlock the rare weapon
          const weaponTypes = ['primary', 'secondary', 'defense', 'ultimate'];
          for (const type of weaponTypes) {
            const weapon = ARMORY[type]?.find(w => w.id === rewards.rareWeapon);
            if (weapon) {
              Save.unlockArmory(type, rewards.rareWeapon);
              break;
            }
          }
        }
        
        if (rewards.ship) {
          if (!this.playerProfile.unlockedShips.includes(rewards.ship)) {
            this.playerProfile.unlockedShips.push(rewards.ship);
          }
        }
      }
      
      // Reset pilot level but keep credits and other progress
      Save.data.pilotLevel = 1;
      Save.data.pilotXp = 0;
      Save.save();
      
      this.saveProfile();
      this.checkAchievements();
      
      return true;
    },
    
    // Achievement checking
    checkAchievements() {
      const profile = this.getProfile();
      const newlyUnlocked = [];
      
      for (const achievement of ACHIEVEMENTS) {
        // Skip already unlocked achievements
        if (this.playerProfile.unlockedAchievements.includes(achievement.id)) {
          continue;
        }
        
        const req = achievement.requirement;
        let unlocked = false;
        
        if (req.kills && profile.totalKills >= req.kills) unlocked = true;
        if (req.totalKills && profile.totalKills >= req.totalKills) unlocked = true;
        if (req.bossKills && profile.bossKills >= req.bossKills) unlocked = true;
        if (req.eliteKills && profile.eliteKills >= req.eliteKills) unlocked = true;
        if (req.level && profile.highestLevel >= req.level) unlocked = true;
        if (req.score && profile.bestScore >= req.score) unlocked = true;
        if (req.pilotLevel && profile.pilotLevel >= req.pilotLevel) unlocked = true;
        if (req.prestige && profile.prestige >= req.prestige) unlocked = true;
        if (req.flawlessLevel && profile.flawlessLevels >= req.flawlessLevel) unlocked = true;
        if (req.credits && profile.credits >= req.credits) unlocked = true;
        
        if (req.unlockedWeapons) {
          const totalUnlocked = Object.values(Save.data.armory.unlocked).flat().length;
          if (totalUnlocked >= req.unlockedWeapons) unlocked = true;
        }
        
        if (req.unlockedShips && profile.unlockedShips.length >= req.unlockedShips) unlocked = true;
        
        if (req.totalUpgrades) {
          const totalUpgrades = Object.values(Save.data.upgrades).reduce((a, b) => a + b, 0);
          if (totalUpgrades >= req.totalUpgrades) unlocked = true;
        }
        
        if (unlocked) {
          this.playerProfile.unlockedAchievements.push(achievement.id);
          newlyUnlocked.push(achievement);
        }
      }
      
      if (newlyUnlocked.length > 0) {
        this.saveProfile();
        // Show achievement notification for each newly unlocked
        newlyUnlocked.forEach(achievement => {
          this.showAchievementNotification(achievement);
        });
      }
      
      return newlyUnlocked;
    },
    
    showAchievementNotification(achievement) {
      // Create achievement toast notification
      const toast = document.createElement('div');
      toast.className = 'achievement-toast';
      toast.innerHTML = `
        <div class="achievement-toast-icon">${achievement.icon}</div>
        <div class="achievement-toast-content">
          <div class="achievement-toast-title">Achievement Unlocked!</div>
          <div class="achievement-toast-name">${achievement.name}</div>
        </div>
      `;
      document.body.appendChild(toast);
      
      // Animate in
      setTimeout(() => toast.classList.add('show'), 100);
      
      // Remove after 4 seconds
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
          if (toast.parentNode) toast.remove();
        }, 300);
      }, 4000);
    },
    
    // Update stats after a game
    updateGameStats(stats) {
      this.playerProfile.gamesPlayed++;
      this.playerProfile.totalKills += stats.kills || 0;
      this.playerProfile.bossKills += stats.bossKills || 0;
      this.playerProfile.eliteKills += stats.eliteKills || 0;
      this.playerProfile.totalPlayTime += stats.playTime || 0;
      
      if (stats.flawlessLevel) {
        this.playerProfile.flawlessLevels++;
      }
      
      this.saveProfile();
      this.checkAchievements();
    }
  };

  /* ====== LEADERBOARD SYSTEM ====== */
  const Leaderboard = {
    entries: [],
    useGlobal: typeof GlobalLeaderboard !== 'undefined',
    migrated: false,
    statusMessage: '',
    statusTone: 'info',

    setStatus(message = '', tone = 'info') {
      this.statusMessage = message;
      this.statusTone = tone;
      if (dom.leaderboardStatus) {
        dom.leaderboardStatus.textContent = message;
        dom.leaderboardStatus.className = `leaderboard-status ${tone}`;
        dom.leaderboardStatus.style.display = message ? 'block' : 'none';
      }
    },
    
    load() {
      try {
        const raw = localStorage.getItem(LEADERBOARD_KEY);
        if (raw) {
          this.entries = JSON.parse(raw);
        }
      } catch (err) {
        console.warn('Failed to load leaderboard', err);
        this.entries = [];
      }
      
      // Auto-migrate local scores to global on first load
      this.autoMigrate();
      this.setStatus('', 'info');
    },
    
    async autoMigrate() {
      if (this.migrated || !this.useGlobal || this.entries.length === 0) {
        return;
      }
      
      const MIGRATION_KEY = 'void_rift_scores_migrated';
      if (localStorage.getItem(MIGRATION_KEY)) {
        this.migrated = true;
        return;
      }
      
      console.warn(`Migrating ${this.entries.length} local scores to global leaderboard...`);
      
      let success = 0;
      for (const entry of this.entries) {
        try {
          const result = await GlobalLeaderboard.submitScore(entry);
          if (result && result.success) {
            success++;
          }
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (err) {
          console.warn('Migration error:', err);
        }
      }
      
      localStorage.setItem(MIGRATION_KEY, 'true');
      this.migrated = true;
      console.warn(`Migrated ${success}/${this.entries.length} scores to global leaderboard`);
    },
    
    save() {
      try {
        localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(this.entries));
      } catch (err) {
        console.warn('Failed to save leaderboard', err);
      }
    },
    
    async addEntry(username, score, level, difficulty) {
      const entry = {
        username: username,
        score: score,
        level: level,
        difficulty: difficulty,
        timestamp: Date.now()
      };
      
      // Save to local storage as backup
      this.entries.push(entry);
      this.entries.sort((a, b) => b.score - a.score);
      if (this.entries.length > 100) {
        this.entries = this.entries.slice(0, 100);
      }
      this.save();
      
      // Submit to global leaderboard
      if (this.useGlobal) {
        try {
          const result = await GlobalLeaderboard.submitScore(entry);
          if (result && result.rank) {
            this.setStatus('', 'info');
            // Score submitted successfully
            return result.rank;
          }

          if (result && result.success === false) {
            this.setStatus(result.error || 'Global submit failed. Using local scores.', 'error');
          }
        } catch (err) {
          console.warn('Global leaderboard unavailable, using local');
          this.setStatus('Global leaderboard unavailable. Using local scores.', 'warning');
        }
      }
      
      // Return local rank as fallback
      return this.entries.findIndex(e => 
        e.username === username && 
        e.score === score && 
        e.timestamp === entry.timestamp
      ) + 1;
    },
    
    async getEntries(difficulty = 'all', limit = 100) {
      // Try to fetch from global leaderboard first
      if (this.useGlobal) {
        try {
          const globalEntries = await GlobalLeaderboard.fetchScores(difficulty, limit);
          // Return global entries even if empty (distinguishes from error)
          if (globalEntries !== null && Array.isArray(globalEntries)) {
            // Global entries fetched successfully
            // Merge with local entries to ensure user's scores appear
            const mergedEntries = this.mergeWithLocal(globalEntries, difficulty);
            this.setStatus('', 'info');
            return mergedEntries.slice(0, limit);
          }
          if (GlobalLeaderboard.lastError) {
            this.setStatus(`Global leaderboard unavailable: ${GlobalLeaderboard.lastError}`, 'warning');
          }
        } catch (err) {
          console.warn('Global leaderboard unavailable, using local:', err.message);
          this.setStatus('Global leaderboard unavailable. Using local scores.', 'warning');
        }
      }
      
      // Fallback to local entries
      let filtered = this.entries;
      if (difficulty !== 'all') {
        filtered = this.entries.filter(e => e.difficulty === difficulty);
      }
      return filtered.slice(0, limit);
    },
    
    // Merge global entries with local entries (in case global doesn't have user's recent scores)
    mergeWithLocal(globalEntries, difficulty = 'all') {
      const globalIds = new Set(globalEntries.map(e => e.id));
      // Filter local entries by difficulty and exclude entries already in global
      const localToAdd = this.entries.filter(e => {
        const matchesDifficulty = difficulty === 'all' || e.difficulty === difficulty;
        const notInGlobal = !globalIds.has(e.id);
        return matchesDifficulty && notInGlobal;
      });
      
      // Combine and sort by score
      const merged = [...globalEntries, ...localToAdd];
      merged.sort((a, b) => b.score - a.score);
      
      return merged;
    },
    
    getUserBest(username) {
      const userEntries = this.entries.filter(e => 
        e.username.toLowerCase() === username.toLowerCase()
      );
      
      if (userEntries.length === 0) return null;
      
      return userEntries[0]; // Already sorted by score
    }
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
    hazards = [];
    celestialBodies = [];
    timedEffects = [];
    starsFar = starsMid = starsNear = null;
    starsDeepSpace = starsBright = null;
    score = 0;
    level = 1;
    enemiesToKill = 15;  // Increased from 10 for better pacing
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
    
    // Wave system reset
    currentWaveType = 'standard';
    waveTimer = 0;
    waveStartTime = 0;
    bossActive = false;
    bossEntity = null;
    
    // Phase 1: Reset combo and kill streak
    comboCount = 0;
    comboTimer = 0;
    totalKillsThisRun = 0;
    lastKillStreakNotification = 0;
    damageNumbers.length = 0;
    levelUpAnimationActive = false;
    
    Object.keys(input).forEach((k) => {
      if (typeof input[k] === 'boolean') input[k] = false;
      else input[k] = 0;
    });
    input.mouseAimActive = false;
    Object.keys(keyboard).forEach((k) => (keyboard[k] = false));
  };

  const addXP = (amount) => {
    if (!amount || amount <= 0) return false;
    
    // Phase 1: Apply combo bonus
    if (comboCount > 1) {
      const comboBonus = 1 + (comboCount * 0.1);
      amount = Math.floor(amount * comboBonus);
    }
    
    pilotXP += amount;
    let leveled = false;
    let needed = XP_PER_LEVEL(pilotLevel);
    while (pilotXP >= needed) {
      pilotXP -= needed;
      pilotLevel += 1;
      leveled = true;
      needed = XP_PER_LEVEL(pilotLevel);
      
      // Phase 1: Trigger level-up celebration
      levelUpAnimationActive = true;
      levelUpAnimationStart = performance.now();
      addLogEntry(`🎉 Level Up! Pilot Level ${pilotLevel}`, '#4ade80');
      shakeScreen(8, 300);
      
      // Play level up sound
      if (typeof AudioManager !== 'undefined') {
        AudioManager.playLevelUp();
      }
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
    
    // Also trigger 3D shake if active
    if (use3DMode && game3DInstance) {
      game3DInstance.shake(power);
    }
  };

  // Phase 1: Spawn floating damage number
  const spawnDamageNumber = (x, y, damage, isCrit = false) => {
    const text = isCrit ? `${Math.round(damage)}!` : Math.round(damage);
    const size = isCrit ? 24 : 18;
    const color = isCrit ? 'rgb(234, 88, 12)' : 'rgb(251, 191, 36)';
    damageNumbers.push({
      x: x + rand(-10, 10),
      y: y - 20,
      text: String(text),
      size,
      color,
      time: performance.now(),
      lifetime: 1000
    });
  };

  // Phase 1: Add kill to combo system
  const addComboKill = () => {
    const now = performance.now();
    comboCount++;
    comboTimer = now + COMBO_TIMEOUT;
    totalKillsThisRun++;
    
    // Check for kill streak milestones
    for (const milestone of KILL_STREAK_MILESTONES) {
      if (totalKillsThisRun === milestone && lastKillStreakNotification < milestone) {
        lastKillStreakNotification = milestone;
        const messages = {
          5: 'Kill Streak!',
          10: 'Rampage!',
          25: 'Dominating!',
          50: 'UNSTOPPABLE!',
          100: 'LEGENDARY!',
          200: 'GODLIKE!'
        };
        // Create stylish kill streak popup instead of just log entry
        createKillStreakPopup(milestone, messages[milestone]);
        addLogEntry(`🔥 ${messages[milestone]} (${milestone} kills)`, '#f97316');
        const shakeIntensity = KILL_STREAK_VISUAL_CONFIG.SHAKE_BASE_INTENSITY + Math.floor(milestone / KILL_STREAK_VISUAL_CONFIG.SHAKE_MILESTONE_DIVISOR);
        const shakeDuration = KILL_STREAK_VISUAL_CONFIG.SHAKE_BASE_DURATION + milestone * KILL_STREAK_VISUAL_CONFIG.SHAKE_DURATION_MULTIPLIER;
        shakeScreen(shakeIntensity, shakeDuration);
        addParticles('levelup', player.x, player.y, 0, KILL_STREAK_VISUAL_CONFIG.PARTICLE_BASE_COUNT + milestone);
        
        // Play combo milestone sound
        if (typeof AudioManager !== 'undefined') {
          AudioManager.playComboMilestone();
        }
      }
    }
  };

  // Phase 1: Reset combo on timeout
  const updateComboSystem = () => {
    if (comboCount > 0 && performance.now() > comboTimer) {
      if (comboCount >= 5) {
        addLogEntry(`Combo ended: ${comboCount}x`, '#94a3b8');
      }
      comboCount = 0;
    }
  };

  /* ====== PARTICLES ====== */
  const addParticles = (kind, x, y, ang = 0, count = 8, colorOverride) => {
    for (let i = 0; i < count; i++) {
      if (kind === 'muzzle') {
        // Phase A.4: Enhanced muzzle flash with directional spread
        const spread = rand(-0.3, 0.3);
        const speed = rand(2, 4);
        particles.push({ 
          x: x + Math.cos(ang) * 10, 
          y: y + Math.sin(ang) * 10, 
          vx: Math.cos(ang + spread) * speed, 
          vy: Math.sin(ang + spread) * speed, 
          life: 220, 
          c: chance(0.7) ? '#ffd54f' : '#fff', 
          s: rand(2, 3),
          type: 'fade' // Phase A.4: Particle type for rendering
        });
        continue;
      }
      if (kind === 'pop') {
        particles.push({ x, y, vx: rand(-2, 2), vy: rand(-2, 2), life: 320, c: '#fca5a5', s: 2, type: 'fade' });
        continue;
      }
      if (kind === 'sparks') {
        // Phase A.4: Enhanced sparks with bounce physics and trails
        const angle = rand(0, Math.PI * 2);
        const speed = rand(2, 5);
        particles.push({ 
          x, 
          y, 
          vx: Math.cos(angle) * speed, 
          vy: Math.sin(angle) * speed, 
          life: rand(160, 240), 
          c: chance(0.8) ? '#ffffff' : '#fde047', 
          s: rand(1, 2),
          type: 'spark', // Phase A.4: Spark type with physics
          gravity: 0.05,
          bounce: 0.6
        });
        continue;
      }
      if (kind === 'debris') {
        // Phase A.4: Rotating debris chunks
        particles.push({ 
          x, 
          y, 
          vx: rand(-2, 2), 
          vy: rand(-2, 2), 
          life: rand(350, 450), 
          c: chance(0.5) ? '#9ca3af' : '#6b7280', 
          s: rand(2, 4),
          type: 'debris',
          rotation: rand(0, Math.PI * 2),
          rotSpeed: rand(-0.2, 0.2)
        });
        continue;
      }
      if (kind === 'thruster') {
        particles.push({ x, y, vx: rand(-0.6, 0.6), vy: rand(-0.6, 0.6), life: 180 + rand(-40, 60), c: colorOverride || '#ff9a3c', s: 1.8 + rand(-0.4, 0.6), type: 'fade' });
        continue;
      }
      if (kind === 'levelup') {
        // Phase A.4: Enhanced level up with spiraling wisps
        const angle = (i / count) * Math.PI * 2;
        const speed = rand(2, 3.5);
        particles.push({ 
          x, 
          y, 
          vx: Math.cos(angle) * speed, 
          vy: Math.sin(angle) * speed, 
          life: 500, 
          c: chance(0.5) ? '#38bdf8' : '#a855f7', 
          s: 3,
          type: 'wisp', // Phase A.4: Spiraling energy wisp
          spiralSpeed: rand(0.05, 0.1)
        });
        continue;
      }
      if (kind === 'nova') {
        const palette = ['#fde68a', '#f97316'];
        particles.push({ x, y, vx: rand(-3, 3), vy: rand(-3, 3), life: 260, c: palette[i % palette.length], s: 3, type: 'fade' });
        continue;
      }
      if (kind === 'shield') {
        particles.push({ x: x + rand(-14, 14), y: y + rand(-14, 14), vx: rand(-0.5, 0.5), vy: rand(-0.5, 0.5), life: 220, c: 'rgba(148,163,246,0.8)', s: 2, type: 'fade' });
        continue;
      }
      if (kind === 'ultimate') {
        const palette = ['#f97316', '#a855f7'];
        particles.push({ x: x + rand(-4, 4), y: y + rand(-4, 4), vx: rand(-4, 4), vy: rand(-4, 4), life: 320, c: palette[i % palette.length], s: 4, type: 'fade' });
        continue;
      }
      // Phase A.4: New particle types
      if (kind === 'smoke') {
        particles.push({ 
          x: x + rand(-5, 5), 
          y: y + rand(-5, 5), 
          vx: rand(-0.5, 0.5), 
          vy: rand(-1.5, -0.5), 
          life: rand(400, 600), 
          c: `rgba(100, 100, 100, ${rand(0.3, 0.6)})`, 
          s: rand(3, 6),
          type: 'smoke',
          growth: 1.02
        });
        continue;
      }
      if (kind === 'ring') {
        // Phase A.4: Expanding shockwave ring
        particles.push({ 
          x, 
          y, 
          r: 5, 
          maxR: rand(40, 80), 
          life: 300, 
          c: colorOverride || '#fde047', 
          type: 'ring',
          expandSpeed: rand(0.8, 1.5)
        });
      }
    }
  };

  const drawParticles = (ctx, dt) => {
    // Phase A.4: Cap particles for performance
    const particleCap = 1000;
    if (particles.length > particleCap) {
      particles.splice(0, particles.length - particleCap);
    }
    
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      const step = dt / 16.67;
      
      // Phase A.4: Different particle behaviors
      if (p.type === 'spark') {
        // Sparks with gravity and bounce
        p.vy += (p.gravity || 0.05) * step;
        p.x += p.vx * step;
        p.y += p.vy * step;
        // Simple bounce (could enhance with obstacle detection)
        if (p.bounce && Math.abs(p.vy) > 0.1) {
          // Simulated floor bounce
          if (p.y > camera.y + window.innerHeight / 2 - 50) {
            p.vy *= -p.bounce;
            p.y = camera.y + window.innerHeight / 2 - 50;
          }
        }
      } else if (p.type === 'debris') {
        // Rotating debris
        p.x += p.vx * step;
        p.y += p.vy * step;
        if (p.rotation !== undefined) p.rotation += (p.rotSpeed || 0) * step;
      } else if (p.type === 'wisp') {
        // Spiraling energy wisps
        const angle = Math.atan2(p.vy, p.vx);
        const spiral = (p.spiralSpeed || 0.05) * step;
        p.vx = Math.cos(angle + spiral) * Math.hypot(p.vx, p.vy);
        p.vy = Math.sin(angle + spiral) * Math.hypot(p.vx, p.vy);
        p.x += p.vx * step;
        p.y += p.vy * step;
      } else if (p.type === 'smoke') {
        // Smoke clouds that expand and rise
        p.x += p.vx * step;
        p.y += p.vy * step;
        if (p.growth) p.s *= p.growth;
      } else if (p.type === 'ring') {
        // Expanding rings
        p.r += (p.expandSpeed || 1) * step;
      } else {
        // Default particle movement
        p.x += p.vx * step;
        p.y += p.vy * step;
      }
      
      p.life -= dt;
      if (p.life <= 0 || (p.type === 'ring' && p.r >= p.maxR)) {
        particles.splice(i, 1);
        continue;
      }
      
      // Phase A.4: Enhanced rendering based on type
      const alpha = Math.max(0, p.life / 320);
      ctx.globalAlpha = alpha;
      
      if (p.type === 'ring') {
        // Phase A.4: Draw expanding ring
        ctx.strokeStyle = p.c;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.type === 'debris' && p.rotation !== undefined) {
        // Phase A.4: Draw rotating debris
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s);
        ctx.restore();
      } else if (p.type === 'wisp') {
        // Phase A.4: Draw glowing wisp with trail
        ctx.shadowColor = p.c;
        ctx.shadowBlur = 8;
        ctx.fillStyle = p.c;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      } else if (p.type === 'smoke') {
        // Phase A.4: Draw smoke cloud as circle
        ctx.fillStyle = p.c;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Phase A.4: Standard particle
        ctx.fillStyle = p.c;
        ctx.fillRect(p.x - p.s / 2, p.y - p.s / 2, p.s, p.s);
      }
      
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
      // Use polar coordinates for truly random distribution (avoids grid patterns)
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.sqrt(Math.random()) * margin; // sqrt for uniform area distribution
      arr.push({
        x: cx + Math.cos(angle) * dist,
        y: cy + Math.sin(angle) * dist,
        s: Math.random() * 1.8 + 0.3, // Smaller, more realistic sizes
        // Random drift direction for each star (very subtle)
        driftAngle: Math.random() * Math.PI * 2,
        driftSpeed: Math.random() * 0.02 // Nearly imperceptible movement
      });
    }
    return arr;
  };

  // Enhanced star maker with color and subtle twinkle support for realism
  const makeEnhancedStars = (n, options = {}) => {
    const arr = [];
    const margin = viewRadius(1.6);
    const cx = camera.x + window.innerWidth / 2;
    const cy = camera.y + window.innerHeight / 2;
    const colors = options.colors || ['#ffffff'];
    const minSize = options.minSize || 0.4;
    const maxSize = options.maxSize || 2.4;
    const twinkle = options.twinkle || false;
    
    for (let i = 0; i < n; i++) {
      // Use polar coordinates for truly random distribution
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.sqrt(Math.random()) * margin;
      arr.push({
        x: cx + Math.cos(angle) * dist,
        y: cy + Math.sin(angle) * dist,
        s: Math.random() * (maxSize - minSize) + minSize,
        color: colors[Math.floor(Math.random() * colors.length)],
        twinkle: twinkle,
        twinklePhase: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.001 + Math.random() * 0.002, // Slower, more subtle twinkle
        baseAlpha: options.baseAlpha || 1,
        // Random drift direction (nearly static)
        driftAngle: Math.random() * Math.PI * 2,
        driftSpeed: Math.random() * 0.01
      });
    }
    return arr;
  };

  // Draw stars layer with realistic near-static movement
  const drawStarsLayer = (ctx, arr, parallaxFactor) => {
    ctx.fillStyle = '#fff';
    for (const star of arr) {
      // Smaller stars appear dimmer (realistic)
      ctx.globalAlpha = clamp(star.s / 2.2, 0.15, 0.85);
      ctx.fillRect(star.x, star.y, star.s, star.s);
      
      // Very subtle individual drift (stars appear nearly static like real space)
      if (star.driftAngle !== undefined) {
        star.x += Math.cos(star.driftAngle) * star.driftSpeed * parallaxFactor;
        star.y += Math.sin(star.driftAngle) * star.driftSpeed * parallaxFactor;
      }
      
      // Wrap stars at edges
      const margin = viewRadius(1.8);
      if (star.x < camera.x - margin) {
        star.x = camera.x + margin;
        // Randomize Y using polar coordinates when wrapping
        const wrapAngle = Math.random() * Math.PI * 2;
        star.y = camera.y + Math.sin(wrapAngle) * Math.sqrt(Math.random()) * margin;
      }
      if (star.x > camera.x + margin) {
        star.x = camera.x - margin;
        const wrapAngle = Math.random() * Math.PI * 2;
        star.y = camera.y + Math.sin(wrapAngle) * Math.sqrt(Math.random()) * margin;
      }
      if (star.y < camera.y - margin) {
        star.y = camera.y + margin;
        const wrapAngle = Math.random() * Math.PI * 2;
        star.x = camera.x + Math.cos(wrapAngle) * Math.sqrt(Math.random()) * margin;
      }
      if (star.y > camera.y + margin) {
        star.y = camera.y - margin;
        const wrapAngle = Math.random() * Math.PI * 2;
        star.x = camera.x + Math.cos(wrapAngle) * Math.sqrt(Math.random()) * margin;
      }
    }
    ctx.globalAlpha = 1;
  };

  // Enhanced star layer with subtle twinkle for realistic space appearance
  const drawEnhancedStarsLayer = (ctx, arr, parallaxFactor) => {
    for (const star of arr) {
      let alpha = clamp(star.s / 2.2, 0.15, 0.85) * (star.baseAlpha || 1);
      
      // Apply subtle twinkling effect
      if (star.twinkle) {
        star.twinklePhase += star.twinkleSpeed * 16.67;
        // More subtle twinkle range for realism
        alpha *= 0.75 + 0.25 * Math.sin(star.twinklePhase);
      }
      
      ctx.globalAlpha = alpha;
      ctx.fillStyle = star.color || '#fff';
      ctx.fillRect(star.x, star.y, star.s, star.s);
      
      // Very subtle individual drift
      if (star.driftAngle !== undefined) {
        star.x += Math.cos(star.driftAngle) * star.driftSpeed * parallaxFactor;
        star.y += Math.sin(star.driftAngle) * star.driftSpeed * parallaxFactor;
      }
      
      // Wrap stars at edges with proper randomization
      const margin = viewRadius(1.8);
      if (star.x < camera.x - margin) {
        star.x = camera.x + margin;
        const wrapAngle = Math.random() * Math.PI * 2;
        star.y = camera.y + Math.sin(wrapAngle) * Math.sqrt(Math.random()) * margin;
      }
      if (star.x > camera.x + margin) {
        star.x = camera.x - margin;
        const wrapAngle = Math.random() * Math.PI * 2;
        star.y = camera.y + Math.sin(wrapAngle) * Math.sqrt(Math.random()) * margin;
      }
      if (star.y < camera.y - margin) {
        star.y = camera.y + margin;
        const wrapAngle = Math.random() * Math.PI * 2;
        star.x = camera.x + Math.cos(wrapAngle) * Math.sqrt(Math.random()) * margin;
      }
      if (star.y > camera.y + margin) {
        star.y = camera.y - margin;
        const wrapAngle = Math.random() * Math.PI * 2;
        star.x = camera.x + Math.cos(wrapAngle) * Math.sqrt(Math.random()) * margin;
      }
    }
    ctx.globalAlpha = 1;
  };

  const recenterStars = () => {
    const margin = viewRadius(1.6);
    const cx = camera.x + window.innerWidth / 2;
    const cy = camera.y + window.innerHeight / 2;
    const bundles = [starsFar, starsMid, starsNear, starsDeepSpace, starsBright];
    for (const layer of bundles) {
      if (!layer) continue;
      for (const star of layer) {
        // Use polar distribution when recentering for natural appearance
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.sqrt(Math.random()) * margin;
        star.x = cx + Math.cos(angle) * dist;
        star.y = cy + Math.sin(angle) * dist;
      }
    }
  };

  // Initialize realistic star layers for dark space aesthetic
  const initStarLayers = () => {
    // Layer 1: Deep space stars (very distant, faint, nearly static)
    starsDeepSpace = makeEnhancedStars(300, {
      colors: ['#ffffff', '#e5e7eb', '#d1d5db'],  // Subtle white/gray tones
      minSize: 0.2,
      maxSize: 0.6,
      baseAlpha: 0.3,
      twinkle: true
    });
    // Layer 2-4: Main star layers (varying distances)
    starsFar = makeStars(150);   // Most distant, smallest
    starsMid = makeStars(100);   // Middle distance
    starsNear = makeStars(60);   // Closer stars
    // Layer 5: Occasional bright stars (rare, prominent)
    starsBright = makeEnhancedStars(12, {
      colors: ['#ffffff', '#fef9c3', '#e0f2fe'],  // Pure white with slight color variance
      minSize: 1.2,
      maxSize: 2.0,
      baseAlpha: 0.8,
      twinkle: true
    });
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
      this.id = `asteroid_${entityIdCounter++}`;
      this.x = x;
      this.y = y;
      this.r = r;
      this.size = r; // Add size property for 3D system
      this.seed = Math.random() * 1000; // Random seed for 3D geometry variation
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

  /* ====== ENVIRONMENTAL HAZARDS ====== */
  
  // Black Hole - Gravitational pull that damages and slows entities
  class BlackHole {
    constructor(x, y, size = 80) {
      this.x = x;
      this.y = y;
      this.size = size;
      this.pullRadius = size * 4;
      this.damageRadius = size * 0.8;
      this.pullStrength = 0.8;
      this.damage = 8;
      this.rotation = 0;
      this.rotSpeed = 0.02;
      this.pulsePhase = Math.random() * Math.PI * 2;
      this.active = true;
      this.lifetime = 30000 + rand(0, 20000); // 30-50 seconds
      this.created = performance.now();
      this.accretionParticles = [];
      // Initialize accretion disk particles
      for (let i = 0; i < 40; i++) {
        this.accretionParticles.push({
          angle: rand(0, Math.PI * 2),
          dist: rand(this.size * 0.9, this.size * 2.5),
          speed: rand(0.01, 0.04),
          size: rand(1, 3),
          alpha: rand(0.3, 0.8)
        });
      }
    }
    
    draw(ctx) {
      if (!this.active) return;
      const pulse = Math.sin(performance.now() / 300 + this.pulsePhase) * 0.15 + 1;
      
      ctx.save();
      ctx.translate(this.x, this.y);
      
      // Outer gravitational distortion effect
      const gradient = ctx.createRadialGradient(0, 0, this.size * 0.3, 0, 0, this.pullRadius);
      gradient.addColorStop(0, 'rgba(30, 0, 50, 0)');
      gradient.addColorStop(0.4, 'rgba(60, 0, 100, 0.1)');
      gradient.addColorStop(0.7, 'rgba(80, 20, 150, 0.05)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, this.pullRadius, 0, Math.PI * 2);
      ctx.fill();
      
      // Accretion disk - rotating particle ring
      ctx.save();
      ctx.rotate(this.rotation);
      for (const p of this.accretionParticles) {
        const px = Math.cos(p.angle) * p.dist;
        const py = Math.sin(p.angle) * p.dist * 0.3; // Elliptical for 3D effect
        ctx.globalAlpha = p.alpha * pulse;
        
        // Color based on distance (hotter closer to center)
        const heat = 1 - (p.dist - this.size) / (this.size * 1.5);
        if (heat > 0.7) {
          ctx.fillStyle = '#fff';
        } else if (heat > 0.4) {
          ctx.fillStyle = '#fde047';
        } else {
          ctx.fillStyle = '#f97316';
        }
        
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      
      // Event horizon (black center)
      const eventHorizon = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size * pulse);
      eventHorizon.addColorStop(0, '#000000');
      eventHorizon.addColorStop(0.7, '#0a0010');
      eventHorizon.addColorStop(0.9, '#1a0030');
      eventHorizon.addColorStop(1, 'rgba(50, 0, 80, 0.8)');
      ctx.fillStyle = eventHorizon;
      ctx.beginPath();
      ctx.arc(0, 0, this.size * pulse, 0, Math.PI * 2);
      ctx.fill();
      
      // Inner glow ring
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.6)';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#a855f7';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(0, 0, this.size * 0.9 * pulse, 0, Math.PI * 2);
      ctx.stroke();
      
      // Core singularity glow
      ctx.shadowColor = '#fff';
      ctx.shadowBlur = 15;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.beginPath();
      ctx.arc(0, 0, this.size * 0.15, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    }
    
    update(dt) {
      if (!this.active) return;
      
      const step = dt / 16.67;
      this.rotation += this.rotSpeed * step;
      
      // Update accretion disk particles
      for (const p of this.accretionParticles) {
        p.angle += p.speed * step;
        // Particles slowly spiral inward
        if (p.dist > this.size * 0.7) {
          p.dist -= 0.05 * step;
        }
        // Respawn particles that got too close
        if (p.dist < this.size * 0.7) {
          p.dist = this.size * 2 + rand(0, this.size * 0.5);
          p.angle = rand(0, Math.PI * 2);
        }
      }
      
      // Check lifetime
      if (performance.now() - this.created > this.lifetime) {
        this.active = false;
        return;
      }
      
      // Apply gravitational effects to player
      if (player) {
        const dx = this.x - player.x;
        const dy = this.y - player.y;
        const dist = Math.hypot(dx, dy);
        
        if (dist < this.pullRadius && dist > this.damageRadius) {
          // Pull effect - stronger closer to center
          const pullFactor = (1 - dist / this.pullRadius) * this.pullStrength;
          player.x += (dx / dist) * pullFactor * step;
          player.y += (dy / dist) * pullFactor * step;
          
          // Particle effect when being pulled
          if (chance(0.1)) {
            addParticles('sparks', player.x, player.y, Math.atan2(dy, dx), 2);
          }
        }
        
        // Damage zone
        if (dist < this.damageRadius) {
          player.takeDamage(this.damage * (dt / 1000), null);
          shakeScreen(2, 50);
        }
      }
      
      // Pull enemies too
      for (const enemy of enemies) {
        const dx = this.x - enemy.x;
        const dy = this.y - enemy.y;
        const dist = Math.hypot(dx, dy);
        
        if (dist < this.pullRadius && dist > this.size * 0.5) {
          const pullFactor = (1 - dist / this.pullRadius) * this.pullStrength * 0.5;
          enemy.x += (dx / dist) * pullFactor * step;
          enemy.y += (dy / dist) * pullFactor * step;
        }
        
        // Destroy enemies that fall in
        if (dist < this.size * 0.5) {
          enemy.health = 0;
        }
      }
      
      // Pull bullets
      for (const bullet of bullets) {
        const dx = this.x - bullet.x;
        const dy = this.y - bullet.y;
        const dist = Math.hypot(dx, dy);
        
        if (dist < this.pullRadius) {
          const pullFactor = (1 - dist / this.pullRadius) * this.pullStrength * 0.3;
          bullet.vel.x += (dx / dist) * pullFactor * 0.02;
          bullet.vel.y += (dy / dist) * pullFactor * 0.02;
        }
      }
    }
  }
  
  // Time Portal - Teleportation and time dilation effects
  class TimePortal {
    constructor(x, y, linkedPortal = null) {
      this.x = x;
      this.y = y;
      this.size = 50;
      this.portalRadius = 35;
      this.linkedPortal = linkedPortal;
      this.rotation = 0;
      this.rotSpeed = 0.03;
      this.active = true;
      this.cooldown = 0; // Prevent rapid teleportation
      this.lifetime = 25000 + rand(0, 15000);
      this.created = performance.now();
      this.color = linkedPortal ? '#06b6d4' : '#8b5cf6'; // Cyan for exit, purple for entry
      this.pulsePhase = Math.random() * Math.PI * 2;
      this.energyRings = [];
      // Initialize energy rings
      for (let i = 0; i < 3; i++) {
        this.energyRings.push({
          radius: this.size * (0.5 + i * 0.25),
          rotation: rand(0, Math.PI * 2),
          speed: rand(0.02, 0.05) * (i % 2 === 0 ? 1 : -1)
        });
      }
    }
    
    draw(ctx) {
      if (!this.active) return;
      const pulse = Math.sin(performance.now() / 200 + this.pulsePhase) * 0.2 + 1;
      
      ctx.save();
      ctx.translate(this.x, this.y);
      
      // Outer dimensional distortion
      const gradient = ctx.createRadialGradient(0, 0, this.size * 0.2, 0, 0, this.size * 1.5);
      gradient.addColorStop(0, this.color === '#8b5cf6' ? 'rgba(139, 92, 246, 0.4)' : 'rgba(6, 182, 212, 0.4)');
      gradient.addColorStop(0.5, this.color === '#8b5cf6' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(6, 182, 212, 0.1)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, this.size * 1.5, 0, Math.PI * 2);
      ctx.fill();
      
      // Rotating energy rings
      for (const ring of this.energyRings) {
        ctx.save();
        ctx.rotate(ring.rotation);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.6 * pulse;
        ctx.setLineDash([10, 5]);
        ctx.beginPath();
        ctx.arc(0, 0, ring.radius * pulse, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }
      
      // Portal center
      const portalGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.portalRadius * pulse);
      portalGradient.addColorStop(0, '#ffffff');
      portalGradient.addColorStop(0.3, this.color);
      portalGradient.addColorStop(0.7, this.color === '#8b5cf6' ? '#4c1d95' : '#164e63');
      portalGradient.addColorStop(1, '#000000');
      ctx.fillStyle = portalGradient;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 25;
      ctx.beginPath();
      ctx.arc(0, 0, this.portalRadius * pulse, 0, Math.PI * 2);
      ctx.fill();
      
      // Swirling inner pattern
      ctx.save();
      ctx.rotate(this.rotation);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < 3; i++) {
        const angle = (i / 3) * Math.PI * 2;
        const innerR = this.portalRadius * 0.2;
        const outerR = this.portalRadius * 0.8;
        ctx.moveTo(Math.cos(angle) * innerR, Math.sin(angle) * innerR);
        // Spiral arm
        for (let t = 0; t <= 1; t += 0.1) {
          const spiralAngle = angle + t * Math.PI;
          const r = innerR + (outerR - innerR) * t;
          ctx.lineTo(Math.cos(spiralAngle) * r, Math.sin(spiralAngle) * r);
        }
      }
      ctx.stroke();
      ctx.restore();
      
      // Center glow
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#fff';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(0, 0, this.portalRadius * 0.15 * pulse, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    }
    
    update(dt) {
      if (!this.active) return;
      
      const step = dt / 16.67;
      this.rotation += this.rotSpeed * step;
      
      // Update energy rings
      for (const ring of this.energyRings) {
        ring.rotation += ring.speed * step;
      }
      
      // Cooldown
      if (this.cooldown > 0) {
        this.cooldown -= dt;
      }
      
      // Check lifetime
      if (performance.now() - this.created > this.lifetime) {
        this.active = false;
        if (this.linkedPortal) this.linkedPortal.active = false;
        return;
      }
      
      // Check for player teleportation
      if (player && this.linkedPortal && this.linkedPortal.active && this.cooldown <= 0) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.hypot(dx, dy);
        
        if (dist < this.portalRadius) {
          // Teleport player
          player.x = this.linkedPortal.x;
          player.y = this.linkedPortal.y;
          
          // Set cooldown on both portals
          this.cooldown = 2000;
          this.linkedPortal.cooldown = 2000;
          
          // Effects
          addParticles('levelup', this.x, this.y, 0, 15);
          addParticles('levelup', this.linkedPortal.x, this.linkedPortal.y, 0, 15);
          shakeScreen(4, 150);
          addLogEntry('⚡ Portal teleport!', '#8b5cf6');
        }
      }
      
      // Enemies can also be teleported
      if (this.linkedPortal && this.linkedPortal.active && this.cooldown <= 0) {
        for (const enemy of enemies) {
          const dx = enemy.x - this.x;
          const dy = enemy.y - this.y;
          const dist = Math.hypot(dx, dy);
          
          if (dist < this.portalRadius && chance(0.3)) {
            enemy.x = this.linkedPortal.x + rand(-50, 50);
            enemy.y = this.linkedPortal.y + rand(-50, 50);
            addParticles('sparks', this.linkedPortal.x, this.linkedPortal.y, 0, 5);
          }
        }
      }
    }
  }
  
  // Nebula - Area effect that reduces visibility and applies status effects
  class Nebula {
    constructor(x, y, size = 200) {
      this.x = x;
      this.y = y;
      this.size = size;
      this.type = chance(0.5) ? 'toxic' : 'electric';
      this.active = true;
      this.lifetime = 35000 + rand(0, 20000);
      this.created = performance.now();
      this.pulsePhase = Math.random() * Math.PI * 2;
      this.cloudParticles = [];
      // Generate cloud particles
      for (let i = 0; i < 60; i++) {
        const angle = rand(0, Math.PI * 2);
        const dist = rand(0, this.size * 0.9);
        this.cloudParticles.push({
          x: Math.cos(angle) * dist,
          y: Math.sin(angle) * dist,
          size: rand(20, 50),
          alpha: rand(0.1, 0.4),
          drift: rand(-0.3, 0.3)
        });
      }
    }
    
    draw(ctx) {
      if (!this.active) return;
      const pulse = Math.sin(performance.now() / 400 + this.pulsePhase) * 0.1 + 1;
      
      ctx.save();
      ctx.translate(this.x, this.y);
      
      // Base gradient
      const baseColor = this.type === 'toxic' ? 'rgba(34, 197, 94,' : 'rgba(59, 130, 246,';
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size * pulse);
      gradient.addColorStop(0, baseColor + '0.3)');
      gradient.addColorStop(0.5, baseColor + '0.15)');
      gradient.addColorStop(1, baseColor + '0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, this.size * pulse, 0, Math.PI * 2);
      ctx.fill();
      
      // Cloud particles
      for (const p of this.cloudParticles) {
        ctx.globalAlpha = p.alpha * pulse;
        const cloudGradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
        cloudGradient.addColorStop(0, this.type === 'toxic' ? 'rgba(74, 222, 128, 0.4)' : 'rgba(96, 165, 250, 0.4)');
        cloudGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = cloudGradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Lightning effects for electric type
      if (this.type === 'electric' && chance(0.05)) {
        ctx.strokeStyle = '#60a5fa';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#3b82f6';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        let lx = rand(-this.size * 0.5, this.size * 0.5);
        let ly = rand(-this.size * 0.5, this.size * 0.5);
        ctx.moveTo(lx, ly);
        for (let i = 0; i < 4; i++) {
          lx += rand(-40, 40);
          ly += rand(-40, 40);
          ctx.lineTo(lx, ly);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
      
      ctx.globalAlpha = 1;
      ctx.restore();
    }
    
    update(dt) {
      if (!this.active) return;
      
      const step = dt / 16.67;
      
      // Drift cloud particles
      for (const p of this.cloudParticles) {
        p.x += p.drift * step;
        p.y += p.drift * 0.5 * step;
        // Wrap particles
        const dist = Math.hypot(p.x, p.y);
        if (dist > this.size) {
          const angle = rand(0, Math.PI * 2);
          p.x = Math.cos(angle) * this.size * 0.3;
          p.y = Math.sin(angle) * this.size * 0.3;
        }
      }
      
      // Check lifetime
      if (performance.now() - this.created > this.lifetime) {
        this.active = false;
        return;
      }
      
      // Apply effects to player
      if (player) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.hypot(dx, dy);
        
        if (dist < this.size) {
          if (this.type === 'toxic') {
            // Toxic damage over time
            player.takeDamage(2 * (dt / 1000), null);
            if (chance(0.02)) {
              addParticles('smoke', player.x, player.y, 0, 2);
            }
          } else {
            // Electric - occasional shock damage
            if (chance(0.01)) {
              player.takeDamage(5, null);
              addParticles('sparks', player.x, player.y, 0, 8);
              shakeScreen(2, 50);
            }
          }
        }
      }
      
      // Apply effects to enemies
      for (const enemy of enemies) {
        const dx = enemy.x - this.x;
        const dy = enemy.y - this.y;
        const dist = Math.hypot(dx, dy);
        
        if (dist < this.size) {
          if (this.type === 'toxic') {
            enemy.health -= 1 * (dt / 1000);
          } else if (chance(0.005)) {
            enemy.health -= 3;
            addParticles('sparks', enemy.x, enemy.y, 0, 3);
          }
        }
      }
    }
  }
  
  // Celestial Body - Decorative background planets and moons
  class CelestialBody {
    constructor(x, y, type = 'moon') {
      this.x = x;
      this.y = y;
      this.type = type;
      // Smaller, less intrusive sizes
      this.size = type === 'planet' ? rand(80, 150) : rand(25, 60);
      this.rotation = rand(0, Math.PI * 2);
      this.rotSpeed = rand(-0.0005, 0.0005);
      this.parallax = type === 'planet' ? 0.05 : 0.08; // More distant feel
      this.baseX = x;
      this.baseY = y;
      
      // Determine if this is a gas giant or solid planet
      this.isGasGiant = type === 'planet' && chance(0.4);
      
      // Generate surface features
      this.craters = [];
      this.surfaceNoise = []; // For rough texture
      this.gasParticles = []; // For gas giant glow effect
      this.color = this.generateColor();
      this.secondaryColor = this.generateSecondaryColor();
      
      if (this.isGasGiant) {
        // Gas giants have swirling particle bands instead of craters
        this.generateGasParticles();
      } else {
        // Solid planets/moons have craters and rough surface
        const craterCount = type === 'planet' ? rand(8, 18) : rand(4, 10);
        for (let i = 0; i < craterCount; i++) {
          const angle = rand(0, Math.PI * 2);
          const dist = rand(0, this.size * 0.8);
          this.craters.push({
            x: Math.cos(angle) * dist,
            y: Math.sin(angle) * dist,
            r: rand(this.size * 0.03, this.size * 0.12),
            depth: rand(0.3, 0.7) // Crater depth variation
          });
        }
        // Add surface roughness noise points
        for (let i = 0; i < 20; i++) {
          const angle = rand(0, Math.PI * 2);
          const dist = rand(0, this.size * 0.9);
          this.surfaceNoise.push({
            x: Math.cos(angle) * dist,
            y: Math.sin(angle) * dist,
            r: rand(2, 6),
            dark: chance(0.5)
          });
        }
      }
      
      // Rings for some planets (less common)
      this.hasRings = type === 'planet' && !this.isGasGiant && chance(0.25);
      this.ringColor = 'rgba(120, 110, 100,'; // More muted ring color
    }
    
    generateGasParticles() {
      // Create swirling gas bands/particles for gas giants
      const bandCount = rand(4, 7);
      for (let band = 0; band < bandCount; band++) {
        const bandY = -this.size * 0.8 + (band / bandCount) * this.size * 1.6;
        const particlesInBand = rand(8, 15);
        for (let i = 0; i < particlesInBand; i++) {
          this.gasParticles.push({
            x: rand(-this.size * 0.9, this.size * 0.9),
            y: bandY + rand(-this.size * 0.1, this.size * 0.1),
            r: rand(3, 12),
            speed: rand(0.1, 0.4) * (band % 2 === 0 ? 1 : -1),
            alpha: rand(0.1, 0.4)
          });
        }
      }
    }
    
    generateColor() {
      const colors = {
        // Muted, realistic moon colors
        moon: ['#4a4a4a', '#3d3d3d', '#555555', '#484848', '#525252'],
        // Muted, realistic planet colors - darker, less saturated
        planet: ['#3d2817', '#1a3a3a', '#2d2040', '#4a2020', '#1a3020', '#3a3520']
      };
      const palette = colors[this.type];
      return palette[Math.floor(Math.random() * palette.length)];
    }
    
    generateSecondaryColor() {
      // Slightly lighter variant for bands/details
      const colors = {
        moon: ['#5a5a5a', '#4d4d4d', '#656565'],
        planet: ['#4d3827', '#2a4a4a', '#3d3050', '#5a3030', '#2a4030', '#4a4530']
      };
      const palette = colors[this.type];
      return palette[Math.floor(Math.random() * palette.length)];
    }
    
    draw(ctx) {
      ctx.save();
      
      // Apply parallax based on camera position
      const parallaxOffset = 1 - this.parallax;
      const px = this.baseX + camera.x * parallaxOffset;
      const py = this.baseY + camera.y * parallaxOffset;
      
      ctx.translate(px, py);
      ctx.rotate(this.rotation);
      
      // Lower overall opacity for background feel
      ctx.globalAlpha = this.type === 'planet' ? 0.6 : 0.5;
      
      if (this.isGasGiant) {
        this.drawGasGiant(ctx);
      } else {
        this.drawSolidBody(ctx);
      }
      
      ctx.globalAlpha = 1;
      ctx.restore();
    }
    
    drawGasGiant(ctx) {
      // Subtle outer glow
      const glowGradient = ctx.createRadialGradient(0, 0, this.size * 0.7, 0, 0, this.size * 1.3);
      glowGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
      glowGradient.addColorStop(0.6, this.adjustBrightness(this.color, 0.3, 0.2));
      glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(0, 0, this.size * 1.3, 0, Math.PI * 2);
      ctx.fill();
      
      // Main body - very dim base
      const bodyGradient = ctx.createRadialGradient(
        -this.size * 0.2, -this.size * 0.2, 0,
        0, 0, this.size
      );
      bodyGradient.addColorStop(0, this.adjustBrightness(this.color, 0.6));
      bodyGradient.addColorStop(0.5, this.adjustBrightness(this.color, 0.4));
      bodyGradient.addColorStop(1, this.adjustBrightness(this.color, 0.2));
      
      ctx.fillStyle = bodyGradient;
      ctx.beginPath();
      ctx.arc(0, 0, this.size, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw gas bands with clip
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, this.size * 0.98, 0, Math.PI * 2);
      ctx.clip();
      
      // Horizontal gas bands
      for (let i = 0; i < 5; i++) {
        const bandY = -this.size * 0.8 + i * this.size * 0.4;
        const bandHeight = this.size * 0.15;
        ctx.fillStyle = i % 2 === 0 
          ? this.adjustBrightness(this.secondaryColor, 0.5, 0.25)
          : this.adjustBrightness(this.color, 0.7, 0.2);
        ctx.fillRect(-this.size, bandY, this.size * 2, bandHeight);
      }
      
      // Draw swirling particles for gaseous effect
      for (const particle of this.gasParticles) {
        ctx.globalAlpha = particle.alpha * 0.5;
        const particleGrad = ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, particle.r
        );
        particleGrad.addColorStop(0, this.adjustBrightness(this.secondaryColor, 0.8, 0.4));
        particleGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = particleGrad;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      
      // Subtle edge highlight
      ctx.globalAlpha = 0.1;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, this.size * 0.98, -Math.PI * 0.3, Math.PI * 0.3);
      ctx.stroke();
    }
    
    drawSolidBody(ctx) {
      // Shadow side gradient (3D effect) - more muted
      const bodyGradient = ctx.createRadialGradient(
        -this.size * 0.25, -this.size * 0.25, 0,
        0, 0, this.size
      );
      bodyGradient.addColorStop(0, this.adjustBrightness(this.color, 0.8));
      bodyGradient.addColorStop(0.4, this.adjustBrightness(this.color, 0.5));
      bodyGradient.addColorStop(1, this.adjustBrightness(this.color, 0.15));
      
      // Main body
      ctx.fillStyle = bodyGradient;
      ctx.beginPath();
      ctx.arc(0, 0, this.size, 0, Math.PI * 2);
      ctx.fill();
      
      // Surface roughness noise
      for (const noise of this.surfaceNoise) {
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = noise.dark ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.1)';
        ctx.beginPath();
        ctx.arc(noise.x, noise.y, noise.r, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Surface craters with raised rim effect
      for (const crater of this.craters) {
        // Crater shadow (depth)
        ctx.globalAlpha = crater.depth * 0.5;
        const craterGrad = ctx.createRadialGradient(
          crater.x + crater.r * 0.2, crater.y + crater.r * 0.2, 0,
          crater.x, crater.y, crater.r
        );
        craterGrad.addColorStop(0, 'rgba(0, 0, 0, 0.6)');
        craterGrad.addColorStop(0.6, 'rgba(0, 0, 0, 0.3)');
        craterGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = craterGrad;
        ctx.beginPath();
        ctx.arc(crater.x, crater.y, crater.r, 0, Math.PI * 2);
        ctx.fill();
        
        // Crater rim highlight (raised edge)
        ctx.globalAlpha = 0.15;
        ctx.strokeStyle = '#888888';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(crater.x - crater.r * 0.15, crater.y - crater.r * 0.15, crater.r * 0.9, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      
      // Rings for ringed planets (muted)
      if (this.hasRings) {
        ctx.save();
        ctx.rotate(Math.PI * 0.15);
        ctx.scale(1, 0.3);
        ctx.globalAlpha = 0.25;
        
        for (let i = 0; i < 3; i++) {
          const innerR = this.size * (1.25 + i * 0.12);
          const outerR = this.size * (1.32 + i * 0.12);
          ctx.strokeStyle = this.ringColor + (0.3 - i * 0.08) + ')';
          ctx.lineWidth = outerR - innerR;
          ctx.beginPath();
          ctx.arc(0, 0, (innerR + outerR) / 2, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      }
      
      // Very subtle highlight
      ctx.globalAlpha = 0.12;
      ctx.fillStyle = '#888888';
      ctx.beginPath();
      ctx.arc(-this.size * 0.3, -this.size * 0.3, this.size * 0.15, 0, Math.PI * 2);
      ctx.fill();
    }
    
    adjustBrightness(hex, factor, alpha = 1) {
      // Convert hex to RGB and adjust brightness
      // Handle both hex (#rrggbb) and rgba strings
      if (hex.startsWith('rgb')) {
        return hex; // Return as-is for rgba
      }
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      const newR = Math.min(255, Math.floor(r * factor));
      const newG = Math.min(255, Math.floor(g * factor));
      const newB = Math.min(255, Math.floor(b * factor));
      if (alpha < 1) {
        return `rgba(${newR}, ${newG}, ${newB}, ${alpha})`;
      }
      return `rgb(${newR}, ${newG}, ${newB})`;
    }
    
    update(dt) {
      this.rotation += this.rotSpeed * (dt / 16.67);
      
      // Update gas particle positions for animation
      if (this.isGasGiant) {
        for (const particle of this.gasParticles) {
          particle.x += particle.speed * (dt / 16.67);
          // Wrap around
          if (particle.x > this.size * 0.95) particle.x = -this.size * 0.95;
          if (particle.x < -this.size * 0.95) particle.x = this.size * 0.95;
        }
      }
    }
  }
  
  // Asteroid Belt - Dense field of moving asteroids
  class AsteroidBelt {
    constructor(x, y, width = 400) {
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = 100;
      this.rotation = rand(0, Math.PI * 2);
      this.active = true;
      this.lifetime = 40000 + rand(0, 20000);
      this.created = performance.now();
      this.asteroids = [];
      
      // Generate belt asteroids
      for (let i = 0; i < 25; i++) {
        this.asteroids.push({
          offset: rand(-this.width / 2, this.width / 2),
          perpOffset: rand(-this.height / 2, this.height / 2),
          size: rand(8, 25),
          rot: rand(0, Math.PI * 2),
          rotSpeed: rand(-0.03, 0.03),
          speed: rand(0.3, 0.8) * (chance(0.5) ? 1 : -1),
          variant: chance(0.3) ? 'iron' : chance(0.3) ? 'ember' : 'rock'
        });
      }
    }
    
    draw(ctx) {
      if (!this.active) return;
      
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      
      // Draw belt boundary indicator
      ctx.globalAlpha = 0.1;
      ctx.fillStyle = '#9ca3af';
      ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
      ctx.globalAlpha = 1;
      
      // Draw asteroids
      for (const a of this.asteroids) {
        ctx.save();
        ctx.translate(a.offset, a.perpOffset);
        ctx.rotate(a.rot);
        
        let fill = '#1f2937';
        let stroke = '#9ca3af';
        if (a.variant === 'ember') {
          fill = '#3b0d0d';
          stroke = '#f87171';
        } else if (a.variant === 'iron') {
          fill = '#111827';
          stroke = '#94a3b8';
        }
        
        ctx.fillStyle = fill;
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 1.5;
        
        // Simple polygon asteroid
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2;
          const r = a.size * (0.7 + Math.sin(angle * 3 + a.rot) * 0.3);
          if (i === 0) ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
          else ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        ctx.restore();
      }
      
      ctx.restore();
    }
    
    update(dt) {
      if (!this.active) return;
      
      const step = dt / 16.67;
      
      // Check lifetime
      if (performance.now() - this.created > this.lifetime) {
        this.active = false;
        return;
      }
      
      // Update asteroids
      for (const a of this.asteroids) {
        a.offset += a.speed * step;
        a.rot += a.rotSpeed * step;
        
        // Wrap around
        if (a.offset > this.width / 2) a.offset = -this.width / 2;
        if (a.offset < -this.width / 2) a.offset = this.width / 2;
      }
      
      // Collision with player
      if (player) {
        // Transform player position to belt space
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const cos = Math.cos(-this.rotation);
        const sin = Math.sin(-this.rotation);
        const localX = dx * cos - dy * sin;
        const localY = dx * sin + dy * cos;
        
        // Check if player is in belt area
        if (Math.abs(localX) < this.width / 2 && Math.abs(localY) < this.height / 2) {
          // Check individual asteroid collisions
          for (const a of this.asteroids) {
            const adx = localX - a.offset;
            const ady = localY - a.perpOffset;
            if (Math.hypot(adx, ady) < a.size + player.size) {
              // Push player and deal damage
              const pushDir = Math.atan2(dy, dx);
              player.x += Math.cos(pushDir) * 3;
              player.y += Math.sin(pushDir) * 3;
              player.takeDamage(4, null);
              addParticles('sparks', player.x, player.y, 0, 3);
            }
          }
        }
      }
    }
  }
  
  // Solar Flare - Periodic damaging beam from off-screen
  class SolarFlare {
    constructor() {
      this.active = true;
      this.warning = true;
      this.warningStart = performance.now();
      this.warningDuration = 2000;
      this.flareDuration = 1500;
      this.flareStart = 0;
      this.lifetime = this.warningDuration + this.flareDuration + 1000;
      this.created = performance.now();
      
      // Random direction
      this.angle = rand(0, Math.PI * 2);
      this.width = 100;
      this.damage = 15;
    }
    
    draw(ctx) {
      if (!this.active) return;
      
      const now = performance.now();
      
      if (this.warning) {
        // Warning phase - show indicator
        const progress = (now - this.warningStart) / this.warningDuration;
        const flashAlpha = Math.sin(progress * Math.PI * 8) * 0.3 + 0.3;
        
        ctx.save();
        if (player) {
          ctx.translate(player.x, player.y);
        }
        ctx.rotate(this.angle);
        
        // Warning beam indicator
        ctx.globalAlpha = flashAlpha;
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(-2000, -this.width / 2, 4000, this.width);
        
        // Warning text
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('⚠ SOLAR FLARE INCOMING ⚠', 0, -this.width - 20);
        
        ctx.restore();
      } else {
        // Flare phase - actual damage beam
        const progress = (now - this.flareStart) / this.flareDuration;
        const intensity = Math.sin(progress * Math.PI);
        
        ctx.save();
        if (player) {
          ctx.translate(player.x, player.y);
        }
        ctx.rotate(this.angle);
        
        // Main beam
        const gradient = ctx.createLinearGradient(0, -this.width, 0, this.width);
        gradient.addColorStop(0, 'rgba(251, 191, 36, 0)');
        gradient.addColorStop(0.3, `rgba(251, 191, 36, ${intensity * 0.8})`);
        gradient.addColorStop(0.5, `rgba(255, 255, 255, ${intensity})`);
        gradient.addColorStop(0.7, `rgba(251, 191, 36, ${intensity * 0.8})`);
        gradient.addColorStop(1, 'rgba(251, 191, 36, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(-2000, -this.width, 4000, this.width * 2);
        
        // Core beam
        ctx.fillStyle = `rgba(255, 255, 255, ${intensity})`;
        ctx.fillRect(-2000, -this.width * 0.2, 4000, this.width * 0.4);
        
        ctx.restore();
      }
    }
    
    update(dt) {
      if (!this.active) return;
      
      const now = performance.now();
      
      // Check lifetime
      if (now - this.created > this.lifetime) {
        this.active = false;
        return;
      }
      
      // Transition from warning to flare
      if (this.warning && now - this.warningStart > this.warningDuration) {
        this.warning = false;
        this.flareStart = now;
        addLogEntry('☀️ SOLAR FLARE!', '#fbbf24');
        shakeScreen(8, 500);
      }
      
      // Apply damage during flare
      if (!this.warning && player) {
        const progress = (now - this.flareStart) / this.flareDuration;
        if (progress < 1) {
          // Check if player is in beam path
          // Simplified: damage based on distance from beam center
          const perpDist = this.getPerpendicularDistance(player.x, player.y);
          if (perpDist < this.width) {
            player.takeDamage(this.damage * (dt / 1000) * (1 - perpDist / this.width), null);
          }
        }
      }
    }
    
    getPerpendicularDistance(px, py) {
      if (!player) return Infinity;
      // Distance from player to the beam line
      const dx = px - player.x;
      const dy = py - player.y;
      const cos = Math.cos(this.angle + Math.PI / 2);
      const sin = Math.sin(this.angle + Math.PI / 2);
      return Math.abs(dx * cos + dy * sin);
    }
  }
  
  // Spawn environmental hazards based on level and wave type
  const spawnHazards = () => {
    hazards = [];
    celestialBodies = [];
    if (!player) return;
    
    const waveType = WAVE_TYPES[currentWaveType];
    const isHazardWave = waveType && waveType.hazards;
    
    // Always spawn some celestial bodies for visual interest (background decorations)
    const planetCount = rand(1, 3);  // At least 1 planet
    const moonCount = rand(2, 5);    // At least 2 moons
    
    // Spawn distant planets - closer range for visibility
    for (let i = 0; i < planetCount; i++) {
      const pos = randomAround(player.x, player.y, viewRadius(0.8), viewRadius(1.8));
      celestialBodies.push(new CelestialBody(pos.x, pos.y, 'planet'));
    }
    
    // Spawn moons - closer range for visibility
    for (let i = 0; i < moonCount; i++) {
      const pos = randomAround(player.x, player.y, viewRadius(0.6), viewRadius(1.5));
      celestialBodies.push(new CelestialBody(pos.x, pos.y, 'moon'));
    }
    
    // Hazards appear based on level and wave type
    const hazardChance = isHazardWave ? 0.8 : 0.15 + level * 0.02;
    
    if (level >= 3 && (isHazardWave || chance(hazardChance))) {
      // Black holes - dangerous gravitational hazard
      if (level >= 5 && (isHazardWave || chance(0.3))) {
        const blackHoleCount = isHazardWave ? rand(1, 3) : 1;
        for (let i = 0; i < blackHoleCount; i++) {
          const pos = randomAround(player.x, player.y, viewRadius(0.5), viewRadius(1.2));
          const size = rand(50, 100) + level * 2;
          hazards.push(new BlackHole(pos.x, pos.y, size));
        }
        addLogEntry('⚫ Black hole detected!', '#a855f7');
      }
      
      // Time portals - teleportation hazard (come in pairs)
      if (level >= 4 && (isHazardWave || chance(0.35))) {
        const portalPairs = isHazardWave ? rand(1, 2) : 1;
        for (let i = 0; i < portalPairs; i++) {
          const pos1 = randomAround(player.x, player.y, viewRadius(0.4), viewRadius(0.8));
          const pos2 = randomAround(player.x, player.y, viewRadius(0.6), viewRadius(1.1));
          const portal1 = new TimePortal(pos1.x, pos1.y);
          const portal2 = new TimePortal(pos2.x, pos2.y, portal1);
          portal1.linkedPortal = portal2;
          hazards.push(portal1);
          hazards.push(portal2);
        }
        addLogEntry('🌀 Time portals opened!', '#8b5cf6');
      }
      
      // Nebulae - area damage zones
      if (level >= 3 && (isHazardWave || chance(0.4))) {
        const nebulaCount = isHazardWave ? rand(1, 3) : 1;
        for (let i = 0; i < nebulaCount; i++) {
          const pos = randomAround(player.x, player.y, viewRadius(0.3), viewRadius(1));
          const size = rand(150, 300) + level * 5;
          hazards.push(new Nebula(pos.x, pos.y, size));
        }
        addLogEntry('☁️ Nebula cloud detected!', '#22c55e');
      }
      
      // Asteroid belt - moving obstacle field
      if (level >= 6 && (isHazardWave || chance(0.25))) {
        const pos = randomAround(player.x, player.y, viewRadius(0.5), viewRadius(1));
        const width = rand(300, 500) + level * 10;
        hazards.push(new AsteroidBelt(pos.x, pos.y, width));
        addLogEntry('🪨 Asteroid belt ahead!', '#9ca3af');
      }
      
      // Solar flare - periodic beam attack (only in hazard waves or high levels)
      if ((isHazardWave && chance(0.5)) || (level >= 10 && chance(0.15))) {
        hazards.push(new SolarFlare());
        addLogEntry('⚠️ Solar activity detected!', '#fbbf24');
      }
    }
  };
  
  // Update all hazards
  const updateHazards = (dt) => {
    // Update celestial bodies
    for (const body of celestialBodies) {
      body.update(dt);
    }
    
    // Update and clean up hazards
    for (let i = hazards.length - 1; i >= 0; i--) {
      hazards[i].update(dt);
      if (!hazards[i].active) {
        hazards.splice(i, 1);
      }
    }
  };
  
  // Draw all environmental objects
  const drawEnvironment = (ctx) => {
    // Draw celestial bodies first (background)
    for (const body of celestialBodies) {
      body.draw(ctx);
    }
    
    // Draw hazards
    for (const hazard of hazards) {
      hazard.draw(ctx);
    }
  };

  /* ====== PLANETARY TERRAIN & PHYSICS SYSTEM ====== */
  
  // Platform class for planetary mode
  class Platform {
    constructor(x, y, width, height, type = 'solid') {
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
      this.type = type; // 'solid', 'passthrough', 'moving', 'crumbling'
      this.originalY = y;
      this.movePhase = Math.random() * Math.PI * 2;
      this.moveRange = type === 'moving' ? 80 : 0;
      this.crumbleTimer = 0;
      this.crumbling = false;
      this.broken = false;
    }

    update(dt) {
      if (this.type === 'moving') {
        this.movePhase += dt * 0.002;
        this.y = this.originalY + Math.sin(this.movePhase) * this.moveRange;
      }
      if (this.crumbling) {
        this.crumbleTimer += dt;
        if (this.crumbleTimer > 1500) {
          this.broken = true;
        }
      }
    }

    draw(ctx, planet) {
      if (this.broken) return;
      
      const colors = planet || { groundColor: '#4a5568', groundAccent: '#2d3748' };
      
      ctx.save();
      
      // Platform shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(this.x + 4, this.y + 4, this.width, this.height);
      
      // Main platform
      const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
      gradient.addColorStop(0, colors.groundColor);
      gradient.addColorStop(1, colors.groundAccent);
      ctx.fillStyle = gradient;
      
      if (this.crumbling) {
        // Shake effect when crumbling
        const shake = Math.sin(this.crumbleTimer * 0.1) * 3;
        ctx.translate(shake, 0);
        ctx.globalAlpha = 1 - (this.crumbleTimer / 1500) * 0.5;
      }
      
      ctx.fillRect(this.x, this.y, this.width, this.height);
      
      // Top edge highlight
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x + this.width, this.y);
      ctx.stroke();
      
      // Bottom edge shadow
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.moveTo(this.x, this.y + this.height);
      ctx.lineTo(this.x + this.width, this.y + this.height);
      ctx.stroke();
      
      // Moving platform indicator
      if (this.type === 'moving') {
        ctx.fillStyle = 'rgba(100, 200, 255, 0.5)';
        ctx.fillRect(this.x + this.width / 2 - 10, this.y + 2, 20, 4);
      }
      
      // Passthrough platform indicator (dashed top)
      if (this.type === 'passthrough') {
        ctx.setLineDash([8, 8]);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + this.width, this.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      
      ctx.restore();
    }

    checkCollision(entity, velocityY) {
      if (this.broken) return null;
      
      const entityBottom = entity.y + entity.size;
      const entityTop = entity.y - entity.size;
      const entityLeft = entity.x - entity.size;
      const entityRight = entity.x + entity.size;
      
      // Check if horizontally aligned
      if (entityRight < this.x || entityLeft > this.x + this.width) {
        return null;
      }
      
      // For passthrough platforms, only collide when falling and from above
      if (this.type === 'passthrough') {
        if (velocityY > 0 && entityBottom >= this.y && entityBottom <= this.y + this.height + 10) {
          return { type: 'top', y: this.y };
        }
        return null;
      }
      
      // Solid platform collision
      // Landing on top
      if (velocityY >= 0 && entityBottom >= this.y && entityBottom <= this.y + this.height) {
        if (this.type === 'crumbling' && !this.crumbling) {
          this.crumbling = true;
        }
        return { type: 'top', y: this.y };
      }
      
      // Hitting bottom
      if (velocityY < 0 && entityTop <= this.y + this.height && entityTop >= this.y) {
        return { type: 'bottom', y: this.y + this.height };
      }
      
      // Side collisions
      if (entityBottom > this.y && entityTop < this.y + this.height) {
        if (entityRight >= this.x && entityLeft < this.x) {
          return { type: 'left', x: this.x };
        }
        if (entityLeft <= this.x + this.width && entityRight > this.x + this.width) {
          return { type: 'right', x: this.x + this.width };
        }
      }
      
      return null;
    }
  }

  // Generate terrain for planetary mode
  const generatePlanetaryTerrain = (planet) => {
    planetaryTerrain = [];
    planetaryPlatforms = [];
    
    if (!planet) return;
    
    const canvasWidth = dom.canvas?.width || window.innerWidth;
    const canvasHeight = dom.canvas?.height || window.innerHeight;
    
    // Ground level at 85% of screen height
    groundLevel = canvasHeight * 0.85;
    
    // Generate terrain points for the ground
    const terrainSegments = 50;
    const segmentWidth = (canvasWidth * 3) / terrainSegments; // Wider world
    
    for (let i = 0; i <= terrainSegments; i++) {
      const x = -canvasWidth + i * segmentWidth;
      let y = groundLevel;
      
      // Add terrain variation based on terrain type using constants
      if (planet.terrainType === 'grassy') {
        y += Math.sin(i * TERRAIN_CONFIG.GRASSY_WAVE_1) * TERRAIN_CONFIG.GRASSY_AMPLITUDE_1 + 
             Math.sin(i * TERRAIN_CONFIG.GRASSY_WAVE_2) * TERRAIN_CONFIG.GRASSY_AMPLITUDE_2;
      } else if (planet.terrainType === 'rocky') {
        y += Math.random() * TERRAIN_CONFIG.ROCKY_VARIATION - TERRAIN_CONFIG.ROCKY_VARIATION / 2;
      } else if (planet.terrainType === 'crater') {
        // Create crater-like depressions
        const craterCenter = terrainSegments / 2;
        const distFromCenter = Math.abs(i - craterCenter);
        y += Math.max(0, TERRAIN_CONFIG.CRATER_DEPTH - distFromCenter * TERRAIN_CONFIG.CRATER_SLOPE);
      } else if (planet.terrainType === 'volcanic') {
        y += Math.sin(i * TERRAIN_CONFIG.VOLCANIC_WAVE) * TERRAIN_CONFIG.VOLCANIC_AMPLITUDE + 
             (Math.random() > 0.9 ? -TERRAIN_CONFIG.CRATER_DEPTH : 0);
      } else if (planet.terrainType === 'icy') {
        y += Math.sin(i * TERRAIN_CONFIG.ICY_WAVE) * TERRAIN_CONFIG.ICY_AMPLITUDE;
      }
      
      planetaryTerrain.push({ x, y });
    }
    
    // Generate platforms
    const platformCount = planet.platformCount || 6;
    
    for (let i = 0; i < platformCount; i++) {
      const x = rand(-canvasWidth * 0.5, canvasWidth * 1.5);
      const y = rand(canvasHeight * TERRAIN_CONFIG.PLATFORM_Y_MIN, canvasHeight * TERRAIN_CONFIG.PLATFORM_Y_MAX);
      const width = rand(TERRAIN_CONFIG.PLATFORM_MIN_WIDTH, TERRAIN_CONFIG.PLATFORM_MAX_WIDTH);
      const height = rand(TERRAIN_CONFIG.PLATFORM_MIN_HEIGHT, TERRAIN_CONFIG.PLATFORM_MAX_HEIGHT);
      
      // Randomly assign platform type
      const typeRoll = Math.random();
      let type = 'solid';
      if (typeRoll < TERRAIN_CONFIG.MOVING_PLATFORM_CHANCE) type = 'moving';
      else if (typeRoll < TERRAIN_CONFIG.PASSTHROUGH_PLATFORM_CHANCE) type = 'passthrough';
      else if (typeRoll < TERRAIN_CONFIG.CRUMBLING_PLATFORM_CHANCE && level > 3) type = 'crumbling';
      
      planetaryPlatforms.push(new Platform(x, y, width, height, type));
    }
    
    // Add some decorative elements based on terrain type
    if (planet.terrainType === 'volcanic' && planet.lavaLevel) {
      // Lava pools stored as special terrain markers
      planetaryTerrain.lavaLevel = canvasHeight * planet.lavaLevel;
    }
  };

  // Draw planetary background and terrain
  const drawPlanetaryBackground = (ctx) => {
    if (!currentPlanet) return;
    
    const canvas = dom.canvas;
    const planet = currentPlanet;
    
    // Draw sky gradient
    const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    planet.skyGradient.forEach((color, i) => {
      skyGradient.addColorStop(i / (planet.skyGradient.length - 1), color);
    });
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw distant mountains/hills (parallax layer)
    ctx.save();
    ctx.translate(-camera.x * 0.2, 0);
    drawDistantTerrain(ctx, planet);
    ctx.restore();
    
    // Draw atmosphere effect
    if (planet.atmosphereColor) {
      ctx.fillStyle = planet.atmosphereColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  };

  // Draw distant terrain for parallax
  const drawDistantTerrain = (ctx, planet) => {
    const canvas = dom.canvas;
    const mountainColor = planet.groundAccent || '#1a1a1a';
    
    ctx.fillStyle = mountainColor;
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.moveTo(-200, canvas.height);
    
    // Generate mountain silhouette
    for (let x = -200; x < canvas.width + 400; x += 60) {
      const height = Math.sin(x * 0.01) * 80 + Math.sin(x * 0.003) * 120 + 200;
      ctx.lineTo(x, canvas.height * 0.6 - height);
    }
    
    ctx.lineTo(canvas.width + 200, canvas.height);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
  };

  // Draw ground terrain
  const drawPlanetaryTerrain = (ctx) => {
    if (!currentPlanet || planetaryTerrain.length < 2) return;
    
    const planet = currentPlanet;
    
    ctx.save();
    
    // Draw main terrain
    const groundGradient = ctx.createLinearGradient(0, groundLevel - 50, 0, groundLevel + 100);
    groundGradient.addColorStop(0, planet.groundColor);
    groundGradient.addColorStop(0.5, planet.groundAccent);
    groundGradient.addColorStop(1, '#000000');
    
    ctx.fillStyle = groundGradient;
    ctx.beginPath();
    ctx.moveTo(planetaryTerrain[0].x, planetaryTerrain[0].y);
    
    for (let i = 1; i < planetaryTerrain.length; i++) {
      ctx.lineTo(planetaryTerrain[i].x, planetaryTerrain[i].y);
    }
    
    ctx.lineTo(planetaryTerrain[planetaryTerrain.length - 1].x, dom.canvas.height + 100);
    ctx.lineTo(planetaryTerrain[0].x, dom.canvas.height + 100);
    ctx.closePath();
    ctx.fill();
    
    // Draw terrain edge highlight
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(planetaryTerrain[0].x, planetaryTerrain[0].y);
    for (let i = 1; i < planetaryTerrain.length; i++) {
      ctx.lineTo(planetaryTerrain[i].x, planetaryTerrain[i].y);
    }
    ctx.stroke();
    
    // Draw lava if volcanic planet
    if (planetaryTerrain.lavaLevel) {
      const lavaY = planetaryTerrain.lavaLevel;
      const lavaGradient = ctx.createLinearGradient(0, lavaY - 20, 0, dom.canvas.height);
      lavaGradient.addColorStop(0, 'rgba(255, 100, 0, 0.8)');
      lavaGradient.addColorStop(0.3, 'rgba(255, 50, 0, 0.9)');
      lavaGradient.addColorStop(1, 'rgba(100, 20, 0, 1)');
      
      ctx.fillStyle = lavaGradient;
      ctx.fillRect(-500, lavaY, dom.canvas.width + 1000, dom.canvas.height - lavaY + 100);
      
      // Lava glow
      ctx.shadowColor = '#ff4400';
      ctx.shadowBlur = 30;
      ctx.fillStyle = 'rgba(255, 150, 0, 0.3)';
      ctx.fillRect(-500, lavaY - 30, dom.canvas.width + 1000, 30);
      ctx.shadowBlur = 0;
    }
    
    // Draw decorative elements based on terrain type
    drawTerrainDecorations(ctx, planet);
    
    ctx.restore();
  };

  // Draw terrain decorations (grass, rocks, crystals, etc.)
  const drawTerrainDecorations = (ctx, planet) => {
    if (planet.terrainType === 'grassy') {
      // Draw grass tufts
      ctx.fillStyle = '#3d7a3d';
      for (let i = 0; i < planetaryTerrain.length - 1; i++) {
        const t = planetaryTerrain[i];
        if (Math.random() < 0.3) {
          for (let j = 0; j < 5; j++) {
            const gx = t.x + Math.random() * 20 - 10;
            const gy = t.y;
            ctx.beginPath();
            ctx.moveTo(gx, gy);
            ctx.lineTo(gx - 3, gy - 15 - Math.random() * 10);
            ctx.lineTo(gx + 3, gy - 12 - Math.random() * 10);
            ctx.closePath();
            ctx.fill();
          }
        }
      }
    } else if (planet.terrainType === 'icy') {
      // Draw ice crystals
      ctx.fillStyle = 'rgba(200, 230, 255, 0.6)';
      for (let i = 0; i < planetaryTerrain.length - 1; i++) {
        const t = planetaryTerrain[i];
        if (Math.random() < 0.15) {
          ctx.beginPath();
          ctx.moveTo(t.x, t.y);
          ctx.lineTo(t.x - 8, t.y - 25);
          ctx.lineTo(t.x + 8, t.y - 25);
          ctx.closePath();
          ctx.fill();
        }
      }
    }
  };

  // Draw platforms
  const drawPlatforms = (ctx) => {
    for (const platform of planetaryPlatforms) {
      platform.draw(ctx, currentPlanet);
    }
  };

  // Apply planetary physics to an entity
  const applyPlanetaryPhysics = (entity, dt) => {
    if (currentGameMode !== 'planetary' || !currentPlanet) return;
    
    const gravity = currentPlanet.gravity || 0.4;
    const maxFallSpeed = GAME_MODES.planetary.maxFallSpeed || 15;
    const friction = currentPlanet.friction || 0.98;
    
    // Apply gravity
    if (!entity.isGrounded) {
      entity.velocityY = (entity.velocityY || 0) + gravity * (dt / 16.67);
      entity.velocityY = Math.min(entity.velocityY, maxFallSpeed);
    }
    
    // Apply velocity
    entity.y += entity.velocityY * (dt / 16.67);
    
    // Apply friction to horizontal movement (on ground)
    if (entity.isGrounded && currentPlanet.friction) {
      entity.velocityX = (entity.velocityX || 0) * friction;
    }
    
    // Check ground collision
    const groundY = getGroundYAt(entity.x);
    if (entity.y + entity.size >= groundY) {
      entity.y = groundY - entity.size;
      entity.velocityY = 0;
      entity.isGrounded = true;
    } else {
      entity.isGrounded = false;
    }
    
    // Check platform collisions
    for (const platform of planetaryPlatforms) {
      const collision = platform.checkCollision(entity, entity.velocityY);
      if (collision) {
        if (collision.type === 'top') {
          entity.y = collision.y - entity.size;
          entity.velocityY = 0;
          entity.isGrounded = true;
        } else if (collision.type === 'bottom') {
          entity.y = collision.y + entity.size;
          entity.velocityY = Math.abs(entity.velocityY) * 0.5;
        } else if (collision.type === 'left') {
          entity.x = collision.x - entity.size;
        } else if (collision.type === 'right') {
          entity.x = collision.x + entity.size;
        }
      }
    }
    
    // Lava damage
    if (planetaryTerrain.lavaLevel && entity.y + entity.size > planetaryTerrain.lavaLevel) {
      if (entity.takeDamage) {
        entity.takeDamage(5 * (dt / 16.67)); // Continuous lava damage
      }
    }
  };

  // Get ground height at a specific x position
  const getGroundYAt = (x) => {
    if (planetaryTerrain.length < 2) return groundLevel;
    
    // Find the terrain segment containing x
    for (let i = 0; i < planetaryTerrain.length - 1; i++) {
      const t1 = planetaryTerrain[i];
      const t2 = planetaryTerrain[i + 1];
      
      if (x >= t1.x && x < t2.x) {
        // Linear interpolation between terrain points
        const t = (x - t1.x) / (t2.x - t1.x);
        return t1.y + (t2.y - t1.y) * t;
      }
    }
    
    return groundLevel;
  };

  // Handle jump for planetary mode
  const handlePlanetaryJump = (entity) => {
    if (currentGameMode !== 'planetary') return false;
    
    const now = performance.now();
    
    // Use timestamp-based cooldown instead of setTimeout
    if (entity.isGrounded && (entity.jumpCooldownEnd === undefined || now >= entity.jumpCooldownEnd)) {
      entity.velocityY = GAME_MODES.planetary.jumpForce;
      entity.isGrounded = false;
      entity.jumpCooldownEnd = now + TERRAIN_CONFIG.JUMP_COOLDOWN_MS;
      
      return true;
    }
    return false;
  };

  // Update platforms
  const updatePlatforms = (dt) => {
    const now = performance.now();
    
    for (let i = planetaryPlatforms.length - 1; i >= 0; i--) {
      const platform = planetaryPlatforms[i];
      platform.update(dt);
      
      // Use timestamp-based respawn instead of setTimeout
      if (platform.broken) {
        if (!platform.respawnTime) {
          platform.respawnTime = now + TERRAIN_CONFIG.PLATFORM_RESPAWN_DELAY;
        } else if (now >= platform.respawnTime) {
          platform.broken = false;
          platform.crumbling = false;
          platform.crumbleTimer = 0;
          platform.respawnTime = null;
        }
      }
    }
  };

  /* ====== ENTITY CLASSES ====== */
  
  // Entity ID counter for 3D tracking
  let entityIdCounter = 0;
  
  class Bullet {
    constructor(x, y, vel, damage, color = '#fde047', speed = BASE.BULLET_SPEED, size = BASE.BULLET_SIZE, pierce = 0, isEnemy = false) {
      this.id = `bullet_${entityIdCounter++}`;
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
      this.rotation = Math.random() * Math.PI * 2; // Phase A.3: Rotating bullets
      this.rotSpeed = 0.15; // Phase A.3: Rotation speed
    }
    draw(ctx) {
      if (this.isEnemy) {
        // Phase A.3: Enhanced enemy bullets with pulsing plasma
        const pulse = Math.sin(this.life / 50) * 0.2 + 1;
        ctx.shadowColor = '#dc2626';
        ctx.shadowBlur = 12 * pulse;
        
        // Outer glow layer
        ctx.fillStyle = 'rgba(220, 38, 38, 0.4)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 1.6 * pulse, 0, Math.PI * 2);
        ctx.fill();
        
        // Main plasma orb
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 1.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // Inner bright core
        ctx.fillStyle = '#fca5a5';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 0.6, 0, Math.PI * 2);
        ctx.fill();
        
        // Energy crackle
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 0.3, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        // Phase A.3: Enhanced player bullets with energy trails
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        
        // Phase A.3: Draw energy trail
        const trailLength = 5;
        for (let i = 0; i < trailLength; i++) {
          const alpha = (trailLength - i) / trailLength * 0.5;
          const trailX = this.x - this.vel.x * i * 2;
          const trailY = this.y - this.vel.y * i * 2;
          ctx.globalAlpha = alpha;
          ctx.fillStyle = this.color;
          ctx.beginPath();
          ctx.arc(trailX, trailY, this.size * (1 - i * 0.15), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        
        // Phase A.3: Rotating bullet with elongated shape
        const angle = Math.atan2(this.vel.y, this.vel.x);
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(angle + this.rotation);
        
        // Outer glow layer
        ctx.fillStyle = this.color;
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.moveTo(this.size * 2.5, 0);
        ctx.lineTo(0, -this.size * 1.3);
        ctx.lineTo(-this.size * 1.2, 0);
        ctx.lineTo(0, this.size * 1.3);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
        
        // Main bullet body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(this.size * 2, 0);
        ctx.lineTo(0, -this.size);
        ctx.lineTo(-this.size, 0);
        ctx.lineTo(0, this.size);
        ctx.closePath();
        ctx.fill();
        
        // Bright energy core
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.ellipse(this.size * 0.3, 0, this.size * 0.8, this.size * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Energy ring
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 0.6, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.restore();
        ctx.shadowBlur = 0;
      }
    }
    update(dt) {
      const step = dt / 16.67;
      this.x += this.vel.x * this.speed * step;
      this.y += this.vel.y * this.speed * step;
      this.life += dt;
      this.rotation += this.rotSpeed * step; // Phase A.3: Rotate bullets
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
    constructor(x, y, kind = 'chaser', isElite = false, isBoss = false) {
      this.id = `enemy_${entityIdCounter++}`;
      this.x = x;
      this.y = y;
      this.kind = kind;
      this.isElite = isElite;
      this.isBoss = isBoss;
      this.rot = 0;
      const diff = getDifficulty();
      const adaptive = getAdaptiveScaling();
      
      // Base size scaling
      const sizeMap = { heavy: 1.45, swarmer: 0.9, drone: 0.75 };
      let baseSize = BASE.ENEMY_SIZE * (sizeMap[kind] || 1);
      if (isElite) baseSize *= ADAPTIVE_CONSTANTS.ELITE_SIZE_MULT;
      if (isBoss) baseSize *= ADAPTIVE_CONSTANTS.BOSS_SIZE_MULT;
      this.size = baseSize;
      
      // Speed scaling with adaptive difficulty and progression
      const speedMap = { heavy: 0.85, swarmer: 1.45, drone: 1.2 };
      let baseSpeed = BASE.ENEMY_SPEED * (speedMap[kind] || 1.05) * diff.enemySpeed;
      baseSpeed *= adaptive.enemySpeedBoost;
      if (isElite) baseSpeed *= ADAPTIVE_CONSTANTS.ELITE_SPEED_MULT;
      if (isBoss) baseSpeed *= ADAPTIVE_CONSTANTS.BOSS_SPEED_MULT; // Bosses are slower but more dangerous
      this.speed = baseSpeed;
      
      // Health scaling with progressive difficulty
      const baseHealth = kind === 'heavy' ? 3 : 1;
      let health = Math.ceil(baseHealth * diff.enemyHealth * adaptive.progressiveHealthBonus);
      if (isElite) health *= ADAPTIVE_CONSTANTS.ELITE_HEALTH_MULT;
      if (isBoss) health *= ADAPTIVE_CONSTANTS.BOSS_BASE_HEALTH_MULT + level * ADAPTIVE_CONSTANTS.BOSS_HEALTH_PER_LEVEL;
      this.health = health;
      this.maxHealth = this.health;
      
      // Damage scaling with adaptive difficulty
      this.baseDamage = BASE.ENEMY_DAMAGE * diff.enemyDamage * adaptive.enemyDamageMultiplier;
      if (isElite) this.baseDamage *= ADAPTIVE_CONSTANTS.ELITE_DAMAGE_MULT;
      if (isBoss) this.baseDamage *= ADAPTIVE_CONSTANTS.BOSS_DAMAGE_MULT;
      
      // Elite/Boss special abilities
      this.shieldPenetration = adaptive.shieldPenetration;
      if (isElite) this.shieldPenetration += ADAPTIVE_CONSTANTS.ELITE_PENETRATION_BONUS;
      if (isBoss) this.shieldPenetration += ADAPTIVE_CONSTANTS.BOSS_PENETRATION_BONUS;
      
      // Can bypass repulse field partially
      this.repulseResistance = 0;
      if (isElite) this.repulseResistance = ADAPTIVE_CONSTANTS.ELITE_REPULSE_RESISTANCE;
      if (isBoss) this.repulseResistance = ADAPTIVE_CONSTANTS.BOSS_REPULSE_RESISTANCE;
      
      // Boss special attack timers
      this.lastSpecialAttack = 0;
      this.specialAttackCooldown = 3000;
      this.attackPhase = 0;
      
      // Shooting capability for ranged enemies - more aggressive at higher levels
      const shootChance = level > ADAPTIVE_CONSTANTS.EASY_LEVELS ? 0.6 : 0.4;
      this.canShoot = isBoss || (isElite && Math.random() < shootChance);
      this.lastShot = 0;
      this.shotCooldown = isBoss ? Math.max(1000, 1500 - level * 30) : Math.max(1500, 2500 - level * 50);
      
      this.animPhase = Math.random() * Math.PI * 2;
      this.hitFlash = 0;
    }
    draw(ctx) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rot);
      
      // Phase A.2: Enhanced animation and visual states
      const pulse = Math.sin(performance.now() / 180 + this.animPhase) * 0.15 + 1;
      const healthPct = this.health / this.maxHealth;
      const damaged = healthPct < 0.5;
      const criticalHealth = healthPct < 0.25;
      
      // Elite/Boss visual indicators
      if (this.isBoss) {
        // Boss aura - pulsing red/purple glow
        ctx.save();
        const bossGlow = Math.sin(performance.now() / 150) * 0.3 + 0.7;
        ctx.globalAlpha = 0.4 * bossGlow;
        ctx.shadowColor = '#dc2626';
        ctx.shadowBlur = 40;
        ctx.fillStyle = '#7c3aed';
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        // Boss health bar above
        ctx.save();
        ctx.rotate(-this.rot); // Keep health bar level
        const barWidth = this.size * 2.5;
        const barHeight = 6;
        const barY = -this.size * 1.8;
        ctx.fillStyle = '#1f2937';
        ctx.fillRect(-barWidth / 2, barY, barWidth, barHeight);
        ctx.fillStyle = healthPct > 0.5 ? '#ef4444' : healthPct > 0.25 ? '#f97316' : '#dc2626';
        ctx.fillRect(-barWidth / 2, barY, barWidth * healthPct, barHeight);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(-barWidth / 2, barY, barWidth, barHeight);
        ctx.restore();
      } else if (this.isElite) {
        // Elite indicator - golden crown-like glow
        ctx.save();
        const eliteGlow = Math.sin(performance.now() / 200) * 0.2 + 0.8;
        ctx.globalAlpha = 0.5 * eliteGlow;
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 1.3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
      
      // Phase A.2: Hit flash effect overlay
      if (this.hitFlash > 0) {
        ctx.globalAlpha = this.hitFlash / 150;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-this.size * 1.5, -this.size * 1.5, this.size * 3, this.size * 3);
        ctx.globalAlpha = 1;
      }
      
      // Phase A.2: Aggro indicator - intensified glow
      const aggroIntensity = 12 + Math.sin(performance.now() / 200) * 6;
      ctx.shadowColor = this.isBoss ? '#7c3aed' : this.isElite ? '#f59e0b' : '#dc2626';
      ctx.shadowBlur = aggroIntensity;
      
      if (this.kind === 'drone') {
        // Phase A.2: Enhanced drone with multi-layer rendering
        // Base layer - darker hull
        ctx.fillStyle = damaged ? '#991b1b' : '#b91c1c';
        ctx.strokeStyle = damaged ? '#dc2626' : '#ef4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.size, 0);
        ctx.lineTo(-this.size * 0.6, -this.size * 0.6);
        ctx.lineTo(-this.size * 0.3, 0);
        ctx.lineTo(-this.size * 0.6, this.size * 0.6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Phase A.2: Glowing energy core
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 10;
        ctx.fillStyle = criticalHealth ? '#fca5a5' : '#fecaca';
        ctx.beginPath();
        ctx.arc(-this.size * 0.1, 0, this.size * 0.3 * pulse, 0, Math.PI * 2);
        ctx.fill();
        
        // Phase A.2: Animated wing thrusters
        ctx.shadowBlur = 6;
        const thrusterGlow = Math.sin(performance.now() / 100) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(251, 113, 133, ${thrusterGlow})`;
        ctx.beginPath();
        ctx.arc(-this.size * 0.4, -this.size * 0.4, this.size * 0.15, 0, Math.PI * 2);
        ctx.arc(-this.size * 0.4, this.size * 0.4, this.size * 0.15, 0, Math.PI * 2);
        ctx.fill();
        
      } else if (this.kind === 'chaser') {
        // Phase A.2: Enhanced alien organic creature with animated parts
        // Base body layer - darker when damaged
        ctx.fillStyle = damaged ? '#701a75' : '#a21caf';
        ctx.strokeStyle = damaged ? '#c026d3' : '#e879f9';
        ctx.lineWidth = 2;
        
        // Phase A.2: Animated body segments
        const bodyPulse = Math.sin(performance.now() / 200 + this.animPhase) * 0.1 + 1;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.size * 1.2 * bodyPulse, this.size * 0.8 * pulse, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Phase A.2: Armor plates overlay
        if (!criticalHealth) {
          ctx.strokeStyle = '#f0abfc';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.ellipse(0, 0, this.size * 0.9, this.size * 0.6, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
        
        // Phase A.2: Animated mandibles/claws with wave motion
        ctx.strokeStyle = '#d946ef';
        ctx.lineWidth = 3;
        const clawWave = Math.sin(performance.now() / 150) * 0.2;
        ctx.beginPath();
        ctx.moveTo(this.size * 0.8, -this.size * 0.5);
        ctx.lineTo(this.size * (1.4 + clawWave), -this.size * (0.8 + clawWave));
        ctx.moveTo(this.size * 0.8, this.size * 0.5);
        ctx.lineTo(this.size * (1.4 + clawWave), this.size * (0.8 + clawWave));
        ctx.stroke();
        
        // Phase A.2: Pulsing weak point eyes (glowing targets)
        ctx.shadowColor = criticalHealth ? '#fca5a5' : '#ef4444';
        ctx.shadowBlur = 8 + Math.sin(performance.now() / 150) * 4;
        ctx.fillStyle = criticalHealth ? '#fca5a5' : '#ef4444';
        ctx.beginPath();
        ctx.arc(this.size * 0.3, -this.size * 0.3, this.size * 0.2 * pulse, 0, Math.PI * 2);
        ctx.arc(this.size * 0.3, this.size * 0.3, this.size * 0.2 * pulse, 0, Math.PI * 2);
        ctx.fill();
        
        // Phase A.2: Animated pupils tracking
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#dc2626';
        const pupilOffset = Math.sin(performance.now() / 300) * 0.05;
        ctx.beginPath();
        ctx.arc(this.size * (0.35 + pupilOffset), -this.size * 0.3, this.size * 0.1, 0, Math.PI * 2);
        ctx.arc(this.size * (0.35 + pupilOffset), this.size * 0.3, this.size * 0.1, 0, Math.PI * 2);
        ctx.fill();
        
      } else if (this.kind === 'heavy') {
        // Phase A.2: Enhanced heavy tank with rotating core and damage
        // Outer armor layer - shows cracks when damaged
        ctx.fillStyle = damaged ? '#14532d' : '#15803d';
        ctx.strokeStyle = damaged ? '#22c55e' : '#86efac';
        ctx.lineWidth = 3;
        
        // Phase A.2: Central crystal body with facets
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
        
        // Phase A.2: Damage visualization - cracks
        if (damaged) {
          ctx.strokeStyle = '#052e16';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(this.size * 0.6, -this.size * 0.4);
          ctx.lineTo(this.size * 0.2, this.size * 0.3);
          ctx.moveTo(-this.size * 0.5, -this.size * 0.3);
          ctx.lineTo(-this.size * 0.7, this.size * 0.2);
          ctx.stroke();
        }
        
        // Phase A.2: Rotating inner crystal facets
        const rotation = performance.now() / 1000;
        ctx.strokeStyle = '#4ade80';
        ctx.lineWidth = 2;
        ctx.save();
        ctx.rotate(rotation);
        ctx.beginPath();
        ctx.moveTo(this.size * 0.4, -this.size * 0.6);
        ctx.lineTo(-this.size * 0.4, -this.size * 0.4);
        ctx.lineTo(-this.size * 0.4, this.size * 0.4);
        ctx.lineTo(this.size * 0.4, this.size * 0.6);
        ctx.stroke();
        ctx.restore();
        
        // Phase A.2: Pulsing energy core (weak point)
        const coreGlow = 12 + Math.sin(performance.now() / 120) * 6;
        ctx.fillStyle = criticalHealth ? '#fca5a5' : '#ef4444';
        ctx.shadowColor = '#dc2626';
        ctx.shadowBlur = coreGlow;
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 0.35 * pulse, 0, Math.PI * 2);
        ctx.fill();
        
        // Phase A.2: Inner core ring
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 0.2, 0, Math.PI * 2);
        ctx.stroke();
        
      } else {
        // Phase A.2: Enhanced swarmer with layered bio-energy
        // Outer membrane layer
        ctx.fillStyle = damaged ? '#9a3412' : '#ea580c';
        ctx.strokeStyle = damaged ? '#fb923c' : '#fdba74';
        ctx.lineWidth = 2;
        
        // Phase A.2: Animated amoeba-like body with complex wobble
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
        
        // Phase A.2: Inner energy layer
        ctx.fillStyle = 'rgba(251, 146, 60, 0.5)';
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2 + performance.now() / 500;
          const wobble = Math.sin(performance.now() / 150 + i) * 0.15 + 0.85;
          const r = this.size * 0.6 * wobble;
          const x = Math.cos(angle) * r;
          const y = Math.sin(angle) * r;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        
        // Phase A.2: Pulsing nucleus spots (weak points)
        ctx.fillStyle = criticalHealth ? '#fca5a5' : '#ef4444';
        ctx.shadowColor = '#dc2626';
        ctx.shadowBlur = 8 + Math.sin(performance.now() / 100) * 4;
        ctx.beginPath();
        ctx.arc(-this.size * 0.2, -this.size * 0.15, this.size * 0.2 * pulse, 0, Math.PI * 2);
        ctx.arc(this.size * 0.1, this.size * 0.2, this.size * 0.15 * pulse, 0, Math.PI * 2);
        ctx.fill();
        
        // Phase A.2: Animated waving tendrils
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#fdba74';
        ctx.lineWidth = 2.5;
        for (let i = 0; i < 4; i++) {
          const a = (i * Math.PI) / 2;
          const wave = Math.sin(performance.now() / 150 + i) * 0.3 + 0.7;
          const bend = Math.sin(performance.now() / 100 + i) * 0.15;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * this.size * 0.6, Math.sin(a) * this.size * 0.6);
          const midX = Math.cos(a + bend) * this.size * (0.8 + wave * 0.5);
          const midY = Math.sin(a + bend) * this.size * (0.8 + wave * 0.5);
          const endX = Math.cos(a) * this.size * (1 + wave);
          const endY = Math.sin(a) * this.size * (1 + wave);
          ctx.quadraticCurveTo(midX, midY, endX, endY);
          ctx.stroke();
        }
      }
      ctx.shadowBlur = 0;
      ctx.restore();
    }
    update(dt) {
      // Phase A.2: Update hit flash timer
      if (this.hitFlash > 0) this.hitFlash -= dt;
      
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
      
      // Ranged attacks for elite and boss enemies
      const now = performance.now();
      if (this.canShoot && player && now - this.lastShot > this.shotCooldown) {
        const shootDist = this.isBoss ? 400 : 250;
        if (dist < shootDist && dist > this.size * 2) {
          this.shootAtPlayer();
          this.lastShot = now;
        }
      }
      
      // Boss special attacks
      if (this.isBoss && now - this.lastSpecialAttack > this.specialAttackCooldown) {
        this.performSpecialAttack(now);
      }
    }
    
    shootAtPlayer() {
      if (!player) return;
      const dx = player.x - this.x;
      const dy = player.y - this.y;
      const dist = Math.hypot(dx, dy) || 1;
      const vel = { x: dx / dist, y: dy / dist };
      const damage = this.baseDamage * ADAPTIVE_CONSTANTS.RANGED_DAMAGE_MULT;
      const speed = this.isBoss 
        ? BASE.BULLET_SPEED * ADAPTIVE_CONSTANTS.BOSS_BULLET_SPEED_MULT 
        : BASE.BULLET_SPEED * ADAPTIVE_CONSTANTS.ELITE_BULLET_SPEED_MULT;
      const size = this.isBoss ? BASE.BULLET_SIZE * 1.5 : BASE.BULLET_SIZE * 1.2;
      bullets.push(new Bullet(this.x, this.y, vel, damage, '#dc2626', speed, size, 0, true));
      addParticles('muzzle', this.x, this.y, this.rot, 4);
    }
    
    performSpecialAttack(now) {
      if (!player) return;
      this.lastSpecialAttack = now;
      this.attackPhase = (this.attackPhase + 1) % 3;
      
      switch (this.attackPhase) {
        case 0: // Radial burst - fires in all directions
          for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const vel = { x: Math.cos(angle), y: Math.sin(angle) };
            const damage = this.baseDamage * 0.4;
            bullets.push(new Bullet(this.x, this.y, vel, damage, '#7c3aed', BASE.BULLET_SPEED * 0.5, BASE.BULLET_SIZE * 1.3, 0, true));
          }
          addParticles('nova', this.x, this.y, 0, 20);
          shakeScreen(5, 150);
          addLogEntry('⚠️ Boss radial burst!', '#f97316');
          break;
          
        case 1: { // Charge attack - dash towards player
          const dx = player.x - this.x;
          const dy = player.y - this.y;
          const dist = Math.hypot(dx, dy) || 1;
          this.x += (dx / dist) * 80;
          this.y += (dy / dist) * 80;
          addParticles('sparks', this.x, this.y, 0, 15);
          shakeScreen(8, 200);
          addLogEntry('⚠️ Boss charge attack!', '#ef4444');
          break;
        }
          
        case 2: // Summon minions
          for (let i = 0; i < 3; i++) {
            const angle = rand(0, Math.PI * 2);
            const spawnDist = this.size * 2 + rand(20, 50);
            const sx = this.x + Math.cos(angle) * spawnDist;
            const sy = this.y + Math.sin(angle) * spawnDist;
            enemies.push(new Enemy(sx, sy, 'swarmer', false, false));
          }
          addParticles('levelup', this.x, this.y, 0, 25);
          addLogEntry('⚠️ Boss summoned minions!', '#a855f7');
          break;
      }
    }
    
    // Get the actual damage this enemy deals (with penetration calculations)
    getDamage() {
      return this.baseDamage || BASE.ENEMY_DAMAGE;
    }
  }

  class Coin {
    constructor(x, y) {
      this.id = `coin_${entityIdCounter++}`;
      this.x = x;
      this.y = y;
      this.r = BASE.COIN_SIZE;
      this.size = BASE.COIN_SIZE; // Add size property for 3D system
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
    constructor(isInitial = false) {
      this.resetPosition();
      const now = performance.now();
      this.last = isInitial ? now + rand(BASE.INITIAL_SPAWN_DELAY_MIN, BASE.INITIAL_SPAWN_DELAY_MAX) : now;
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
      const adaptive = getAdaptiveScaling();
      const waveType = WAVE_TYPES[currentWaveType] || WAVE_TYPES.standard;
      
      // Determine enemy type
      const roll = Math.random();
      const kind = roll < 0.15 ? 'heavy' : roll < 0.35 ? 'swarmer' : roll < 0.55 ? 'chaser' : 'drone';
      
      // Determine if enemy is elite based on adaptive difficulty
      let eliteChance = adaptive.eliteChance;
      if (waveType.eliteBoost) eliteChance *= waveType.eliteBoost;
      const isElite = Math.random() < eliteChance;
      
      const dir = Math.atan2(player.y - this.y, player.x - this.x);
      const dist = 70;
      const jitter = rand(-40, 40);
      const x = this.x + Math.cos(dir) * dist + Math.cos(dir + Math.PI / 2) * jitter;
      const y = this.y + Math.sin(dir) * dist + Math.sin(dir + Math.PI / 2) * jitter;
      enemies.push(new Enemy(x, y, kind, isElite, false));
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
    const diff = getDifficulty();
    
    // Early levels have slower spawns, then ramps up
    let levelReduction;
    if (level <= ADAPTIVE_CONSTANTS.EASY_LEVELS) {
      // Early game: gentle spawn rate (60ms reduction per level)
      levelReduction = level * 60;
    } else if (level <= ADAPTIVE_CONSTANTS.LATE_GAME_START) {
      // Mid game: standard spawn rate increase (100ms per level after easy)
      levelReduction = ADAPTIVE_CONSTANTS.EASY_LEVELS * 60 + (level - ADAPTIVE_CONSTANTS.EASY_LEVELS) * 100;
    } else {
      // Late game: aggressive spawn rate (140ms per level after mid)
      levelReduction = ADAPTIVE_CONSTANTS.EASY_LEVELS * 60 + 
        (ADAPTIVE_CONSTANTS.LATE_GAME_START - ADAPTIVE_CONSTANTS.EASY_LEVELS) * 100 + 
        (level - ADAPTIVE_CONSTANTS.LATE_GAME_START) * 140;
    }
    
    const base = BASE.SPAWNER_RATE_MS - levelReduction + Math.random() * 300;
    const withDifficulty = base / diff.enemySpawnRate;
    // Progressive scaling makes minimum spawn time lower at higher levels
    const minSpawnTime = level > ADAPTIVE_CONSTANTS.LATE_GAME_START ? 300 : 400;
    return Math.max(minSpawnTime, withDifficulty);
  };

  const createSpawners = (count, isInitial = false) => {
    spawners = [];
    const diff = getDifficulty();
    // More spawners at higher progression levels
    let adjustedCount = Math.max(1, Math.round(count * diff.spawnerCount));
    if (level > ADAPTIVE_CONSTANTS.LATE_GAME_START) {
      adjustedCount = Math.ceil(adjustedCount * 1.2); // 20% more spawners in late game
    }
    for (let i = 0; i < adjustedCount; i++) spawners.push(new Spawner(isInitial));
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
      // Charge ability state
      this.chargeActiveUntil = 0;
      this.chargeDamage = 0;
      this.chargeSpeedMult = 1;
      this.chargeInvulnerable = false;
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
      const adaptive = getAdaptiveScaling();
      
      // Apply diminishing returns at high power levels
      const effectiveness = adaptive.powerEffectiveness;
      
      // Fire rate: diminishing returns on very fast fire rates
      const fireBase = clamp(140 - L('firerate') * 18 * effectiveness, 55, 999) * shipStat('fireRate', 1);
      
      // HP: full benefit (survivability shouldn't be nerfed too hard)
      const hpBase = (BASE.PLAYER_HEALTH + L('shield') * 22) * shipStat('hp', 1);
      
      // Pickup and ammo regen: slight effectiveness reduction
      const pickupBase = (26 + L('magnet') * 14 * effectiveness) * shipStat('pickup', 1);
      const ammoRegenBase = clamp((BASE.AMMO_REGEN_MS - L('ammo') * 120 * effectiveness) * shipStat('ammoRegen', 1), 280, 2200);
      
      // Speed bonuses: keep full benefit for mobility
      const baseSpeed = BASE.PLAYER_SPEED * shipStat('speed', 1);
      const boostSpeed = (BASE.PLAYER_BOOST_SPEED + L('boost') * 0.9) * shipStat('boost', shipStat('speed', 1));
      
      // Damage and regen: apply effectiveness modifier
      const damageMultiplier = (1 + L('damage') * 0.6 * effectiveness);
      const regenAmount = L('regen') * 3 * effectiveness;
      
      // Repulse field: reduced by both effectiveness and adaptive scaling
      const repulseBase = L('field') > 0 ? 2 + L('field') * 0.8 : 0;
      const repulseEffective = repulseBase * adaptive.repulseEffectiveness;
      
      return {
        fireCD: clamp(fireBase * (weaponStats.cd || 1), 35, 999),
        dmg: damageMultiplier * shipStat('damage', 1) * (weaponStats.damage || 1),
        multishot: 1 + L('multi') + (weaponStats.shots || 0),
        hpMax: hpBase,
        hpRegen5: regenAmount,
        repulse: repulseEffective,
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
      
      const now = performance.now();
      const healthPct = this.health / this.hpMax;
      const isBoosting = input.isBoosting;
      const isLowHealth = healthPct < 0.3;
      
      // Phase A: Enhanced engine trails
      const thrusterDist = this.size * (this.engineOffset || 1.1);
      if (isBoosting) {
        // Boost afterburner - multiple particles
        if (Math.random() < 0.8) {
          addParticles('thruster', this.x - Math.cos(this.lookAngle) * thrusterDist, this.y - Math.sin(this.lookAngle) * thrusterDist, 0, 3, this.thrusterColor);
        }
        // Boost glow effect
        ctx.save();
        ctx.globalAlpha = 0.4 + Math.sin(now / 50) * 0.2;
        ctx.shadowColor = this.thrusterColor;
        ctx.shadowBlur = 30;
        ctx.fillStyle = this.thrusterColor;
        ctx.beginPath();
        ctx.arc(-this.size * 1.1, 0, this.size * 0.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (chance(0.3)) {
        addParticles('thruster', this.x - Math.cos(this.lookAngle) * thrusterDist, this.y - Math.sin(this.lookAngle) * thrusterDist, 0, 1, this.thrusterColor);
      }
      
      // Phase A: Draw ship with enhancements
      drawShip(ctx, currentShip?.id || Save.data.selectedShip, this.size, {
        healthPct,
        isBoosting,
        isDefenseActive: this.isDefenseActive(now),
        time: now
      });
      
      // Phase A: Shield bubble effect and charge glow
      const glow = Math.max(0, (this.invEnd - now) / BASE.INVULN_MS);
      const isCharging = now < this.chargeActiveUntil;
      
      if (glow > 0 || this.flash || this.isDefenseActive(now) || isCharging) {
        ctx.save();
        
        if (isCharging) {
          // Charging effect - golden/yellow aggressive aura
          ctx.globalAlpha = 0.6 + Math.sin(now / 40) * 0.3;
          ctx.strokeStyle = '#eab308';
          ctx.fillStyle = '#eab308';
          ctx.lineWidth = 4;
          ctx.shadowColor = '#fbbf24';
          ctx.shadowBlur = 25;
          
          // Multiple expanding rings for speed effect
          for (let i = 0; i < 3; i++) {
            const offset = (now / 60 + i * 0.3) % 1;
            ctx.globalAlpha = (1 - offset) * 0.5;
            ctx.beginPath();
            ctx.arc(0, 0, this.size * (1.2 + offset * 0.5), 0, Math.PI * 2);
            ctx.stroke();
          }
          
          // Speed lines behind ship
          ctx.globalAlpha = 0.7;
          ctx.lineWidth = 2;
          for (let i = 0; i < 5; i++) {
            const lineOffset = -this.size * (1.5 + i * 0.3);
            ctx.beginPath();
            ctx.moveTo(lineOffset, -this.size * 0.3 + i * this.size * 0.15);
            ctx.lineTo(lineOffset - this.size * 0.5, -this.size * 0.3 + i * this.size * 0.15);
            ctx.stroke();
          }
        } else if (this.isDefenseActive(now)) {
          // Hexagonal shield pattern
          ctx.globalAlpha = 0.5 + Math.sin(now / 100) * 0.2;
          ctx.strokeStyle = this.defenseStats?.color || '#a855f7';
          ctx.lineWidth = 3;
          const hexRadius = this.size * 1.4;
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const x = Math.cos(angle) * hexRadius;
            const y = Math.sin(angle) * hexRadius;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.stroke();
          
          // Inner hexagon glow
          ctx.globalAlpha = 0.3;
          ctx.shadowColor = this.defenseStats?.color || '#a855f7';
          ctx.shadowBlur = 15;
          ctx.stroke();
        } else {
          // Invulnerability glow
          ctx.globalAlpha = glow > 0 ? 0.8 : 0.35;
          ctx.strokeStyle = glow > 0 ? '#93c5fd' : '#e5e7eb';
          ctx.lineWidth = glow > 0 ? 4 : 2;
          ctx.shadowColor = glow > 0 ? '#60a5fa' : '#94a3b8';
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(0, 0, this.size * 1.2, 0, Math.PI * 2);
          ctx.stroke();
        }
        
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
        this.flash = false;
        ctx.restore();
      }
      
      // Phase A: Low health warning
      if (isLowHealth) {
        ctx.save();
        const pulse = Math.sin(now / 150) * 0.5 + 0.5;
        ctx.globalAlpha = 0.3 * pulse;
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#dc2626';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 1.3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
      
      ctx.restore();
    }

    update(dt) {
      const stats = this.#dynamicStats();
      const now = performance.now();
      const isCharging = now < this.chargeActiveUntil;
      let spd = input.isBoosting ? stats.boost : stats.speed;
      if (isCharging) {
        spd *= this.chargeSpeedMult;
      }
      const moveMag = Math.hypot(input.moveX, input.moveY);
      let moving = false;
      
      // Planetary mode: Different movement handling with gravity
      if (currentGameMode === 'planetary' && currentPlanet) {
        // Initialize velocity properties if needed
        if (this.velocityY === undefined) this.velocityY = 0;
        if (this.isGrounded === undefined) this.isGrounded = false;
        if (this.canJump === undefined) this.canJump = true;
        
        // Horizontal movement (left/right)
        if (Math.abs(input.moveX) > 0.01) {
          const nx = input.moveX > 0 ? 1 : -1;
          const step = spd * (dt / 16.67);
          this.x += nx * step;
          this.vel.x = nx;
          moving = true;
        } else {
          this.vel.x = 0;
        }
        
        // Jump with up input or boost
        if ((input.moveY < -0.3 || input.isBoosting) && this.isGrounded && this.canJump) {
          handlePlanetaryJump(this);
        }
        
        // Apply planetary physics (gravity, platform collisions)
        applyPlanetaryPhysics(this, dt);
        
        // Keep vel.y synced for aiming purposes
        this.vel.y = this.velocityY > 0 ? 1 : (this.velocityY < 0 ? -1 : 0);
      } else {
        // Space mode: Original twin-stick movement
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
        const adaptive = getAdaptiveScaling();
        const repulseEffectiveness = adaptive.repulseEffectiveness;
        for (const enemy of enemies) {
          const dx = enemy.x - this.x;
          const dy = enemy.y - this.y;
          const dist = Math.hypot(dx, dy);
          if (dist < this.size + 18 + stats.pickupR * 0.4) {
            const nx = dx / (dist || 1);
            const ny = dy / (dist || 1);
            // Apply repulse resistance - elite/boss enemies resist the push
            const resistance = enemy.repulseResistance || 0;
            const effectiveKnock = knock * repulseEffectiveness * (1 - resistance);
            enemy.x += nx * effectiveKnock;
            enemy.y += ny * effectiveKnock;
          }
        }
      }
      
      // Automatic defense activation when enemies get close
      const defenseRange = this.size + 100;
      let enemyNearby = false;
      for (const enemy of enemies) {
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

      if (input.altFireHeld && !this.secondaryLatch) {
        if (this.trySecondary(now)) input.altFireHeld = false;
        this.secondaryLatch = true;
      } else if (!input.altFireHeld) {
        this.secondaryLatch = false;
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
      
      // Play shooting sound based on weapon type
      if (typeof AudioManager !== 'undefined') {
        const weaponId = this.primary?.id || 'pulse';
        if (weaponId === 'scatter') {
          AudioManager.playScatterShoot();
        } else if (weaponId === 'rail') {
          AudioManager.playRailShoot();
        } else {
          AudioManager.playShoot();
        }
      }
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
      
      // Play secondary weapon sound
      if (typeof AudioManager !== 'undefined') {
        AudioManager.playSecondary();
      }
      
      // Handle different secondary weapon types
      if (this.secondary.id === 'charge') {
        // Ramming Charge: high speed, collision damage, invulnerable
        this.chargeActiveUntil = now + (stats.duration || 2500);
        this.chargeDamage = stats.damage || 45;
        this.chargeSpeedMult = stats.speedMult || 3.5;
        this.chargeInvulnerable = stats.invulnerable || true;
        addParticles('boost', this.x, this.y, 0, 32);
        shakeScreen(5, 180);
        addLogEntry('⚡ RAMMING CHARGE!', '#eab308');
      } else if (this.secondary.id === 'reinforcement') {
        // Orbital Strike: missiles from off-screen
        const targetX = originX;
        const targetY = originY;
        const missiles = stats.missiles || 5;
        const delay = stats.delay || 800;
        
        addParticles('nova', targetX, targetY, 0, 16);
        shakeScreen(4, 150);
        addLogEntry('📡 ORBITAL STRIKE CALLED!', '#dc2626');
        
        for (let i = 0; i < missiles; i++) {
          queueTimedEffect(delay + i * 220, () => {
            // Missiles come from random positions off-screen above
            const missileStartX = targetX + rand(-300, 300);
            const missileStartY = targetY - 800;
            const missileTargetX = targetX + rand(-60, 60);
            const missileTargetY = targetY + rand(-60, 60);
            
            // Create missile trail effect
            addParticles('boost', missileStartX, missileStartY, 0, 8);
            
            // Delayed impact
            queueTimedEffect(400, () => {
              addParticles('nova', missileTargetX, missileTargetY, 0, 24);
              applyRadialDamage(missileTargetX, missileTargetY, stats.radius || 120, stats.damage || 90, { knockback: 5, chargeMult: 0.7 });
              shakeScreen(6, 140);
            });
          });
        }
      } else if (this.secondary.id === 'cluster') {
        addParticles('nova', originX, originY, 0, 24);
        shakeScreen(7, 220);
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
        // Default secondary weapon behavior (nova, seeker, gravity, etc.)
        addParticles('nova', originX, originY, 0, 24);
        shakeScreen(7, 220);
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
      
      // Play shield activation sound
      if (typeof AudioManager !== 'undefined') {
        AudioManager.playShield();
      }
      
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
      
      // Play ultimate sound
      if (typeof AudioManager !== 'undefined') {
        AudioManager.playUltimate();
      }
      
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
      
      // Play supply pickup sound
      if (typeof AudioManager !== 'undefined') {
        AudioManager.playSupplyPickup();
      }
    }

    takeDamage(amount, source = null) {
      const now = performance.now();
      if (now < this.invEnd) return;
      
      // Check if charging with invulnerability
      const isCharging = now < this.chargeActiveUntil;
      if (isCharging && this.chargeInvulnerable) return;
      
      // Calculate shield penetration from enemy source using optional chaining
      const penetration = source?.shieldPenetration ?? 0;
      
      if (this.isDefenseActive(now)) {
        const absorb = this.defenseStats.absorb || 0;
        // Penetration bypasses a portion of shield absorption
        const effectiveAbsorb = absorb * (1 - penetration);
        const mitigated = amount * effectiveAbsorb;
        const penetratedDamage = amount * penetration;
        amount = Math.max(0, amount - mitigated);
        
        // Show penetration warning if significant
        if (penetration > 0.1 && penetratedDamage > 0) {
          addLogEntry('⚠️ Shield penetrated!', '#f97316');
        }
        
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
      
      // Play player damage sound
      if (typeof AudioManager !== 'undefined') {
        AudioManager.playPlayerDamage();
      }
      
      // Phase 1: Show damage taken
      spawnDamageNumber(this.x, this.y - this.size, amount, true);
      
      // Phase 1: Reset combo on taking damage
      if (comboCount >= 3) {
        addLogEntry(`Combo broken! (${comboCount}x)`, '#ef4444');
        comboCount = 0;
      }
      
      if (this.health <= 0) {
        this.health = 0;
        gameRunning = false;
      }
    }
  }

  const drawShip = (ctx, shipId, size, state = {}) => {
    const template = getShipTemplate(shipId) || SHIP_TEMPLATES[0];
    const colors = template.colors || {};
    const primary = colors.primary || '#0ea5e9';
    const trim = colors.trim || '#ffffff';
    const accent = colors.accent || trim;
    const canopy = colors.canopy || '#7dd3fc';
    const thruster = colors.thruster || '#f97316';
    const shape = template.shape || 'spear';
    const now = state.time || performance.now();
    const healthPct = state.healthPct || 1;
    const isBoosting = state.isBoosting || false;
    const isDefenseActive = state.isDefenseActive || false;
    
    // Damage visualization
    const damageLevel = 1 - healthPct;
    const isDamaged = healthPct < 0.7;
    
    // Helper to darken colors for shadows/depth
    const darken = (color, amt = 0.3) => {
      const hex = color.replace('#', '');
      const r = Math.max(0, parseInt(hex.slice(0, 2), 16) * (1 - amt));
      const g = Math.max(0, parseInt(hex.slice(2, 4), 16) * (1 - amt));
      const b = Math.max(0, parseInt(hex.slice(4, 6), 16) * (1 - amt));
      return `rgb(${Math.floor(r)},${Math.floor(g)},${Math.floor(b)})`;
    };
    
    // Ship-specific detailed rendering
    if (shape === 'spear') {
      // VANGUARD MK.I - Classic fighter jet inspired design
      // Twin-engine strike craft with swept wings and central fuselage
      
      // Boost/defense glow effect
      if (isBoosting || isDefenseActive) {
        ctx.save();
        ctx.globalAlpha = 0.35;
        ctx.shadowColor = isBoosting ? thruster : primary;
        ctx.shadowBlur = 30;
        ctx.fillStyle = isBoosting ? thruster : primary;
        ctx.beginPath();
        ctx.moveTo(size * 1.3, 0);
        ctx.lineTo(size * 0.2, -size * 0.25);
        ctx.lineTo(-size * 0.3, -size * 0.9);
        ctx.lineTo(-size * 0.9, -size * 0.7);
        ctx.lineTo(-size * 0.7, -size * 0.2);
        ctx.lineTo(-size * 0.9, 0);
        ctx.lineTo(-size * 0.7, size * 0.2);
        ctx.lineTo(-size * 0.9, size * 0.7);
        ctx.lineTo(-size * 0.3, size * 0.9);
        ctx.lineTo(size * 0.2, size * 0.25);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      
      // Main swept wings (bottom layer) - ENHANCED: wider and more aggressive
      ctx.fillStyle = darken(primary, 0.2);
      ctx.beginPath();
      ctx.moveTo(-size * 0.05, -size * 0.35);
      ctx.lineTo(-size * 0.3, -size * 1.3);
      ctx.lineTo(-size * 0.9, -size * 1.05);
      ctx.lineTo(-size * 0.6, -size * 0.3);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-size * 0.05, size * 0.35);
      ctx.lineTo(-size * 0.3, size * 1.3);
      ctx.lineTo(-size * 0.9, size * 1.05);
      ctx.lineTo(-size * 0.6, size * 0.3);
      ctx.closePath();
      ctx.fill();
      
      // Wing tip weapons pods - ENHANCED: larger and more detailed with realistic touches
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.ellipse(-size * 0.45, -size * 1.15, size * 0.15, size * 0.08, -0.3, 0, Math.PI * 2);
      ctx.ellipse(-size * 0.45, size * 1.15, size * 0.15, size * 0.08, 0.3, 0, Math.PI * 2);
      ctx.fill();
      
      // Weapon pod details and highlights
      ctx.fillStyle = darken(accent, 0.3);
      ctx.beginPath();
      ctx.ellipse(-size * 0.55, -size * 1.15, size * 0.06, size * 0.04, -0.3, 0, Math.PI * 2);
      ctx.ellipse(-size * 0.55, size * 1.15, size * 0.06, size * 0.04, 0.3, 0, Math.PI * 2);
      ctx.fill();
      
      // Weapon pod highlights for realism
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = size * 0.015;
      ctx.beginPath();
      ctx.arc(-size * 0.42, -size * 1.18, size * 0.08, Math.PI * 0.5, Math.PI * 1.2);
      ctx.arc(-size * 0.42, size * 1.18, size * 0.08, -Math.PI * 1.2, -Math.PI * 0.5);
      ctx.stroke();
      
      // Engine nacelles on wings - ENHANCED: bigger and more prominent with realistic shading
      ctx.fillStyle = darken(primary, 0.35);
      ctx.beginPath();
      ctx.ellipse(-size * 0.7, -size * 0.75, size * 0.22, size * 0.12, -0.2, 0, Math.PI * 2);
      ctx.ellipse(-size * 0.7, size * 0.75, size * 0.22, size * 0.12, 0.2, 0, Math.PI * 2);
      ctx.fill();
      
      // Engine intake details with depth
      ctx.fillStyle = darken(primary, 0.5);
      ctx.beginPath();
      ctx.ellipse(-size * 0.65, -size * 0.75, size * 0.1, size * 0.06, -0.2, 0, Math.PI * 2);
      ctx.ellipse(-size * 0.65, size * 0.75, size * 0.1, size * 0.06, 0.2, 0, Math.PI * 2);
      ctx.fill();
      
      // Engine nacelle highlights for realistic shine
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.beginPath();
      ctx.ellipse(-size * 0.75, -size * 0.78, size * 0.08, size * 0.04, -0.2, Math.PI, Math.PI * 1.8);
      ctx.ellipse(-size * 0.75, size * 0.78, size * 0.08, size * 0.04, 0.2, -Math.PI * 1.8, -Math.PI);
      ctx.fill();
      
      // Main fuselage body - ENHANCED: wider and more substantial
      ctx.fillStyle = primary;
      ctx.strokeStyle = trim;
      ctx.lineWidth = Math.max(2, size * 0.1);
      ctx.shadowColor = primary;
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.moveTo(size * 1.3, 0);
      ctx.quadraticCurveTo(size * 0.8, -size * 0.25, size * 0.3, -size * 0.35);
      ctx.lineTo(-size * 0.5, -size * 0.32);
      ctx.lineTo(-size * 0.75, -size * 0.22);
      ctx.lineTo(-size * 0.85, 0);
      ctx.lineTo(-size * 0.75, size * 0.22);
      ctx.lineTo(-size * 0.5, size * 0.32);
      ctx.lineTo(size * 0.3, size * 0.35);
      ctx.quadraticCurveTo(size * 0.8, size * 0.25, size * 1.3, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;
      
      // Dorsal ridge/spine detail - ENHANCED: thicker and more prominent
      ctx.strokeStyle = accent;
      ctx.lineWidth = size * 0.08;
      ctx.beginPath();
      ctx.moveTo(size * 0.9, 0);
      ctx.lineTo(-size * 0.6, 0);
      ctx.stroke();
      
      // Additional surface detailing
      ctx.strokeStyle = darken(accent, 0.3);
      ctx.lineWidth = size * 0.04;
      ctx.beginPath();
      ctx.moveTo(size * 0.7, -size * 0.08);
      ctx.lineTo(-size * 0.4, -size * 0.08);
      ctx.moveTo(size * 0.7, size * 0.08);
      ctx.lineTo(-size * 0.4, size * 0.08);
      ctx.stroke();
      
      // Panel lines - ENHANCED: more detailed panel work with highlights
      ctx.strokeStyle = darken(primary, 0.25);
      ctx.lineWidth = size * 0.025;
      ctx.beginPath();
      ctx.moveTo(size * 0.5, -size * 0.28);
      ctx.lineTo(size * 0.1, -size * 0.32);
      ctx.moveTo(size * 0.5, size * 0.28);
      ctx.lineTo(size * 0.1, size * 0.32);
      ctx.moveTo(-size * 0.2, -size * 0.25);
      ctx.lineTo(-size * 0.2, size * 0.25);
      ctx.moveTo(size * 0.0, -size * 0.3);
      ctx.lineTo(size * 0.0, size * 0.3);
      ctx.stroke();
      
      // Panel highlights for metallic look
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = size * 0.015;
      ctx.beginPath();
      ctx.moveTo(size * 0.6, -size * 0.25);
      ctx.lineTo(size * 0.2, -size * 0.28);
      ctx.moveTo(size * 0.6, size * 0.25);
      ctx.lineTo(size * 0.2, size * 0.28);
      ctx.stroke();
      
      // Canopy (elongated fighter style) - ENHANCED: larger and more detailed
      ctx.save();
      ctx.shadowColor = canopy;
      ctx.shadowBlur = 12;
      ctx.fillStyle = canopy;
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.moveTo(size * 0.7, 0);
      ctx.quadraticCurveTo(size * 0.5, -size * 0.18, size * 0.2, -size * 0.16);
      ctx.lineTo(size * 0.1, 0);
      ctx.lineTo(size * 0.2, size * 0.16);
      ctx.quadraticCurveTo(size * 0.5, size * 0.18, size * 0.7, 0);
      ctx.fill();
      ctx.restore();
      
      // Canopy frame - ENHANCED
      ctx.strokeStyle = trim;
      ctx.lineWidth = size * 0.04;
      ctx.beginPath();
      ctx.moveTo(size * 0.45, -size * 0.14);
      ctx.lineTo(size * 0.45, size * 0.14);
      ctx.stroke();
      
      // Canopy highlight for realism
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = size * 0.02;
      ctx.beginPath();
      ctx.arc(size * 0.5, -size * 0.06, size * 0.12, Math.PI * 0.8, Math.PI * 1.3);
      ctx.stroke();
      
      // Engine exhausts with glow - ENHANCED: more powerful looking
      const enginePulse = Math.sin(now / 100) * 0.2 + 0.85;
      ctx.save();
      ctx.shadowColor = thruster;
      ctx.shadowBlur = 22;
      ctx.fillStyle = thruster;
      ctx.globalAlpha = enginePulse;
      // Twin main engines - larger
      ctx.beginPath();
      ctx.ellipse(-size * 0.72, -size * 0.75, size * 0.14, size * 0.1, 0, 0, Math.PI * 2);
      ctx.ellipse(-size * 0.72, size * 0.75, size * 0.14, size * 0.1, 0, 0, Math.PI * 2);
      ctx.fill();
      // Central engine - larger
      ctx.beginPath();
      ctx.ellipse(-size * 0.88, 0, size * 0.12, size * 0.08, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Inner engine glow
      ctx.fillStyle = '#fff';
      ctx.globalAlpha = enginePulse * 0.6;
      ctx.beginPath();
      ctx.ellipse(-size * 0.72, -size * 0.75, size * 0.08, size * 0.06, 0, 0, Math.PI * 2);
      ctx.ellipse(-size * 0.72, size * 0.75, size * 0.08, size * 0.06, 0, 0, Math.PI * 2);
      ctx.ellipse(-size * 0.88, 0, size * 0.07, size * 0.05, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      
      // Weapon barrels at nose - ENHANCED: more prominent
      ctx.fillStyle = darken(trim, 0.3);
      ctx.beginPath();
      ctx.rect(size * 1.05, -size * 0.06, size * 0.25, size * 0.025);
      ctx.rect(size * 1.05, size * 0.035, size * 0.25, size * 0.025);
      ctx.fill();
      
      // Weapon barrel tips with glow
      ctx.fillStyle = accent;
      ctx.shadowColor = accent;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.rect(size * 1.28, -size * 0.055, size * 0.04, size * 0.015);
      ctx.rect(size * 1.28, size * 0.04, size * 0.04, size * 0.015);
      ctx.fill();
      ctx.shadowBlur = 0;

    } else if (shape === 'needle') {
      // PHANTOM-X - Sleek stealth interceptor with angular surfaces
      // Inspired by SR-71 Blackbird / F-117 Nighthawk
      
      if (isBoosting || isDefenseActive) {
        ctx.save();
        ctx.globalAlpha = 0.35;
        ctx.shadowColor = isBoosting ? thruster : primary;
        ctx.shadowBlur = 28;
        ctx.fillStyle = isBoosting ? thruster : primary;
        ctx.beginPath();
        ctx.moveTo(size * 1.5, 0);
        ctx.lineTo(size * 0.3, -size * 0.35);
        ctx.lineTo(-size * 0.6, -size * 0.5);
        ctx.lineTo(-size * 1.0, -size * 0.15);
        ctx.lineTo(-size * 1.0, size * 0.15);
        ctx.lineTo(-size * 0.6, size * 0.5);
        ctx.lineTo(size * 0.3, size * 0.35);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      
      // Angular delta wings (stealth faceted design) - ENHANCED: wider and more dramatic
      ctx.fillStyle = darken(primary, 0.15);
      ctx.beginPath();
      ctx.moveTo(size * 0.15, -size * 0.15);
      ctx.lineTo(-size * 0.15, -size * 0.82);
      ctx.lineTo(-size * 0.8, -size * 0.68);
      ctx.lineTo(-size * 0.5, -size * 0.18);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(size * 0.15, size * 0.15);
      ctx.lineTo(-size * 0.15, size * 0.82);
      ctx.lineTo(-size * 0.8, size * 0.68);
      ctx.lineTo(-size * 0.5, size * 0.18);
      ctx.closePath();
      ctx.fill();
      
      // Wing edge highlights - ENHANCED
      ctx.strokeStyle = accent;
      ctx.lineWidth = size * 0.03;
      ctx.beginPath();
      ctx.moveTo(-size * 0.15, -size * 0.82);
      ctx.lineTo(-size * 0.8, -size * 0.68);
      ctx.moveTo(-size * 0.15, size * 0.82);
      ctx.lineTo(-size * 0.8, size * 0.68);
      ctx.stroke();
      
      // Vertical stabilizers (canted) - ENHANCED: larger and more aggressive
      ctx.fillStyle = darken(primary, 0.25);
      ctx.beginPath();
      ctx.moveTo(-size * 0.5, -size * 0.5);
      ctx.lineTo(-size * 0.35, -size * 0.85);
      ctx.lineTo(-size * 0.7, -size * 0.78);
      ctx.lineTo(-size * 0.75, -size * 0.48);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-size * 0.5, size * 0.5);
      ctx.lineTo(-size * 0.35, size * 0.85);
      ctx.lineTo(-size * 0.7, size * 0.78);
      ctx.lineTo(-size * 0.75, size * 0.48);
      ctx.closePath();
      ctx.fill();
      
      // Stabilizer edge accents
      ctx.strokeStyle = darken(accent, 0.2);
      ctx.lineWidth = size * 0.025;
      ctx.beginPath();
      ctx.moveTo(-size * 0.35, -size * 0.85);
      ctx.lineTo(-size * 0.7, -size * 0.78);
      ctx.moveTo(-size * 0.35, size * 0.85);
      ctx.lineTo(-size * 0.7, size * 0.78);
      ctx.stroke();
      
      // Main fuselage - long needle shape - ENHANCED: wider and more substantial
      ctx.fillStyle = primary;
      ctx.strokeStyle = trim;
      ctx.lineWidth = Math.max(2, size * 0.08);
      ctx.shadowColor = primary;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(size * 1.5, 0);
      ctx.lineTo(size * 0.4, -size * 0.22);
      ctx.lineTo(-size * 0.3, -size * 0.24);
      ctx.lineTo(-size * 0.9, -size * 0.15);
      ctx.lineTo(-size * 0.95, 0);
      ctx.lineTo(-size * 0.9, size * 0.15);
      ctx.lineTo(-size * 0.3, size * 0.24);
      ctx.lineTo(size * 0.4, size * 0.22);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;
      
      // Stealth panel lines (faceted surfaces) - ENHANCED: more detail
      ctx.strokeStyle = accent;
      ctx.lineWidth = size * 0.05;
      ctx.beginPath();
      ctx.moveTo(size * 1.1, 0);
      ctx.lineTo(size * 0.2, -size * 0.15);
      ctx.lineTo(-size * 0.5, -size * 0.18);
      ctx.moveTo(size * 1.1, 0);
      ctx.lineTo(size * 0.2, size * 0.15);
      ctx.lineTo(-size * 0.5, size * 0.18);
      ctx.stroke();
      
      // Additional facet lines for stealth appearance
      ctx.strokeStyle = darken(primary, 0.3);
      ctx.lineWidth = size * 0.02;
      ctx.beginPath();
      ctx.moveTo(size * 0.6, -size * 0.18);
      ctx.lineTo(size * 0.3, -size * 0.2);
      ctx.moveTo(size * 0.6, size * 0.18);
      ctx.lineTo(size * 0.3, size * 0.2);
      ctx.moveTo(-size * 0.1, -size * 0.22);
      ctx.lineTo(-size * 0.1, size * 0.22);
      ctx.stroke();
      
      // Sensor array on nose - ENHANCED: more prominent
      ctx.fillStyle = accent;
      ctx.shadowColor = accent;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(size * 1.25, 0, size * 0.08, 0, Math.PI * 2);
      ctx.fill();
      
      // Additional sensor details
      ctx.fillStyle = canopy;
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.arc(size * 1.25, 0, size * 0.04, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      
      // Elongated narrow canopy - ENHANCED: more detailed
      ctx.save();
      ctx.shadowColor = canopy;
      ctx.shadowBlur = 10;
      ctx.fillStyle = canopy;
      ctx.globalAlpha = 0.88;
      ctx.beginPath();
      ctx.ellipse(size * 0.4, 0, size * 0.28, size * 0.12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      
      // Canopy highlight - ENHANCED
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = size * 0.025;
      ctx.beginPath();
      ctx.arc(size * 0.45, -size * 0.03, size * 0.1, Math.PI * 0.9, Math.PI * 1.4);
      ctx.stroke();
      
      // Canopy frame lines
      ctx.strokeStyle = trim;
      ctx.lineWidth = size * 0.02;
      ctx.beginPath();
      ctx.moveTo(size * 0.25, -size * 0.08);
      ctx.lineTo(size * 0.25, size * 0.08);
      ctx.stroke();
      
      // Twin vectoring thrusters - ENHANCED: more powerful looking
      const enginePulse = Math.sin(now / 80) * 0.25 + 0.8;
      ctx.save();
      ctx.shadowColor = thruster;
      ctx.shadowBlur = 24;
      ctx.fillStyle = thruster;
      ctx.globalAlpha = enginePulse;
      ctx.beginPath();
      ctx.ellipse(-size * 0.92, -size * 0.05, size * 0.1, size * 0.055, 0, 0, Math.PI * 2);
      ctx.ellipse(-size * 0.92, size * 0.05, size * 0.1, size * 0.055, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Inner engine core glow
      ctx.fillStyle = '#fff';
      ctx.globalAlpha = enginePulse * 0.7;
      ctx.beginPath();
      ctx.ellipse(-size * 0.92, -size * 0.05, size * 0.05, size * 0.03, 0, 0, Math.PI * 2);
      ctx.ellipse(-size * 0.92, size * 0.05, size * 0.05, size * 0.03, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Afterburner trails when boosting - ENHANCED
      if (isBoosting) {
        ctx.globalAlpha = enginePulse * 0.7;
        ctx.fillStyle = thruster;
        ctx.beginPath();
        ctx.moveTo(-size * 0.98, -size * 0.05);
        ctx.lineTo(-size * 1.5, -size * 0.02);
        ctx.lineTo(-size * 1.5, size * 0.02);
        ctx.lineTo(-size * 0.98, size * 0.05);
        ctx.fill();
      }
      ctx.restore();

    } else if (shape === 'bastion') {
      // BULWARK-7 - Heavy assault gunship with twin hulls
      // Inspired by A-10 Warthog / Pelican dropship
      
      if (isBoosting || isDefenseActive) {
        ctx.save();
        ctx.globalAlpha = 0.35;
        ctx.shadowColor = isBoosting ? thruster : primary;
        ctx.shadowBlur = 32;
        ctx.fillStyle = isBoosting ? thruster : primary;
        ctx.beginPath();
        ctx.moveTo(size * 1.1, 0);
        ctx.lineTo(size * 0.4, -size * 0.4);
        ctx.lineTo(-size * 0.2, -size * 1.1);
        ctx.lineTo(-size * 0.9, -size * 0.95);
        ctx.lineTo(-size * 1.1, -size * 0.35);
        ctx.lineTo(-size * 1.1, size * 0.35);
        ctx.lineTo(-size * 0.9, size * 0.95);
        ctx.lineTo(-size * 0.2, size * 1.1);
        ctx.lineTo(size * 0.4, size * 0.4);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      
      // Heavy twin-boom hull structures - ENHANCED: wider and more imposing
      ctx.fillStyle = darken(primary, 0.2);
      // Top boom
      ctx.beginPath();
      ctx.moveTo(size * 0.35, -size * 0.48);
      ctx.lineTo(-size * 0.1, -size * 1.25);
      ctx.lineTo(-size * 0.9, -size * 1.12);
      ctx.lineTo(-size * 1.05, -size * 0.48);
      ctx.lineTo(-size * 0.6, -size * 0.42);
      ctx.closePath();
      ctx.fill();
      // Bottom boom
      ctx.beginPath();
      ctx.moveTo(size * 0.35, size * 0.48);
      ctx.lineTo(-size * 0.1, size * 1.25);
      ctx.lineTo(-size * 0.9, size * 1.12);
      ctx.lineTo(-size * 1.05, size * 0.48);
      ctx.lineTo(-size * 0.6, size * 0.42);
      ctx.closePath();
      ctx.fill();
      
      // Boom structural ribs - ENHANCED
      ctx.strokeStyle = darken(primary, 0.35);
      ctx.lineWidth = size * 0.04;
      ctx.beginPath();
      ctx.moveTo(-size * 0.3, -size * 1.2);
      ctx.lineTo(-size * 0.3, -size * 0.45);
      ctx.moveTo(-size * 0.6, -size * 1.08);
      ctx.lineTo(-size * 0.6, -size * 0.43);
      ctx.moveTo(-size * 0.3, size * 1.2);
      ctx.lineTo(-size * 0.3, size * 0.45);
      ctx.moveTo(-size * 0.6, size * 1.08);
      ctx.lineTo(-size * 0.6, size * 0.43);
      ctx.stroke();
      
      // Armor plates on booms - ENHANCED: larger and more detailed
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.rect(-size * 0.55, -size * 1.15, size * 0.3, size * 0.14);
      ctx.rect(-size * 0.55, size * 1.01, size * 0.3, size * 0.14);
      ctx.fill();
      
      // Armor plate rivets
      ctx.fillStyle = darken(accent, 0.4);
      for (let i = 0; i < 3; i++) {
        const x = -size * 0.5 + i * size * 0.1;
        ctx.beginPath();
        ctx.arc(x, -size * 1.08, size * 0.02, 0, Math.PI * 2);
        ctx.arc(x, size * 1.08, size * 0.02, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Central main fuselage (armored box) - ENHANCED: wider and more armored looking
      ctx.fillStyle = primary;
      ctx.strokeStyle = trim;
      ctx.lineWidth = Math.max(2.5, size * 0.12);
      ctx.shadowColor = primary;
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.moveTo(size * 1.1, 0);
      ctx.lineTo(size * 0.6, -size * 0.42);
      ctx.lineTo(-size * 0.4, -size * 0.4);
      ctx.lineTo(-size * 0.55, -size * 0.3);
      ctx.lineTo(-size * 0.55, size * 0.3);
      ctx.lineTo(-size * 0.4, size * 0.4);
      ctx.lineTo(size * 0.6, size * 0.42);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;
      
      // Heavy weapon mount (chin gun) - ENHANCED: more menacing
      ctx.fillStyle = darken(primary, 0.4);
      ctx.beginPath();
      ctx.rect(size * 0.8, -size * 0.08, size * 0.4, size * 0.16);
      ctx.fill();
      
      // Weapon housing details
      ctx.strokeStyle = darken(primary, 0.5);
      ctx.lineWidth = size * 0.02;
      ctx.beginPath();
      ctx.rect(size * 0.85, -size * 0.07, size * 0.3, size * 0.14);
      ctx.stroke();
      
      // Gun barrel details - ENHANCED
      ctx.fillStyle = trim;
      ctx.beginPath();
      ctx.rect(size * 1.15, -size * 0.04, size * 0.18, size * 0.028);
      ctx.rect(size * 1.15, size * 0.012, size * 0.18, size * 0.028);
      ctx.fill();
      
      // Barrel muzzle flash suppressors
      ctx.fillStyle = darken(trim, 0.3);
      ctx.beginPath();
      ctx.rect(size * 1.3, -size * 0.045, size * 0.04, size * 0.035);
      ctx.rect(size * 1.3, size * 0.01, size * 0.04, size * 0.035);
      ctx.fill();
      
      // Reinforced armor lines - ENHANCED: more prominent
      ctx.strokeStyle = accent;
      ctx.lineWidth = size * 0.09;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(size * 0.5, -size * 0.34);
      ctx.lineTo(-size * 0.35, -size * 0.32);
      ctx.moveTo(size * 0.5, size * 0.34);
      ctx.lineTo(-size * 0.35, size * 0.32);
      ctx.stroke();
      
      // Additional armor detail lines
      ctx.strokeStyle = darken(accent, 0.3);
      ctx.lineWidth = size * 0.04;
      ctx.beginPath();
      ctx.moveTo(size * 0.3, -size * 0.38);
      ctx.lineTo(-size * 0.2, -size * 0.36);
      ctx.moveTo(size * 0.3, size * 0.38);
      ctx.lineTo(-size * 0.2, size * 0.36);
      ctx.stroke();
      ctx.lineCap = 'butt';
      
      // Armored canopy (smaller, protected) - ENHANCED
      ctx.save();
      ctx.shadowColor = canopy;
      ctx.shadowBlur = 10;
      ctx.fillStyle = canopy;
      ctx.globalAlpha = 0.88;
      ctx.beginPath();
      ctx.ellipse(size * 0.5, 0, size * 0.22, size * 0.14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      
      // Canopy frame
      ctx.strokeStyle = trim;
      ctx.lineWidth = size * 0.035;
      ctx.beginPath();
      ctx.arc(size * 0.5, 0, size * 0.18, Math.PI * 0.5, Math.PI * 1.5);
      ctx.stroke();
      
      // Sensor dome on top - ENHANCED
      ctx.fillStyle = canopy;
      ctx.globalAlpha = 0.75;
      ctx.shadowColor = canopy;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(size * 0.12, -size * 0.18, size * 0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      
      // Sensor dome antenna
      ctx.strokeStyle = accent;
      ctx.lineWidth = size * 0.02;
      ctx.beginPath();
      ctx.moveTo(size * 0.12, -size * 0.28);
      ctx.lineTo(size * 0.12, -size * 0.35);
      ctx.stroke();
      
      // Quad engine configuration - ENHANCED: more powerful
      const enginePulse = Math.sin(now / 120) * 0.2 + 0.85;
      ctx.save();
      ctx.shadowColor = thruster;
      ctx.shadowBlur = 22;
      ctx.fillStyle = thruster;
      ctx.globalAlpha = enginePulse;
      // Boom engines - larger
      ctx.beginPath();
      ctx.ellipse(-size * 0.98, -size * 0.9, size * 0.15, size * 0.12, 0, 0, Math.PI * 2);
      ctx.ellipse(-size * 0.98, size * 0.9, size * 0.15, size * 0.12, 0, 0, Math.PI * 2);
      ctx.fill();
      // Central engines
      ctx.beginPath();
      ctx.ellipse(-size * 0.58, -size * 0.22, size * 0.1, size * 0.08, 0, 0, Math.PI * 2);
      ctx.ellipse(-size * 0.58, size * 0.22, size * 0.1, size * 0.08, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Inner engine core glow
      ctx.fillStyle = '#fff';
      ctx.globalAlpha = enginePulse * 0.6;
      ctx.beginPath();
      ctx.ellipse(-size * 0.98, -size * 0.9, size * 0.08, size * 0.06, 0, 0, Math.PI * 2);
      ctx.ellipse(-size * 0.98, size * 0.9, size * 0.08, size * 0.06, 0, 0, Math.PI * 2);
      ctx.ellipse(-size * 0.58, -size * 0.22, size * 0.05, size * 0.04, 0, 0, Math.PI * 2);
      ctx.ellipse(-size * 0.58, size * 0.22, size * 0.05, size * 0.04, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

    } else if (shape === 'razor') {
      // EMBERWING - Aggressive attack craft with forward-swept wings
      // Inspired by X-29 / aggressive sci-fi fighters
      
      if (isBoosting || isDefenseActive) {
        ctx.save();
        ctx.globalAlpha = 0.4;
        ctx.shadowColor = isBoosting ? thruster : primary;
        ctx.shadowBlur = 28;
        ctx.fillStyle = isBoosting ? thruster : primary;
        ctx.beginPath();
        ctx.moveTo(size * 1.4, 0);
        ctx.lineTo(size * 0.5, -size * 0.2);
        ctx.lineTo(size * 0.3, -size * 0.75);
        ctx.lineTo(-size * 0.4, -size * 0.55);
        ctx.lineTo(-size * 0.9, -size * 0.2);
        ctx.lineTo(-size * 0.9, size * 0.2);
        ctx.lineTo(-size * 0.4, size * 0.55);
        ctx.lineTo(size * 0.3, size * 0.75);
        ctx.lineTo(size * 0.5, size * 0.2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      
      // Forward-swept aggressive wings - ENHANCED: wider and more dynamic
      ctx.fillStyle = darken(primary, 0.15);
      ctx.beginPath();
      ctx.moveTo(size * 0.45, -size * 0.22);
      ctx.lineTo(size * 0.38, -size * 1.05);
      ctx.lineTo(-size * 0.38, -size * 0.8);
      ctx.lineTo(-size * 0.12, -size * 0.22);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(size * 0.45, size * 0.22);
      ctx.lineTo(size * 0.38, size * 1.05);
      ctx.lineTo(-size * 0.38, size * 0.8);
      ctx.lineTo(-size * 0.12, size * 0.22);
      ctx.closePath();
      ctx.fill();
      
      // Wing leading edge highlights - ENHANCED
      ctx.strokeStyle = accent;
      ctx.lineWidth = size * 0.04;
      ctx.beginPath();
      ctx.moveTo(size * 0.45, -size * 0.22);
      ctx.lineTo(size * 0.38, -size * 1.05);
      ctx.moveTo(size * 0.45, size * 0.22);
      ctx.lineTo(size * 0.38, size * 1.05);
      ctx.stroke();
      
      // Wing-mounted cannons - ENHANCED: larger and more detailed
      ctx.fillStyle = darken(accent, 0.2);
      ctx.beginPath();
      ctx.rect(size * 0.42, -size * 0.88, size * 0.35, size * 0.08);
      ctx.rect(size * 0.42, size * 0.8, size * 0.35, size * 0.08);
      ctx.fill();
      
      // Cannon barrels
      ctx.fillStyle = darken(trim, 0.3);
      ctx.beginPath();
      ctx.rect(size * 0.72, -size * 0.86, size * 0.12, size * 0.04);
      ctx.rect(size * 0.72, size * 0.82, size * 0.12, size * 0.04);
      ctx.fill();
      
      // Cannon muzzle glow
      ctx.fillStyle = primary;
      ctx.shadowColor = primary;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.rect(size * 0.82, -size * 0.855, size * 0.03, size * 0.03);
      ctx.rect(size * 0.82, size * 0.825, size * 0.03, size * 0.03);
      ctx.fill();
      ctx.shadowBlur = 0;
      
      // Tail fins (angular, aggressive) - ENHANCED: larger and more prominent
      ctx.fillStyle = darken(primary, 0.25);
      ctx.beginPath();
      ctx.moveTo(-size * 0.48, -size * 0.24);
      ctx.lineTo(-size * 0.68, -size * 0.68);
      ctx.lineTo(-size * 0.88, -size * 0.52);
      ctx.lineTo(-size * 0.75, -size * 0.22);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-size * 0.48, size * 0.24);
      ctx.lineTo(-size * 0.68, size * 0.68);
      ctx.lineTo(-size * 0.88, size * 0.52);
      ctx.lineTo(-size * 0.75, size * 0.22);
      ctx.closePath();
      ctx.fill();
      
      // Tail fin edge accents
      ctx.strokeStyle = darken(accent, 0.3);
      ctx.lineWidth = size * 0.03;
      ctx.beginPath();
      ctx.moveTo(-size * 0.68, -size * 0.68);
      ctx.lineTo(-size * 0.88, -size * 0.52);
      ctx.moveTo(-size * 0.68, size * 0.68);
      ctx.lineTo(-size * 0.88, size * 0.52);
      ctx.stroke();
      
      // Angular main fuselage - ENHANCED: wider and more aggressive
      ctx.fillStyle = primary;
      ctx.strokeStyle = trim;
      ctx.lineWidth = Math.max(2, size * 0.09);
      ctx.shadowColor = primary;
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.moveTo(size * 1.4, 0);
      ctx.lineTo(size * 0.6, -size * 0.26);
      ctx.lineTo(size * 0.2, -size * 0.3);
      ctx.lineTo(-size * 0.5, -size * 0.22);
      ctx.lineTo(-size * 0.8, 0);
      ctx.lineTo(-size * 0.5, size * 0.22);
      ctx.lineTo(size * 0.2, size * 0.3);
      ctx.lineTo(size * 0.6, size * 0.26);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;
      
      // Heat vents / radiator panels - ENHANCED: more prominent
      ctx.fillStyle = thruster;
      const heatPulse = 0.5 + Math.sin(now / 180) * 0.25;
      ctx.globalAlpha = heatPulse;
      ctx.shadowColor = thruster;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.rect(-size * 0.32, -size * 0.14, size * 0.18, size * 0.04);
      ctx.rect(-size * 0.32, size * 0.1, size * 0.18, size * 0.04);
      // Additional vent slits
      for (let i = 0; i < 4; i++) {
        const x = -size * 0.3 + i * size * 0.04;
        ctx.rect(x, -size * 0.13, size * 0.015, size * 0.02);
        ctx.rect(x, size * 0.11, size * 0.015, size * 0.02);
      }
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      
      // Aggressive accent stripes - ENHANCED: thicker and more visible
      ctx.strokeStyle = accent;
      ctx.lineWidth = size * 0.07;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(size * 1.1, -size * 0.06);
      ctx.lineTo(size * 0.35, -size * 0.14);
      ctx.moveTo(size * 1.1, size * 0.06);
      ctx.lineTo(size * 0.35, size * 0.14);
      ctx.stroke();
      ctx.lineCap = 'butt';
      
      // Narrow aggressive canopy - ENHANCED
      ctx.save();
      ctx.shadowColor = canopy;
      ctx.shadowBlur = 12;
      ctx.fillStyle = canopy;
      ctx.globalAlpha = 0.92;
      ctx.beginPath();
      ctx.moveTo(size * 0.75, 0);
      ctx.lineTo(size * 0.52, -size * 0.1);
      ctx.lineTo(size * 0.25, -size * 0.08);
      ctx.lineTo(size * 0.25, size * 0.08);
      ctx.lineTo(size * 0.52, size * 0.1);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      
      // Canopy frame highlight
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = size * 0.02;
      ctx.beginPath();
      ctx.moveTo(size * 0.6, -size * 0.08);
      ctx.lineTo(size * 0.5, -size * 0.09);
      ctx.stroke();
      
      // Triple engine configuration - ENHANCED: more powerful
      const enginePulse = Math.sin(now / 90) * 0.25 + 0.8;
      ctx.save();
      ctx.shadowColor = thruster;
      ctx.shadowBlur = 24;
      ctx.fillStyle = thruster;
      ctx.globalAlpha = enginePulse;
      ctx.beginPath();
      ctx.ellipse(-size * 0.82, 0, size * 0.14, size * 0.1, 0, 0, Math.PI * 2);
      ctx.ellipse(-size * 0.78, -size * 0.3, size * 0.1, size * 0.06, 0, 0, Math.PI * 2);
      ctx.ellipse(-size * 0.78, size * 0.3, size * 0.1, size * 0.06, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Inner engine core glow
      ctx.fillStyle = '#fff';
      ctx.globalAlpha = enginePulse * 0.7;
      ctx.beginPath();
      ctx.ellipse(-size * 0.82, 0, size * 0.07, size * 0.05, 0, 0, Math.PI * 2);
      ctx.ellipse(-size * 0.78, -size * 0.3, size * 0.05, size * 0.03, 0, 0, Math.PI * 2);
      ctx.ellipse(-size * 0.78, size * 0.3, size * 0.05, size * 0.03, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

    } else if (shape === 'dart') {
      // SPECTRE-9 - Stealth reconnaissance craft
      // Inspired by B-2 Spirit / flying wing designs
      
      if (isBoosting || isDefenseActive) {
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.shadowColor = isBoosting ? thruster : primary;
        ctx.shadowBlur = 25;
        ctx.fillStyle = isBoosting ? thruster : primary;
        ctx.beginPath();
        ctx.moveTo(size * 1.2, 0);
        ctx.lineTo(size * 0.1, -size * 0.65);
        ctx.lineTo(-size * 0.9, -size * 0.5);
        ctx.lineTo(-size * 0.7, 0);
        ctx.lineTo(-size * 0.9, size * 0.5);
        ctx.lineTo(size * 0.1, size * 0.65);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      
      // Flying wing design - blended body
      ctx.fillStyle = darken(primary, 0.12);
      // Main wing body (smooth curves)
      ctx.beginPath();
      ctx.moveTo(size * 0.2, -size * 0.08);
      ctx.quadraticCurveTo(-size * 0.1, -size * 0.5, -size * 0.75, -size * 0.48);
      ctx.lineTo(-size * 0.6, -size * 0.15);
      ctx.lineTo(size * 0.2, -size * 0.08);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(size * 0.2, size * 0.08);
      ctx.quadraticCurveTo(-size * 0.1, size * 0.5, -size * 0.75, size * 0.48);
      ctx.lineTo(-size * 0.6, size * 0.15);
      ctx.lineTo(size * 0.2, size * 0.08);
      ctx.closePath();
      ctx.fill();
      
      // Wingtip sensor pods
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.ellipse(-size * 0.68, -size * 0.42, size * 0.08, size * 0.05, -0.4, 0, Math.PI * 2);
      ctx.ellipse(-size * 0.68, size * 0.42, size * 0.08, size * 0.05, 0.4, 0, Math.PI * 2);
      ctx.fill();
      
      // Central body spine - ENHANCED: wider and more substantial
      ctx.fillStyle = primary;
      ctx.strokeStyle = trim;
      ctx.lineWidth = Math.max(2, size * 0.08);
      ctx.shadowColor = primary;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(size * 1.2, 0);
      ctx.quadraticCurveTo(size * 0.7, -size * 0.1, size * 0.3, -size * 0.13);
      ctx.lineTo(-size * 0.4, -size * 0.15);
      ctx.lineTo(-size * 0.65, 0);
      ctx.lineTo(-size * 0.4, size * 0.15);
      ctx.lineTo(size * 0.3, size * 0.13);
      ctx.quadraticCurveTo(size * 0.7, size * 0.1, size * 1.2, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;
      
      // Stealth coating lines (subtle) - ENHANCED: more detail
      ctx.strokeStyle = darken(primary, 0.15);
      ctx.lineWidth = size * 0.02;
      ctx.beginPath();
      ctx.moveTo(size * 0.85, 0);
      ctx.lineTo(-size * 0.18, -size * 0.1);
      ctx.moveTo(size * 0.85, 0);
      ctx.lineTo(-size * 0.18, size * 0.1);
      ctx.moveTo(size * 0.35, -size * 0.08);
      ctx.quadraticCurveTo(size * 0.1, -size * 0.28, -size * 0.32, -size * 0.35);
      ctx.moveTo(size * 0.35, size * 0.08);
      ctx.quadraticCurveTo(size * 0.1, size * 0.28, -size * 0.32, size * 0.35);
      ctx.stroke();
      
      // Additional panel details
      ctx.strokeStyle = darken(primary, 0.25);
      ctx.lineWidth = size * 0.015;
      ctx.beginPath();
      ctx.moveTo(size * 0.5, -size * 0.05);
      ctx.lineTo(size * 0.1, -size * 0.1);
      ctx.moveTo(size * 0.5, size * 0.05);
      ctx.lineTo(size * 0.1, size * 0.1);
      ctx.stroke();
      
      // Glowing sensor array on nose - ENHANCED
      ctx.save();
      ctx.shadowColor = canopy;
      ctx.shadowBlur = 15;
      ctx.fillStyle = canopy;
      ctx.globalAlpha = 0.75 + Math.sin(now / 350) * 0.25;
      ctx.beginPath();
      ctx.arc(size * 1.0, 0, size * 0.1, 0, Math.PI * 2);
      ctx.fill();
      
      // Inner sensor core
      ctx.fillStyle = '#fff';
      ctx.globalAlpha = 0.6 + Math.sin(now / 300) * 0.3;
      ctx.beginPath();
      ctx.arc(size * 1.0, 0, size * 0.05, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      
      // Wide panoramic canopy - ENHANCED
      ctx.save();
      ctx.shadowColor = canopy;
      ctx.shadowBlur = 12;
      ctx.fillStyle = canopy;
      ctx.globalAlpha = 0.88;
      ctx.beginPath();
      ctx.ellipse(size * 0.42, 0, size * 0.26, size * 0.1, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      
      // Canopy frame highlights
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.lineWidth = size * 0.02;
      ctx.beginPath();
      ctx.arc(size * 0.5, 0, size * 0.22, Math.PI * 0.7, Math.PI * 1.3);
      ctx.stroke();
      
      // Integrated stealth engines (hidden in trailing edge) - ENHANCED
      const enginePulse = Math.sin(now / 150) * 0.2 + 0.75;
      ctx.save();
      ctx.shadowColor = thruster;
      ctx.shadowBlur = 18;
      ctx.fillStyle = thruster;
      ctx.globalAlpha = enginePulse;
      // Slot exhausts blended into wing
      ctx.beginPath();
      ctx.ellipse(-size * 0.62, -size * 0.1, size * 0.08, size * 0.04, 0, 0, Math.PI * 2);
      ctx.ellipse(-size * 0.62, size * 0.1, size * 0.08, size * 0.04, 0, 0, Math.PI * 2);
      ctx.ellipse(-size * 0.55, 0, size * 0.07, size * 0.035, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Inner engine glow
      ctx.fillStyle = '#fff';
      ctx.globalAlpha = enginePulse * 0.6;
      ctx.beginPath();
      ctx.ellipse(-size * 0.62, -size * 0.1, size * 0.04, size * 0.02, 0, 0, Math.PI * 2);
      ctx.ellipse(-size * 0.62, size * 0.1, size * 0.04, size * 0.02, 0, 0, Math.PI * 2);
      ctx.ellipse(-size * 0.55, 0, size * 0.035, size * 0.018, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

    } else if (shape === 'fortress') {
      // TITAN HEAVY - Massive capital-class gunship
      // Inspired by gunships, battleships, heavy bombers
      
      if (isBoosting || isDefenseActive) {
        ctx.save();
        ctx.globalAlpha = 0.35;
        ctx.shadowColor = isBoosting ? thruster : primary;
        ctx.shadowBlur = 35;
        ctx.fillStyle = isBoosting ? thruster : primary;
        ctx.beginPath();
        ctx.moveTo(size * 1.0, 0);
        ctx.lineTo(size * 0.5, -size * 0.5);
        ctx.lineTo(-size * 0.3, -size * 1.0);
        ctx.lineTo(-size * 1.0, -size * 0.8);
        ctx.lineTo(-size * 1.15, -size * 0.3);
        ctx.lineTo(-size * 1.15, size * 0.3);
        ctx.lineTo(-size * 1.0, size * 0.8);
        ctx.lineTo(-size * 0.3, size * 1.0);
        ctx.lineTo(size * 0.5, size * 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      
      // Massive wing platforms - ENHANCED: wider and more menacing
      ctx.fillStyle = darken(primary, 0.2);
      // Upper wing/weapon platform
      ctx.beginPath();
      ctx.moveTo(size * 0.35, -size * 0.55);
      ctx.lineTo(-size * 0.2, -size * 1.3);
      ctx.lineTo(-size * 0.95, -size * 1.05);
      ctx.lineTo(-size * 1.0, -size * 0.5);
      ctx.lineTo(-size * 0.48, -size * 0.45);
      ctx.closePath();
      ctx.fill();
      // Lower wing/weapon platform
      ctx.beginPath();
      ctx.moveTo(size * 0.35, size * 0.55);
      ctx.lineTo(-size * 0.2, size * 1.3);
      ctx.lineTo(-size * 0.95, size * 1.05);
      ctx.lineTo(-size * 1.0, size * 0.5);
      ctx.lineTo(-size * 0.48, size * 0.45);
      ctx.closePath();
      ctx.fill();
      
      // Wing structural supports - ENHANCED
      ctx.strokeStyle = darken(primary, 0.35);
      ctx.lineWidth = size * 0.05;
      ctx.beginPath();
      ctx.moveTo(-size * 0.35, -size * 1.25);
      ctx.lineTo(-size * 0.5, -size * 0.48);
      ctx.moveTo(-size * 0.65, -size * 1.1);
      ctx.lineTo(-size * 0.7, -size * 0.48);
      ctx.moveTo(-size * 0.35, size * 1.25);
      ctx.lineTo(-size * 0.5, size * 0.48);
      ctx.moveTo(-size * 0.65, size * 1.1);
      ctx.lineTo(-size * 0.7, size * 0.48);
      ctx.stroke();
      
      // Heavy turret mounts on wings - ENHANCED: larger and more imposing
      ctx.fillStyle = darken(primary, 0.35);
      ctx.beginPath();
      ctx.arc(-size * 0.52, -size * 0.92, size * 0.18, 0, Math.PI * 2);
      ctx.arc(-size * 0.52, size * 0.92, size * 0.18, 0, Math.PI * 2);
      ctx.fill();
      
      // Turret armor rings
      ctx.strokeStyle = darken(accent, 0.3);
      ctx.lineWidth = size * 0.03;
      ctx.beginPath();
      ctx.arc(-size * 0.52, -size * 0.92, size * 0.16, 0, Math.PI * 2);
      ctx.arc(-size * 0.52, size * 0.92, size * 0.16, 0, Math.PI * 2);
      ctx.stroke();
      
      // Turret barrels - ENHANCED
      ctx.fillStyle = trim;
      ctx.beginPath();
      ctx.rect(-size * 0.32, -size * 0.96, size * 0.28, size * 0.035);
      ctx.rect(-size * 0.32, -size * 0.88, size * 0.28, size * 0.035);
      ctx.rect(-size * 0.32, size * 0.88, size * 0.28, size * 0.035);
      ctx.rect(-size * 0.32, size * 0.925, size * 0.28, size * 0.035);
      ctx.fill();
      
      // Barrel muzzles
      ctx.fillStyle = accent;
      ctx.shadowColor = accent;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.rect(-size * 0.05, -size * 0.955, size * 0.04, size * 0.025);
      ctx.rect(-size * 0.05, -size * 0.875, size * 0.04, size * 0.025);
      ctx.rect(-size * 0.05, size * 0.885, size * 0.04, size * 0.025);
      ctx.rect(-size * 0.05, size * 0.93, size * 0.04, size * 0.025);
      ctx.fill();
      ctx.shadowBlur = 0;
      
      // Armored main hull - ENHANCED: wider and more tank-like
      ctx.fillStyle = primary;
      ctx.strokeStyle = trim;
      ctx.lineWidth = Math.max(2.5, size * 0.12);
      ctx.shadowColor = primary;
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.moveTo(size * 1.0, 0);
      ctx.lineTo(size * 0.6, -size * 0.5);
      ctx.lineTo(-size * 0.3, -size * 0.52);
      ctx.lineTo(-size * 0.7, -size * 0.4);
      ctx.lineTo(-size * 0.85, 0);
      ctx.lineTo(-size * 0.7, size * 0.4);
      ctx.lineTo(-size * 0.3, size * 0.52);
      ctx.lineTo(size * 0.6, size * 0.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;
      
      // Command bridge/superstructure
      ctx.fillStyle = darken(primary, 0.1);
      ctx.beginPath();
      ctx.moveTo(size * 0.5, -size * 0.35);
      ctx.lineTo(size * 0.2, -size * 0.42);
      ctx.lineTo(-size * 0.2, -size * 0.38);
      ctx.lineTo(-size * 0.2, size * 0.38);
      ctx.lineTo(size * 0.2, size * 0.42);
      ctx.lineTo(size * 0.5, size * 0.35);
      ctx.closePath();
      ctx.fill();
      
      // Forward heavy cannons
      ctx.fillStyle = darken(primary, 0.4);
      ctx.beginPath();
      ctx.rect(size * 0.7, -size * 0.12, size * 0.4, size * 0.08);
      ctx.rect(size * 0.7, size * 0.04, size * 0.4, size * 0.08);
      ctx.fill();
      // Barrel tips
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.rect(size * 1.05, -size * 0.1, size * 0.08, size * 0.04);
      ctx.rect(size * 1.05, size * 0.06, size * 0.08, size * 0.04);
      ctx.fill();
      
      // Armored plating details
      ctx.strokeStyle = accent;
      ctx.lineWidth = size * 0.06;
      ctx.beginPath();
      ctx.moveTo(size * 0.4, -size * 0.38);
      ctx.lineTo(-size * 0.3, -size * 0.4);
      ctx.moveTo(size * 0.4, size * 0.38);
      ctx.lineTo(-size * 0.3, size * 0.4);
      ctx.stroke();
      
      // Small armored bridge canopy - ENHANCED
      ctx.save();
      ctx.shadowColor = canopy;
      ctx.shadowBlur = 10;
      ctx.fillStyle = canopy;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.rect(size * 0.28, -size * 0.18, size * 0.25, size * 0.36);
      ctx.fill();
      ctx.restore();
      
      // Bridge frame
      ctx.strokeStyle = trim;
      ctx.lineWidth = size * 0.025;
      ctx.beginPath();
      ctx.rect(size * 0.28, -size * 0.18, size * 0.25, size * 0.36);
      ctx.stroke();
      
      // Multiple sensor domes - ENHANCED
      ctx.fillStyle = canopy;
      ctx.shadowColor = canopy;
      ctx.shadowBlur = 8;
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.arc(size * 0.0, -size * 0.26, size * 0.08, 0, Math.PI * 2);
      ctx.arc(size * 0.0, size * 0.26, size * 0.08, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      
      // Massive engine bank (6 engines) - ENHANCED: more powerful
      const enginePulse = Math.sin(now / 130) * 0.2 + 0.85;
      ctx.save();
      ctx.shadowColor = thruster;
      ctx.shadowBlur = 26;
      ctx.fillStyle = thruster;
      ctx.globalAlpha = enginePulse;
      // Wing engines - larger
      ctx.beginPath();
      ctx.ellipse(-size * 0.95, -size * 0.82, size * 0.15, size * 0.12, 0, 0, Math.PI * 2);
      ctx.ellipse(-size * 0.95, size * 0.82, size * 0.15, size * 0.12, 0, 0, Math.PI * 2);
      ctx.fill();
      // Central quad engines
      ctx.beginPath();
      ctx.ellipse(-size * 0.88, -size * 0.3, size * 0.12, size * 0.09, 0, 0, Math.PI * 2);
      ctx.ellipse(-size * 0.88, -size * 0.1, size * 0.12, size * 0.09, 0, 0, Math.PI * 2);
      ctx.ellipse(-size * 0.88, size * 0.1, size * 0.12, size * 0.09, 0, 0, Math.PI * 2);
      ctx.ellipse(-size * 0.88, size * 0.3, size * 0.12, size * 0.09, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Inner engine core glow
      ctx.fillStyle = '#fff';
      ctx.globalAlpha = enginePulse * 0.7;
      ctx.beginPath();
      ctx.ellipse(-size * 0.95, -size * 0.82, size * 0.08, size * 0.06, 0, 0, Math.PI * 2);
      ctx.ellipse(-size * 0.95, size * 0.82, size * 0.08, size * 0.06, 0, 0, Math.PI * 2);
      ctx.ellipse(-size * 0.88, -size * 0.3, size * 0.06, size * 0.045, 0, 0, Math.PI * 2);
      ctx.ellipse(-size * 0.88, -size * 0.1, size * 0.06, size * 0.045, 0, 0, Math.PI * 2);
      ctx.ellipse(-size * 0.88, size * 0.1, size * 0.06, size * 0.045, 0, 0, Math.PI * 2);
      ctx.ellipse(-size * 0.88, size * 0.3, size * 0.06, size * 0.045, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

    } else {
      // Fallback to spear shape (default)
      ctx.fillStyle = primary;
      ctx.strokeStyle = trim;
      ctx.lineWidth = Math.max(2, size * 0.1);
      ctx.beginPath();
      ctx.moveTo(size * 1.15, 0);
      ctx.lineTo(-size * 0.94, -size * 0.82);
      ctx.lineTo(-size * 0.22, 0);
      ctx.lineTo(-size * 0.94, size * 0.82);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    
    // Damage visualization (applies to all ships)
    if (isDamaged) {
      ctx.save();
      ctx.strokeStyle = '#7f1d1d';
      ctx.lineWidth = size * 0.06;
      ctx.globalAlpha = damageLevel * 0.7;
      ctx.beginPath();
      if (damageLevel > 0.3) {
        ctx.moveTo(-size * 0.3, -size * 0.2);
        ctx.lineTo(-size * 0.1, -size * 0.4);
        ctx.moveTo(size * 0.2, size * 0.15);
        ctx.lineTo(size * 0.4, size * 0.3);
      }
      if (damageLevel > 0.5) {
        ctx.moveTo(-size * 0.5, size * 0.1);
        ctx.lineTo(-size * 0.25, size * 0.3);
        ctx.moveTo(size * 0.0, -size * 0.15);
        ctx.lineTo(size * 0.15, -size * 0.35);
      }
      if (damageLevel > 0.7) {
        // Sparks/fire effect
        ctx.fillStyle = thruster;
        ctx.globalAlpha = Math.sin(now / 50) * 0.3 + 0.5;
        ctx.beginPath();
        ctx.arc(-size * 0.4, size * 0.2, size * 0.08, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.stroke();
      ctx.restore();
    }
  };

  const dropCoin = (x, y) => coins.push(new Coin(x, y));
  const dropSupply = (x, y) => supplies.push(new SupplyCrate(x, y, SUPPLY_TYPES[Math.floor(Math.random() * SUPPLY_TYPES.length)] || 'ammo'));

  const handleEnemyDeath = (index, xpBonus = 0) => {
    const enemy = enemies[index];
    if (!enemy) return;
    
    // Check if this was the boss
    const wasBoss = enemy.isBoss;
    const wasElite = enemy.isElite;
    
    // Phase 1: Add to combo system
    addComboKill();
    
    // Drop more coins for elite/boss
    dropCoin(enemy.x, enemy.y);
    if (wasElite) {
      dropCoin(enemy.x + rand(-20, 20), enemy.y + rand(-20, 20));
      dropCoin(enemy.x + rand(-20, 20), enemy.y + rand(-20, 20));
    }
    if (wasBoss) {
      for (let i = 0; i < 10; i++) {
        dropCoin(enemy.x + rand(-40, 40), enemy.y + rand(-40, 40));
      }
      dropSupply(enemy.x, enemy.y);
      dropSupply(enemy.x + 30, enemy.y);
      dropSupply(enemy.x - 30, enemy.y);
    } else if (chance(wasElite ? 0.5 : 0.22)) {
      dropSupply(enemy.x, enemy.y);
    }
    
    // Phase A.4: Enhanced death effects based on enemy type
    const deathColor = wasBoss ? '#7c3aed' :
                       wasElite ? '#f59e0b' :
                       enemy.kind === 'drone' ? '#ef4444' : 
                       enemy.kind === 'chaser' ? '#e879f9' :
                       enemy.kind === 'heavy' ? '#4ade80' : '#fb923c';
    
    // Phase A.4: Shockwave ring
    addParticles('ring', enemy.x, enemy.y, 0, wasBoss ? 3 : 1, deathColor);
    
    // Play explosion sound based on enemy type
    if (typeof AudioManager !== 'undefined') {
      if (wasBoss) {
        AudioManager.playExplosionLarge();
      } else if (wasElite) {
        AudioManager.playExplosionMedium();
      } else {
        AudioManager.playExplosionSmall();
      }
    }
    
    // Enhanced effects for boss/elite
    if (wasBoss) {
      addParticles('debris', enemy.x, enemy.y, 0, 40);
      addParticles('smoke', enemy.x, enemy.y, 0, 20);
      addParticles('sparks', enemy.x, enemy.y, 0, 30);
      addParticles('levelup', enemy.x, enemy.y, 0, 30);
      shakeScreen(15, 500);
      addLogEntry('💀 BOSS DESTROYED!', '#f59e0b');
    } else if (wasElite) {
      addParticles('debris', enemy.x, enemy.y, 0, 25);
      addParticles('sparks', enemy.x, enemy.y, 0, 20);
      shakeScreen(8, 250);
      addLogEntry('⭐ Elite enemy destroyed!', '#f59e0b');
    } else if (enemy.kind === 'heavy') {
      addParticles('debris', enemy.x, enemy.y, 0, 20);
      addParticles('smoke', enemy.x, enemy.y, 0, 8);
      addParticles('ring', enemy.x, enemy.y, 0, 2, '#15803d');
      shakeScreen(6, 180);
    } else if (enemy.kind === 'swarmer') {
      addParticles('sparks', enemy.x, enemy.y, 0, 15);
      addParticles('pop', enemy.x, enemy.y, 0, 10);
    } else {
      addParticles('sparks', enemy.x, enemy.y, 0, 12);
      addParticles('debris', enemy.x, enemy.y, 0, 8);
    }
    
    enemies.splice(index, 1);
    
    // Mark boss as dead
    if (wasBoss && enemy === bossEntity) {
      bossEntity = null;
    }
    
    enemiesKilled++;
    
    // Score calculation with elite/boss bonuses
    let scoreGain = 15 + (comboCount > 1 ? comboCount * 2 : 0);
    if (wasElite) scoreGain *= 3;
    if (wasBoss) scoreGain *= 20;
    score += scoreGain;
    
    // Phase 1: Show score as damage number
    spawnDamageNumber(enemy.x, enemy.y - enemy.size, `+${scoreGain}`, wasBoss || wasElite);
    
    // XP with bonuses
    let xpGain = 30 + level * 4 + xpBonus;
    if (wasElite) xpGain *= 2;
    if (wasBoss) xpGain *= 10;
    addXP(xpGain);
    
    shakeScreen(3.4, 110);
    
    // Ultimate charge with bonuses
    let charge = 15 + level * 2;
    if (wasElite) charge *= 2;
    if (wasBoss) charge *= 5;
    if (player) player.addUltimateCharge(charge);
    
    // Check if all enemies eliminated (only for non-boss waves)
    if (enemiesKilled >= enemiesToKill && currentWaveType !== 'boss') {
      addLogEntry('All enemies eliminated!', '#4ade80');
    }
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
      
      // Phase 1: Show damage number
      spawnDamageNumber(enemy.x, enemy.y, dealt, false);
      
      // Phase A.2: Hit flash on damage
      enemy.hitFlash = 150;
      
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
      
      // Phase 1: Show damage number
      spawnDamageNumber(enemy.x, enemy.y, dealt, false);
      
      // Phase A.2: Hit flash on damage
      enemy.hitFlash = 150;
      
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
    
    // Show level with wave type indicator
    const waveType = WAVE_TYPES[currentWaveType];
    let levelText = level.toString();
    if (currentWaveType !== 'standard') {
      levelText += ` (${waveType.name})`;
    }
    dom.levelValue.textContent = levelText;
    
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
    
    // Update wave timer for survival waves
    const waveInfo = WAVE_TYPES[currentWaveType];
    if (waveInfo && waveInfo.timerBased && waveStartTime > 0) {
      const elapsed = performance.now() - waveStartTime;
      const remaining = Math.max(0, (waveInfo.duration - elapsed) / 1000);
      const waveTimerEl = document.getElementById('waveTimer');
      if (waveTimerEl) {
        waveTimerEl.textContent = `Survive: ${Math.ceil(remaining)}s`;
        waveTimerEl.style.display = remaining > 0 ? 'block' : 'none';
      }
    } else {
      const waveTimerEl = document.getElementById('waveTimer');
      if (waveTimerEl) waveTimerEl.style.display = 'none';
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
        slot.setAttribute('aria-pressed', 'true');
      } else {
        slot.classList.remove('active');
        slot.setAttribute('aria-pressed', 'false');
      }
    });
    
    // Update slot labels and icons based on equipment class
    const equipClass = Save.data.armory.equipmentClass || defaultArmory().equipmentClass;
    Object.keys(equipClass).forEach((slotKey, index) => {
      const slotData = equipClass[slotKey];
      const slotElement = document.querySelector(`.equip-slot[data-slot="${index}"]`);
      if (slotElement && slotData) {
        const iconImg = slotElement.querySelector('.equip-icon');
        const labelSpan = slotElement.querySelector('.equip-label');
        
        const iconPath = EQUIPMENT_ICONS.getPath(slotData);
        
        if (iconImg && iconImg.tagName === 'IMG') {
          iconImg.src = iconPath;
          iconImg.alt = slotData.id || slotData.type;
        }
        
        if (labelSpan) {
          if (index === 0) {
            labelSpan.textContent = 'Primary';
          } else {
            labelSpan.textContent = `Slot ${index + 1}`;
          }
        }
      }
    });
    
    // Also update radial menu icons if it exists
    updateRadialMenuIcons();
  };
  
  // Update radial menu icons to match equipment loadout
  const updateRadialMenuIcons = () => {
    const radialMenu = document.getElementById('radialMenu');
    if (!radialMenu) return;
    
    const equipClass = Save.data.armory.equipmentClass || defaultArmory().equipmentClass;
    const radialItems = radialMenu.querySelectorAll('.radial-item');
    
    radialItems.forEach((item, index) => {
      const slotData = equipClass[`slot${index + 1}`];
      if (slotData) {
        const iconImg = item.querySelector('img');
        const labelSpan = item.querySelector('span');
        
        const iconPath = EQUIPMENT_ICONS.getPath(slotData);
        
        if (iconImg) {
          iconImg.src = iconPath;
          iconImg.alt = slotData.id || slotData.type;
        }
        
        if (labelSpan) {
          if (index === 0) {
            labelSpan.textContent = 'Primary';
          } else {
            labelSpan.textContent = `Slot ${index + 1}`;
          }
        }
      }
    });
  };

  const drawStartGraphic = () => {
    const canvas = dom.startGraphicCanvas;
    if (!canvas) return;
    const g = canvas.getContext('2d');
    if (!g) return;
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

  const _showMessage = (title, html, button = 'Continue', handler) => {
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
    ['Offense', 'Defense', 'Utility', 'Special'].forEach((cat) => {
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
    
    // Black sleek background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);
    
    // Add subtle gradient
    const gradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width / 2);
    gradient.addColorStop(0, 'rgba(74, 222, 128, 0.15)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.8)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Fallback: draw generic weapon shape with item color
    const drawFallback = () => {
      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.rotate(-Math.PI / 8);
      ctx.fillStyle = item.color || '#4ade80';
      ctx.shadowBlur = 10;
      ctx.shadowColor = item.color || '#4ade80';
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
    
    // Load and display weapon icon if available
    const weaponType = item.id ? 
      (ARMORY.primary.find(w => w.id === item.id) ? 'primary' :
       ARMORY.secondary.find(w => w.id === item.id) ? 'secondary' :
       ARMORY.defense.find(w => w.id === item.id) ? 'defense' :
       ARMORY.ultimate.find(w => w.id === item.id) ? 'ultimate' : null) : null;
    
    if (weaponType && item.id) {
      const iconPath = `assets/icons/${weaponType}-${item.id}.svg`;
      const img = new Image();
      
      img.onload = () => {
        ctx.save();
        ctx.translate(width / 2, height / 2);
        // Apply glow effect with single draw
        ctx.shadowBlur = 15;
        ctx.shadowColor = item.color || '#4ade80';
        // Draw icon centered and scaled
        const iconSize = Math.min(width, height) * 0.6;
        ctx.drawImage(img, -iconSize / 2, -iconSize / 2, iconSize, iconSize);
        ctx.restore();
      };
      
      img.onerror = () => {
        // If icon fails to load, render fallback shape
        drawFallback();
      };
      
      img.src = iconPath;
    } else {
      // No weapon type identified, use fallback
      drawFallback();
    }
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
    preview.width = 280;
    preview.height = 140;
    card.appendChild(preview);
    const meta = document.createElement('div');
    meta.className = 'shipMeta';
    meta.innerHTML = `<h3>${ship.name}</h3><p>${ship.desc}</p>`;
    card.appendChild(meta);
    
    // Create visual stat bars
    const statsWrap = document.createElement('div');
    statsWrap.className = 'shipStats';
    
    // Base ship (Vanguard) has all stats at 1.0
    const baseShip = SHIP_TEMPLATES[0];
    
    for (const stat of HANGAR_STATS) {
      const mult = ship.stats && ship.stats[stat.key];
      if (mult === undefined) continue;
      
      const baseMult = baseShip.stats[stat.key] || 1;
      const inverted = !!stat.invert;
      
      // Calculate percentage (0-200%, where 100% is baseline)
      let percentage = inverted ? (baseMult / mult) * 100 : (mult / baseMult) * 100;
      percentage = Math.min(200, Math.max(0, percentage));
      
      const statRow = document.createElement('div');
      statRow.className = 'stat-row';
      
      const label = document.createElement('div');
      label.className = 'stat-label';
      label.innerHTML = `<strong>${stat.label}</strong><span>${formatMultiplier(mult, inverted)}</span>`;
      
      const barContainer = document.createElement('div');
      barContainer.className = 'stat-bar-container';
      
      const barFill = document.createElement('div');
      barFill.className = 'stat-bar-fill';
      
      // Color coding based on performance
      if (percentage < 85) {
        barFill.classList.add('stat-low');
      } else if (percentage > 115) {
        barFill.classList.add('stat-high');
      }
      
      barFill.style.width = `${percentage / 2}%`; // Scale to 0-100% for display
      
      barContainer.appendChild(barFill);
      statRow.appendChild(label);
      statRow.appendChild(barContainer);
      statsWrap.appendChild(statRow);
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
    
    // Draw space background with ship
    requestAnimationFrame(() => {
      const ctx = preview.getContext('2d');
      const width = preview.width;
      const height = preview.height;
      
      // Space background
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, width, height);
      
      // Stars
      ctx.fillStyle = '#fff';
      for (let i = 0; i < 40; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const size = Math.random() * 1.5 + 0.5;
        ctx.globalAlpha = Math.random() * 0.5 + 0.5;
        ctx.fillRect(x, y, size, size);
      }
      ctx.globalAlpha = 1;
      
      // Draw ship centered
      ctx.save();
      ctx.translate(width / 2, height / 2);
      drawShip(ctx, ship.id, 20 * (ship.scale || 1));
      ctx.restore();
    });
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
    updateComboSystem(); // Phase 1: Update combo timer
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
          
          // Phase 1: Show damage number
          spawnDamageNumber(enemy.x, enemy.y, bullet.damage, false);
          
          // Phase A.2: Hit flash on damage
          enemy.hitFlash = 150;
          
          addParticles('sparks', bullet.x, bullet.y, 0, 6);
          if (player) player.addUltimateCharge(bullet.damage * 0.35);
          
          // Play hit sound
          if (typeof AudioManager !== 'undefined') {
            AudioManager.playHit();
          }
          
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
        
        // Play coin pickup sound
        if (typeof AudioManager !== 'undefined') {
          AudioManager.playCoinPickup();
        }
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

    // Update environmental hazards
    updateHazards(dt);
    
    // Update platforms in planetary mode
    if (currentGameMode === 'planetary') {
      updatePlatforms(dt);
    }

    for (let i = enemies.length - 1; i >= 0; i--) {
      const enemy = enemies[i];
      const dx = player.x - enemy.x;
      const dy = player.y - enemy.y;
      const dist = Math.hypot(dx, dy);
      if (dist < player.size + enemy.size) {
        const now = performance.now();
        const isCharging = now < player.chargeActiveUntil;
        
        if (isCharging) {
          // Player is charging - damage enemy without taking damage
          enemy.health -= player.chargeDamage;
          addParticles('hit', enemy.x, enemy.y, 0, 16);
          shakeScreen(4, 120);
          
          if (enemy.health <= 0) {
            handleEnemyDeath(i);
          }
          
          // Don't take damage during charge if invulnerable
          if (!player.chargeInvulnerable) {
            const enemyDamage = enemy.getDamage();
            player.takeDamage(enemyDamage, enemy);
          }
        } else {
          // Normal collision - player takes damage
          enemies.splice(i, 1);
          const enemyDamage = enemy.getDamage();
          player.takeDamage(enemyDamage, enemy);
        }
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
        player.takeDamage(6, null);
      }
    }
    
    // Handle enemy bullets hitting player
    for (let i = bullets.length - 1; i >= 0; i--) {
      const bullet = bullets[i];
      if (!bullet.isEnemy) continue;
      const dx = player.x - bullet.x;
      const dy = player.y - bullet.y;
      if (Math.hypot(dx, dy) < player.size + bullet.size) {
        bullets.splice(i, 1);
        // Enemy bullets inherit shield penetration from adaptive scaling
        const adaptive = getAdaptiveScaling();
        const source = { shieldPenetration: adaptive.shieldPenetration * ADAPTIVE_CONSTANTS.BULLET_PENETRATION_FACTOR };
        player.takeDamage(bullet.damage, source);
      }
    }

    // Check wave completion (handles boss waves, survival waves, etc.)
    if (!checkWaveCompletion()) {
      // Normal level advancement for standard/elite/swarm waves
      if (enemiesKilled >= enemiesToKill && currentWaveType !== 'boss') {
        advanceLevel();
      }
    }
  };

  const advanceLevel = () => {
    Save.addCredits(Math.floor(20 + level * 5 + enemiesKilled * 1.5));
    addXP(90 + level * 12);
    if (!tookDamageThisLevel) addXP(110 + level * 18);
    
    // Play level advance sound
    if (typeof AudioManager !== 'undefined') {
      AudioManager.playLevelAdvance();
    }
    
    const completedLevel = level; // Store current level before incrementing
    level += 1;
    enemiesKilled = 0;
    
    // Determine wave type based on level and player power
    const adaptive = getAdaptiveScaling();
    const bossLevel = level % adaptive.bossInterval === 0;
    
    if (bossLevel) {
      currentWaveType = 'boss';
      addLogEntry(`⚠️ BOSS WAVE INCOMING!`, '#dc2626');
    } else if (level % 5 === 0 && getPowerRatio() > 0.3) {
      // Every 5th level (non-boss), special wave type
      const waveTypes = ['swarm', 'elite', 'survival', 'hazard'];
      currentWaveType = waveTypes[Math.floor(Math.random() * waveTypes.length)];
      const waveInfo = WAVE_TYPES[currentWaveType];
      addLogEntry(`🎯 ${waveInfo.name}: ${waveInfo.desc}`, '#f59e0b');
    } else {
      currentWaveType = 'standard';
    }
    
    const waveType = WAVE_TYPES[currentWaveType];
    const diff = getDifficulty();
    
    // Calculate enemies to kill with progressive scaling
    let baseEnemies;
    if (level <= ADAPTIVE_CONSTANTS.EASY_LEVELS) {
      // Early game: INCREASED from (8 + level * 2.5) to make levels less trivial
      baseEnemies = Math.floor((12 + level * 3.5) * diff.enemiesToKill);
    } else if (level <= ADAPTIVE_CONSTANTS.LATE_GAME_START) {
      // Mid game: standard scaling
      baseEnemies = Math.floor((10 + level * 5.5) * diff.enemiesToKill);
    } else {
      // Late game: more enemies with accelerated scaling
      const lateBonus = (level - ADAPTIVE_CONSTANTS.LATE_GAME_START) * 2;
      baseEnemies = Math.floor((10 + level * 7 + lateBonus) * diff.enemiesToKill);
    }
    if (waveType.enemyMultiplier) baseEnemies = Math.floor(baseEnemies * waveType.enemyMultiplier);
    enemiesToKill = baseEnemies;
    
    enemies = [];
    bullets = [];
    coins = [];
    supplies = [];
    spawners = [];
    particles = [];
    bossActive = false;
    bossEntity = null;
    waveStartTime = performance.now();
    
    // Survival waves use timer instead of kill count
    if (waveType.timerBased) {
      waveTimer = waveType.duration || 60000;
      enemiesToKill = 999999; // High number so kills don't trigger advance
    } else {
      waveTimer = 0;
    }
    
    // NEW: Enter ready-up phase instead of immediately starting countdown
    readyUpPhase = true;
    readyUpLevel = completedLevel;
    countdownActive = false;
    
    if (player) {
      player.reconfigureLoadout(false);
      player.x = window.innerWidth / 2 + camera.x;
      player.y = window.innerHeight / 2 + camera.y;
    }
    
    tookDamageThisLevel = false;
  };
  
  // NEW: Function to start countdown from ready-up phase
  const startCountdownFromReadyUp = () => {
    if (!readyUpPhase) return;
    
    readyUpPhase = false;
    countdownActive = true;
    countdownEnd = performance.now() + 3000;
    countdownCompletedLevel = readyUpLevel;
    
    // Set up level after countdown
    queueTimedEffect(3000, () => {
      countdownActive = false;
      spawnObstacles();
      spawnHazards();
      
      // Spawn rate modifier for wave types
      const waveType = WAVE_TYPES[currentWaveType];
      let spawnerCount = Math.min(1 + Math.floor(level / 2), 5);
      if (waveType.spawnRateBoost) spawnerCount = Math.ceil(spawnerCount * waveType.spawnRateBoost);
      createSpawners(spawnerCount, true);
      
      // Spawn boss for boss waves
      if (currentWaveType === 'boss') {
        spawnBoss();
      }
      
      recenterStars();
      lastTime = performance.now();
    });
  };

  // Spawn a boss enemy
  const spawnBoss = () => {
    if (!player) return;
    const pos = randomAround(player.x, player.y, viewRadius(0.6), viewRadius(0.9));
    const bossKind = Math.random() < 0.5 ? 'heavy' : 'chaser';
    bossEntity = new Enemy(pos.x, pos.y, bossKind, false, true);
    enemies.push(bossEntity);
    bossActive = true;
    addLogEntry('💀 BOSS HAS ARRIVED!', '#dc2626');
    shakeScreen(10, 400);
    
    // Play boss spawn sound
    if (typeof AudioManager !== 'undefined') {
      AudioManager.playBossSpawn();
    }
  };

  // Check if survival wave is complete
  const checkWaveCompletion = () => {
    const waveType = WAVE_TYPES[currentWaveType];
    
    if (waveType.timerBased && waveTimer > 0) {
      const elapsed = performance.now() - waveStartTime;
      if (elapsed >= waveType.duration) {
        addLogEntry('✅ Survival complete!', '#4ade80');
        advanceLevel();
        return true;
      }
    }
    
    if (currentWaveType === 'boss') {
      // Boss wave ends when boss is dead (removed from enemies array)
      // bossEntity is set to null when the boss dies in handleEnemyDeath
      if (bossActive && !bossEntity) {
        addLogEntry('🎉 BOSS DEFEATED!', '#4ade80');
        bossActive = false;
        // Give bonus rewards
        Save.addCredits(level * 50);
        addXP(level * 100);
        advanceLevel();
        return true;
      }
      // Don't advance from normal kills in boss wave
      return false;
    }
    
    return false;
  };

  /* ====== RENDERING ====== */
  const drawGame = () => {
    if (!dom.ctx) return;
    
    // Check if 3D mode is active
    if (use3DMode && game3DInstance && game3DInstance.isActive()) {
      // Get current ship configuration
      const shipConfig = Save.data.shipConfig || SHIP_TEMPLATES[0];
      
      // Update 3D entities (sync 2D state to 3D)
      game3DInstance.update({
        player: player,
        bullets: bullets,
        enemies: enemies,
        obstacles: obstacles,
        coins: coins,
        shipData: {
          shape: shipConfig.shape || 'spear',
          scale: shipConfig.scale || 1,
          colors: shipConfig.colors || {
            primary: '#0ea5e9',
            accent: '#38bdf8',
            thruster: '#f97316',
            trim: '#f8fafc',
            canopy: '#7dd3fc'
          }
        },
        boosting: keys.boost || false,
        camera: camera
      });
      
      // Update particles
      game3DInstance.updateParticles(16.67);
      
      // Render 3D scene
      game3DInstance.render();
      
      // Note: HUD and overlays are still rendered separately in 2D (updateHUD())
      // Draw FPS counter on top of 3D if enabled
      if (showFPS && fps > 0) {
        const ctx = dom.ctx;
        ctx.save();
        ctx.font = 'bold 16px monospace';
        ctx.fillStyle = fps >= 55 ? '#4ade80' : fps >= 30 ? '#fbbf24' : '#ef4444';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.textAlign = 'right';
        ctx.strokeText(`${fps} FPS`, dom.canvas.width - 10, 30);
        ctx.fillText(`${fps} FPS`, dom.canvas.width - 10, 30);
        ctx.restore();
      }
      
      return; // Exit early, 3D rendering is done
    }
    
    // Fallback to 2D rendering
    const ctx = dom.ctx;
    const canvas = dom.canvas;
    
    // Different background for planetary vs space mode
    if (currentGameMode === 'planetary' && currentPlanet) {
      // Planetary mode: Draw planet-specific background
      drawPlanetaryBackground(ctx);
    } else {
      // Space mode: Dark space background
      ctx.fillStyle = '#030712';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    let shakeX = 0;
    let shakeY = 0;
    if (performance.now() < shakeUntil) {
      shakeX = (Math.random() * 2 - 1) * shakePower;
      shakeY = (Math.random() * 2 - 1) * shakePower;
    }
    ctx.save();
    ctx.translate(-camera.x + shakeX, -camera.y + shakeY);
    
    // Draw background layers based on game mode
    if (currentGameMode === 'planetary' && currentPlanet) {
      // Planetary mode: Draw terrain and platforms
      drawPlanetaryTerrain(ctx);
      drawPlatforms(ctx);
    } else {
      // Space mode: Draw realistic multi-layer starfield
      if (starsDeepSpace) {
        drawEnhancedStarsLayer(ctx, starsDeepSpace, 0.05);
      }
      if (starsFar) {
        drawStarsLayer(ctx, starsFar, 0.1);
        drawStarsLayer(ctx, starsMid, 0.15);
        drawStarsLayer(ctx, starsNear, 0.2);
      }
      if (starsBright) {
        drawEnhancedStarsLayer(ctx, starsBright, 0.25);
      }
      
      // Draw celestial bodies and hazards (background layer)
      drawEnvironment(ctx);
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
    
    // Phase 1: Draw enemy health bars
    for (const enemy of enemies) {
      if (enemy.health < enemy.maxHealth) {
        const barWidth = enemy.size * 2.5;
        const barHeight = 4;
        const barX = enemy.x - barWidth / 2;
        const barY = enemy.y - enemy.size - 12;
        
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Health fill
        const healthPct = enemy.health / enemy.maxHealth;
        const fillColor = healthPct > 0.6 ? '#4ade80' : healthPct > 0.3 ? '#fbbf24' : '#ef4444';
        ctx.fillStyle = fillColor;
        ctx.fillRect(barX, barY, barWidth * healthPct, barHeight);
        
        // Border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
      }
    }
    
    // Phase 1: Draw floating damage numbers
    for (let i = damageNumbers.length - 1; i >= 0; i--) {
      const dmg = damageNumbers[i];
      const age = performance.now() - dmg.time;
      if (age > dmg.lifetime) {
        damageNumbers.splice(i, 1);
        continue;
      }
      
      const alpha = 1 - (age / dmg.lifetime);
      const yOffset = age * 0.05;
      ctx.save();
      ctx.font = `bold ${dmg.size}px Arial`;
      ctx.fillStyle = dmg.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
      ctx.strokeStyle = `rgba(0, 0, 0, ${alpha * 0.8})`;
      ctx.lineWidth = 3;
      ctx.textAlign = 'center';
      ctx.strokeText(dmg.text, dmg.x, dmg.y - yOffset);
      ctx.fillText(dmg.text, dmg.x, dmg.y - yOffset);
      ctx.restore();
    }
    
    drawParticles(ctx, 16.67);
    player.draw(ctx);
    ctx.restore();
    
    // Draw FPS counter if enabled
    if (showFPS && fps > 0) {
      ctx.save();
      ctx.font = 'bold 16px monospace';
      ctx.fillStyle = fps >= 55 ? '#4ade80' : fps >= 30 ? '#fbbf24' : '#ef4444';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3;
      ctx.textAlign = 'right';
      ctx.strokeText(`${fps} FPS`, canvas.width - 10, 30);
      ctx.fillText(`${fps} FPS`, canvas.width - 10, 30);
      ctx.restore();
    }
    
    // SUBTLE: Draw combo counter - SMALLER, positioned in TOP RIGHT corner, out of gameplay area
    const now = performance.now();
    if (comboCount > 1 && now < comboTimer) {
      ctx.save();
      const comboAge = now - (comboTimer - COMBO_TIMEOUT);
      const appearScale = Math.min(1, comboAge / 150);
      
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';
      
      const screenWidth = window.innerWidth;
      
      // REPOSITIONED: Top right corner, away from gameplay
      const x = screenWidth - 15;
      const y = 70; // Below HUD
      
      // Get tier-based styling
      const tier = getTierFromCount(comboCount, COMBO_VISUAL_CONFIG.TIER_THRESHOLDS);
      const tierColors = {
        1: { main: '#4ade80', glow: '#22c55e' },
        2: { main: '#fbbf24', glow: '#f59e0b' },
        3: { main: '#f97316', glow: '#ea580c' },
        4: { main: '#a855f7', glow: '#9333ea' },
        5: { main: '#ec4899', glow: '#db2777' }
      };
      const colors = tierColors[tier];
      
      // MUCH SMALLER: Simple text-based display
      const comboFontSize = 18;
      ctx.font = `bold ${Math.floor(comboFontSize * appearScale)}px Arial, sans-serif`;
      ctx.fillStyle = colors.main;
      ctx.shadowColor = colors.glow;
      ctx.shadowBlur = 8;
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.lineWidth = 2;
      ctx.strokeText(`${comboCount}x COMBO`, x, y);
      ctx.fillText(`${comboCount}x COMBO`, x, y);
      
      ctx.shadowBlur = 0;
      ctx.restore();
    }
    
    // Phase 1: Draw level-up celebration
    if (levelUpAnimationActive) {
      const elapsed = now - levelUpAnimationStart;
      if (elapsed > LEVEL_UP_DURATION) {
        levelUpAnimationActive = false;
      } else {
        ctx.save();
        const progress = elapsed / LEVEL_UP_DURATION;
        const alpha = progress < 0.3 ? progress / 0.3 : 1 - ((progress - 0.3) / 0.7);
        
        // Full screen flash
        ctx.fillStyle = `rgba(74, 222, 128, ${alpha * 0.15})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Center text
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        const scale = progress < 0.2 ? progress / 0.2 : 1;
        const yOffset = progress < 0.5 ? 0 : (progress - 0.5) * 100;
        
        ctx.font = `bold ${Math.floor(64 * scale)}px Arial`;
        ctx.fillStyle = `rgba(74, 222, 128, ${alpha})`;
        ctx.shadowColor = '#4ade80';
        ctx.shadowBlur = 30;
        ctx.fillText('LEVEL UP!', centerX, centerY - 50 - yOffset);
        
        ctx.font = `bold ${Math.floor(48 * scale)}px Arial`;
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.shadowBlur = 20;
        ctx.fillText(`PILOT LEVEL ${pilotLevel}`, centerX, centerY + 20 - yOffset);
        
        ctx.shadowBlur = 0;
        ctx.restore();
        
        // Particle burst
        if (elapsed < 300 && Math.random() < 0.3) {
          addParticles('levelup', player.x, player.y, Math.random() * Math.PI * 2, 3);
        }
      }
    }
    
    // SUBTLE: Draw kill streak popup - SMALLER, positioned in TOP RIGHT, out of the way
    if (killStreakPopup) {
      const elapsed = now - killStreakPopup.startTime;
      if (elapsed > KILL_STREAK_POPUP_DURATION) {
        killStreakPopup = null;
      } else {
        ctx.save();
        const progress = elapsed / KILL_STREAK_POPUP_DURATION;
        
        // Simple fade animation
        let alpha;
        if (progress < 0.1) {
          alpha = progress / 0.1;
        } else if (progress < 0.8) {
          alpha = 1;
        } else {
          alpha = 1 - ((progress - 0.8) / 0.2);
        }
        
        const screenWidth = window.innerWidth;
        
        // REPOSITIONED: Top right corner, below combo
        const x = screenWidth - 15;
        const y = 95; // Below combo counter
        
        // Tier-based styling - simplified
        const tierStyles = {
          1: { main: '#f97316', glow: '#ea580c' },
          2: { main: '#ef4444', glow: '#dc2626' },
          3: { main: '#a855f7', glow: '#9333ea' },
          4: { main: '#ec4899', glow: '#db2777' },
          5: { main: '#facc15', glow: '#eab308' }
        };
        const style = tierStyles[killStreakPopup.tier] || tierStyles[1];
        
        // MUCH SMALLER: Simple text display
        ctx.textAlign = 'right';
        ctx.textBaseline = 'top';
        const textSize = 16;
        ctx.font = `bold ${textSize}px Arial, sans-serif`;
        ctx.fillStyle = style.main;
        ctx.globalAlpha = alpha;
        ctx.shadowColor = style.glow;
        ctx.shadowBlur = 6;
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.lineWidth = 2;
        ctx.strokeText(`${killStreakPopup.milestone} KILL STREAK`, x, y);
        ctx.fillText(`${killStreakPopup.milestone} KILL STREAK`, x, y);
        
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
        ctx.restore();
      }
    }
    
    // Ready-up overlay is drawn separately after HUD (see drawReadyUpOverlay function)
    
    // Draw countdown - ENHANCED: Better positioning and styling to prevent overlap
    if (countdownActive) {
      const timeRemaining = countdownEnd - performance.now();
      const now = performance.now();
      
      ctx.save();
      
      // Use window dimensions for proper positioning (canvas has DPR transform applied)
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      const isPortrait = screenHeight > screenWidth;
      
      // ENHANCED: Semi-transparent overlay that adapts to screen size
      const overlayOpacity = isPortrait ? 0.96 : 0.94;
      const gradientCenterY = screenHeight * 0.42;
      const gradient = ctx.createRadialGradient(
        screenWidth / 2, gradientCenterY, 0,
        screenWidth / 2, gradientCenterY, Math.max(screenWidth, screenHeight) * 0.75
      );
      gradient.addColorStop(0, `rgba(10, 15, 25, ${overlayOpacity})`);
      gradient.addColorStop(0.5, `rgba(15, 23, 42, ${overlayOpacity})`);
      gradient.addColorStop(1, `rgba(0, 0, 0, ${overlayOpacity + 0.02})`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, screenWidth, screenHeight);
      
      // ENHANCED: Animated scan lines effect (subtle)
      ctx.fillStyle = 'rgba(74, 222, 128, 0.02)';
      const scanLineOffset = (now / 25) % 10;
      for (let y = scanLineOffset; y < screenHeight; y += 10) {
        ctx.fillRect(0, y, screenWidth, 1);
      }
      
      // ENHANCED: Glowing corner accent lines with better visibility
      ctx.strokeStyle = 'rgba(74, 222, 128, 0.4)';
      ctx.lineWidth = 3;
      const cornerSize = isPortrait ? 35 : 45;
      
      // Top-left corner
      ctx.beginPath();
      ctx.moveTo(20, 20 + cornerSize);
      ctx.lineTo(20, 20);
      ctx.lineTo(20 + cornerSize, 20);
      ctx.stroke();
      
      // Top-right corner
      ctx.beginPath();
      ctx.moveTo(screenWidth - 20 - cornerSize, 20);
      ctx.lineTo(screenWidth - 20, 20);
      ctx.lineTo(screenWidth - 20, 20 + cornerSize);
      ctx.stroke();
      
      // Bottom-left corner
      ctx.beginPath();
      ctx.moveTo(20, screenHeight - 20 - cornerSize);
      ctx.lineTo(20, screenHeight - 20);
      ctx.lineTo(20 + cornerSize, screenHeight - 20);
      ctx.stroke();
      
      // Bottom-right corner
      ctx.beginPath();
      ctx.moveTo(screenWidth - 20 - cornerSize, screenHeight - 20);
      ctx.lineTo(screenWidth - 20, screenHeight - 20);
      ctx.lineTo(screenWidth - 20, screenHeight - 20 - cornerSize);
      ctx.stroke();
      
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Center coordinates for text and elements - ENHANCED: better positioning
      const centerX = screenWidth / 2;
      const centerY = isPortrait ? screenHeight * 0.45 : screenHeight * 0.5;
      
      // First 0.5 seconds: Show "LEVEL COMPLETE" - ENHANCED
      if (timeRemaining > 2500) {
        const appearPhase = Math.min(1, (3000 - timeRemaining) / 400);
        const bounceScale = 1 + Math.sin(appearPhase * Math.PI) * 0.12;
        
        // Decorative line above - ENHANCED
        const lineWidth = Math.min(250, screenWidth * 0.6) * appearPhase;
        ctx.strokeStyle = `rgba(74, 222, 128, ${0.7 * appearPhase})`;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(centerX - lineWidth / 2, centerY - (isPortrait ? 80 : 100));
        ctx.lineTo(centerX + lineWidth / 2, centerY - (isPortrait ? 80 : 100));
        ctx.stroke();
        
        // "LEVEL COMPLETE" text with glow - ENHANCED: better sizing for mobile
        const completeFontSize = isPortrait ? 40 : 52;
        ctx.font = `900 ${Math.floor(completeFontSize * bounceScale)}px Arial, sans-serif`;
        ctx.shadowColor = '#4ade80';
        ctx.shadowBlur = 45;
        
        // Double glow for extra pop
        ctx.fillStyle = '#4ade80';
        ctx.fillText('LEVEL COMPLETE', centerX, centerY - (isPortrait ? 40 : 50));
        ctx.shadowBlur = 25;
        ctx.fillText('LEVEL COMPLETE', centerX, centerY - (isPortrait ? 40 : 50));
        
        // Text outline for better contrast
        ctx.strokeStyle = 'rgba(0,0,0,0.7)';
        ctx.lineWidth = 3;
        ctx.shadowBlur = 0;
        ctx.strokeText('LEVEL COMPLETE', centerX, centerY - (isPortrait ? 40 : 50));
        ctx.shadowBlur = 0;
        
        // Level number badge - ENHANCED
        const badgeWidth = isPortrait ? 140 : 170;
        const badgeHeight = isPortrait ? 45 : 55;
        ctx.fillStyle = 'rgba(74, 222, 128, 0.18)';
        ctx.beginPath();
        ctx.roundRect(centerX - badgeWidth / 2, centerY - 8, badgeWidth, badgeHeight, 10);
        ctx.fill();
        ctx.strokeStyle = 'rgba(74, 222, 128, 0.6)';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        const levelFontSize = isPortrait ? 24 : 30;
        ctx.font = `bold ${levelFontSize}px Arial, sans-serif`;
        ctx.fillStyle = '#fff';
        ctx.shadowColor = '#4ade80';
        ctx.shadowBlur = 10;
        ctx.fillText(`Level ${countdownCompletedLevel}`, centerX, centerY + (isPortrait ? 14 : 20));
        ctx.shadowBlur = 0;
        
        // "Get Ready" with animated dots - ENHANCED
        const dotCount = Math.floor((now / 400) % 4);
        const dots = '.'.repeat(dotCount);
        const readyFontSize = isPortrait ? 16 : 18;
        ctx.font = `${readyFontSize}px Arial, sans-serif`;
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(`Get Ready${dots}`, centerX, centerY + (isPortrait ? 55 : 70));
        
        // Decorative line below - ENHANCED
        const bottomLineY = isPortrait ? 80 : 100;
        ctx.strokeStyle = `rgba(74, 222, 128, ${0.5 * appearPhase})`;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(centerX - lineWidth / 2, centerY + bottomLineY);
        ctx.lineTo(centerX + lineWidth / 2, centerY + bottomLineY);
        ctx.stroke();
      } 
      // Remaining time: Show countdown and next level - ENHANCED
      else if (timeRemaining > 0) {
        const countdown = Math.ceil(timeRemaining / 1000);
        const countdownFraction = (timeRemaining / 1000) % 1;
        const pulseScale = 1 + (1 - countdownFraction) * 0.18;
        const pulseOpacity = 0.4 + countdownFraction * 0.6;
        
        // "LEVEL X" header with accent - ENHANCED
        const levelHeaderSize = isPortrait ? 28 : 36;
        ctx.font = `900 ${levelHeaderSize}px Arial, sans-serif`;
        ctx.fillStyle = '#60a5fa';
        ctx.shadowColor = '#60a5fa';
        ctx.shadowBlur = 18;
        ctx.fillText(`LEVEL ${level}`, centerX, centerY - (isPortrait ? 80 : 100));
        
        // Outline for better contrast
        ctx.strokeStyle = 'rgba(0,0,0,0.7)';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 0;
        ctx.strokeText(`LEVEL ${level}`, centerX, centerY - (isPortrait ? 80 : 100));
        ctx.shadowBlur = 0;
        
        // Small accent line under header - ENHANCED
        const accentLineWidth = isPortrait ? 50 : 70;
        ctx.strokeStyle = 'rgba(96, 165, 250, 0.6)';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(centerX - accentLineWidth, centerY - (isPortrait ? 60 : 75));
        ctx.lineTo(centerX + accentLineWidth, centerY - (isPortrait ? 60 : 75));
        ctx.stroke();
        
        // REMOVED: "Starting in" text as requested
        
        // Countdown circle ring - ENHANCED: adaptive sizing
        const ringRadius = isPortrait ? 60 : 75;
        const ringY = isPortrait ? 15 : 20;
        ctx.strokeStyle = 'rgba(74, 222, 128, 0.25)';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(centerX, centerY + ringY, ringRadius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Animated progress ring - ENHANCED
        const progressAngle = (1 - countdownFraction) * Math.PI * 2;
        ctx.strokeStyle = '#4ade80';
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.shadowColor = '#4ade80';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(centerX, centerY + ringY, ringRadius, -Math.PI / 2, -Math.PI / 2 + progressAngle);
        ctx.stroke();
        ctx.lineCap = 'butt';
        ctx.shadowBlur = 0;
        
        // Pulsing glow circle behind number - ENHANCED
        ctx.beginPath();
        ctx.arc(centerX, centerY + ringY, 50 * pulseScale, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(74, 222, 128, ${0.15 * pulseOpacity})`;
        ctx.fill();
        
        // Big countdown number - ENHANCED: better sizing and effects
        const countdownSize = isPortrait ? 75 : 95;
        ctx.font = `900 ${Math.floor(countdownSize * pulseScale)}px Arial, sans-serif`;
        ctx.fillStyle = '#4ade80';
        ctx.shadowColor = '#4ade80';
        ctx.shadowBlur = 35 * pulseOpacity;
        ctx.fillText(countdown, centerX, centerY + (isPortrait ? 25 : 32));
        
        // Number outline for better contrast
        ctx.strokeStyle = 'rgba(0,0,0,0.8)';
        ctx.lineWidth = 4;
        ctx.shadowBlur = 0;
        ctx.strokeText(countdown, centerX, centerY + (isPortrait ? 25 : 32));
        ctx.shadowBlur = 0;
        
        // Small decorative particles around the ring - ENHANCED
        ctx.fillStyle = 'rgba(74, 222, 128, 0.7)';
        ctx.shadowColor = 'rgba(74, 222, 128, 0.5)';
        ctx.shadowBlur = 5;
        const particleCount = 10;
        for (let i = 0; i < particleCount; i++) {
          const angle = (i / particleCount) * Math.PI * 2 + (now / 2000);
          const px = centerX + Math.cos(angle) * (ringRadius + 18);
          const py = centerY + ringY + Math.sin(angle) * (ringRadius + 18);
          const particleSize = 2.5 + Math.sin(now / 200 + i) * 1.2;
          ctx.beginPath();
          ctx.arc(px, py, particleSize, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.shadowBlur = 0;
      }
      
      ctx.restore();
    }
  };

  /* ====== MAIN LOOP ====== */
  let animationFrame = null;

  const loop = (timestamp) => {
    // Calculate FPS
    fpsFrames++;
    if (timestamp - fpsLastTime >= 1000) {
      fps = Math.round(fpsFrames * 1000 / (timestamp - fpsLastTime));
      fpsFrames = 0;
      fpsLastTime = timestamp;
    }
    
    if (!gameRunning) {
      if (!gameOverHandled) handleGameOver();
      return;
    }
    
    // Always draw during countdown or ready-up, but don't update game logic
    if (countdownActive || readyUpPhase) {
      drawGame();
      updateHUD();
      drawReadyUpOverlay(); // Draw ready-up AFTER HUD so it's on top of everything
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

  const setupCanvas = () => {
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    dom.canvas.width = Math.floor(window.innerWidth * dpr);
    dom.canvas.height = Math.floor(window.innerHeight * dpr);
    dom.canvas.style.width = '100%';
    dom.canvas.style.height = '100%';
    
    // Create 2D context if needed (for 2D mode or for star initialization even in 3D mode)
    if (!dom.ctx && dom.canvas && !use3DMode) {
      dom.ctx = dom.canvas.getContext('2d');
    }
    
    if (dom.ctx) {
      dom.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    return dpr;
  };

  const startLevel = (lvl, resetScore) => {
    level = lvl;
    if (resetScore) score = 0;
    enemiesKilled = 0;
    // Use the improved scaling with difficulty
    const diff = getDifficulty();
    // Progressive enemy count calculation
    let baseEnemies;
    if (level <= ADAPTIVE_CONSTANTS.EASY_LEVELS) {
      baseEnemies = Math.floor((8 + level * 2.5) * diff.enemiesToKill);
    } else if (level <= ADAPTIVE_CONSTANTS.LATE_GAME_START) {
      baseEnemies = Math.floor((10 + level * 5.5) * diff.enemiesToKill);
    } else {
      const lateBonus = (level - ADAPTIVE_CONSTANTS.LATE_GAME_START) * 2;
      baseEnemies = Math.floor((10 + level * 7 + lateBonus) * diff.enemiesToKill);
    }
    enemiesToKill = baseEnemies;
    setupCanvas();
    
    // Initialize player position based on game mode
    if (currentGameMode === 'planetary' && currentPlanet) {
      // Planetary mode: Generate terrain first, then place player
      generatePlanetaryTerrain(currentPlanet);
      const startX = dom.canvas.width / 2;
      const startY = getGroundYAt(startX) - BASE.PLAYER_SIZE - 50;
      player = new PlayerEntity(startX, startY);
      player.velocityY = 0;
      player.isGrounded = false;
      player.canJump = true;
    } else {
      // Space mode: Center player
      player = new PlayerEntity(dom.canvas.width / 2, dom.canvas.height / 2);
    }
    
    camera.x = player.x - dom.canvas.width / 2;
    camera.y = player.y - dom.canvas.height / 2;
    
    // Only spawn obstacles and hazards in space mode
    if (currentGameMode !== 'planetary') {
      spawnObstacles();
      spawnHazards();
    }
    
    createSpawners(Math.min(1 + Math.floor(level / 2), 5), resetScore);
    
    // Initialize stars only for space mode
    if (currentGameMode !== 'planetary') {
      if (!starsFar) {
        initStarLayers();
      } else {
        recenterStars();
      }
    }
    
    lastTime = performance.now();
    lastAmmoRegen = lastTime;
    gameRunning = true;
    paused = false;
    loop(lastTime);
  };

  // NEW: Draw ready-up overlay AFTER HUD - Mobile-focused design, covers everything
  const drawReadyUpOverlay = () => {
    if (!readyUpPhase || !dom.ctx) return;
    
    const ctx = dom.ctx;
    const now = performance.now();
    ctx.save();
    
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const isPortrait = screenHeight > screenWidth;
    
    // FULL OPACITY overlay to completely cover game
    const overlayOpacity = 0.98;
    const gradient = ctx.createRadialGradient(
      screenWidth / 2, screenHeight * 0.5, 0,
      screenWidth / 2, screenHeight * 0.5, Math.max(screenWidth, screenHeight) * 0.8
    );
    gradient.addColorStop(0, `rgba(5, 10, 20, ${overlayOpacity})`);
    gradient.addColorStop(0.4, `rgba(10, 15, 25, ${overlayOpacity})`);
    gradient.addColorStop(0.7, `rgba(15, 23, 42, ${overlayOpacity})`);
    gradient.addColorStop(1, `rgba(0, 0, 0, ${overlayOpacity + 0.02})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, screenWidth, screenHeight);
    
    // Scan lines for tech aesthetic
    ctx.fillStyle = 'rgba(74, 222, 128, 0.05)';
    const scanLineOffset = (now / 25) % 10;
    for (let y = scanLineOffset; y < screenHeight; y += 10) {
      ctx.fillRect(0, y, screenWidth, 2);
    }
    
    // Corner accents
    ctx.strokeStyle = 'rgba(74, 222, 128, 0.6)';
    ctx.lineWidth = 4;
    const cornerSize = isPortrait ? 50 : 70;
    
    ['tl', 'tr', 'bl', 'br'].forEach(corner => {
      ctx.beginPath();
      if (corner === 'tl') {
        ctx.moveTo(25, 25 + cornerSize);
        ctx.lineTo(25, 25);
        ctx.lineTo(25 + cornerSize, 25);
      } else if (corner === 'tr') {
        ctx.moveTo(screenWidth - 25 - cornerSize, 25);
        ctx.lineTo(screenWidth - 25, 25);
        ctx.lineTo(screenWidth - 25, 25 + cornerSize);
      } else if (corner === 'bl') {
        ctx.moveTo(25, screenHeight - 25 - cornerSize);
        ctx.lineTo(25, screenHeight - 25);
        ctx.lineTo(25 + cornerSize, screenHeight - 25);
      } else {
        ctx.moveTo(screenWidth - 25 - cornerSize, screenHeight - 25);
        ctx.lineTo(screenWidth - 25, screenHeight - 25);
        ctx.lineTo(screenWidth - 25, screenHeight - 25 - cornerSize);
      }
      ctx.stroke();
    });
    
    // Decorative border frame
    ctx.strokeStyle = 'rgba(74, 222, 128, 0.3)';
    ctx.lineWidth = 2;
    ctx.strokeRect(35, 35, screenWidth - 70, screenHeight - 70);
    
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const centerX = screenWidth / 2;
    const centerY = screenHeight * 0.5;
    
    // MOBILE-SIZED: Smaller "LEVEL COMPLETE" text
    const completeFontSize = isPortrait ? 32 : 42;
    ctx.font = `900 ${completeFontSize}px Arial, sans-serif`;
    ctx.fillStyle = '#4ade80';
    ctx.shadowColor = '#4ade80';
    ctx.shadowBlur = 30;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.lineWidth = 3;
    ctx.strokeText('LEVEL COMPLETE', centerX, centerY - (isPortrait ? 140 : 160));
    ctx.fillText('LEVEL COMPLETE', centerX, centerY - (isPortrait ? 140 : 160));
    
    // Decorative line
    ctx.strokeStyle = '#4ade80';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    const lineWidth = isPortrait ? 150 : 220;
    ctx.moveTo(centerX - lineWidth / 2, centerY - (isPortrait ? 110 : 125));
    ctx.lineTo(centerX + lineWidth / 2, centerY - (isPortrait ? 110 : 125));
    ctx.stroke();
    ctx.shadowBlur = 0;
    
    // MOBILE-SIZED: Level number
    const levelFontSize = isPortrait ? 24 : 32;
    ctx.font = `bold ${levelFontSize}px Arial, sans-serif`;
    ctx.fillStyle = '#cbd5e1';
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.lineWidth = 2;
    ctx.strokeText(`Level ${readyUpLevel}`, centerX, centerY - (isPortrait ? 80 : 95));
    ctx.fillText(`Level ${readyUpLevel}`, centerX, centerY - (isPortrait ? 80 : 95));
    
    // MOBILE-SIZED: Credits display
    const infoFontSize = isPortrait ? 18 : 24;
    ctx.font = `bold ${infoFontSize}px Arial, sans-serif`;
    ctx.fillStyle = '#fbbf24';
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 8;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.lineWidth = 2;
    ctx.strokeText(`💰 ${Save.data.credits} Credits`, centerX, centerY - (isPortrait ? 45 : 55));
    ctx.fillText(`💰 ${Save.data.credits} Credits`, centerX, centerY - (isPortrait ? 45 : 55));
    ctx.shadowBlur = 0;
    
    // MOBILE-SIZED: Action button
    const pulsePhase = Math.sin(now / 350) * 0.12 + 1;
    const buttonWidth = isPortrait ? 240 : 320;
    const buttonHeight = isPortrait ? 65 : 80;
    
    // Button glow
    ctx.shadowColor = '#4ade80';
    ctx.shadowBlur = 35 * pulsePhase;
    
    // Button background with gradient
    const btnGradient = ctx.createLinearGradient(
      centerX - buttonWidth / 2, centerY - buttonHeight / 2,
      centerX + buttonWidth / 2, centerY + buttonHeight / 2
    );
    btnGradient.addColorStop(0, `rgba(34, 197, 94, ${0.3 * pulsePhase})`);
    btnGradient.addColorStop(0.5, `rgba(74, 222, 128, ${0.25 * pulsePhase})`);
    btnGradient.addColorStop(1, `rgba(34, 197, 94, ${0.3 * pulsePhase})`);
    ctx.fillStyle = btnGradient;
    ctx.beginPath();
    ctx.roundRect(centerX - (buttonWidth * pulsePhase) / 2, centerY - (buttonHeight * pulsePhase) / 2, 
                   buttonWidth * pulsePhase, buttonHeight * pulsePhase, 14);
    ctx.fill();
    
    // Button border
    ctx.strokeStyle = '#4ade80';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.shadowBlur = 0;
    
    // Button text - MOBILE-SIZED
    const buttonTextSize = isPortrait ? 28 : 36;
    ctx.font = `900 ${buttonTextSize}px Arial, sans-serif`;
    ctx.fillStyle = '#4ade80';
    ctx.shadowColor = '#4ade80';
    ctx.shadowBlur = 18;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.lineWidth = 3;
    ctx.strokeText('TAP TO START', centerX, centerY);
    ctx.fillText('TAP TO START', centerX, centerY);
    
    // MOBILE-FOCUSED: Single tap instruction (removed keyboard references)
    const instructSize = isPortrait ? 15 : 18;
    ctx.font = `${instructSize}px Arial, sans-serif`;
    ctx.fillStyle = '#e2e8f0';
    ctx.shadowBlur = 4;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.fillText('Tap anywhere to continue', centerX, centerY + (isPortrait ? 60 : 70));
    
    // Shop hint - MOBILE-SIZED (updated to reference menu)
    ctx.font = `bold ${instructSize}px Arial, sans-serif`;
    ctx.fillStyle = '#60a5fa';
    ctx.shadowColor = '#60a5fa';
    ctx.shadowBlur = 6;
    ctx.fillText('Open menu (top right) for shop & upgrades', centerX, centerY + (isPortrait ? 90 : 105));
    
    ctx.restore();
  };

  const startGame = () => {
    resetRuntimeState();
    currentDifficulty = Save.data.difficulty || 'normal';  // Load saved difficulty
    
    // Always use space mode (planetary mode removed)
    currentGameMode = 'space';
    currentPlanet = null;
    
    initShipSelection();
    dom.startScreen.style.display = 'none';
    dom.gameContainer.style.display = 'block';
    dom.messageBox.style.display = 'none';
    
    // Initialize audio system on user interaction (required for Chrome autoplay policy)
    if (typeof AudioManager !== 'undefined') {
      AudioManager.init();
      AudioManager.startMusic();
    }
    
    startLevel(1, true);
  };

  /* ====== PAUSE MENU & GAME STATE MANAGEMENT ====== */
  const SAVE_SLOT_KEY = 'void_rift_game_slot_v1';
  
  // Guard flags to prevent race conditions
  let isExiting = false;
  let isRestarting = false;
  let isLoading = false;
  
  const showPauseMenu = () => {
    if (dom.pauseMenuModal) {
      dom.pauseMenuModal.style.display = 'flex';
      if (dom.pauseMenuMessage) dom.pauseMenuMessage.textContent = '';
      // Set focus to the first button for keyboard accessibility
      setTimeout(() => {
        if (dom.resumeGameBtn) dom.resumeGameBtn.focus();
      }, 0);
    }
  };
  
  const hidePauseMenu = () => {
    if (dom.pauseMenuModal) {
      dom.pauseMenuModal.style.display = 'none';
    }
  };
  
  const togglePause = () => {
    if (!gameRunning) {
      openShop();
      return;
    }
    paused = !paused;
    if (paused) {
      cancelAnimationFrame(animationFrame);
      showPauseMenu();
    } else {
      hidePauseMenu();
      lastTime = performance.now();
      animationFrame = requestAnimationFrame(loop);
    }
  };
  
  const resumeGame = () => {
    if (!gameRunning || !paused) return;
    paused = false;
    hidePauseMenu();
    lastTime = performance.now();
    animationFrame = requestAnimationFrame(loop);
  };
  
  const exitToMainMenu = () => {
    if (isExiting) return;
    isExiting = true;
    
    // Confirm before exiting
    if (dom.pauseMenuMessage) {
      dom.pauseMenuMessage.textContent = 'Exiting to main menu...';
      dom.pauseMenuMessage.className = 'pause-menu-message info';
    }
    
    setTimeout(() => {
      // Reset runtime state
      resetRuntimeState();
      
      // Return to main menu
      returnToMainMenu();
      
      isExiting = false;
    }, 500);
  };
  
  const restartGame = () => {
    if (isRestarting) return;
    isRestarting = true;
    
    if (dom.pauseMenuMessage) {
      dom.pauseMenuMessage.textContent = 'Restarting game...';
      dom.pauseMenuMessage.className = 'pause-menu-message info';
    }
    
    setTimeout(() => {
      // Hide pause menu
      hidePauseMenu();
      
      // Restart from level 1
      resetRuntimeState();
      initShipSelection();
      startLevel(1, true);
      
      isRestarting = false;
    }, 500);
  };
  
  const saveGameSlot = () => {
    if (!gameRunning || !player) {
      if (dom.pauseMenuMessage) {
        dom.pauseMenuMessage.textContent = 'No active game to save!';
        dom.pauseMenuMessage.className = 'pause-menu-message error';
      }
      return;
    }
    
    try {
      // NOTE: This save system only preserves core game state and player stats.
      // Active entities (enemies, bullets, items) are not saved and will be
      // regenerated when the game is loaded, effectively starting a "fresh" level.
      const gameState = {
        // Core game state
        level: level,
        score: score,
        enemiesKilled: enemiesKilled,
        enemiesToKill: enemiesToKill,
        difficulty: currentDifficulty,
        
        // Player state
        playerX: player.x,
        playerY: player.y,
        playerHealth: player.health,
        playerAmmo: player.ammo,
        playerShield: player.shield || 0,
        playerSecondaryCharges: player.secondaryCharges || 0,
        playerDefenseCooldown: player.defenseCooldown || 0,
        playerUltCharge: player.ultCharge || 0,
        
        // Pilot progression
        pilotLevel: pilotLevel,
        pilotXP: pilotXP,
        
        // Ship and loadout
        selectedShip: Save.data.selectedShip,
        
        // Timestamp
        savedAt: Date.now(),
        savedAtReadable: new Date().toLocaleString()
      };
      
      localStorage.setItem(SAVE_SLOT_KEY, JSON.stringify(gameState));
      
      if (dom.pauseMenuMessage) {
        dom.pauseMenuMessage.textContent = '✓ Game saved successfully!';
        dom.pauseMenuMessage.className = 'pause-menu-message success';
        
        // Auto-clear success message after 3 seconds
        setTimeout(() => {
          if (dom.pauseMenuMessage && dom.pauseMenuMessage.textContent === '✓ Game saved successfully!') {
            dom.pauseMenuMessage.textContent = '';
            dom.pauseMenuMessage.className = 'pause-menu-message';
          }
        }, 3000);
      }
      
      addLogEntry('Game saved', '#4ade80');
    } catch (err) {
      console.error('Failed to save game:', err);
      if (dom.pauseMenuMessage) {
        dom.pauseMenuMessage.textContent = '✗ Failed to save game!';
        dom.pauseMenuMessage.className = 'pause-menu-message error';
      }
    }
  };
  
  const loadGameSlot = () => {
    if (isLoading) return;
    isLoading = true;
    
    try {
      const raw = localStorage.getItem(SAVE_SLOT_KEY);
      if (!raw) {
        if (dom.pauseMenuMessage) {
          dom.pauseMenuMessage.textContent = 'No saved game found!';
          dom.pauseMenuMessage.className = 'pause-menu-message error';
        }
        isLoading = false;
        return;
      }
      
      const gameState = JSON.parse(raw);

      // Validate critical fields
      if (
        typeof gameState.level !== 'number' ||
        gameState.level < 1 ||
        gameState.level > 1000
      ) {
        throw new Error('Invalid level in save data');
      }
      if (
        typeof gameState.playerX !== 'number' ||
        typeof gameState.playerY !== 'number'
      ) {
        throw new Error('Invalid player position in save data');
      }
      if (
        typeof gameState.score !== 'number' ||
        gameState.score < 0
      ) {
        throw new Error('Invalid score in save data');
      }
      if (
        typeof gameState.playerHealth !== 'number' ||
        gameState.playerHealth < 0
      ) {
        throw new Error('Invalid player health in save data');
      }
      if (
        typeof gameState.playerAmmo !== 'number' ||
        gameState.playerAmmo < 0
      ) {
        throw new Error('Invalid player ammo in save data');
      }
      // Add more validation as needed for other fields
      
      if (dom.pauseMenuMessage) {
        dom.pauseMenuMessage.textContent = `Loading game from ${gameState.savedAtReadable}...`;
        dom.pauseMenuMessage.className = 'pause-menu-message info';
      }
      
      setTimeout(() => {
        // Hide pause menu
        hidePauseMenu();
        
        // Reset and configure game state
        resetRuntimeState();
        
        // Restore difficulty
        currentDifficulty = gameState.difficulty || 'normal';
        
        // Restore ship selection
        Save.data.selectedShip = gameState.selectedShip || 'vanguard';
        Save.save();
        initShipSelection();
        
        // Restore level and score
        level = gameState.level || 1;
        score = gameState.score || 0;
        enemiesKilled = gameState.enemiesKilled || 0;
        enemiesToKill = gameState.enemiesToKill || 15;
        
        // Restore pilot progression and persist it
        pilotLevel = gameState.pilotLevel || 1;
        pilotXP = gameState.pilotXP || 0;
        Save.data.pilotLevel = pilotLevel;
        Save.data.pilotXp = pilotXP;
        Save.save();
        
        // Start the level
        setupCanvas();
        
        // Create player at saved position
        player = new PlayerEntity(
          gameState.playerX || window.innerWidth / 2,
          gameState.playerY || window.innerHeight / 2
        );
        
        // Restore player state
        player.health = gameState.playerHealth || player.maxHealth;
        player.ammo = gameState.playerAmmo || player.maxAmmo;
        if (gameState.playerShield) player.shield = gameState.playerShield;
        if (gameState.playerSecondaryCharges) player.secondaryCharges = gameState.playerSecondaryCharges;
        if (gameState.playerDefenseCooldown) player.defenseCooldown = gameState.playerDefenseCooldown;
        if (gameState.playerUltCharge) player.ultCharge = gameState.playerUltCharge;
        
        // Set up camera and environment
        camera.x = player.x - window.innerWidth / 2;
        camera.y = player.y - window.innerHeight / 2;
        spawnObstacles();
        spawnHazards();  // Spawn environmental hazards
        createSpawners(Math.min(1 + Math.floor(level / 2), 5), false);
        
        if (!starsFar) {
          initStarLayers();
        } else {
          recenterStars();
        }
        
        lastTime = performance.now();
        lastAmmoRegen = lastTime;
        gameRunning = true;
        paused = false;
        
        // Update HUD
        updateHUD();
        
        // Start game loop
        loop(lastTime);
        
        addLogEntry('Game loaded', '#4ade80');
        
        isLoading = false;
      }, 500);
    } catch (err) {
      console.error('Failed to load game:', err);
      if (dom.pauseMenuMessage) {
        dom.pauseMenuMessage.textContent = '✗ Failed to load game!';
        dom.pauseMenuMessage.className = 'pause-menu-message error';
      }
      isLoading = false;
    }
  };
  
  const toggleFullscreen = () => {
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().then(() => {
          isFullscreen = true;
          addLogEntry('Fullscreen enabled', '#4ade80');
        }).catch((err) => {
          console.warn('Fullscreen request failed:', err);
          addLogEntry('Fullscreen not available', '#ef4444');
        });
      } else {
        document.exitFullscreen().then(() => {
          isFullscreen = false;
          addLogEntry('Fullscreen disabled', '#94a3b8');
        }).catch((err) => {
          console.warn('Exit fullscreen failed:', err);
        });
      }
    } catch (err) {
      console.warn('Fullscreen API not supported:', err);
    }
  };
  
  const toggleFPS = () => {
    showFPS = !showFPS;
    if (showFPS) {
      addLogEntry('FPS counter enabled', '#4ade80');
    } else {
      addLogEntry('FPS counter disabled', '#94a3b8');
    }
  };

  const resizeCanvas = () => {
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    dom.canvas.width = Math.floor(window.innerWidth * dpr);
    dom.canvas.height = Math.floor(window.innerHeight * dpr);
    dom.canvas.style.width = '100%';
    dom.canvas.style.height = '100%';
    if (dom.ctx) {
      dom.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    if (player) {
      camera.x = player.x - dom.canvas.width / 2;
      camera.y = player.y - dom.canvas.height / 2;
    }
    
    // Resize 3D renderer if active
    if (game3DInstance) {
      game3DInstance.resize();
    }
    
    drawStartGraphic();
  };

  const handleGameOver = () => {
    gameOverHandled = true;
    Save.setBest(score, level);
    Save.addCredits(Math.floor(score / 25));
    
    // Update game stats for achievements
    // Note: Elite enemy tracking to be implemented in future update
    Auth.updateGameStats({
      kills: totalKillsThisRun,
      bossKills: bossActive ? 0 : (bossEntity ? 1 : 0),
      eliteKills: 0,
      playTime: performance.now() - (waveStartTime || performance.now()),
      flawlessLevel: !tookDamageThisLevel
    });
    
    // Stop game and show game over screen
    gameRunning = false;
    paused = false;
    cancelAnimationFrame(animationFrame);
    
    // Play game over sound and stop music
    if (typeof AudioManager !== 'undefined') {
      AudioManager.playGameOver();
      AudioManager.stopMusic();
    }
    
    // Also update social stats if logged in
    if (typeof window.socialGameOver === 'function') {
      window.socialGameOver(score, level, currentDifficulty, {
        kills: totalKillsThisRun,
        deaths: 1,
        accuracy: 0,
        playTime: performance.now() - (waveStartTime || performance.now())
      });
    }
    
    // Submit to leaderboard if logged in
    const finalScore = score;
    const finalLevel = level;
    
    if (Auth.isLoggedIn()) {
      const username = Auth.getCurrentUsername();
      const rank = Leaderboard.addEntry(username, finalScore, finalLevel, currentDifficulty);
      showGameOverScreen(finalScore, finalLevel, rank);
    } else {
      showGameOverScreen(finalScore, finalLevel, null);
    }
  };

  const showGameOverScreen = (finalScore, finalLevel, rank) => {
    // Note: Don't hide gameContainer - the gameOverModal is a child element
    // inside gameContainer, so hiding the container would also hide the modal.
    // The modal overlays on top of the game canvas with its own styling.
    
    // Show custom game over modal
    const gameOverModal = document.getElementById('gameOverModal');
    if (gameOverModal) {
      const scoreEl = document.getElementById('gameOverScore');
      const levelEl = document.getElementById('gameOverLevel');
      const rankEl = document.getElementById('gameOverRank');
      const rankContainer = document.getElementById('gameOverRankContainer');
      const loginPromptEl = document.getElementById('gameOverLoginPrompt');
      const loginBtn = document.getElementById('gameOverLoginBtn');
      
      if (scoreEl) scoreEl.textContent = finalScore.toLocaleString();
      if (levelEl) levelEl.textContent = finalLevel;
      
      if (rank !== null) {
        if (rankContainer) rankContainer.style.display = 'flex';
        if (rankEl) rankEl.textContent = `#${rank}`;
        if (loginPromptEl) loginPromptEl.style.display = 'none';
        if (loginBtn) loginBtn.style.display = 'none';
      } else {
        if (rankContainer) rankContainer.style.display = 'none';
        if (loginPromptEl) loginPromptEl.style.display = 'block';
        if (loginBtn) loginBtn.style.display = 'block';
      }
      
      gameOverModal.style.display = 'flex';
    }
  };
  
  const closeGameOverScreen = () => {
    const gameOverModal = document.getElementById('gameOverModal');
    if (gameOverModal) {
      gameOverModal.style.display = 'none';
    }
  };
  
  const returnToMainMenu = () => {
    // Close any open modals
    closeGameOverScreen();
    hidePauseMenu();
    closeShop();
    closeHangar();
    closeLeaderboardModal();
    closeAuthModal();
    
    // Hide game container
    dom.gameContainer.style.display = 'none';
    
    // Show start screen
    dom.startScreen.style.display = 'flex';
    
    // Reset game state
    gameRunning = false;
    paused = false;
    cancelAnimationFrame(animationFrame);
    
    // Redraw start graphic
    drawStartGraphic();
  };

  /* ====== AUTHENTICATION & LEADERBOARD UI ====== */
  const openAuthModal = () => {
    if (!dom.authModal) return;
    // Close leaderboard modal when opening auth modal to prevent z-index conflicts
    if (dom.leaderboardModal) dom.leaderboardModal.style.display = 'none';
    dom.authModal.style.display = 'flex';
    if (dom.authUsername) dom.authUsername.value = '';
    if (dom.authPassword) dom.authPassword.value = '';
    if (dom.authError) dom.authError.textContent = '';
  };

  const closeAuthModal = () => {
    if (dom.authModal) dom.authModal.style.display = 'none';
  };

  const handleAuthLogin = async () => {
    const username = dom.authUsername?.value || '';
    const password = dom.authPassword?.value || '';
    
    // Show loading state
    if (dom.authError) dom.authError.textContent = 'Logging in...';
    
    try {
      const result = await Auth.login(username, password);

      if (result.success) {
        closeAuthModal();
        updateAuthUI();
        // Reopen leaderboard modal to show updated user info
        openLeaderboardModal();
      } else {
        if (dom.authError) dom.authError.textContent = result.error;
      }
    } catch (err) {
      if (dom.authError) dom.authError.textContent = 'Login failed. Please try again.';
      console.error('Login error:', err);
    }
  };

  const handleAuthRegister = async () => {
    const username = dom.authUsername?.value || '';
    const password = dom.authPassword?.value || '';
    
    // Show loading state
    if (dom.authError) dom.authError.textContent = 'Registering...';
    
    try {
      const result = await Auth.register(username, password);

      if (result.success) {
        closeAuthModal();
        updateAuthUI();
        // Reopen leaderboard modal to show updated user info
        openLeaderboardModal();
      } else {
        if (dom.authError) dom.authError.textContent = result.error;
      }
    } catch (err) {
      if (dom.authError) dom.authError.textContent = 'Registration failed. Please try again.';
      console.error('Registration error:', err);
    }
  };

  const handleAuthLogout = () => {
    Auth.logout();
    updateAuthUI();
    setLeaderboardFilter('all');
  };

  const updateAuthUI = () => {
    const isLoggedIn = Auth.isLoggedIn();
    const username = Auth.getCurrentUsername();
    
    if (dom.leaderboardUsername) {
      dom.leaderboardUsername.textContent = isLoggedIn ? username : 'Not logged in';
    }
    
    if (dom.leaderboardLogin) {
      dom.leaderboardLogin.style.display = isLoggedIn ? 'none' : 'inline-block';
    }
    
    if (dom.leaderboardLogout) {
      dom.leaderboardLogout.style.display = isLoggedIn ? 'inline-block' : 'none';
    }
  };

  const renderLeaderboard = async (difficulty = 'all') => {
    if (!dom.leaderboardList) return;

    // Show loading state
    dom.leaderboardList.innerHTML = '<div class="leaderboard-loading">Loading scores...</div>';
    
    const entries = await Leaderboard.getEntries(difficulty, 100);
    const currentUsername = Auth.getCurrentUsername();
    
    if (entries.length === 0) {
      dom.leaderboardList.innerHTML = '<div class="leaderboard-empty">No scores yet. Be the first!</div>';
      return;
    }
    
    const sourceLabel = Leaderboard.useGlobal 
      ? '<div style="text-align:center;color:#22c55e;font-size:12px;margin-bottom:8px;">🌍 Global Leaderboard - Top 100</div>' 
      : '<div style="text-align:center;color:#eab308;font-size:12px;margin-bottom:8px;">📱 Local Scores - Top 100</div>';
    
    dom.leaderboardList.innerHTML = sourceLabel + entries.map((entry, index) => {
      const rank = index + 1;
      const isCurrentUser = currentUsername && entry.username.toLowerCase() === currentUsername.toLowerCase();
      const rankClass = rank === 1 ? 'top-1' : rank === 2 ? 'top-2' : rank === 3 ? 'top-3' : '';
      
      return `
        <div class="leaderboard-entry ${isCurrentUser ? 'current-user' : ''}">
          <div class="leaderboard-rank ${rankClass}">${rank}</div>
          <div class="leaderboard-player">${entry.username}</div>
          <div class="leaderboard-score">${entry.score.toLocaleString()}</div>
          <div class="leaderboard-level">Lvl ${entry.level}</div>
        </div>
      `;
    }).join('');
  };

  const setLeaderboardFilter = (difficulty = 'all') => {
    const validDifficulty = difficulty === 'all' || DIFFICULTY_PRESETS[difficulty];
    currentLeaderboardFilter = validDifficulty ? difficulty : 'all';

    document.querySelectorAll('.filter-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.difficulty === currentLeaderboardFilter);
    });

    renderLeaderboard(currentLeaderboardFilter);
  };

  const openLeaderboardModal = () => {
    if (!dom.leaderboardModal) return;
    dom.leaderboardModal.style.display = 'flex';
    updateAuthUI();
    Leaderboard.setStatus(Leaderboard.statusMessage, Leaderboard.statusTone);
    setLeaderboardFilter(currentLeaderboardFilter || currentDifficulty);
  };

  const closeLeaderboardModal = () => {
    if (dom.leaderboardModal) dom.leaderboardModal.style.display = 'none';
  };

  /* ====== INITIALISATION ====== */
  
  // Initialize 3D rendering system
  const init3DSystem = () => {
    if (typeof window.__VOID_RIFT_3D__ !== 'undefined') {
      try {
        const initialized = window.__VOID_RIFT_3D__.init(dom.canvas);
        if (initialized) {
          game3DInstance = window.__VOID_RIFT_3D__;
          use3DMode = true;
          console.log('3D mode enabled');
          return true;
        }
      } catch (error) {
        console.warn('3D initialization failed, using 2D fallback:', error);
        use3DMode = false;
        game3DInstance = null;
      }
    }
    
    // If 3D failed or not available, create 2D context
    if (!dom.ctx && dom.canvas) {
      dom.ctx = dom.canvas.getContext('2d');
      console.log('Using 2D Canvas rendering');
    }
    
    return false;
  };
  
  const ready = () => {
    assignDomRefs();
    Save.load();
    Auth.load();
    Leaderboard.load();
    pilotLevel = Save.data.pilotLevel;
    pilotXP = Save.data.pilotXp;
    initShipSelection();
    syncCredits();
    loadControlSettings(); // Load and apply control settings
    setupInput();
    resizeCanvas();
    
    // Initialize 3D system after canvas is ready
    init3DSystem();
    
    drawStartGraphic();
    updateHUD();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ready, { once: true });
  } else {
    ready();
  }

  window.addEventListener('resize', resizeCanvas);
  
  // Listen for fullscreen changes
  document.addEventListener('fullscreenchange', () => {
    isFullscreen = !!document.fullscreenElement;
    resizeCanvas();
  });
  
  // Handle visibility changes to pause game when tab is hidden
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && gameRunning && !paused) {
      // Auto-pause when tab loses focus
      paused = true;
      cancelAnimationFrame(animationFrame);
    }
  });

  // expose for debugging if needed
  window.__VOID_RIFT__ = {
    startGame,
    togglePause,
    openShop,
    openHangar,
    toggleFullscreen,
    toggleFPS,
    getGameState: () => ({
      gameRunning,
      paused,
      level,
      score,
      enemiesKilled,
      enemiesToKill,
      fps,
      isFullscreen,
      difficulty: currentDifficulty
    })
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
    document.getElementById('showFPSToggle').checked = showFPS;
    
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
      'game': 'gameTab',
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
      
      ['Offense', 'Defense', 'Utility', 'Special'].forEach((cat) => {
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
        // Play boost sound
        if (typeof AudioManager !== 'undefined') {
          AudioManager.playBoost();
        }
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

  /* ====== SECONDARY WEAPONS DOCK INTERACTIONS ====== */
  
  // Haptic feedback helper
  const triggerHapticFeedback = (pattern = 'select') => {
    if (!controlSettings.hapticFeedback || !navigator.vibrate) return;
    
    const patterns = {
      'select': [15],           // Short tap for selection
      'equip': [30],            // Medium tap for equipping
      'preview': [10],          // Very short for preview
      'longpress': [20, 50, 20], // Pattern for long-press activation
      'drag': [5]               // Subtle for drag movement
    };
    
    navigator.vibrate(patterns[pattern] || [15]);
  };
  
  // Debounce helper to prevent accidental activations
  const canInteract = () => {
    const now = performance.now();
    if (now - equipmentInteractionState.lastInteractionTime < DEBOUNCE_DELAY) {
      return false;
    }
    return true;
  };
  
  const markInteraction = () => {
    equipmentInteractionState.lastInteractionTime = performance.now();
  };
  
  // Show weapon preview HUD
  const showWeaponPreview = (slotIndex) => {
    const preview = document.getElementById('weaponPreview');
    if (!preview) return;
    
    const equipClass = Save.data.armory.equipmentClass || defaultArmory().equipmentClass;
    const slotData = equipClass[`slot${slotIndex + 1}`];
    if (!slotData) return;
    
    // Get weapon info
    const weaponInfo = getWeaponInfo(slotData);
    
    const iconImg = preview.querySelector('.preview-icon');
    const nameSpan = preview.querySelector('.preview-name');
    const descSpan = preview.querySelector('.preview-desc');
    
    if (iconImg) {
      iconImg.src = weaponInfo.icon;
      iconImg.alt = weaponInfo.name;
    }
    if (nameSpan) nameSpan.textContent = weaponInfo.name;
    if (descSpan) descSpan.textContent = weaponInfo.desc;
    
    preview.style.display = 'flex';
    equipmentInteractionState.previewSlot = slotIndex;
    
    // Clear any existing preview timer
    if (equipmentInteractionState.previewTimer) {
      clearTimeout(equipmentInteractionState.previewTimer);
    }
    
    // Auto-hide after 2 seconds
    equipmentInteractionState.previewTimer = setTimeout(() => {
      hideWeaponPreview();
    }, 2000);
  };
  
  const hideWeaponPreview = () => {
    const preview = document.getElementById('weaponPreview');
    if (preview) {
      preview.style.display = 'none';
    }
    equipmentInteractionState.previewSlot = null;
    if (equipmentInteractionState.previewTimer) {
      clearTimeout(equipmentInteractionState.previewTimer);
      equipmentInteractionState.previewTimer = null;
    }
  };
  
  // Get weapon info for preview
  // Get weapon info for preview (uses shared EQUIPMENT_ICONS)
  const getWeaponInfo = (slotData) => {
    return EQUIPMENT_ICONS.getInfo(slotData);
  };
  
  // Open radial quick-select menu
  const openRadialMenu = (x, y) => {
    const radialMenu = document.getElementById('radialMenu');
    if (!radialMenu) return;
    
    // Position at center of screen or touch point
    radialMenu.style.left = `${x}px`;
    radialMenu.style.top = `${y}px`;
    radialMenu.style.display = 'block';
    radialMenu.classList.add('opening');
    radialMenu.classList.remove('closing');
    
    equipmentInteractionState.radialMenuOpen = true;
    
    // Update icons to match current loadout
    updateRadialMenuIcons();
    
    // Mark current slot as selected
    const radialItems = radialMenu.querySelectorAll('.radial-item');
    radialItems.forEach((item, index) => {
      item.classList.toggle('selected', index === currentEquipmentSlot);
      item.classList.remove('hovered');
    });
    
    triggerHapticFeedback('longpress');
  };
  
  const closeRadialMenu = (selectedSlot = null) => {
    const radialMenu = document.getElementById('radialMenu');
    if (!radialMenu) return;
    
    radialMenu.classList.remove('opening');
    radialMenu.classList.add('closing');
    
    setTimeout(() => {
      radialMenu.style.display = 'none';
      radialMenu.classList.remove('closing');
    }, 150);
    
    equipmentInteractionState.radialMenuOpen = false;
    
    // If a slot was selected, equip it
    if (selectedSlot !== null && selectedSlot !== currentEquipmentSlot) {
      switchEquipmentSlot(selectedSlot);
    }
  };
  
  // Get radial menu item from pointer position
  const getRadialItemFromPosition = (x, y) => {
    const radialMenu = document.getElementById('radialMenu');
    if (!radialMenu || !equipmentInteractionState.radialMenuOpen) return null;
    
    const rect = radialMenu.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const dx = x - centerX;
    const dy = y - centerY;
    const dist = Math.hypot(dx, dy);
    
    // If in center zone, no selection
    if (dist < 30) return null;
    
    // Determine which quadrant/direction
    const angle = Math.atan2(dy, dx);
    const deg = ((angle * 180 / Math.PI) + 360) % 360;
    
    // Map angle to slot (0=top, 1=right, 2=bottom, 3=left)
    if (deg >= 315 || deg < 45) return 1;   // Right = slot 2
    if (deg >= 45 && deg < 135) return 2;   // Bottom = slot 3
    if (deg >= 135 && deg < 225) return 3;  // Left = slot 4
    if (deg >= 225 && deg < 315) return 0;  // Top = slot 1 (primary)
    
    return null;
  };
  
  // Handle radial menu hover during drag
  const updateRadialHover = (x, y) => {
    const radialMenu = document.getElementById('radialMenu');
    if (!radialMenu || !equipmentInteractionState.radialMenuOpen) return;
    
    const hoveredSlot = getRadialItemFromPosition(x, y);
    const radialItems = radialMenu.querySelectorAll('.radial-item');
    
    radialItems.forEach((item, index) => {
      item.classList.toggle('hovered', index === hoveredSlot);
    });
  };
  
  // Equipment slot pointer/touch event handlers
  const handleEquipSlotPointerDown = (e, slotIndex) => {
    if (!canInteract()) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const state = equipmentInteractionState;
    state.activePointerId = e.pointerId || null;
    state.pointerStartPos = { x: e.clientX, y: e.clientY };
    state.dragStartSlot = slotIndex;
    state.isLongPressing = false;
    state.isDragging = false;
    
    // Start long-press timer
    state.longPressTimer = setTimeout(() => {
      if (!state.isDragging) {
        state.isLongPressing = true;
        openRadialMenu(e.clientX, e.clientY);
      }
    }, LONG_PRESS_THRESHOLD);
    
    // Visual feedback
    const slot = e.currentTarget;
    slot.classList.add('preview');
    
    triggerHapticFeedback('preview');
  };
  
  const handleEquipSlotPointerMove = (e) => {
    const state = equipmentInteractionState;
    if (!state.pointerStartPos) return;
    
    const dx = e.clientX - state.pointerStartPos.x;
    const dy = e.clientY - state.pointerStartPos.y;
    const dist = Math.hypot(dx, dy);
    
    // If moved enough, start dragging
    if (dist > 15 && !state.isLongPressing) {
      // Cancel long-press timer
      if (state.longPressTimer) {
        clearTimeout(state.longPressTimer);
        state.longPressTimer = null;
      }
      
      if (!state.isDragging) {
        state.isDragging = true;
        
        // Mark source slot as dragging
        const sourceSlot = document.querySelector(`.equip-slot[data-slot="${state.dragStartSlot}"]`);
        if (sourceSlot) {
          sourceSlot.classList.add('dragging');
        }
        
        triggerHapticFeedback('drag');
      }
    }
    
    // If radial menu is open, update hover state
    if (state.radialMenuOpen) {
      updateRadialHover(e.clientX, e.clientY);
    }
  };
  
  const handleEquipSlotPointerUp = (e) => {
    const state = equipmentInteractionState;
    
    // Cancel long-press timer
    if (state.longPressTimer) {
      clearTimeout(state.longPressTimer);
      state.longPressTimer = null;
    }
    
    // Clean up visual states
    document.querySelectorAll('.equip-slot').forEach(slot => {
      slot.classList.remove('preview', 'dragging');
    });
    
    // Handle radial menu selection
    if (state.radialMenuOpen) {
      const selectedSlot = getRadialItemFromPosition(e.clientX, e.clientY);
      closeRadialMenu(selectedSlot);
      markInteraction();
      state.pointerStartPos = null;
      state.activePointerId = null;
      return;
    }
    
    // Handle drag completion
    if (state.isDragging) {
      // Check if dropped on equipment indicator area (center target)
      const indicator = document.getElementById('equipmentIndicator');
      if (indicator) {
        const rect = indicator.getBoundingClientRect();
        const centerY = rect.top + rect.height / 2;
        const centerX = rect.left + rect.width / 2;
        
        // If dropped near center, equip the dragged slot
        const dx = e.clientX - centerX;
        const dy = e.clientY - centerY;
        if (Math.hypot(dx, dy) < 100) {
          switchEquipmentSlot(state.dragStartSlot);
          triggerHapticFeedback('equip');
        }
      }
      
      state.isDragging = false;
      state.dragStartSlot = null;
      markInteraction();
      state.pointerStartPos = null;
      state.activePointerId = null;
      return;
    }
    
    // Single tap - show preview and select
    if (state.pointerStartPos && !state.isLongPressing) {
      const slotIndex = parseInt(e.currentTarget?.dataset?.slot ?? state.dragStartSlot);
      
      // Show preview
      showWeaponPreview(slotIndex);
      
      // Visual highlight
      document.querySelectorAll('.equip-slot').forEach((slot, index) => {
        slot.classList.toggle('preview', index === slotIndex && index !== currentEquipmentSlot);
      });
      
      triggerHapticFeedback('select');
      markInteraction();
    }
    
    state.isLongPressing = false;
    state.pointerStartPos = null;
    state.activePointerId = null;
  };
  
  const handleEquipSlotPointerCancel = () => {
    const state = equipmentInteractionState;
    
    if (state.longPressTimer) {
      clearTimeout(state.longPressTimer);
      state.longPressTimer = null;
    }
    
    if (state.radialMenuOpen) {
      closeRadialMenu();
    }
    
    document.querySelectorAll('.equip-slot').forEach(slot => {
      slot.classList.remove('preview', 'dragging');
    });
    
    state.isDragging = false;
    state.isLongPressing = false;
    state.pointerStartPos = null;
    state.activePointerId = null;
  };
  
  // Equipment slot click handler (for single tap equip action)
  const handleEquipSlotClick = (e, slotIndex) => {
    if (!canInteract()) return;
    if (equipmentInteractionState.isDragging || equipmentInteractionState.isLongPressing) return;
    
    // Double-click to equip immediately
    const now = performance.now();
    if (now - lastTapTime < 300 && tapCount >= 1) {
      // Double tap - equip immediately
      switchEquipmentSlot(slotIndex);
      triggerHapticFeedback('equip');
      tapCount = 0;
      markInteraction();
      return;
    }
    
    lastTapTime = now;
    tapCount++;
    
    // Clear tap count after timeout
    setTimeout(() => {
      if (performance.now() - lastTapTime >= 300) {
        tapCount = 0;
      }
    }, 300);
    
    markInteraction();
  };
  
  // Keyboard navigation for equipment slots
  const handleEquipmentKeyboard = (e) => {
    const state = equipmentInteractionState;
    
    // Number keys 1-4 for direct slot selection
    if (e.key >= '1' && e.key <= '4' && !e.ctrlKey && !e.altKey && !e.metaKey) {
      const slotIndex = parseInt(e.key) - 1;
      switchEquipmentSlot(slotIndex);
      triggerHapticFeedback('equip');
      e.preventDefault();
      return true;
    }
    
    // Arrow key navigation within equipment indicator
    const equipIndicator = document.getElementById('equipmentIndicator');
    if (!equipIndicator || document.activeElement?.closest('#equipmentIndicator') === null) {
      return false;
    }
    
    const slots = equipIndicator.querySelectorAll('.equip-slot');
    const currentFocus = state.keyboardFocusIndex;
    
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      state.keyboardFocusIndex = Math.min(currentFocus + 1, slots.length - 1);
      slots[state.keyboardFocusIndex]?.focus();
      showWeaponPreview(state.keyboardFocusIndex);
      triggerHapticFeedback('preview');
      return true;
    }
    
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      state.keyboardFocusIndex = Math.max(currentFocus - 1, 0);
      slots[state.keyboardFocusIndex]?.focus();
      showWeaponPreview(state.keyboardFocusIndex);
      triggerHapticFeedback('preview');
      return true;
    }
    
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      switchEquipmentSlot(state.keyboardFocusIndex);
      triggerHapticFeedback('equip');
      return true;
    }
    
    if (e.key === 'Escape' && state.radialMenuOpen) {
      e.preventDefault();
      closeRadialMenu();
      return true;
    }
    
    return false;
  };
  
  // Initialize equipment dock event listeners
  const initEquipmentDockListeners = () => {
    const equipIndicator = document.getElementById('equipmentIndicator');
    if (!equipIndicator) return;
    
    const slots = equipIndicator.querySelectorAll('.equip-slot');
    
    slots.forEach((slot, index) => {
      // Pointer events for unified touch/mouse handling
      slot.addEventListener('pointerdown', (e) => handleEquipSlotPointerDown(e, index));
      slot.addEventListener('click', (e) => handleEquipSlotClick(e, index));
      
      // Focus handling for keyboard navigation
      slot.addEventListener('focus', () => {
        equipmentInteractionState.keyboardFocusIndex = index;
        showWeaponPreview(index);
      });
      
      slot.addEventListener('blur', () => {
        hideWeaponPreview();
        slot.classList.remove('preview');
      });
    });
    
    // Global pointer move/up handlers
    document.addEventListener('pointermove', handleEquipSlotPointerMove);
    document.addEventListener('pointerup', handleEquipSlotPointerUp);
    document.addEventListener('pointercancel', handleEquipSlotPointerCancel);
    
    // Radial menu item click handlers
    const radialMenu = document.getElementById('radialMenu');
    if (radialMenu) {
      const radialItems = radialMenu.querySelectorAll('.radial-item');
      radialItems.forEach((item, index) => {
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          closeRadialMenu(index);
        });
        
        item.addEventListener('pointerenter', () => {
          item.classList.add('hovered');
        });
        
        item.addEventListener('pointerleave', () => {
          item.classList.remove('hovered');
        });
      });
      
      // Close radial menu when clicking outside
      radialMenu.addEventListener('click', (e) => {
        if (e.target === radialMenu || e.target.classList.contains('radial-center')) {
          closeRadialMenu();
        }
      });
    }
  };

  /* ====== INPUT ====== */

  const triggerSecondary = () => {
    input.altFireHeld = true;
    setTimeout(() => (input.altFireHeld = false), 150);
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
    // Difficulty selector handler
    if (dom.difficultySelect) {
      // Set initial value from saved data
      dom.difficultySelect.value = Save.data.difficulty || 'normal';
      
      dom.difficultySelect.addEventListener('change', (e) => {
        const newDifficulty = e.target.value;
        if (DIFFICULTY_PRESETS[newDifficulty]) {
          Save.data.difficulty = newDifficulty;
          Save.save();
        }
      });
    }
    
    // Game mode selector handler
    if (dom.gameModeSelect) {
      dom.gameModeSelect.addEventListener('change', (e) => {
        const mode = e.target.value;
        const planetContainer = document.getElementById('planetSelectContainer');
        if (planetContainer) {
          planetContainer.style.display = mode === 'planetary' ? 'flex' : 'none';
        }
      });
    }
    
    if (dom.startButton) {
      dom.startButton.addEventListener('click', () => {
        if (typeof AudioManager !== 'undefined') {
          AudioManager.playClick();
        }
        startGame();
      });
      dom.startButton.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (typeof AudioManager !== 'undefined') {
          AudioManager.playClick();
        }
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
    dom.leaderboardButton?.addEventListener('click', openLeaderboardModal);
    
    // Pause menu handlers
    dom.resumeGameBtn?.addEventListener('click', resumeGame);
    dom.restartGameBtn?.addEventListener('click', restartGame);
    dom.saveGameBtn?.addEventListener('click', saveGameSlot);
    dom.loadGameBtn?.addEventListener('click', loadGameSlot);
    
    // Pause menu navigation buttons
    document.getElementById('pauseShopBtn')?.addEventListener('click', () => {
      hidePauseMenu();
      openShop();
    });
    document.getElementById('pauseHangarBtn')?.addEventListener('click', () => {
      hidePauseMenu();
      openHangar();
    });
    document.getElementById('pauseLeaderboardBtn')?.addEventListener('click', () => {
      hidePauseMenu();
      openLeaderboardModal();
    });
    dom.exitToMenuBtn?.addEventListener('click', exitToMainMenu);
    
    // Game Over screen handlers
    document.getElementById('gameOverRestartBtn')?.addEventListener('click', () => {
      closeGameOverScreen();
      startGame();
    });
    document.getElementById('gameOverShopBtn')?.addEventListener('click', () => {
      closeGameOverScreen();
      dom.gameContainer.style.display = 'none';
      dom.startScreen.style.display = 'flex';
      openShop();
    });
    document.getElementById('gameOverHangarBtn')?.addEventListener('click', () => {
      closeGameOverScreen();
      dom.gameContainer.style.display = 'none';
      dom.startScreen.style.display = 'flex';
      openHangar();
    });
    document.getElementById('gameOverLeaderboardBtn')?.addEventListener('click', () => {
      closeGameOverScreen();
      dom.gameContainer.style.display = 'none';
      dom.startScreen.style.display = 'flex';
      openLeaderboardModal();
    });
    document.getElementById('gameOverLoginBtn')?.addEventListener('click', () => {
      closeGameOverScreen();
      dom.gameContainer.style.display = 'none';
      dom.startScreen.style.display = 'flex';
      openAuthModal();
    });
    document.getElementById('gameOverMenuBtn')?.addEventListener('click', () => {
      closeGameOverScreen();
      returnToMainMenu();
    });
    
    // Close pause menu when clicking outside
    dom.pauseMenuModal?.addEventListener('click', (e) => {
      if (e.target === dom.pauseMenuModal) {
        resumeGame();
      }
    });
    
    // ESC key closes pause menu if open
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        // Check if pause menu is open (assume class 'open' or style 'display: block')
        if (dom.pauseMenuModal && (dom.pauseMenuModal.classList.contains('open') || dom.pauseMenuModal.style.display === 'block')) {
          resumeGame();
          e.preventDefault();
          return;
        }
        // Other modal ESC handling can go here...
      }
    });
    // Authentication modal handlers
    dom.closeAuth?.addEventListener('click', closeAuthModal);
    dom.authLogin?.addEventListener('click', handleAuthLogin);
    dom.authRegister?.addEventListener('click', handleAuthRegister);
    
    // Allow Enter key to submit login form
    dom.authPassword?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        handleAuthLogin();
      }
    });
    
    dom.authModal?.addEventListener('click', (e) => {
      if (e.target === dom.authModal) closeAuthModal();
    });
    
    // Leaderboard modal handlers
    dom.closeLeaderboard?.addEventListener('click', closeLeaderboardModal);
    dom.leaderboardLogin?.addEventListener('click', openAuthModal);
    dom.leaderboardLogout?.addEventListener('click', handleAuthLogout);
    
    dom.leaderboardModal?.addEventListener('click', (e) => {
      if (e.target === dom.leaderboardModal) closeLeaderboardModal();
    });

    // Leaderboard filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        setLeaderboardFilter(btn.dataset.difficulty);
      });
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
    
    // FPS toggle
    document.getElementById('showFPSToggle')?.addEventListener('change', (e) => {
      showFPS = e.target.checked;
    });
    
    // Fullscreen toggle button
    document.getElementById('fullscreenToggle')?.addEventListener('click', () => {
      toggleFullscreen();
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
    
    // Audio controls setup
    const setupAudioControls = () => {
      const masterSlider = document.getElementById('masterVolume');
      const sfxSlider = document.getElementById('sfxVolume');
      const musicSlider = document.getElementById('musicVolume');
      const audioToggle = document.getElementById('audioEnabled');
      
      // Initialize with saved values if AudioManager is available
      if (typeof AudioManager !== 'undefined') {
        if (masterSlider) {
          masterSlider.value = Math.round(AudioManager.getVolume('master') * 100);
          document.getElementById('masterVolumeValue').textContent = `${masterSlider.value}%`;
          masterSlider.addEventListener('input', () => {
            const value = parseInt(masterSlider.value) / 100;
            AudioManager.setVolume('master', value);
            document.getElementById('masterVolumeValue').textContent = `${masterSlider.value}%`;
          });
        }
        
        if (sfxSlider) {
          sfxSlider.value = Math.round(AudioManager.getVolume('sfx') * 100);
          document.getElementById('sfxVolumeValue').textContent = `${sfxSlider.value}%`;
          sfxSlider.addEventListener('input', () => {
            const value = parseInt(sfxSlider.value) / 100;
            AudioManager.setVolume('sfx', value);
            document.getElementById('sfxVolumeValue').textContent = `${sfxSlider.value}%`;
          });
        }
        
        if (musicSlider) {
          musicSlider.value = Math.round(AudioManager.getVolume('music') * 100);
          document.getElementById('musicVolumeValue').textContent = `${musicSlider.value}%`;
          musicSlider.addEventListener('input', () => {
            const value = parseInt(musicSlider.value) / 100;
            AudioManager.setVolume('music', value);
            document.getElementById('musicVolumeValue').textContent = `${musicSlider.value}%`;
          });
        }
        
        if (audioToggle) {
          audioToggle.checked = !AudioManager.getMuted();
          audioToggle.addEventListener('change', () => {
            AudioManager.setMuted(!audioToggle.checked);
          });
        }
      }
    };
    setupAudioControls();
    
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
      tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;
        switchMenuTab(tabName);
      });
    });
    
    // Game tab action buttons
    document.getElementById('menuResumeBtn')?.addEventListener('click', () => {
      closeUnifiedMenu();
    });
    
    document.getElementById('menuRestartBtn')?.addEventListener('click', () => {
      closeUnifiedMenu();
      // Restart game from level 1
      resetRuntimeState();
      initShipSelection();
      startLevel(1, true);
    });
    
    document.getElementById('menuSaveBtn')?.addEventListener('click', () => {
      saveGameSlot();
    });
    
    document.getElementById('menuLoadBtn')?.addEventListener('click', () => {
      loadGameSlot();
    });
    
    document.getElementById('menuExitBtn')?.addEventListener('click', () => {
      closeUnifiedMenu();
      returnToMainMenu();
    });
    
    document.getElementById('menuShopBtn')?.addEventListener('click', () => {
      closeUnifiedMenu();
      openShop();
    });
    
    document.getElementById('menuHangarBtn')?.addEventListener('click', () => {
      closeUnifiedMenu();
      openHangar();
    });
    
    document.getElementById('menuLeaderboardBtn')?.addEventListener('click', () => {
      closeUnifiedMenu();
      openLeaderboardModal();
    });
    
    // Equipment slot configuration
    ['equipSlot1', 'equipSlot2', 'equipSlot3', 'equipSlot4'].forEach((id) => {
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
      // NEW: Handle ready-up phase taps - tap anywhere to start
      if (readyUpPhase) {
        startCountdownFromReadyUp();
        return;
      }
      
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
      // NEW: Handle ready-up phase
      if (readyUpPhase) {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          startCountdownFromReadyUp();
          return;
        }
        if (e.key === 's' || e.key === 'S') {
          e.preventDefault();
          openShop();
          return;
        }
      }
      
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
        // Close radial menu on Escape
        if (equipmentInteractionState.radialMenuOpen) {
          e.preventDefault();
          closeRadialMenu();
          return;
        }
      }
      if (e.key === 'p' || e.key === 'P') togglePause();
      if (e.key === 'r' || e.key === 'R') input.ultimateQueued = true;
      if (e.key === 'g' || e.key === 'G') {
        e.preventDefault();
        toggleFPS();
      }
      if (e.key === 'f' || e.key === 'F') {
        // Only allow 'f' for fullscreen if defense isn't using it in game
        if (!gameRunning || paused || countdownActive || readyUpPhase) {
          e.preventDefault();
          toggleFullscreen();
        }
      }
      
      // Equipment slot keyboard shortcuts (number keys 1-4)
      if (gameRunning && !paused && !countdownActive && !readyUpPhase) {
        if (handleEquipmentKeyboard(e)) {
          return; // Keyboard event was handled by equipment system
        }
      }
      
      if (Object.prototype.hasOwnProperty.call(keyboard, e.key)) keyboard[e.key] = true;
      updateFromKeyboard();
    });
    document.addEventListener('keyup', (e) => {
      if (Object.prototype.hasOwnProperty.call(keyboard, e.key)) keyboard[e.key] = false;
      updateFromKeyboard();
    });

    if (dom.canvas) {
      dom.canvas.addEventListener('mousedown', (e) => {
        // NEW: Handle ready-up phase click - anywhere on screen
        if (readyUpPhase) {
          e.preventDefault();
          startCountdownFromReadyUp();
          return;
        }
        
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
      if (readyUpPhase || countdownActive) return; // Disable joystick during ready-up and countdown
      e.preventDefault();
      if (moveId !== null) return;
      const touch = e.changedTouches[0];
      moveId = touch.identifier;
      moveStart = { x: touch.clientX, y: touch.clientY };
      updateMoveJoystick(touch, true);
    }, { passive: false });
    
    dom.rightTouchZone?.addEventListener('touchstart', (e) => {
      if (readyUpPhase || countdownActive) return; // Disable joystick during ready-up and countdown
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
    
    // Initialize equipment dock interaction listeners
    initEquipmentDockListeners();
  };
})();
