/**
 * Mission System - Manages daily missions and bounty targets
 * 
 * Provides rotating daily missions and special bounty targets that give
 * players clear objectives and rewarding challenges.
 */

/**
 * Mission type definitions
 */
const MISSION_TYPES = {
  KILL_ENEMIES: 'kill_enemies',
  REACH_LEVEL: 'reach_level',
  COLLECT_CREDITS: 'collect_credits',
  COLLECT_FRAGMENTS: 'collect_fragments',
  USE_WEAPON: 'use_weapon',
  NO_DAMAGE_LEVEL: 'no_damage_level',
  KILL_BOSSES: 'kill_bosses',
  KILL_ELITES: 'kill_elites',
  SURVIVE_TIME: 'survive_time',
  EARN_SCORE: 'earn_score'
};

/**
 * Mission templates
 */
const MISSION_TEMPLATES = [
  // Kill missions
  { type: MISSION_TYPES.KILL_ENEMIES, target: 50, reward: 150, xpBoost: 1.2, name: 'Exterminator', desc: 'Eliminate {target} enemies' },
  { type: MISSION_TYPES.KILL_ENEMIES, target: 100, reward: 300, xpBoost: 1.3, name: 'Slayer', desc: 'Eliminate {target} enemies' },
  { type: MISSION_TYPES.KILL_ENEMIES, target: 200, reward: 500, xpBoost: 1.5, name: 'Annihilator', desc: 'Eliminate {target} enemies' },
  
  // Level missions
  { type: MISSION_TYPES.REACH_LEVEL, target: 5, reward: 100, xpBoost: 1.15, name: 'Survivor', desc: 'Reach level {target} in a single run' },
  { type: MISSION_TYPES.REACH_LEVEL, target: 10, reward: 250, xpBoost: 1.25, name: 'Veteran', desc: 'Reach level {target} in a single run' },
  { type: MISSION_TYPES.REACH_LEVEL, target: 15, reward: 400, xpBoost: 1.4, name: 'Elite Pilot', desc: 'Reach level {target} in a single run' },
  
  // Credits missions
  { type: MISSION_TYPES.COLLECT_CREDITS, target: 200, reward: 100, xpBoost: 1.1, name: 'Scavenger', desc: 'Collect {target} credits' },
  { type: MISSION_TYPES.COLLECT_CREDITS, target: 500, reward: 250, xpBoost: 1.2, name: 'Prospector', desc: 'Collect {target} credits' },
  
  // Boss/Elite missions
  { type: MISSION_TYPES.KILL_BOSSES, target: 3, reward: 300, techFragment: true, name: 'Boss Hunter', desc: 'Defeat {target} boss enemies' },
  { type: MISSION_TYPES.KILL_ELITES, target: 10, reward: 200, xpBoost: 1.3, name: 'Elite Destroyer', desc: 'Defeat {target} elite enemies' },
  
  // Challenge missions
  { type: MISSION_TYPES.NO_DAMAGE_LEVEL, target: 1, reward: 200, techFragment: true, name: 'Flawless', desc: 'Complete a level without taking damage' },
  { type: MISSION_TYPES.SURVIVE_TIME, target: 300, reward: 250, xpBoost: 1.25, name: 'Endurance', desc: 'Survive for {target} seconds in a single run' },
  
  // Score missions
  { type: MISSION_TYPES.EARN_SCORE, target: 5000, reward: 150, xpBoost: 1.2, name: 'High Scorer', desc: 'Earn {target} points' },
  { type: MISSION_TYPES.EARN_SCORE, target: 10000, reward: 350, xpBoost: 1.35, name: 'Point Master', desc: 'Earn {target} points' }
];

/**
 * Bounty target definitions
 */
