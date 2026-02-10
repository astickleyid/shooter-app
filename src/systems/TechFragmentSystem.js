/**
 * Tech Fragment System - Manages rare collectible tech fragments
 * 
 * Tech Fragments are rare drops from Elite and Boss enemies that unlock
 * special upgrades, cosmetics, and legendary gear when collected.
 */

/**
 * Tech Fragment definitions
 */
const TECH_FRAGMENTS = [
  {
    id: 'quantum_core',
    name: 'Quantum Core',
    desc: 'A pulsating crystalline matrix that bends spacetime. Used in advanced propulsion systems.',
    rarity: 'legendary',
    color: '#a855f7',
    glowColor: '#c084fc',
    dropChance: 0.08, // 8% from bosses, 4% from elites
    unlocks: 'quantum_drive' // Special upgrade or cosmetic
  },
  {
    id: 'void_shard',
    name: 'Void Shard',
    desc: 'A fragment of pure void energy, crackling with dark matter. Powers experimental weapons.',
    rarity: 'legendary',
    color: '#1e293b',
    glowColor: '#7c3aed',
    dropChance: 0.08,
    unlocks: 'void_cannon'
  },
  {
    id: 'plasma_cell',
    name: 'Plasma Cell',
    desc: 'Superheated plasma contained in a magnetic field. Essential for high-output energy systems.',
    rarity: 'rare',
    color: '#22d3ee',
    glowColor: '#67e8f9',
    dropChance: 0.12, // 12% from bosses, 6% from elites
    unlocks: 'plasma_overcharge'
  },
  {
    id: 'neural_chip',
    name: 'Neural Chip',
    desc: 'Advanced AI processor salvaged from an unknown vessel. Enhances targeting systems.',
    rarity: 'rare',
    color: '#84cc16',
    glowColor: '#bef264',
    dropChance: 0.12,
    unlocks: 'ai_targeting'
  },
  {
    id: 'antimatter_vial',
    name: 'Antimatter Vial',
    desc: 'Volatile antimatter suspended in a quantum containment field. Handle with extreme caution.',
    rarity: 'epic',
    color: '#f97316',
    glowColor: '#fb923c',
    dropChance: 0.10, // 10% from bosses, 5% from elites
    unlocks: 'antimatter_reactor'
  },
  {
    id: 'chrono_crystal',
    name: 'Chrono Crystal',
    desc: 'A rare temporal crystal that exists outside of normal time. Used in temporal manipulation devices.',
    rarity: 'legendary',
    color: '#ec4899',
    glowColor: '#f9a8d4',
    dropChance: 0.08,
    unlocks: 'time_dilation'
  }
];

/**
 * Tech Fragment unlockable rewards
 */
const TECH_UNLOCKS = {
  quantum_drive: {
    type: 'upgrade',
    name: 'Quantum Drive',
    desc: 'Experimental propulsion system: +35% boost speed and duration',
    stats: { boostSpeed: 1.35, boostDuration: 1.3 }
  },
  void_cannon: {
    type: 'weapon',
    name: 'Void Cannon',
    desc: 'Fires concentrated void energy that pierces all enemies',
    stats: { damage: 3.2, pierce: 99, cd: 1.8 }
  },
  plasma_overcharge: {
    type: 'upgrade',
    name: 'Plasma Overcharge',
    desc: 'Overcharge plasma weapons for +40% damage output',
    stats: { damageBoost: 1.4 }
  },
  ai_targeting: {
    type: 'upgrade',
    name: 'AI Targeting Matrix',
    desc: 'Advanced targeting: +25% crit chance and +50% crit damage',
    stats: { critChance: 0.25, critDamage: 1.5 }
  },
  antimatter_reactor: {
    type: 'upgrade',
    name: 'Antimatter Reactor',
    desc: 'Unstable power source: +60% ultimate charge rate',
    stats: { ultimateChargeRate: 1.6 }
  },
  time_dilation: {
    type: 'upgrade',
    name: 'Time Dilation Field',
    desc: 'Passive time distortion: enemies move 15% slower',
    stats: { enemySlowdown: 0.15 }
  }
};

/**
 * TechFragmentSystem class
 */
class TechFragmentSystem {
  constructor() {
    this.collected = new Set(); // Set of collected fragment IDs
    this.inventory = {}; // Count of each fragment type
    this.active = []; // Currently spawned fragment pickups in game
  }

  /**
   * Initialize system with saved data
   * @param {Object} saveData - Saved fragment data
   */
  load(saveData) {
    if (saveData && saveData.techFragments) {
      this.collected = new Set(saveData.techFragments.collected || []);
      this.inventory = { ...saveData.techFragments.inventory } || {};
    } else {
      this.collected = new Set();
      this.inventory = {};
    }
  }

  /**
   * Get save data
   * @returns {Object} Save data object
   */
  getSaveData() {
    return {
      collected: Array.from(this.collected),
      inventory: { ...this.inventory }
    };
  }

