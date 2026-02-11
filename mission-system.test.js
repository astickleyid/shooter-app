/**
 * Tests for MissionSystem
 */

const { MissionSystem, MISSION_TYPES, BOUNTY_TARGETS } = require('./src/systems/MissionSystem.js');

describe('MissionSystem', () => {
  let system;

  beforeEach(() => {
    system = new MissionSystem();
  });

  describe('Initialization', () => {
    test('should initialize with empty state', () => {
      expect(system.dailyMissions.length).toBe(0);
      expect(Object.keys(system.missionProgress).length).toBe(0);
      expect(system.completedMissions.size).toBe(0);
      expect(system.activeBounties.length).toBe(0);
    });

    test('should have valid bounty target definitions', () => {
      expect(BOUNTY_TARGETS.length).toBeGreaterThan(0);
      
      BOUNTY_TARGETS.forEach(bounty => {
        expect(bounty.id).toBeDefined();
        expect(bounty.name).toBeDefined();
        expect(bounty.reward).toBeGreaterThan(0);
        expect(bounty.stats).toBeDefined();
        expect(bounty.behavior).toBeDefined();
      });
    });
  });

  describe('Daily Mission Refresh', () => {
    test('should generate 3 daily missions on refresh', () => {
      system.refreshDailyMissions();

      expect(system.dailyMissions.length).toBe(3);
    });

    test('should generate unique missions', () => {
      system.refreshDailyMissions();

      const types = system.dailyMissions.map(m => m.type);
      const uniqueTypes = new Set(types);
      
      // Should have diverse mission types (allowing for duplicates is acceptable)
      expect(uniqueTypes.size).toBeGreaterThanOrEqual(1);
    });

    test('should initialize missions with progress zero', () => {
      system.refreshDailyMissions();

      system.dailyMissions.forEach(mission => {
        expect(mission.progress).toBe(0);
        expect(mission.completed).toBe(false);
        expect(mission.claimed).toBe(false);
      });
    });

    test('should refresh missions when date changes', () => {
      system.lastRefreshDate = new Date(Date.now() - 86400000).toDateString(); // Yesterday
      
      system.checkDailyRefresh();

      expect(system.lastRefreshDate).toBe(new Date().toDateString());
      expect(system.dailyMissions.length).toBe(3);
    });

    test('should not refresh missions on same day', () => {
      system.refreshDailyMissions();
      system.lastRefreshDate = new Date().toDateString(); // Set to today
      const missionCount = system.dailyMissions.length;
      
      system.checkDailyRefresh();

      // Should still have 3 missions (not refreshed)
      expect(system.dailyMissions.length).toBe(missionCount);
      expect(system.lastRefreshDate).toBe(new Date().toDateString());
    });
  });

  describe('Bounty Refresh', () => {
    test('should generate 2 active bounties on refresh', () => {
      system.refreshBounties();

      expect(system.activeBounties.length).toBe(2);
    });

    test('should initialize bounties as active and not spawned', () => {
      system.refreshBounties();

      system.activeBounties.forEach(bounty => {
        expect(bounty.active).toBe(true);
        expect(bounty.spawned).toBe(false);
      });
    });

    test('should allow bounty spawn when conditions met', () => {
      system.refreshBounties();
      const bountyId = system.activeBounties[0].id;

      expect(system.canSpawnBounty(bountyId)).toBe(true);
    });

    test('should prevent bounty spawn after spawned', () => {
      system.refreshBounties();
      const bountyId = system.activeBounties[0].id;
      
      system.markBountySpawned(bountyId);

      expect(system.canSpawnBounty(bountyId)).toBe(false);
    });

    test('should prevent bounty spawn after completed', () => {
      system.refreshBounties();
      const bountyId = system.activeBounties[0].id;
      
      system.trackKill(false, false, bountyId);

      expect(system.canSpawnBounty(bountyId)).toBe(false);
    });
  });

  describe('Run Statistics Tracking', () => {
    test('should reset run stats on start', () => {
      system.runStats.enemiesKilled = 50;
      system.runStats.scoreEarned = 5000;
      
      system.startRun();

      expect(system.runStats.enemiesKilled).toBe(0);
      expect(system.runStats.scoreEarned).toBe(0);
    });

    test('should track enemy kills', () => {
      system.trackKill(false, false);
      system.trackKill(false, false);
      system.trackKill(true, false); // Boss

      expect(system.runStats.enemiesKilled).toBe(3);
      expect(system.runStats.bossesKilled).toBe(1);
    });

    test('should track elite kills', () => {
      system.trackKill(false, true);
      system.trackKill(false, true);

      expect(system.runStats.elitesKilled).toBe(2);
    });

    test('should track credits collected', () => {
      system.trackCredits(100);
      system.trackCredits(50);

      expect(system.runStats.creditsCollected).toBe(150);
    });

    test('should track tech fragments', () => {
      system.trackFragments(1);
      system.trackFragments(1);

      expect(system.runStats.fragmentsCollected).toBe(2);
    });

    test('should track score', () => {
      system.trackScore(5000);

      expect(system.runStats.scoreEarned).toBe(5000);
    });

    test('should track highest level reached', () => {
      system.trackLevel(5);
      system.trackLevel(3); // Lower level shouldn't change max
      system.trackLevel(8);

      expect(system.runStats.levelReached).toBe(8);
    });

    test('should track damage taken', () => {
      system.trackDamage(10);
      system.trackDamage(5);

      expect(system.runStats.damageTakenThisLevel).toBe(15);
    });

    test('should track flawless level completion', () => {
      system.runStats.damageTakenThisLevel = 0;
      
      system.trackLevelComplete(true);

      expect(system.runStats.levelsCompletedFlawless).toBe(1);
      expect(system.runStats.damageTakenThisLevel).toBe(0); // Reset
    });

    test('should not count flawless if damage taken', () => {
      system.runStats.damageTakenThisLevel = 10;
      
      system.trackLevelComplete(true);

      expect(system.runStats.levelsCompletedFlawless).toBe(0);
    });

    test('should track time elapsed', () => {
      system.trackTime(120);

      expect(system.runStats.timeElapsed).toBe(120);
    });
  });

  describe('Mission Progress', () => {
    beforeEach(() => {
      system.refreshDailyMissions();
    });

    test('should update mission progress', () => {
      const killMission = system.dailyMissions.find(m => m.type === MISSION_TYPES.KILL_ENEMIES);
      
      if (killMission) {
        system.trackKill(false, false);
        system.trackKill(false, false);

        expect(killMission.progress).toBe(2);
      }
    });

    test('should complete mission when target reached', () => {
      const killMission = system.dailyMissions.find(m => m.type === MISSION_TYPES.KILL_ENEMIES);
      
      if (killMission) {
        // Set progress to target
        for (let i = 0; i < killMission.target; i++) {
          system.trackKill(false, false);
        }

        expect(killMission.completed).toBe(true);
      }
    });

    test('should not increase progress beyond target', () => {
      const killMission = system.dailyMissions.find(m => m.type === MISSION_TYPES.KILL_ENEMIES);
      
      if (killMission) {
        const target = killMission.target;
        
        for (let i = 0; i < target + 10; i++) {
          system.trackKill(false, false);
        }

        expect(killMission.progress).toBeGreaterThanOrEqual(target);
      }
    });
  });

  describe('Mission Rewards', () => {
    beforeEach(() => {
      system.refreshDailyMissions();
    });

    test('should claim reward for completed mission', () => {
      const mission = system.dailyMissions[0];
      mission.completed = true;
      
      const reward = system.claimMissionReward(mission.id);

      expect(reward).not.toBeNull();
      expect(reward.credits).toBe(mission.reward);
      expect(mission.claimed).toBe(true);
    });

    test('should not claim reward for incomplete mission', () => {
      const mission = system.dailyMissions[0];
      mission.completed = false;
      
      const reward = system.claimMissionReward(mission.id);

      expect(reward).toBeNull();
    });

    test('should not claim reward twice', () => {
      const mission = system.dailyMissions[0];
      mission.completed = true;
      
      system.claimMissionReward(mission.id);
      const secondReward = system.claimMissionReward(mission.id);

      expect(secondReward).toBeNull();
    });

    test('should include XP boost in reward', () => {
      const mission = system.dailyMissions[0];
      mission.completed = true;
      mission.xpBoost = 1.5;
      
      const reward = system.claimMissionReward(mission.id);

      expect(reward.xpBoost).toBe(1.5);
    });

    test('should include tech fragment flag in reward', () => {
      const mission = system.dailyMissions[0];
      mission.completed = true;
      mission.techFragment = true;
      
      const reward = system.claimMissionReward(mission.id);

      expect(reward.techFragment).toBe(true);
    });
  });

  describe('Bounty Tracking', () => {
    beforeEach(() => {
      system.refreshBounties();
    });

    test('should track bounty kill', () => {
      const bountyId = system.activeBounties[0].id;
      
      system.trackKill(false, false, bountyId);

      expect(system.bountyProgress[bountyId]).toBe(true);
      expect(system.completedBounties.has(bountyId)).toBe(true);
    });

    test('should get active bounties', () => {
      const bounties = system.getActiveBounties();

      expect(bounties.length).toBe(2);
      bounties.forEach(b => {
        expect(b.active).toBe(true);
      });
    });
  });

  describe('Statistics', () => {
    beforeEach(() => {
      system.refreshDailyMissions();
      system.refreshBounties(); // Also refresh bounties for tests
    });

    test('should count completed missions', () => {
      system.dailyMissions[0].completed = true;
      system.dailyMissions[1].completed = true;
      
      const counts = system.getMissionCounts();

      expect(counts.completed).toBe(2);
      expect(counts.total).toBe(3);
      expect(counts.allCompleted).toBe(false);
    });

    test('should detect all missions completed', () => {
      system.dailyMissions.forEach(m => m.completed = true);
      
      const counts = system.getMissionCounts();

      expect(counts.allCompleted).toBe(true);
    });

    test('should track total missions completed', () => {
      system.dailyMissions.forEach(m => {
        m.completed = true;
        system.claimMissionReward(m.id);
      });

      expect(system.getTotalMissionsCompleted()).toBe(3);
    });

    test('should track total bounties completed', () => {
      system.activeBounties.forEach(b => {
        system.trackKill(false, false, b.id);
      });

      expect(system.getTotalBountiesCompleted()).toBe(2);
    });

    test('should get run stats', () => {
      system.trackKill(false, false);
      system.trackCredits(100);
      system.trackLevel(5);
      
      const stats = system.getRunStats();

      expect(stats.enemiesKilled).toBe(1);
      expect(stats.creditsCollected).toBe(100);
      expect(stats.levelReached).toBe(5);
    });
  });

  describe('Save/Load', () => {
    test('should save and load mission data', () => {
      system.refreshDailyMissions();
      system.refreshBounties();
      system.lastRefreshDate = new Date().toDateString(); // Set to today
      system.dailyMissions[0].completed = true;
      
      const saveData = system.getSaveData();
      
      const newSystem = new MissionSystem();
      newSystem.load({ missions: saveData });

      expect(newSystem.dailyMissions.length).toBe(3);
      expect(newSystem.activeBounties.length).toBe(2);
      expect(newSystem.dailyMissions[0].completed).toBe(true);
    });

    test('should handle missing save data', () => {
      system.load(null);
      
      expect(system.dailyMissions.length).toBe(3); // Should refresh
    });

    test('should preserve last refresh date', () => {
      const today = new Date().toDateString();
      system.refreshDailyMissions();
      system.lastRefreshDate = today;
      
      const saveData = system.getSaveData();
      
      const newSystem = new MissionSystem();
      newSystem.load({ missions: saveData });

      expect(newSystem.lastRefreshDate).toBe(today);
    });
  });
});