const BOUNTY_TARGETS = [
  {
    id: 'crimson_ace',
    name: 'The Crimson Ace',
    desc: 'A notorious pilot in a blood-red interceptor. Extremely fast and aggressive.',
    reward: 500,
    techFragment: true,
    difficulty: 'hard',
    color: '#dc2626',
    stats: { speed: 2.0, health: 300, damage: 25, size: 18 },
    behavior: 'aggressive_dodge' // Charges player, dodges bullets
  },
  {
    id: 'void_phantom',
    name: 'Void Phantom',
    desc: 'A spectral vessel that phases in and out of reality. Hard to track.',
    reward: 450,
    techFragment: true,
    difficulty: 'hard',
    color: '#7c3aed',
    stats: { speed: 1.3, health: 400, damage: 20, size: 20 },
    behavior: 'phase_blink' // Teleports randomly
  },
  {
    id: 'iron_warlord',
    name: 'Iron Warlord',
    desc: 'Massive armored battleship bristling with weapons. Slow but devastating.',
    reward: 600,
    techFragment: true,
    difficulty: 'very_hard',
    color: '#475569',
    stats: { speed: 0.6, health: 800, damage: 40, size: 35 },
    behavior: 'tank_barrage' // Shoots multiple projectiles
  },
  {
    id: 'swarm_queen',
    name: 'Swarm Queen',
    desc: 'Bio-organic hive ship that spawns smaller attack drones.',
    reward: 550,
    techFragment: true,
    difficulty: 'hard',
    color: '#84cc16',
    stats: { speed: 1.0, health: 500, damage: 15, size: 28 },
    behavior: 'spawn_minions' // Spawns small enemies
  },
  {
    id: 'quantum_hunter',
    name: 'Quantum Hunter',
    desc: 'Experimental craft with temporal displacement capabilities.',
    reward: 700,
    techFragment: true,
    difficulty: 'very_hard',
    color: '#06b6d4',
    stats: { speed: 1.5, health: 600, damage: 30, size: 22 },
    behavior: 'time_distortion' // Slows bullets, speeds self up
  }
];

/**
 * MissionSystem class
 */
class MissionSystem {
  constructor() {
    this.dailyMissions = []; // 3 active daily missions
    this.missionProgress = {}; // Progress tracking for active missions
    this.completedMissions = new Set(); // IDs of completed missions
    this.lastRefreshDate = null; // Date of last mission refresh
    
    this.activeBounties = []; // Currently available bounties
    this.completedBounties = new Set(); // IDs of completed bounties
    this.bountyProgress = {}; // Bounty kill tracking
    
    this.runStats = this.resetRunStats(); // Current run statistics
  }

  /**
   * Reset statistics for current run
   */
  resetRunStats() {
    return {
      enemiesKilled: 0,
      bossesKilled: 0,
      elitesKilled: 0,
      creditsCollected: 0,
      fragmentsCollected: 0,
      scoreEarned: 0,
      levelReached: 0,
      timeElapsed: 0,
      damageTakenThisLevel: 0,
      levelsCompletedFlawless: 0
    };
  }

  /**
   * Initialize system with saved data
   * @param {Object} saveData - Saved mission data
   */
  load(saveData) {
    if (saveData && saveData.missions) {
      this.dailyMissions = saveData.missions.daily || [];
      this.missionProgress = saveData.missions.progress || {};
      this.completedMissions = new Set(saveData.missions.completed || []);
      this.lastRefreshDate = saveData.missions.lastRefresh || null;
      
      this.activeBounties = saveData.missions.bounties || [];
      this.completedBounties = new Set(saveData.missions.bountiesCompleted || []);
      this.bountyProgress = saveData.missions.bountyProgress || {};
    }

    // Check if missions need refresh
    this.checkDailyRefresh();
  }

  /**
   * Get save data
   * @returns {Object} Save data object
   */
  getSaveData() {
    return {
      daily: this.dailyMissions,
      progress: this.missionProgress,
      completed: Array.from(this.completedMissions),
      lastRefresh: this.lastRefreshDate,
      bounties: this.activeBounties,
      bountiesCompleted: Array.from(this.completedBounties),
      bountyProgress: this.bountyProgress
    };
  }

