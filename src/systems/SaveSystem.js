/**
 * Save System - Handles game save/load functionality
 */

import { SAVE_KEY } from '../core/config.js';
import { validateScore, validateLevel } from '../utils/validation.js';

/**
 * Default armory configuration
 */
const defaultArmory = () => ({
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
  },
  equipmentClass: {
    slot1: { type: 'primary', id: 'pulse' },
    slot2: { type: 'defense', id: 'aegis' },
    slot3: { type: 'secondary', id: 'nova' },
    slot4: { type: 'boost', id: 'boost' }
  }
});

/**
 * SaveSystem class for managing game progress persistence
 */
export class SaveSystem {
  constructor() {
    this.data = {
      credits: 0,
      bestScore: 0,
      highestLevel: 1,
      upgrades: {},
      pilotLevel: 1,
      pilotXp: 0,
      selectedShip: 'vanguard',
      armory: defaultArmory(),
      difficulty: 'normal'
    };
  }

  /**
   * Load save data from localStorage
   */
  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          this.data = {
            ...this.data,
            ...parsed,
            armory: parsed.armory || defaultArmory()
          };
        }
      }
    } catch (err) {
      console.warn('Failed to load save:', err);
      this.data = {
        credits: 0,
        bestScore: 0,
        highestLevel: 1,
        upgrades: {},
        pilotLevel: 1,
        pilotXp: 0,
        selectedShip: 'vanguard',
        armory: defaultArmory(),
        difficulty: 'normal'
      };
    }
    
    // Validate and sanitize loaded data
    this._validateData();
  }

  /**
   * Validate and sanitize save data
   * @private
   */
  _validateData() {
    this.data.credits = Math.max(0, Math.floor(this.data.credits || 0));
    this.data.bestScore = Math.max(0, Math.floor(this.data.bestScore || 0));
    this.data.highestLevel = Math.max(1, Math.floor(this.data.highestLevel || 1));
    this.data.pilotLevel = Math.max(1, Math.floor(this.data.pilotLevel || 1));
    this.data.pilotXp = Math.max(0, Math.floor(this.data.pilotXp || 0));
    
    // Validate ship selection (will be validated against SHIP_TEMPLATES in main code)
    if (!this.data.selectedShip || typeof this.data.selectedShip !== 'string') {
      this.data.selectedShip = 'vanguard';
    }
    
    // Validate difficulty
    const validDifficulties = ['easy', 'normal', 'hard'];
    if (!validDifficulties.includes(this.data.difficulty)) {
      this.data.difficulty = 'normal';
    }
    
    // Ensure armory exists
    if (!this.data.armory || typeof this.data.armory !== 'object') {
      this.data.armory = defaultArmory();
    }
    
    // Ensure equipment class exists
    if (!this.data.armory.equipmentClass) {
      this.data.armory.equipmentClass = defaultArmory().equipmentClass;
    }
    
    // Validate armory arrays
    for (const key of ['primary', 'secondary', 'defense', 'ultimate']) {
      if (!Array.isArray(this.data.armory.unlocked[key])) {
        this.data.armory.unlocked[key] = [];
      }
      if (!this.data.armory.loadout[key]) {
        this.data.armory.loadout[key] = defaultArmory().loadout[key];
      }
      if (!this.data.armory.unlocked[key].includes(this.data.armory.loadout[key])) {
        this.data.armory.unlocked[key].push(this.data.armory.loadout[key]);
      }
    }
  }

  /**
   * Save data to localStorage
   */
  save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.data));
    } catch (err) {
      console.error('Failed to save game:', err);
      // Could implement fallback storage here
    }
  }

  /**
   * Add credits to player account
   * @param {number} amount - Amount of credits to add
   */
  addCredits(amount) {
    if (typeof amount !== 'number' || isNaN(amount)) {
      console.warn('Invalid credits amount:', amount);
      return;
    }
    this.data.credits = Math.max(0, Math.floor(this.data.credits + amount));
    this.save();
  }

  /**
   * Spend credits if available
   * @param {number} amount - Amount to spend
   * @returns {boolean} True if successful
   */
  spendCredits(amount) {
    if (typeof amount !== 'number' || isNaN(amount) || amount < 0) {
      console.warn('Invalid spend amount:', amount);
      return false;
    }
    
    if (this.data.credits >= amount) {
      this.data.credits -= amount;
      this.save();
      return true;
    }
    return false;
  }

  /**
   * Update best score and level
   * @param {number} score - Current score
   * @param {number} level - Current level
   */
  setBest(score, level) {
    if (!validateScore(score) || !validateLevel(level)) {
      console.warn('Invalid score or level:', score, level);
      return;
    }
    
    if (score > this.data.bestScore) {
      this.data.bestScore = score;
    }
    if (level > this.data.highestLevel) {
      this.data.highestLevel = level;
    }
    this.save();
  }

  /**
   * Get upgrade level for a specific upgrade
   * @param {string} id - Upgrade ID
   * @returns {number} Upgrade level
   */
  getUpgradeLevel(id) {
    return this.data.upgrades[id] || 0;
  }

  /**
   * Level up an upgrade
   * @param {string} id - Upgrade ID
   */
  levelUp(id) {
    if (!id || typeof id !== 'string') {
      console.warn('Invalid upgrade ID:', id);
      return;
    }
    this.data.upgrades[id] = (this.data.upgrades[id] || 0) + 1;
    this.save();
  }

  /**
   * Check if item is unlocked in armory
   * @param {string} type - Type of item
   * @param {string} id - Item ID
   * @returns {boolean} True if unlocked
   */
  isUnlocked(type, id) {
    const bucket = this.data.armory.unlocked[type] || [];
    return bucket.includes(id);
  }

  /**
   * Unlock item in armory
   * @param {string} type - Type of item
   * @param {string} id - Item ID
   */
  unlockArmory(type, id) {
    if (!this.data.armory.unlocked[type]) {
      this.data.armory.unlocked[type] = [];
    }
    const bucket = this.data.armory.unlocked[type];
    if (!bucket.includes(id)) {
      bucket.push(id);
    }
    this.save();
  }

  /**
   * Set loadout for a type
   * @param {string} type - Type of item
   * @param {string} id - Item ID
   */
  setLoadout(type, id) {
    this.data.armory.loadout[type] = id;
    if (!this.isUnlocked(type, id)) {
      this.unlockArmory(type, id);
    }
    this.save();
  }

  /**
   * Get current game data
   * @returns {Object} Current save data
   */
  getData() {
    return this.data;
  }
}
