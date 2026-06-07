/**
 * AchievementSystem — localStorage-based achievement tracking for VOID RIFT.
 *
 * Tracks cumulative player stats across runs and unlocks achievements when
 * conditions are met. Integrates with hangar-ui.js for display.
 *
 * Usage:
 *   import { updateStats, getUnlocked, loadAchievements } from './AchievementSystem.js';
 *
 *   // After a kill:
 *   const newlyUnlocked = updateStats({ totalKills: currentKills });
 *   // newlyUnlocked is an array of achievement objects that were just unlocked.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Storage key
// ─────────────────────────────────────────────────────────────────────────────

export const ACHIEVEMENT_STORAGE_KEY = 'voidrift_achievements';

// ─────────────────────────────────────────────────────────────────────────────
// Achievement catalog
// ─────────────────────────────────────────────────────────────────────────────

export const ACHIEVEMENT_CATALOG = [
  {
    id: 'first_blood',
    name: 'First Blood',
    icon: '💥',
    desc: 'Destroy your first enemy',
    condition: (s) => s.totalKills >= 1,
  },
  {
    id: 'centurion',
    name: 'Centurion',
    icon: '⚔️',
    desc: 'Destroy 100 enemies total',
    condition: (s) => s.totalKills >= 100,
  },
  {
    id: 'annihilator',
    name: 'Annihilator',
    icon: '🔥',
    desc: 'Destroy 500 enemies total',
    condition: (s) => s.totalKills >= 500,
  },
  {
    id: 'survivor_5',
    name: 'Survivor',
    icon: '🛡️',
    desc: 'Reach wave 5',
    condition: (s) => s.maxWave >= 5,
  },
  {
    id: 'veteran_10',
    name: 'Veteran',
    icon: '🌟',
    desc: 'Reach wave 10',
    condition: (s) => s.maxWave >= 10,
  },
  {
    id: 'boss_slayer',
    name: 'Boss Slayer',
    icon: '👑',
    desc: 'Defeat your first boss',
    condition: (s) => s.bossKills >= 1,
  },
  {
    id: 'daily_pilot',
    name: 'Daily Pilot',
    icon: '📅',
    desc: 'Complete your first daily challenge',
    condition: (s) => s.dailyChallengesCompleted >= 1,
  },
  {
    id: 'streak_3',
    name: 'On a Roll',
    icon: '🔥',
    desc: 'Complete 3 daily challenges in a row',
    condition: (s) => s.dailyStreak >= 3,
  },
  {
    id: 'combo_master',
    name: 'Combo Master',
    icon: '⚡',
    desc: 'Reach a x5 kill combo',
    condition: (s) => s.maxCombo >= 5,
  },
  {
    id: 'hangar_max',
    name: 'Fully Loaded',
    icon: '🚀',
    desc: 'Max out any Hangar upgrade',
    condition: (s) => s.maxedHangarUpgrades >= 1,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Default state factory
// ─────────────────────────────────────────────────────────────────────────────

function defaultAchievementData() {
  return {
    unlockedIds: [],
    stats: {
      totalKills: 0,
      maxWave: 0,
      bossKills: 0,
      dailyChallengesCompleted: 0,
      dailyStreak: 0,
      maxCombo: 0,
      maxedHangarUpgrades: 0,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Persistence helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Load achievement data from localStorage.
 * Falls back to a fresh default state on any parse error.
 * @returns {{ unlockedIds: string[], stats: Object }}
 */
export function loadAchievements() {
  try {
    const raw = localStorage.getItem(ACHIEVEMENT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        const defaults = defaultAchievementData();
        return {
          unlockedIds: Array.isArray(parsed.unlockedIds) ? parsed.unlockedIds : [],
          stats: {
            ...defaults.stats,
            ...(parsed.stats && typeof parsed.stats === 'object' ? parsed.stats : {}),
          },
        };
      }
    }
  } catch (err) {
    console.warn('[AchievementSystem] Failed to load achievement data:', err);
  }
  return defaultAchievementData();
}

/**
 * Persist achievement data to localStorage.
 * @param {{ unlockedIds: string[], stats: Object }} data
 */
export function saveAchievements(data) {
  try {
    localStorage.setItem(ACHIEVEMENT_STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('[AchievementSystem] Failed to save achievement data:', err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Core logic
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Merge partial stats into the stored stats, check all achievement conditions,
 * persist the updated state, and return any newly-unlocked achievement objects.
 *
 * Stat values are merged with Math.max so they only ever increase
 * (e.g. passing totalKills=3 when 5 is stored leaves 5 in place).
 * Pass the running total, not a delta.
 *
 * @param {Partial<{
 *   totalKills: number,
 *   maxWave: number,
 *   bossKills: number,
 *   dailyChallengesCompleted: number,
 *   dailyStreak: number,
 *   maxCombo: number,
 *   maxedHangarUpgrades: number,
 * }>} partialStats
 * @returns {Array<{ id: string, name: string, icon: string, desc: string }>}
 *   Newly unlocked achievement objects (empty array if none newly unlocked).
 */
export function updateStats(partialStats) {
  const data = loadAchievements();

  // Merge stats — always take the higher value so stats only grow
  for (const [key, value] of Object.entries(partialStats)) {
    if (typeof value === 'number' && key in data.stats) {
      data.stats[key] = Math.max(data.stats[key], value);
    }
  }

  // Check all catalog entries for newly-met conditions
  const newlyUnlocked = [];
  for (const achievement of ACHIEVEMENT_CATALOG) {
    if (!data.unlockedIds.includes(achievement.id) && achievement.condition(data.stats)) {
      data.unlockedIds.push(achievement.id);
      newlyUnlocked.push(achievement);
    }
  }

  saveAchievements(data);
  return newlyUnlocked;
}

/**
 * Return all unlocked achievement objects from the catalog.
 * @returns {Array<{ id: string, name: string, icon: string, desc: string }>}
 */
export function getUnlocked() {
  const { unlockedIds } = loadAchievements();
  return ACHIEVEMENT_CATALOG.filter(a => unlockedIds.includes(a.id));
}