  /**
   * Check if a fragment should drop from an enemy
   * @param {boolean} isBoss - Whether the enemy is a boss
   * @param {boolean} isElite - Whether the enemy is an elite
   * @returns {Object|null} Fragment definition or null
   */
  rollDrop(isBoss, isElite) {
    if (!isBoss && !isElite) return null;

    const multiplier = isBoss ? 1.0 : 0.5; // Elites have half the drop chance

    for (const fragment of TECH_FRAGMENTS) {
      const chance = fragment.dropChance * multiplier;
      if (Math.random() < chance) {
        return fragment;
      }
    }

    return null;
  }

  /**
   * Spawn a tech fragment pickup at location
   * @param {Object} fragment - Fragment definition
   * @param {number} x - X position
   * @param {number} y - Y position
   * @returns {Object} Fragment pickup object
   */
  spawnPickup(fragment, x, y) {
    const pickup = {
      id: fragment.id,
      fragment: fragment,
      x: x,
      y: y,
      size: 12,
      lifetime: 15000, // 15 seconds before despawn
      spawnTime: Date.now(),
      collected: false,
      // Visual properties
      angle: 0,
      pulsePhase: Math.random() * Math.PI * 2,
      orbitRadius: 8,
      orbitSpeed: 0.05
    };

    this.active.push(pickup);
    return pickup;
  }

  /**
   * Update active fragment pickups
   * @param {number} deltaTime - Time since last update
   */
  update(deltaTime) {
    const now = Date.now();
    
    // Remove expired pickups
    this.active = this.active.filter(pickup => {
      return !pickup.collected && (now - pickup.spawnTime) < pickup.lifetime;
    });

    // Update visual effects
    this.active.forEach(pickup => {
      pickup.angle += deltaTime * 0.001; // Rotate
      pickup.pulsePhase += deltaTime * 0.003; // Pulse animation
    });
  }

  /**
   * Check if player can collect a fragment
   * @param {number} playerX - Player X position
   * @param {number} playerY - Player Y position
   * @param {number} magnetRange - Pickup magnet range
   * @returns {Object|null} Collected fragment pickup or null
   */
  checkCollection(playerX, playerY, magnetRange) {
    for (const pickup of this.active) {
      if (pickup.collected) continue;

      const dx = pickup.x - playerX;
      const dy = pickup.y - playerY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < magnetRange + pickup.size) {
        pickup.collected = true;
        this.collect(pickup.fragment.id);
        return pickup;
      }
    }

    return null;
  }

  /**
   * Collect a tech fragment
   * @param {string} fragmentId - Fragment ID
   */
  collect(fragmentId) {
    this.collected.add(fragmentId);
    this.inventory[fragmentId] = (this.inventory[fragmentId] || 0) + 1;
  }

  /**
   * Check if a fragment has been collected
   * @param {string} fragmentId - Fragment ID
   * @returns {boolean} True if collected
   */
  hasFragment(fragmentId) {
    return this.collected.has(fragmentId);
  }

  /**
   * Get count of a specific fragment
   * @param {string} fragmentId - Fragment ID
   * @returns {number} Count
   */
  getFragmentCount(fragmentId) {
    return this.inventory[fragmentId] || 0;
  }

  /**
   * Get total number of unique fragments collected
   * @returns {number} Count of unique fragments
   */
  getTotalUnique() {
    return this.collected.size;
  }

  /**
   * Get total number of fragments collected (including duplicates)
   * @returns {number} Total count
   */
  getTotalCount() {
    return Object.values(this.inventory).reduce((sum, count) => sum + count, 0);
  }

  /**
   * Get all collected fragments with details
   * @returns {Array} Array of fragment objects
   */
  getCollectedFragments() {
    return TECH_FRAGMENTS.filter(f => this.collected.has(f.id));
  }

  /**
   * Check if all fragments have been collected
   * @returns {boolean} True if collection is complete
   */
  isCollectionComplete() {
    return this.collected.size === TECH_FRAGMENTS.length;
  }

  /**
   * Get active fragment pickups for rendering
   * @returns {Array} Array of active pickups
   */
  getActivePickups() {
    return this.active.filter(p => !p.collected);
  }

  /**
   * Clear all active pickups (for level transitions)
   */
  clearActivePickups() {
    this.active = [];
  }
}

// ES6 export for module systems
if (typeof exports === 'undefined') {
  // Browser environment - use export statements if supported
  if (typeof window !== 'undefined') {
    window.TechFragmentSystem = TechFragmentSystem;
    window.TECH_FRAGMENTS = TECH_FRAGMENTS;
    window.TECH_UNLOCKS = TECH_UNLOCKS;
  }
}

// CommonJS export for Node.js/Jest
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    TechFragmentSystem,
    TECH_FRAGMENTS,
    TECH_UNLOCKS
  };
  module.exports.default = TechFragmentSystem;
}