  /**
   * Check if daily missions need to be refreshed
   */
  checkDailyRefresh() {
    const today = new Date().toDateString();
    
    if (this.lastRefreshDate !== today || this.dailyMissions.length === 0) {
      this.refreshDailyMissions();
      this.refreshBounties();
      this.lastRefreshDate = today;
    }
  }

  /**
   * Refresh daily missions (picks 3 random missions)
   */
  refreshDailyMissions() {
    // Pick 3 random unique missions
    const shuffled = [...MISSION_TEMPLATES].sort(() => Math.random() - 0.5);
    this.dailyMissions = shuffled.slice(0, 3).map((template, index) => ({
      id: `daily_${Date.now()}_${index}`,
      ...template,
      progress: 0,
      completed: false,
      claimed: false
    }));

    // Reset progress for new missions
    this.missionProgress = {};
  }

  /**
   * Refresh bounty targets (picks 2 random bounties)
   */
  refreshBounties() {
    const shuffled = [...BOUNTY_TARGETS].sort(() => Math.random() - 0.5);
    this.activeBounties = shuffled.slice(0, 2).map(bounty => ({
      ...bounty,
      active: true,
      spawned: false
    }));

    this.bountyProgress = {};
  }

  /**
   * Start a new run - reset run stats
   */
  startRun() {
    this.runStats = this.resetRunStats();
  }

  /**
   * Track enemy kill
   * @param {boolean} isBoss - Whether enemy was a boss
   * @param {boolean} isElite - Whether enemy was an elite
   * @param {string} bountyId - ID if enemy was a bounty target
   */
  trackKill(isBoss = false, isElite = false, bountyId = null) {
    this.runStats.enemiesKilled++;
    
    if (isBoss) {
      this.runStats.bossesKilled++;
      this.updateMissionProgress(MISSION_TYPES.KILL_BOSSES, 1);
    }
    
    if (isElite) {
      this.runStats.elitesKilled++;
      this.updateMissionProgress(MISSION_TYPES.KILL_ELITES, 1);
    }

    this.updateMissionProgress(MISSION_TYPES.KILL_ENEMIES, 1);

    // Track bounty kills
    if (bountyId) {
      this.bountyProgress[bountyId] = true;
      this.completedBounties.add(bountyId);
    }
  }

  /**
   * Track credits collected
   * @param {number} amount - Credits collected
   */
  trackCredits(amount) {
    this.runStats.creditsCollected += amount;
    this.updateMissionProgress(MISSION_TYPES.COLLECT_CREDITS, amount);
  }

  /**
   * Track tech fragments collected
   * @param {number} amount - Fragments collected
   */
  trackFragments(amount = 1) {
    this.runStats.fragmentsCollected += amount;
    this.updateMissionProgress(MISSION_TYPES.COLLECT_FRAGMENTS, amount);
  }

  /**
   * Track score earned
   * @param {number} score - Score earned
   */
  trackScore(score) {
    this.runStats.scoreEarned = score;
    this.updateMissionProgress(MISSION_TYPES.EARN_SCORE, score);
  }

  /**
   * Track level reached
   * @param {number} level - Current level
   */
  trackLevel(level) {
    this.runStats.levelReached = Math.max(this.runStats.levelReached, level);
    this.updateMissionProgress(MISSION_TYPES.REACH_LEVEL, level);
  }

  /**
   * Track damage taken this level
   * @param {number} damage - Damage amount
   */
  trackDamage(damage) {
    this.runStats.damageTakenThisLevel += damage;
  }

  /**
   * Track level completion
   * @param {boolean} flawless - Whether level was completed without damage
   */
  trackLevelComplete(flawless) {
    if (flawless && this.runStats.damageTakenThisLevel === 0) {
      this.runStats.levelsCompletedFlawless++;
      this.updateMissionProgress(MISSION_TYPES.NO_DAMAGE_LEVEL, 1);
    }
    // Reset level damage counter
    this.runStats.damageTakenThisLevel = 0;
  }

