/**
 * Tests for game utility functions
 */

const {
  clamp,
  rand,
  chance,
  XP_PER_LEVEL,
  calculateUpgradeCost,
  randomAround,
  distance,
  circleCollision
} = require('./game-utils');

describe('Utility Functions', () => {
  describe('clamp', () => {
    test('should clamp value within range', () => {
      expect(clamp(5, 0, 10)).toBe(5);
    });

    test('should clamp value to minimum', () => {
      expect(clamp(-5, 0, 10)).toBe(0);
    });

    test('should clamp value to maximum', () => {
      expect(clamp(15, 0, 10)).toBe(10);
    });

    test('should handle edge cases at boundaries', () => {
      expect(clamp(0, 0, 10)).toBe(0);
      expect(clamp(10, 0, 10)).toBe(10);
    });

    test('should work with negative ranges', () => {
      expect(clamp(-5, -10, -1)).toBe(-5);
      expect(clamp(-15, -10, -1)).toBe(-10);
      expect(clamp(0, -10, -1)).toBe(-1);
    });
  });

  describe('rand', () => {
    test('should generate number within range', () => {
      for (let i = 0; i < 100; i++) {
        const value = rand(0, 10);
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(10);
      }
    });

    test('should generate number in negative range', () => {
      for (let i = 0; i < 100; i++) {
        const value = rand(-10, -5);
        expect(value).toBeGreaterThanOrEqual(-10);
        expect(value).toBeLessThanOrEqual(-5);
      }
    });

    test('should handle min equal to max', () => {
      const value = rand(5, 5);
      expect(value).toBe(5);
    });
  });

  describe('chance', () => {
    test('should always return true for probability 1', () => {
      for (let i = 0; i < 10; i++) {
        expect(chance(1)).toBe(true);
      }
    });

    test('should always return false for probability 0', () => {
      for (let i = 0; i < 10; i++) {
        expect(chance(0)).toBe(false);
      }
    });

    test('should return boolean for probability 0.5', () => {
      const result = chance(0.5);
      expect(typeof result).toBe('boolean');
    });

    test('should have roughly 50% distribution for p=0.5', () => {
      let trueCount = 0;
      const iterations = 1000;
      for (let i = 0; i < iterations; i++) {
        if (chance(0.5)) trueCount++;
      }
      // Allow for statistical variance (40-60% range)
      expect(trueCount).toBeGreaterThan(iterations * 0.4);
      expect(trueCount).toBeLessThan(iterations * 0.6);
    });
  });

  describe('XP_PER_LEVEL', () => {
    test('should return positive XP for level 1', () => {
      const xp = XP_PER_LEVEL(1);
      expect(xp).toBeGreaterThan(0);
    });

    test('should increase XP requirement with level', () => {
      const xp1 = XP_PER_LEVEL(1);
      const xp2 = XP_PER_LEVEL(2);
      const xp3 = XP_PER_LEVEL(5);
      expect(xp2).toBeGreaterThan(xp1);
      expect(xp3).toBeGreaterThan(xp2);
    });

    test('should return integer values', () => {
      for (let lvl = 1; lvl <= 10; lvl++) {
        const xp = XP_PER_LEVEL(lvl);
        expect(Number.isInteger(xp)).toBe(true);
      }
    });

    test('should calculate correct XP for specific levels', () => {
      // Level 1: floor(160 + 1^1.65 * 55) = floor(160 + 55) = 215
      expect(XP_PER_LEVEL(1)).toBe(215);
      
      // Level 2: floor(160 + 2^1.65 * 55) = floor(160 + 172.48...) = 332
      expect(XP_PER_LEVEL(2)).toBe(332);
    });
  });

  describe('calculateUpgradeCost', () => {
    test('should calculate cost for level 0', () => {
      const upgrade = { base: 100, step: 50 };
      const cost = calculateUpgradeCost(upgrade, 0);
      expect(cost).toBe(100);
    });

    test('should increase cost with level', () => {
      const upgrade = { base: 100, step: 50 };
      const cost0 = calculateUpgradeCost(upgrade, 0);
      const cost1 = calculateUpgradeCost(upgrade, 1);
      const cost2 = calculateUpgradeCost(upgrade, 2);
      expect(cost1).toBeGreaterThan(cost0);
      expect(cost2).toBeGreaterThan(cost1);
    });

    test('should return integer values', () => {
      const upgrade = { base: 80, step: 40 };
      for (let lvl = 0; lvl <= 10; lvl++) {
        const cost = calculateUpgradeCost(upgrade, lvl);
        expect(Number.isInteger(cost)).toBe(true);
      }
    });

    test('should calculate specific upgrade costs correctly', () => {
      const upgrade = { base: 80, step: 40 };
      // Level 0: floor(80 + 40 * (0 * 1.5 + 0 * 0 * 0.35)) = 80
      expect(calculateUpgradeCost(upgrade, 0)).toBe(80);
      
      // Level 1: floor(80 + 40 * (1 * 1.5 + 1 * 1 * 0.35)) = floor(80 + 40 * 1.85) = floor(80 + 74) = 154
      expect(calculateUpgradeCost(upgrade, 1)).toBe(154);
    });
  });

  describe('randomAround', () => {
    test('should generate position within distance range', () => {
      const cx = 100;
      const cy = 100;
      const min = 50;
      const max = 100;

      for (let i = 0; i < 50; i++) {
        const pos = randomAround(cx, cy, min, max);
        const dist = distance(cx, cy, pos.x, pos.y);
        expect(dist).toBeGreaterThanOrEqual(min);
        expect(dist).toBeLessThanOrEqual(max);
      }
    });

    test('should return object with x and y properties', () => {
      const pos = randomAround(0, 0, 10, 20);
      expect(pos).toHaveProperty('x');
      expect(pos).toHaveProperty('y');
      expect(typeof pos.x).toBe('number');
      expect(typeof pos.y).toBe('number');
    });

    test('should generate different positions', () => {
      const positions = [];
      for (let i = 0; i < 5; i++) {
        positions.push(randomAround(0, 0, 10, 20));
      }
      // Check that not all positions are identical
      const allSame = positions.every(pos => 
        pos.x === positions[0].x && pos.y === positions[0].y
      );
      expect(allSame).toBe(false);
    });
  });

  describe('distance', () => {
    test('should calculate distance between two points', () => {
      expect(distance(0, 0, 3, 4)).toBeCloseTo(5);
    });

    test('should return 0 for same point', () => {
      expect(distance(5, 5, 5, 5)).toBe(0);
    });

    test('should calculate distance correctly for negative coordinates', () => {
      expect(distance(-3, -4, 0, 0)).toBeCloseTo(5);
    });

    test('should be symmetric', () => {
      const d1 = distance(0, 0, 10, 10);
      const d2 = distance(10, 10, 0, 0);
      expect(d1).toBe(d2);
    });

    test('should calculate horizontal distance', () => {
      expect(distance(0, 5, 10, 5)).toBe(10);
    });

    test('should calculate vertical distance', () => {
      expect(distance(5, 0, 5, 10)).toBe(10);
    });
  });

  describe('circleCollision', () => {
    test('should detect collision when circles overlap', () => {
      expect(circleCollision(0, 0, 5, 5, 5, 5)).toBe(true);
    });

    test('should detect no collision when circles are apart', () => {
      expect(circleCollision(0, 0, 5, 20, 20, 5)).toBe(false);
    });

    test('should detect collision when circles touch', () => {
      // Circles at (0,0) r=5 and (10,0) r=5 are exactly touching (distance = 10, sum of radii = 10)
      // They should collide (<=, not <)
      expect(circleCollision(0, 0, 5, 10, 0, 5)).toBe(true);
    });

    test('should detect collision when one circle contains another', () => {
      expect(circleCollision(0, 0, 10, 2, 2, 2)).toBe(true);
    });

    test('should handle circles at same position', () => {
      expect(circleCollision(5, 5, 3, 5, 5, 3)).toBe(true);
    });

    test('should work with different sized circles', () => {
      expect(circleCollision(0, 0, 1, 5, 5, 10)).toBe(true);
      expect(circleCollision(0, 0, 1, 50, 50, 10)).toBe(false);
    });
  });

  describe('Planetary Physics', () => {
    const {
      getTerrainHeightAt,
      applyGravity,
      isOnGround,
      PLANET_CONFIGS
    } = require('./game-utils');

    describe('getTerrainHeightAt', () => {
      test('should interpolate between terrain points', () => {
        const terrain = [
          { x: 0, y: 100 },
          { x: 100, y: 200 }
        ];
        expect(getTerrainHeightAt(terrain, 50, 0)).toBe(150);
      });

      test('should return exact point value at terrain point', () => {
        const terrain = [
          { x: 0, y: 100 },
          { x: 100, y: 200 },
          { x: 200, y: 150 }
        ];
        expect(getTerrainHeightAt(terrain, 0, 0)).toBe(100);
      });

      test('should return default value for empty terrain', () => {
        expect(getTerrainHeightAt([], 50, 500)).toBe(500);
        expect(getTerrainHeightAt(null, 50, 500)).toBe(500);
      });

      test('should return default for single point terrain', () => {
        expect(getTerrainHeightAt([{ x: 0, y: 100 }], 50, 500)).toBe(500);
      });

      test('should handle x outside terrain bounds', () => {
        const terrain = [
          { x: 0, y: 100 },
          { x: 100, y: 200 }
        ];
        expect(getTerrainHeightAt(terrain, -50, 500)).toBe(500);
        expect(getTerrainHeightAt(terrain, 150, 500)).toBe(500);
      });
    });

    describe('applyGravity', () => {
      test('should increase velocity with gravity', () => {
        const newVel = applyGravity(0, 0.4, 15, 16.67);
        expect(newVel).toBeCloseTo(0.4);
      });

      test('should cap velocity at max fall speed', () => {
        const newVel = applyGravity(14, 0.4, 15, 16.67);
        expect(newVel).toBeLessThanOrEqual(15);
      });

      test('should respect different gravity values', () => {
        const highGrav = applyGravity(0, 0.5, 15, 16.67);
        const lowGrav = applyGravity(0, 0.15, 15, 16.67);
        expect(highGrav).toBeGreaterThan(lowGrav);
      });

      test('should scale with delta time', () => {
        const normal = applyGravity(0, 0.4, 15, 16.67);
        const double = applyGravity(0, 0.4, 15, 33.34);
        expect(double).toBeCloseTo(normal * 2, 1);
      });
    });

    describe('isOnGround', () => {
      test('should return true when entity touches ground', () => {
        expect(isOnGround(90, 10, 100)).toBe(true);
      });

      test('should return true when entity is below ground', () => {
        expect(isOnGround(100, 10, 100)).toBe(true);
      });

      test('should return false when entity is above ground', () => {
        expect(isOnGround(80, 10, 100)).toBe(false);
      });

      test('should handle different entity sizes', () => {
        expect(isOnGround(50, 50, 100)).toBe(true);
        expect(isOnGround(50, 10, 100)).toBe(false);
      });
    });

    describe('PLANET_CONFIGS', () => {
      test('should have all expected planets', () => {
        expect(PLANET_CONFIGS.terra).toBeDefined();
        expect(PLANET_CONFIGS.mars).toBeDefined();
        expect(PLANET_CONFIGS.ice).toBeDefined();
        expect(PLANET_CONFIGS.volcanic).toBeDefined();
        expect(PLANET_CONFIGS.moon).toBeDefined();
      });

      test('should have correct gravity values', () => {
        expect(PLANET_CONFIGS.terra.gravity).toBe(0.4);
        expect(PLANET_CONFIGS.mars.gravity).toBe(0.28);
        expect(PLANET_CONFIGS.moon.gravity).toBe(0.15);
      });

      test('moon should have lowest gravity', () => {
        const gravities = Object.values(PLANET_CONFIGS).map(p => p.gravity);
        expect(Math.min(...gravities)).toBe(PLANET_CONFIGS.moon.gravity);
      });

      test('volcanic should have highest gravity', () => {
        const gravities = Object.values(PLANET_CONFIGS).map(p => p.gravity);
        expect(Math.max(...gravities)).toBe(PLANET_CONFIGS.volcanic.gravity);
      });
    });
  });
});
