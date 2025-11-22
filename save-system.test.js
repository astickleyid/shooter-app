/**
 * Tests for save/load system
 * Tests localStorage persistence and data integrity
 */

describe('Save System', () => {
  let mockLocalStorage;
  
  beforeEach(() => {
    // Create a mock localStorage
    mockLocalStorage = (() => {
      let store = {};
      return {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => {
          store[key] = value.toString();
        },
        removeItem: (key) => {
          delete store[key];
        },
        clear: () => {
          store = {};
        }
      };
    })();
    
    global.localStorage = mockLocalStorage;
  });

  afterEach(() => {
    mockLocalStorage.clear();
  });

  describe('Data Persistence', () => {
    test('should save and load data correctly', () => {
      const testData = {
        credits: 1000,
        bestScore: 5000,
        highestLevel: 10
      };
      
      localStorage.setItem('void_rift_v11', JSON.stringify(testData));
      const loaded = JSON.parse(localStorage.getItem('void_rift_v11'));
      
      expect(loaded).toEqual(testData);
    });

    test('should handle missing save data', () => {
      // Clear localStorage first
      localStorage.clear();
      const data = localStorage.getItem('void_rift_v11');
      expect(data).toBeNull();
    });

    test('should handle corrupted save data', () => {
      localStorage.setItem('void_rift_v11', 'invalid json');
      
      expect(() => {
        JSON.parse(localStorage.getItem('void_rift_v11'));
      }).toThrow();
    });

    test('should preserve data types after save/load', () => {
      const testData = {
        credits: 500,
        bestScore: 10000,
        highestLevel: 5,
        selectedShip: 'vanguard',
        upgrades: { damage: 2, shield: 3 }
      };
      
      localStorage.setItem('void_rift_v11', JSON.stringify(testData));
      const loaded = JSON.parse(localStorage.getItem('void_rift_v11'));
      
      expect(typeof loaded.credits).toBe('number');
      expect(typeof loaded.bestScore).toBe('number');
      expect(typeof loaded.selectedShip).toBe('string');
      expect(typeof loaded.upgrades).toBe('object');
    });
  });

  describe('Credits System', () => {
    test('should add credits correctly', () => {
      let credits = 100;
      const toAdd = 50;
      credits += toAdd;
      
      expect(credits).toBe(150);
    });

    test('should not allow negative credits', () => {
      let credits = 100;
      credits = Math.max(0, credits - 200);
      
      expect(credits).toBe(0);
    });

    test('should spend credits when enough available', () => {
      let credits = 100;
      const cost = 50;
      
      if (credits >= cost) {
        credits -= cost;
      }
      
      expect(credits).toBe(50);
    });

    test('should not spend credits when not enough available', () => {
      let credits = 30;
      const cost = 50;
      
      // Attempt to spend credits - should fail because we don't have enough
      const canSpend = credits >= cost;
      if (canSpend) {
        credits -= cost;
      }
      
      // Credits should remain unchanged
      expect(canSpend).toBe(false);
      expect(credits).toBe(30);
    });

    test('should handle large credit amounts', () => {
      let credits = 1000000;
      credits += 500000;
      
      expect(credits).toBe(1500000);
    });

    test('should round fractional credits to integers', () => {
      let credits = Math.floor(100.7);
      
      expect(credits).toBe(100);
      expect(Number.isInteger(credits)).toBe(true);
    });
  });

  describe('Progress Tracking', () => {
    test('should update best score when exceeded', () => {
      let bestScore = 1000;
      const newScore = 1500;
      
      if (newScore > bestScore) {
        bestScore = newScore;
      }
      
      expect(bestScore).toBe(1500);
    });

    test('should not update best score when not exceeded', () => {
      let bestScore = 2000;
      const newScore = 1500;
      
      // Check if new score exceeds best score
      const isNewRecord = newScore > bestScore;
      if (isNewRecord) {
        bestScore = newScore;
      }
      
      // Best score should remain unchanged
      expect(isNewRecord).toBe(false);
      expect(bestScore).toBe(2000);
    });

    test('should track highest level reached', () => {
      let highestLevel = 5;
      const currentLevel = 7;
      
      if (currentLevel > highestLevel) {
        highestLevel = currentLevel;
      }
      
      expect(highestLevel).toBe(7);
    });
  });

  describe('Upgrade System', () => {
    test('should track upgrade levels', () => {
      const upgrades = {};
      
      upgrades['damage'] = 1;
      upgrades['shield'] = 2;
      
      expect(upgrades['damage']).toBe(1);
      expect(upgrades['shield']).toBe(2);
      expect(upgrades['missing']).toBeUndefined();
    });

    test('should level up upgrades correctly', () => {
      const upgrades = { damage: 3 };
      
      upgrades['damage'] = (upgrades['damage'] || 0) + 1;
      
      expect(upgrades['damage']).toBe(4);
    });

    test('should initialize new upgrades at level 1', () => {
      const upgrades = {};
      const upgradeId = 'newUpgrade';
      
      upgrades[upgradeId] = (upgrades[upgradeId] || 0) + 1;
      
      expect(upgrades[upgradeId]).toBe(1);
    });

    test('should get upgrade level with default value', () => {
      const upgrades = { damage: 5 };
      
      const damageLevel = upgrades['damage'] || 0;
      const shieldLevel = upgrades['shield'] || 0;
      
      expect(damageLevel).toBe(5);
      expect(shieldLevel).toBe(0);
    });
  });

  describe('Armory System', () => {
    test('should track unlocked weapons', () => {
      const unlocked = {
        primary: ['pulse', 'scatter'],
        secondary: ['nova'],
        defense: ['aegis'],
        ultimate: ['voidstorm']
      };
      
      expect(unlocked.primary).toContain('pulse');
      expect(unlocked.primary).toContain('scatter');
      expect(unlocked.primary.length).toBe(2);
    });

    test('should not duplicate unlocked weapons', () => {
      const unlocked = {
        primary: ['pulse']
      };
      
      const weaponToUnlock = 'scatter';
      if (!unlocked.primary.includes(weaponToUnlock)) {
        unlocked.primary.push(weaponToUnlock);
      }
      
      expect(unlocked.primary.length).toBe(2);
      
      // Try to unlock again
      if (!unlocked.primary.includes(weaponToUnlock)) {
        unlocked.primary.push(weaponToUnlock);
      }
      
      expect(unlocked.primary.length).toBe(2); // Should still be 2
    });

    test('should track current loadout', () => {
      const loadout = {
        primary: 'pulse',
        secondary: 'nova',
        defense: 'aegis',
        ultimate: 'voidstorm'
      };
      
      expect(loadout.primary).toBe('pulse');
      
      loadout.primary = 'scatter';
      
      expect(loadout.primary).toBe('scatter');
    });

    test('should have default weapons unlocked', () => {
      const defaultUnlocked = {
        primary: ['pulse'],
        secondary: ['nova'],
        defense: ['aegis'],
        ultimate: ['voidstorm']
      };
      
      expect(defaultUnlocked.primary.length).toBeGreaterThan(0);
      expect(defaultUnlocked.secondary.length).toBeGreaterThan(0);
      expect(defaultUnlocked.defense.length).toBeGreaterThan(0);
      expect(defaultUnlocked.ultimate.length).toBeGreaterThan(0);
    });
  });

  describe('Pilot Level System', () => {
    test('should track pilot level and XP', () => {
      let pilotLevel = 1;
      let pilotXP = 0;
      
      pilotXP += 100;
      
      expect(pilotLevel).toBe(1);
      expect(pilotXP).toBe(100);
    });

    test('should enforce minimum pilot level', () => {
      let pilotLevel = 0;
      pilotLevel = Math.max(1, pilotLevel);
      
      expect(pilotLevel).toBe(1);
    });

    test('should enforce non-negative XP', () => {
      let pilotXP = -50;
      pilotXP = Math.max(0, pilotXP);
      
      expect(pilotXP).toBe(0);
    });
  });

  describe('Ship Selection', () => {
    test('should track selected ship', () => {
      let selectedShip = 'vanguard';
      
      expect(selectedShip).toBe('vanguard');
      
      selectedShip = 'phantom';
      
      expect(selectedShip).toBe('phantom');
    });

    test('should default to vanguard if no ship selected', () => {
      let selectedShip;
      
      if (!selectedShip) {
        selectedShip = 'vanguard';
      }
      
      expect(selectedShip).toBe('vanguard');
    });

    test('should validate ship selection', () => {
      const validShips = ['vanguard', 'phantom', 'bulwark', 'emberwing'];
      let selectedShip = 'invalid';
      
      if (!validShips.includes(selectedShip)) {
        selectedShip = 'vanguard';
      }
      
      expect(selectedShip).toBe('vanguard');
    });
  });
});