  /**
   * Track time elapsed
   * @param {number} seconds - Time elapsed in seconds
   */
  trackTime(seconds) {
    this.runStats.timeElapsed = seconds;
    this.updateMissionProgress(MISSION_TYPES.SURVIVE_TIME, seconds);
  }

  /**
   * Update mission progress
   * @param {string} missionType - Type of mission
   * @param {number} amount - Progress amount
   */
  updateMissionProgress(missionType, amount) {
    this.dailyMissions.forEach(mission => {
      if (mission.type === missionType && !mission.completed) {
        // For cumulative missions (kills, credits), add the amount
        // For milestone missions (level, score), use max value
        const cumulativeMissions = [
          MISSION_TYPES.KILL_ENEMIES,
          MISSION_TYPES.KILL_BOSSES,
          MISSION_TYPES.KILL_ELITES,
          MISSION_TYPES.COLLECT_CREDITS,
          MISSION_TYPES.COLLECT_FRAGMENTS
        ];
        
        if (cumulativeMissions.includes(missionType)) {
          mission.progress += amount;
        } else {
          mission.progress = Math.max(mission.progress, amount);
        }
        
        if (mission.progress >= mission.target) {
          mission.completed = true;
        }
      }
    });
  }

  /**
   * Claim mission reward
   * @param {string} missionId - Mission ID
   * @returns {Object|null} Reward object or null if invalid
   */
  claimMissionReward(missionId) {
    const mission = this.dailyMissions.find(m => m.id === missionId);
    
    if (!mission || !mission.completed || mission.claimed) {
      return null;
    }

    mission.claimed = true;
    this.completedMissions.add(missionId);

    return {
      credits: mission.reward,
      xpBoost: mission.xpBoost || 1.0,
      techFragment: mission.techFragment || false
    };
  }

  /**
   * Get active bounty targets
   * @returns {Array} Array of active bounties
   */
  getActiveBounties() {
    return this.activeBounties.filter(b => b.active);
  }

  /**
   * Get daily missions
   * @returns {Array} Array of daily missions
   */
  getDailyMissions() {
    return this.dailyMissions;
  }

  /**
   * Check if bounty can spawn
   * @param {string} bountyId - Bounty ID
   * @returns {boolean} True if can spawn
   */
  canSpawnBounty(bountyId) {
    const bounty = this.activeBounties.find(b => b.id === bountyId);
    return bounty && bounty.active && !bounty.spawned && !this.completedBounties.has(bountyId);
  }

  /**
   * Mark bounty as spawned
   * @param {string} bountyId - Bounty ID
   */
  markBountySpawned(bountyId) {
    const bounty = this.activeBounties.find(b => b.id === bountyId);
    if (bounty) {
      bounty.spawned = true;
    }
  }

  /**
   * Get current run statistics
   * @returns {Object} Run stats
   */
  getRunStats() {
    return { ...this.runStats };
  }

  /**
   * Get mission completion count
   * @returns {Object} Counts of completed/total missions
   */
  getMissionCounts() {
    const completed = this.dailyMissions.filter(m => m.completed).length;
    const total = this.dailyMissions.length;
    const allCompleted = completed === total && total > 0;

    return { completed, total, allCompleted };
  }

  /**
   * Get total missions completed (all time)
   * @returns {number} Total count
   */
  getTotalMissionsCompleted() {
    return this.completedMissions.size;
  }

  /**
   * Get total bounties completed (all time)
   * @returns {number} Total count
   */
  getTotalBountiesCompleted() {
    return this.completedBounties.size;
  }
}

// ES6 export for module systems
if (typeof exports === 'undefined') {
  // Browser environment
  if (typeof window !== 'undefined') {
    window.MissionSystem = MissionSystem;
    window.MISSION_TYPES = MISSION_TYPES;
    window.BOUNTY_TARGETS = BOUNTY_TARGETS;
  }
}

// CommonJS export for Node.js/Jest
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    MissionSystem,
    MISSION_TYPES,
    BOUNTY_TARGETS
  };
  module.exports.default = MissionSystem;
}
