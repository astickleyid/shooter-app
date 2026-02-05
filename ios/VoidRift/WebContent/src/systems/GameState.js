/**
 * Game State Manager - Central game state management
 */

import { MAX_LOG_ENTRIES, LOG_ENTRY_LIFETIME } from '../core/config.js';

/**
 * GameState class for managing game runtime state
 */
export class GameState {
  constructor() {
    this.reset();
  }

  /**
   * Reset game state to initial values
   */
  reset() {
    // Core game state
    this.score = 0;
    this.level = 1;
    this.enemiesToKill = 15;
    this.enemiesKilled = 0;
    this.gameRunning = false;
    this.paused = false;
    this.gameOverHandled = false;

    // Timing
    this.lastTime = 0;
    this.lastAmmoRegen = 0;
    this.lastShotTime = 0;

    // Camera
    this.camera = { x: 0, y: 0 };

    // Screen shake
    this.shakeUntil = 0;
    this.shakePower = 3;

    // Pilot progression
    this.pilotLevel = 1;
    this.pilotXP = 0;

    // Level tracking
    this.tookDamageThisLevel = false;
    this.countdownActive = false;
    this.countdownValue = 3;
    this.countdownEnd = 0;
    this.countdownCompletedLevel = 0;

    // Difficulty
    this.currentDifficulty = 'normal';

    // Equipment
    this.currentEquipmentSlot = 0;
    this.lastTapTime = 0;
    this.tapCount = 0;

    // FPS tracking
    this.fps = 0;
    this.fpsFrames = 0;
    this.fpsLastTime = 0;
    this.showFPS = false;

    // Fullscreen
    this.isFullscreen = false;

    // Action log
    this.actionLog = [];
  }

  /**
   * Add entry to action log
   * @param {string} message - Log message
   * @param {string} color - Message color
   */
  addLogEntry(message, color = '#fff') {
    if (!message || typeof message !== 'string') return;

    this.actionLog.push({
      message,
      color,
      timestamp: performance.now()
    });

    if (this.actionLog.length > MAX_LOG_ENTRIES) {
      this.actionLog.shift();
    }
  }

  /**
   * Update action log (remove expired entries)
   * @param {number} now - Current timestamp
   */
  updateActionLog(now) {
    this.actionLog = this.actionLog.filter(entry => 
      now - entry.timestamp < LOG_ENTRY_LIFETIME
    );
  }

  /**
   * Get active action log entries
   * @returns {Array} Active log entries
   */
  getActionLog() {
    return this.actionLog;
  }

  /**
   * Trigger screen shake
   * @param {number} power - Shake power
   * @param {number} duration - Duration in milliseconds
   */
  shakeScreen(power = 4, duration = 120) {
    this.shakeUntil = Math.max(this.shakeUntil, performance.now() + duration);
    this.shakePower = power;
  }

  /**
   * Check if screen should shake
   * @param {number} now - Current timestamp
   * @returns {boolean} True if shaking
   */
  isShaking(now) {
    return now < this.shakeUntil;
  }

  /**
   * Get shake offset
   * @returns {{x: number, y: number}} Shake offset
   */
  getShakeOffset() {
    if (!this.isShaking(performance.now())) {
      return { x: 0, y: 0 };
    }

    return {
      x: (Math.random() - 0.5) * this.shakePower * 2,
      y: (Math.random() - 0.5) * this.shakePower * 2
    };
  }

  /**
   * Update FPS counter
   * @param {number} now - Current timestamp
   * @param {number} dt - Delta time
   */
  updateFPS(now, dt) {
    this.fpsFrames++;
    if (now - this.fpsLastTime >= 1000) {
      this.fps = Math.round((this.fpsFrames * 1000) / (now - this.fpsLastTime));
      this.fpsFrames = 0;
      this.fpsLastTime = now;
    }
  }

  /**
   * Toggle FPS display
   */
  toggleFPS() {
    this.showFPS = !this.showFPS;
  }

  /**
   * Set FPS display state
   * @param {boolean} show - Whether to show FPS
   */
  setShowFPS(show) {
    this.showFPS = !!show;
  }

  /**
   * Toggle fullscreen
   */
  toggleFullscreen() {
    this.isFullscreen = !this.isFullscreen;
  }

  /**
   * Set game running state
   * @param {boolean} running - Whether game is running
   */
  setGameRunning(running) {
    this.gameRunning = !!running;
  }

  /**
   * Set paused state
   * @param {boolean} paused - Whether game is paused
   */
  setPaused(paused) {
    this.paused = !!paused;
  }

  /**
   * Check if game is active (running and not paused)
   * @returns {boolean} True if active
   */
  isActive() {
    return this.gameRunning && !this.paused;
  }

  /**
   * Increment score
   * @param {number} amount - Amount to add
   */
  addScore(amount) {
    if (typeof amount === 'number' && !isNaN(amount) && amount > 0) {
      this.score += Math.floor(amount);
    }
  }

  /**
   * Increment enemies killed
   */
  incrementEnemiesKilled() {
    this.enemiesKilled++;
  }

  /**
   * Check if level is complete
   * @returns {boolean} True if level complete
   */
  isLevelComplete() {
    return this.enemiesKilled >= this.enemiesToKill;
  }

  /**
   * Advance to next level
   */
  advanceLevel() {
    this.level++;
    this.enemiesKilled = 0;
    this.tookDamageThisLevel = false;
  }
}
