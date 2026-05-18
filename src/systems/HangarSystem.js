/**
 * HangarSystem — Persistent upgrade shop ("Hangar") for VOID RIFT.
 *
 * Upgrades purchased here are permanent across runs. Credits are earned
 * during gameplay and persisted via localStorage. Each upgrade has a
 * max level and a scaling cost formula.
 *
 * Usage:
 *   import { loadHangar, saveHangar, purchaseUpgrade, applyHangarToConfig, HANGAR_CATALOG } from './HangarSystem.js';
 */

// ─────────────────────────────────────────────────────────────────────────────
// Storage key — intentionally separate from the main save key so the two
// systems remain independently resettable.
// ─────────────────────────────────────────────────────────────────────────────

export const HANGAR_STORAGE_KEY = 'voidrift_hangar';

// ─────────────────────────────────────────────────────────────────────────────
// Upgrade catalog
//
// Each entry describes one permanent upgrade available in the Hangar shop.
//
// apply(multipliers, level) receives the *current level* (1-based) so each
// tier can scale the stat appropriately.  It is called once per purchased
// level at game-start via applyHangarToConfig().
// ─────────────────────────────────────────────────────────────────────────────

export const HANGAR_CATALOG = [
  {
    id: 'max_hp_up',
    name: 'Hull Reinforcement',
    icon: '🛡️',
    description: 'Permanently increase maximum HP by 20 per tier.',
    baseCost: 150,
    maxLevel: 5,
    apply(m, level) { m.maxHp += 20 * level; }
  },
  {
    id: 'damage_up',
    name: 'Plasma Amplifier',
    icon: '🔥',
    description: 'All weapons deal +8% damage per tier.',
    baseCost: 200,
    maxLevel: 4,
    apply(m, level) { m.damage *= Math.pow(1.08, level); }
  },
  {
    id: 'speed_up',
    name: 'Thruster Upgrade',
    icon: '🚀',
    description: 'Increase base movement speed by +10% per tier.',
    baseCost: 175,
    maxLevel: 4,
    apply(m, level) { m.speed *= Math.pow(1.10, level); }
  },
  {
    id: 'start_shield',
    name: 'Void Shield',
    icon: '⚡',
    description: 'Begin every run with an energy shield absorbing 25 damage per tier.',
    baseCost: 250,
    maxLevel: 3,
    apply(m, level) { m.startShield = (m.startShield || 0) + 25 * level; }
  },
  {
    id: 'fire_rate_up',
    name: 'Rapid Core Mk.II',
    icon: '🔫',
    description: 'Fire rate increased by 6% per tier (cooldown reduced).',
    baseCost: 220,
    maxLevel: 4,
    apply(m, level) { m.fireRate = Math.max(0.2, m.fireRate * Math.pow(0.94, level)); }
  },
  {
    id: 'credits_bonus',
    name: 'Salvage Network',
    icon: '💰',
    description: 'Earn +15% credits from kills per tier.',
    baseCost: 100,
    maxLevel: 5,
    apply(m, level) { m.coinBonus *= Math.pow(1.15, level); }
  },
  {
    id: 'extra_life',
    name: 'Emergency Clone Bay',
    icon: '❤️',
    description: 'Start each run with +1 extra life per tier.',
    baseCost: 400,
    maxLevel: 3,
    apply(m, level) { m.extraLives = (m.extraLives || 0) + level; }
  },
  {
    id: 'piercing_shot',
    name: 'Void Piercer',
    icon: '🎯',
    description: 'Bullets pierce through +1 additional enemy per tier.',
    baseCost: 350,
    maxLevel: 3,
    apply(m, level) { m.piercePlus = (m.piercePlus || 0) + level; }
  }
];

// ─────────────────────────────────────────────────────────────────────────────
// Persistence helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Default hangar state factory.
 * @returns {{ credits: number, upgrades: Object.<string, number> }}
 */
function defaultState() {
  return { credits: 0, upgrades: {} };
}

/**
 * Load hangar state from localStorage.
 * Falls back to a fresh default state on any parse error.
 * @returns {{ credits: number, upgrades: Object.<string, number> }}
 */
export function loadHangar() {
  try {
    const raw = localStorage.getItem(HANGAR_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return {
          credits: Math.max(0, Math.floor(parsed.credits || 0)),
          upgrades: (parsed.upgrades && typeof parsed.upgrades === 'object')
            ? parsed.upgrades
            : {}
        };
      }
    }
  } catch (err) {
    console.warn('[HangarSystem] Failed to load hangar state:', err);
  }
  return defaultState();
}

/**
 * Persist hangar state to localStorage.
 * @param {{ credits: number, upgrades: Object.<string, number> }} state
 */
export function saveHangar(state) {
  try {
    localStorage.setItem(HANGAR_STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('[HangarSystem] Failed to save hangar state:', err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Cost formula
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculate the credit cost to purchase the next level of an upgrade.
 * Cost scales super-linearly: baseCost * (1 + currentLevel)^1.4
 *
 * @param {Object} item         - Entry from HANGAR_CATALOG
 * @param {number} currentLevel - The level the player currently has (0 = not bought)
 * @returns {number} Cost in credits, always a positive integer
 */
export function getUpgradeCost(item, currentLevel) {
  return Math.round(item.baseCost * Math.pow(1 + currentLevel, 1.4));
}

// ─────────────────────────────────────────────────────────────────────────────
// Purchase logic
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Attempt to purchase one level of an upgrade.
 *
 * @param {{ credits: number, upgrades: Object.<string, number> }} state - Current hangar state (not mutated)
 * @param {string} upgradeId - ID from HANGAR_CATALOG
 * @returns {{ success: boolean, state: Object, message: string }}
 */
export function purchaseUpgrade(state, upgradeId) {
  const item = HANGAR_CATALOG.find(u => u.id === upgradeId);
  if (!item) {
    return { success: false, state, message: 'Unknown upgrade ID.' };
  }

  const currentLevel = state.upgrades[upgradeId] || 0;
  if (currentLevel >= item.maxLevel) {
    return { success: false, state, message: `${item.name} is already at max level.` };
  }

  const cost = getUpgradeCost(item, currentLevel);
  if (state.credits < cost) {
    return { success: false, state, message: `Insufficient credits. Need ${cost} CR.` };
  }

  const newState = {
    credits: state.credits - cost,
    upgrades: { ...state.upgrades, [upgradeId]: currentLevel + 1 }
  };
  saveHangar(newState);
  return { success: true, state: newState, message: `${item.name} upgraded to level ${currentLevel + 1}.` };
}

// ─────────────────────────────────────────────────────────────────────────────
// Apply upgrades to a game multipliers config object
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Apply all purchased hangar upgrades to a multipliers object.
 * Mutates and returns the provided config for convenience.
 *
 * Compatible with createDefaultMultipliers() from UpgradeSystem.js.
 *
 * @param {{ credits: number, upgrades: Object.<string, number> }} hangarState
 * @param {Object} multipliers - Multipliers object from createDefaultMultipliers()
 * @returns {Object} The mutated multipliers object
 */
export function applyHangarToConfig(hangarState, multipliers) {
  if (!hangarState || !multipliers) return multipliers;

  for (const item of HANGAR_CATALOG) {
    const level = hangarState.upgrades[item.id] || 0;
    if (level > 0) {
      item.apply(multipliers, level);
    }
  }

  return multipliers;
}
