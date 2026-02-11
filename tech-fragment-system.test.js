/**
 * Tests for TechFragmentSystem
 */

const { TechFragmentSystem, TECH_FRAGMENTS, TECH_UNLOCKS } = require('./src/systems/TechFragmentSystem.js');

describe('TechFragmentSystem', () => {
  let system;

  beforeEach(() => {
    system = new TechFragmentSystem();
  });

  describe('Initialization', () => {
    test('should initialize with empty collections', () => {
      expect(system.collected.size).toBe(0);
      expect(Object.keys(system.inventory).length).toBe(0);
      expect(system.active.length).toBe(0);
    });

    test('should have 6 tech fragment definitions', () => {
      expect(TECH_FRAGMENTS.length).toBe(6);
    });

    test('should have matching unlocks for all fragments', () => {
      TECH_FRAGMENTS.forEach(fragment => {
        expect(TECH_UNLOCKS[fragment.unlocks]).toBeDefined();
      });
    });
  });

  describe('Drop System', () => {
    test('should not drop fragments from normal enemies', () => {
      for (let i = 0; i < 100; i++) {
        const drop = system.rollDrop(false, false);
        expect(drop).toBeNull();
      }
    });

    test('should potentially drop from bosses', () => {
      let dropped = false;
      for (let i = 0; i < 100; i++) {
        const drop = system.rollDrop(true, false);
        if (drop) {
          dropped = true;
          expect(TECH_FRAGMENTS).toContainEqual(drop);
          break;
        }
      }
      // With 100 rolls and 8-12% drop rates, should almost always get at least one
      expect(dropped).toBe(true);
    });

    test('should have lower drop chance for elites than bosses', () => {
      const bossDrops = [];
      const eliteDrops = [];
      const trials = 1000;

      for (let i = 0; i < trials; i++) {
        if (system.rollDrop(true, false)) bossDrops.push(1);
        if (system.rollDrop(false, true)) eliteDrops.push(1);
      }

      // Elites should have roughly half the drops of bosses
      expect(eliteDrops.length).toBeLessThan(bossDrops.length);
    });
  });

  describe('Pickup System', () => {
    test('should spawn fragment pickup at location', () => {
      const fragment = TECH_FRAGMENTS[0];
      const pickup = system.spawnPickup(fragment, 100, 200);

      expect(pickup.id).toBe(fragment.id);
      expect(pickup.x).toBe(100);
      expect(pickup.y).toBe(200);
      expect(pickup.collected).toBe(false);
      expect(system.active.length).toBe(1);
    });

    test('should update pickup animations', () => {
      const fragment = TECH_FRAGMENTS[0];
      system.spawnPickup(fragment, 100, 100);
      
      const initialAngle = system.active[0].angle;
      const initialPhase = system.active[0].pulsePhase;

      system.update(100); // 100ms

      expect(system.active[0].angle).not.toBe(initialAngle);
      expect(system.active[0].pulsePhase).not.toBe(initialPhase);
    });

    test('should remove expired pickups', () => {
      const fragment = TECH_FRAGMENTS[0];
      const pickup = system.spawnPickup(fragment, 100, 100);
      pickup.spawnTime = Date.now() - 20000; // Expired (15s lifetime)

      system.update(100);

      expect(system.active.length).toBe(0);
    });

    test('should collect fragment in range', () => {
      const fragment = TECH_FRAGMENTS[0];
      system.spawnPickup(fragment, 100, 100);

      const collected = system.checkCollection(105, 105, 20); // Within range

      expect(collected).not.toBeNull();
      expect(collected.fragment.id).toBe(fragment.id);
      expect(system.hasFragment(fragment.id)).toBe(true);
      expect(system.getFragmentCount(fragment.id)).toBe(1);
    });

    test('should not collect fragment out of range', () => {
      const fragment = TECH_FRAGMENTS[0];
      system.spawnPickup(fragment, 100, 100);

      const collected = system.checkCollection(200, 200, 20); // Out of range

      expect(collected).toBeNull();
      expect(system.hasFragment(fragment.id)).toBe(false);
    });
  });

  describe('Collection Tracking', () => {
    test('should track collected fragments', () => {
      system.collect('quantum_core');
      
      expect(system.hasFragment('quantum_core')).toBe(true);
      expect(system.getFragmentCount('quantum_core')).toBe(1);
      expect(system.getTotalUnique()).toBe(1);
      expect(system.getTotalCount()).toBe(1);
    });

    test('should track duplicate fragments', () => {
      system.collect('quantum_core');
      system.collect('quantum_core');
      system.collect('quantum_core');

      expect(system.getFragmentCount('quantum_core')).toBe(3);
      expect(system.getTotalUnique()).toBe(1);
      expect(system.getTotalCount()).toBe(3);
    });

    test('should track multiple fragment types', () => {
      system.collect('quantum_core');
      system.collect('void_shard');
      system.collect('plasma_cell');

      expect(system.getTotalUnique()).toBe(3);
      expect(system.getTotalCount()).toBe(3);
    });

    test('should detect complete collection', () => {
      expect(system.isCollectionComplete()).toBe(false);

      TECH_FRAGMENTS.forEach(fragment => {
        system.collect(fragment.id);
      });

      expect(system.isCollectionComplete()).toBe(true);
      expect(system.getTotalUnique()).toBe(TECH_FRAGMENTS.length);
    });

    test('should get collected fragments list', () => {
      system.collect('quantum_core');
      system.collect('void_shard');

      const collected = system.getCollectedFragments();

      expect(collected.length).toBe(2);
      expect(collected.find(f => f.id === 'quantum_core')).toBeDefined();
      expect(collected.find(f => f.id === 'void_shard')).toBeDefined();
    });
  });

  describe('Save/Load', () => {
    test('should save and load fragment data', () => {
      system.collect('quantum_core');
      system.collect('void_shard');
      system.collect('quantum_core');

      const saveData = system.getSaveData();
      
      const newSystem = new TechFragmentSystem();
      newSystem.load({ techFragments: saveData });

      expect(newSystem.hasFragment('quantum_core')).toBe(true);
      expect(newSystem.hasFragment('void_shard')).toBe(true);
      expect(newSystem.getFragmentCount('quantum_core')).toBe(2);
      expect(newSystem.getTotalUnique()).toBe(2);
      expect(newSystem.getTotalCount()).toBe(3);
    });

    test('should handle missing save data', () => {
      system.load(null);
      
      expect(system.collected.size).toBe(0);
      expect(Object.keys(system.inventory).length).toBe(0);
    });

    test('should handle malformed save data', () => {
      system.load({ techFragments: {} });
      
      expect(system.collected.size).toBe(0);
      expect(Object.keys(system.inventory).length).toBe(0);
    });
  });

  describe('Active Pickups Management', () => {
    test('should get active pickups for rendering', () => {
      const fragment1 = TECH_FRAGMENTS[0];
      const fragment2 = TECH_FRAGMENTS[1];
      
      system.spawnPickup(fragment1, 100, 100);
      system.spawnPickup(fragment2, 200, 200);

      const active = system.getActivePickups();

      expect(active.length).toBe(2);
    });

    test('should exclude collected pickups from active list', () => {
      const fragment = TECH_FRAGMENTS[0];
      const pickup = system.spawnPickup(fragment, 100, 100);
      
      pickup.collected = true;

      const active = system.getActivePickups();

      expect(active.length).toBe(0);
    });

    test('should clear all active pickups', () => {
      system.spawnPickup(TECH_FRAGMENTS[0], 100, 100);
      system.spawnPickup(TECH_FRAGMENTS[1], 200, 200);
      
      system.clearActivePickups();

      expect(system.active.length).toBe(0);
      expect(system.getActivePickups().length).toBe(0);
    });
  });
});
