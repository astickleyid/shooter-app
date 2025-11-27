/**
 * Tests for game configuration and constants
 * These tests verify that game configurations are valid and consistent
 */

describe('Game Configuration', () => {
  // Mock game constants from script.js
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
      stats: { hp: 1, speed: 1, boost: 1, ammo: 1, damage: 1, fireRate: 1, pickup: 1, ammoRegen: 1 }
    },
    {
      id: 'phantom',
      name: 'Phantom-X',
      stats: { hp: 0.85, speed: 1.22, boost: 1.28, ammo: 0.9, damage: 0.95, fireRate: 0.9, pickup: 1.1, ammoRegen: 0.9 }
    },
    {
      id: 'bulwark',
      name: 'Bulwark-7',
      stats: { hp: 1.35, speed: 0.86, boost: 0.92, ammo: 1.22, damage: 1.1, fireRate: 1.18, pickup: 0.95, ammoRegen: 0.85 }
    },
    {
      id: 'emberwing',
      name: 'Emberwing',
      stats: { hp: 0.9, speed: 1.08, boost: 1.1, ammo: 0.82, damage: 1.28, fireRate: 0.94, pickup: 1, ammoRegen: 0.95 }
    },
    {
      id: 'spectre',
      name: 'Spectre-9',
      stats: { hp: 0.75, speed: 1.35, boost: 1.4, ammo: 0.85, damage: 0.88, fireRate: 0.85, pickup: 1.25, ammoRegen: 1.1 }
    },
    {
      id: 'titan',
      name: 'Titan Heavy',
      stats: { hp: 1.6, speed: 0.72, boost: 0.78, ammo: 1.45, damage: 1.35, fireRate: 1.3, pickup: 0.8, ammoRegen: 0.75 }
    }
  ];

  describe('BASE Configuration', () => {
    test('should have positive values for all properties', () => {
      Object.values(BASE).forEach(value => {
        expect(value).toBeGreaterThan(0);
      });
    });

    test('should have player boost speed greater than regular speed', () => {
      expect(BASE.PLAYER_BOOST_SPEED).toBeGreaterThan(BASE.PLAYER_SPEED);
    });

    test('should have bullet speed greater than player speed', () => {
      expect(BASE.BULLET_SPEED).toBeGreaterThan(BASE.PLAYER_SPEED);
      expect(BASE.BULLET_SPEED).toBeGreaterThan(BASE.PLAYER_BOOST_SPEED);
    });

    test('should have reasonable invulnerability time', () => {
      expect(BASE.INVULN_MS).toBeGreaterThan(0);
      expect(BASE.INVULN_MS).toBeLessThan(1000); // Less than 1 second
    });

    test('should have sensible spawn delay range', () => {
      expect(BASE.INITIAL_SPAWN_DELAY_MAX).toBeGreaterThan(BASE.INITIAL_SPAWN_DELAY_MIN);
      expect(BASE.INITIAL_SPAWN_DELAY_MIN).toBeGreaterThan(0);
    });

    test('should have player size larger than bullet size', () => {
      expect(BASE.PLAYER_SIZE).toBeGreaterThan(BASE.BULLET_SIZE);
    });

    test('should have coin lifetime long enough to collect', () => {
      expect(BASE.COIN_LIFETIME).toBeGreaterThan(3000); // At least 3 seconds
    });
  });

  describe('Ship Templates', () => {
    test('should have at least one ship template', () => {
      expect(SHIP_TEMPLATES.length).toBeGreaterThan(0);
    });

    test('should have unique ship IDs', () => {
      const ids = SHIP_TEMPLATES.map(ship => ship.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    test('should have all ships with required properties', () => {
      SHIP_TEMPLATES.forEach(ship => {
        expect(ship).toHaveProperty('id');
        expect(ship).toHaveProperty('name');
        expect(ship).toHaveProperty('stats');
        expect(typeof ship.id).toBe('string');
        expect(typeof ship.name).toBe('string');
        expect(typeof ship.stats).toBe('object');
      });
    });

    test('should have all ships with complete stats', () => {
      const requiredStats = ['hp', 'speed', 'boost', 'ammo', 'damage', 'fireRate', 'pickup', 'ammoRegen'];
      SHIP_TEMPLATES.forEach(ship => {
        requiredStats.forEach(stat => {
          expect(ship.stats).toHaveProperty(stat);
          expect(typeof ship.stats[stat]).toBe('number');
          expect(ship.stats[stat]).toBeGreaterThan(0);
        });
      });
    });

    test('should have balanced ship stats (no stat too extreme)', () => {
      SHIP_TEMPLATES.forEach(ship => {
        Object.values(ship.stats).forEach(value => {
          expect(value).toBeGreaterThan(0.5); // Not too low
          expect(value).toBeLessThan(2); // Not too high
        });
      });
    });

    test('should have vanguard as baseline ship', () => {
      const vanguard = SHIP_TEMPLATES.find(ship => ship.id === 'vanguard');
      expect(vanguard).toBeDefined();
      // Vanguard should have all stats at 1.0 (baseline)
      Object.values(vanguard.stats).forEach(value => {
        expect(value).toBe(1);
      });
    });
  });

  describe('Game Balance', () => {
    test('enemy damage should not one-shot player', () => {
      // Assuming minimum HP multiplier is 0.85 (Phantom-X)
      const minPlayerHP = BASE.PLAYER_HEALTH * 0.85;
      expect(BASE.ENEMY_DAMAGE).toBeLessThan(minPlayerHP);
    });

    test('player should be able to regenerate ammo reasonably', () => {
      // Ammo regen should not take too long
      expect(BASE.AMMO_REGEN_MS).toBeLessThan(2000); // Less than 2 seconds
    });

    test('enemy speed should be less than player speed', () => {
      expect(BASE.ENEMY_SPEED).toBeLessThan(BASE.PLAYER_SPEED);
    });

    test('player should be larger than enemies for better gameplay', () => {
      expect(BASE.PLAYER_SIZE).toBeGreaterThanOrEqual(BASE.ENEMY_SIZE);
    });
  });

  describe('Save System', () => {
    test('save key should be defined', () => {
      const SAVE_KEY = 'void_rift_v11';
      expect(SAVE_KEY).toBeDefined();
      expect(typeof SAVE_KEY).toBe('string');
      expect(SAVE_KEY.length).toBeGreaterThan(0);
    });

    test('default armory should have all weapon types', () => {
      const defaultArmory = {
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
      };

      expect(defaultArmory.unlocked).toHaveProperty('primary');
      expect(defaultArmory.unlocked).toHaveProperty('secondary');
      expect(defaultArmory.unlocked).toHaveProperty('defense');
      expect(defaultArmory.unlocked).toHaveProperty('ultimate');
      
      expect(Array.isArray(defaultArmory.unlocked.primary)).toBe(true);
      expect(defaultArmory.unlocked.primary.length).toBeGreaterThan(0);
    });
  });

  describe('Upgrade System', () => {
    const UPGRADES = [
      { id: 'damage', name: 'Damage Amplifier', cat: 'Offense', base: 80, step: 40, max: 10 },
      { id: 'firerate', name: 'Fire Rate', cat: 'Offense', base: 100, step: 50, max: 8 },
      { id: 'multi', name: 'Multishot', cat: 'Offense', base: 150, step: 80, max: 4 },
      { id: 'crit', name: 'Critical Strike', cat: 'Offense', base: 130, step: 65, max: 6 },
      { id: 'shield', name: 'Hull Plating', cat: 'Defense', base: 70, step: 35, max: 12 },
      { id: 'regen', name: 'Regenerator', cat: 'Defense', base: 120, step: 60, max: 6 },
      { id: 'field', name: 'Repulse Field', cat: 'Defense', base: 180, step: 90, max: 5 },
      { id: 'armor', name: 'Reactive Armor', cat: 'Defense', base: 140, step: 70, max: 5 },
      { id: 'ammo', name: 'Ammo Regen', cat: 'Utility', base: 90, step: 45, max: 8 },
      { id: 'boost', name: 'Boost Speed', cat: 'Utility', base: 110, step: 55, max: 7 },
      { id: 'magnet', name: 'Magnet Range', cat: 'Utility', base: 85, step: 42, max: 8 },
      { id: 'luck', name: 'Fortune Module', cat: 'Utility', base: 100, step: 50, max: 6 },
      { id: 'ultimate', name: 'Ultimate Charger', cat: 'Special', base: 160, step: 80, max: 5 },
      { id: 'cooldown', name: 'System Coolant', cat: 'Special', base: 175, step: 88, max: 5 },
      { id: 'pierce', name: 'Armor Piercing', cat: 'Special', base: 200, step: 100, max: 3 }
    ];

    test('should have upgrades in all categories', () => {
      const categories = new Set(UPGRADES.map(u => u.cat));
      expect(categories.has('Offense')).toBe(true);
      expect(categories.has('Defense')).toBe(true);
      expect(categories.has('Utility')).toBe(true);
      expect(categories.has('Special')).toBe(true);
    });

    test('should have unique upgrade IDs', () => {
      const ids = UPGRADES.map(u => u.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    test('should have all upgrades with required properties', () => {
      UPGRADES.forEach(upgrade => {
        expect(upgrade).toHaveProperty('id');
        expect(upgrade).toHaveProperty('name');
        expect(upgrade).toHaveProperty('cat');
        expect(upgrade).toHaveProperty('base');
        expect(upgrade).toHaveProperty('step');
        expect(upgrade).toHaveProperty('max');
        
        expect(typeof upgrade.id).toBe('string');
        expect(typeof upgrade.name).toBe('string');
        expect(typeof upgrade.cat).toBe('string');
        expect(typeof upgrade.base).toBe('number');
        expect(typeof upgrade.step).toBe('number');
        expect(typeof upgrade.max).toBe('number');
      });
    });

    test('should have positive costs and reasonable maximums', () => {
      UPGRADES.forEach(upgrade => {
        expect(upgrade.base).toBeGreaterThan(0);
        expect(upgrade.step).toBeGreaterThan(0);
        expect(upgrade.max).toBeGreaterThan(0);
        expect(upgrade.max).toBeLessThan(20); // Reasonable maximum
      });
    });

    test('should have balanced upgrade costs', () => {
      UPGRADES.forEach(upgrade => {
        expect(upgrade.step).toBeLessThan(upgrade.base * 2); // Step shouldn't be too large relative to base
      });
    });
  });
});
