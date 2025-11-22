/**
 * Leaderboard System - Manages high scores and rankings
 */

import { LEADERBOARD_KEY } from '../core/config.js';
import { validateScore, validateLevel } from '../utils/validation.js';

/**
 * LeaderboardSystem class for managing high scores
 */
export class LeaderboardSystem {
  constructor() {
    this.entries = [];
  }

  /**
   * Load leaderboard from localStorage
   */
  load() {
    try {
      const raw = localStorage.getItem(LEADERBOARD_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.entries = parsed;
          // Validate and sanitize entries
          this._validateEntries();
        }
      }
    } catch (err) {
      console.warn('Failed to load leaderboard:', err);
      this.entries = [];
    }
  }

  /**
   * Validate and sanitize leaderboard entries
   * @private
   */
  _validateEntries() {
    this.entries = this.entries.filter(entry => {
      return entry && 
             typeof entry === 'object' &&
             typeof entry.username === 'string' &&
             validateScore(entry.score) &&
             validateLevel(entry.level) &&
             typeof entry.difficulty === 'string' &&
             typeof entry.timestamp === 'number';
    });

    // Re-sort after validation
    this.entries.sort((a, b) => b.score - a.score);
  }

  /**
   * Save leaderboard to localStorage
   */
  save() {
    try {
      localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(this.entries));
    } catch (err) {
      console.error('Failed to save leaderboard:', err);
    }
  }

  /**
   * Add new leaderboard entry
   * @param {string} username - Username
   * @param {number} score - Score
   * @param {number} level - Level reached
   * @param {string} difficulty - Difficulty level
   * @returns {number} Rank (1-based)
   */
  addEntry(username, score, level, difficulty) {
    // Validate inputs
    if (!username || typeof username !== 'string') {
      console.warn('Invalid username for leaderboard');
      return -1;
    }

    if (!validateScore(score)) {
      console.warn('Invalid score for leaderboard:', score);
      return -1;
    }

    if (!validateLevel(level)) {
      console.warn('Invalid level for leaderboard:', level);
      return -1;
    }

    const validDifficulties = ['easy', 'normal', 'hard'];
    if (!validDifficulties.includes(difficulty)) {
      console.warn('Invalid difficulty for leaderboard:', difficulty);
      difficulty = 'normal'; // Default fallback
    }

    const entry = {
      username: username.trim(),
      score: Math.floor(score),
      level: Math.floor(level),
      difficulty: difficulty,
      timestamp: Date.now()
    };

    this.entries.push(entry);

    // Sort by score descending
    this.entries.sort((a, b) => b.score - a.score);

    // Keep only top 100 entries
    if (this.entries.length > 100) {
      this.entries = this.entries.slice(0, 100);
    }

    this.save();

    // Return the rank
    const rank = this.entries.findIndex(e =>
      e.username === entry.username &&
      e.score === entry.score &&
      e.timestamp === entry.timestamp
    ) + 1;

    return rank;
  }

  /**
   * Get leaderboard entries with optional filtering
   * @param {string} difficulty - Difficulty filter ('all' for no filter)
   * @param {number} limit - Maximum number of entries
   * @returns {Array} Leaderboard entries
   */
  getEntries(difficulty = 'all', limit = 50) {
    let filtered = this.entries;

    if (difficulty !== 'all') {
      filtered = this.entries.filter(e => e.difficulty === difficulty);
    }

    return filtered.slice(0, Math.max(1, Math.min(100, limit)));
  }

  /**
   * Get best score for a user
   * @param {string} username - Username to search for
   * @returns {Object|null} Best entry or null
   */
  getUserBest(username) {
    if (!username || typeof username !== 'string') {
      return null;
    }

    const userEntries = this.entries.filter(e =>
      e.username.toLowerCase() === username.toLowerCase()
    );

    if (userEntries.length === 0) return null;

    return userEntries[0]; // Already sorted by score
  }

  /**
   * Get user rank for specific difficulty
   * @param {string} username - Username
   * @param {string} difficulty - Difficulty level
   * @returns {number} Rank (1-based) or -1 if not found
   */
  getUserRank(username, difficulty = 'all') {
    const entries = this.getEntries(difficulty);
    const index = entries.findIndex(e =>
      e.username.toLowerCase() === username.toLowerCase()
    );
    return index >= 0 ? index + 1 : -1;
  }

  /**
   * Clear all leaderboard entries
   */
  clear() {
    this.entries = [];
    this.save();
  }
}
