/**
 * daily-challenge.js — Daily Challenge mode for VOID RIFT
 * Seeds Math.random() with today's date so all players face the same run.
 * Stores best daily score in localStorage.
 */

export const DAILY_CHALLENGE_KEY = 'voidrift_daily_challenge';

/** Returns today's date string YYYY-MM-DD */
export function todayStr() {
  return new Date().toISOString().split('T')[0];
}

/** Mulberry32 seeded PRNG — returns a function that replaces Math.random() */
function mulberry32(seed) {
  return function() {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/** Turn the date string into a numeric seed */
function dateSeed(dateStr) {
  return dateStr.split('-').reduce((acc, part) => acc * 1000 + parseInt(part, 10), 0);
}

/** Load stored challenge state */
export function loadDailyChallenge() {
  try {
    const stored = JSON.parse(localStorage.getItem(DAILY_CHALLENGE_KEY) || '{}');
    return stored;
  } catch { return {}; }
}

/** Save daily best score */
export function saveDailyBest(score) {
  const today = todayStr();
  const stored = loadDailyChallenge();
  const prev = stored[today]?.best ?? 0;
  if (score > prev) {
    stored[today] = { best: score, date: today };
    localStorage.setItem(DAILY_CHALLENGE_KEY, JSON.stringify(stored));
    return true; // new best
  }
  return false;
}

/** Get today's best score (0 if none) */
export function getTodayBest() {
  const today = todayStr();
  const stored = loadDailyChallenge();
  return stored[today]?.best ?? 0;
}

/** Activate daily challenge: seeds Math.random, sets global flag */
export function activateDailyChallenge() {
  const seed = dateSeed(todayStr());
  const seededRandom = mulberry32(seed);
  window._originalMathRandom = Math.random;
  Math.random = seededRandom;
  window.DAILY_CHALLENGE_ACTIVE = true;
  window.DAILY_CHALLENGE_DATE = todayStr();
  console.log('[DailyChallenge] Activated for', todayStr(), '— seed:', seed);
}

/** Deactivate daily challenge: restore Math.random */
export function deactivateDailyChallenge() {
  if (window._originalMathRandom) {
    Math.random = window._originalMathRandom;
    window._originalMathRandom = null;
  }
  window.DAILY_CHALLENGE_ACTIVE = false;
}

/**
 * Returns the current daily streak — consecutive days including today that
 * have a completed challenge. Requires that today's challenge was already saved.
 */
export function getDailyStreak() {
  const stored = loadDailyChallenge();
  let streak = 0;
  const d = new Date();
  while (true) {
    const dateStr = d.toISOString().split('T')[0];
    if (!stored[dateStr]) break;
    streak++;
    d.setDate(d.getDate() - 1);
    if (streak > 365) break; // safety cap
  }
  return streak;
}

/**
 * Returns total number of unique days with a completed challenge.
 */
export function getTotalDailyChallengesCompleted() {
  const stored = loadDailyChallenge();
  return Object.keys(stored).length;
}
