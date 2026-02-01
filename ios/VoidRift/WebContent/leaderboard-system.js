/**
 * Unified Leaderboard System
 * Integrates with AuthSystem for authenticated submissions
 * Handles both backend (global) and local leaderboards
 */

const LEADERBOARD_CONFIG = {
  API_URL: 'https://shooter-app-one.vercel.app/api/leaderboard',
  LOCAL_KEY: 'voidrift_local_leaderboard',
  MAX_LOCAL_ENTRIES: 100,
  TIMEOUT_MS: 8000,
  RETRY_ATTEMPTS: 2
};

const LeaderboardSystem = {
  lastError: null,
  
  /**
   * Submit score to leaderboard
   * Automatically uses authenticated user if logged in
   * @param {Object} entry - Score entry {score, level, difficulty}
   * @returns {Promise<{success: boolean, rank?: number, error?: string}>}
   */
  async submitScore(entry) {
    if (!entry || typeof entry.score !== 'number') {
      return { success: false, error: 'Invalid score data' };
    }
    
    // Get authenticated user
    const user = typeof AuthSystem !== 'undefined' ? AuthSystem.getCurrentUser() : null;
    const token = typeof AuthSystem !== 'undefined' ? AuthSystem.getToken() : null;
    
    if (!user) {
      return { success: false, error: 'Please login to submit scores to the global leaderboard' };
    }
    
    // Prepare entry
    const scoreEntry = {
      userId: user.id,
      username: user.username,
      score: Math.floor(entry.score),
      level: Math.floor(entry.level || 1),
      difficulty: entry.difficulty || 'normal',
      timestamp: entry.timestamp || Date.now()
    };
    
    // Try backend submission
    try {
      const result = await this._submitToBackend(scoreEntry, token);
      if (result.success) {
        // Also save locally as backup
        this._saveToLocal(scoreEntry);
        return result;
      }
    } catch (error) {
      console.warn('Backend submission failed:', error.message);
    }
    
    // Fallback to local only
    this._saveToLocal(scoreEntry);
    const localRank = this._calculateLocalRank(scoreEntry);
    
    return {
      success: true,
      rank: localRank,
      storage: 'local',
      message: 'Score saved locally (offline mode)'
    };
  },
  
  /**
   * Fetch leaderboard scores
   * @param {string} difficulty - 'all', 'easy', 'normal', or 'hard'
   * @param {number} limit - Maximum number of entries to fetch
   * @returns {Promise<Array>} Array of leaderboard entries
   */
  async fetchScores(difficulty = 'all', limit = 50) {
    // Try backend first
    try {
      const scores = await this._fetchFromBackend(difficulty, limit);
      if (scores && scores.length > 0) {
        return scores;
      }
    } catch (error) {
      console.warn('Backend fetch failed:', error.message);
    }
    
    // Fallback to local
    return this._fetchFromLocal(difficulty, limit);
  },
  
  /**
   * Get user's personal best scores
   * @returns {Array} User's top scores across all difficulties
   */
  getUserBestScores() {
    const user = typeof AuthSystem !== 'undefined' ? AuthSystem.getCurrentUser() : null;
    if (!user) return [];
    
    const localScores = this._getLocalData();
    return localScores
      .filter(entry => entry.userId === user.id)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  },
  
  /**
   * Get user's rank for a specific score
   * @param {number} score
   * @param {string} difficulty
   * @returns {Promise<number>} User's rank (1-based)
   */
  async getUserRank(score, difficulty = 'all') {
    const scores = await this.fetchScores(difficulty, 1000);
    const higherScores = scores.filter(entry => entry.score > score);
    return higherScores.length + 1;
  },
  
  /**
   * Clear local leaderboard data
   */
  clearLocal() {
    try {
      localStorage.removeItem(LEADERBOARD_CONFIG.LOCAL_KEY);
    } catch (error) {
      console.error('Failed to clear local leaderboard:', error);
    }
  },
  
  /**
   * Submit score to backend
   * @private
   */
  async _submitToBackend(entry, token) {
    for (let attempt = 0; attempt < LEADERBOARD_CONFIG.RETRY_ATTEMPTS; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), LEADERBOARD_CONFIG.TIMEOUT_MS);
        
        const headers = { 'Content-Type': 'application/json' };
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }
        
        const response = await fetch(LEADERBOARD_CONFIG.API_URL, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            ...entry,
            authToken: token
          }),
          signal: controller.signal
        });
        
        clearTimeout(timeout);
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || `HTTP ${response.status}`);
        }
        
        return {
          success: true,
          rank: data.rank,
          storage: data.storage || 'kv'
        };
      } catch (error) {
        if (attempt < LEADERBOARD_CONFIG.RETRY_ATTEMPTS - 1) {
          await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        } else {
          throw error;
        }
      }
    }
  },
  
  /**
   * Fetch scores from backend
   * @private
   */
  async _fetchFromBackend(difficulty, limit) {
    for (let attempt = 0; attempt < LEADERBOARD_CONFIG.RETRY_ATTEMPTS; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), LEADERBOARD_CONFIG.TIMEOUT_MS);
        
        const url = new URL(LEADERBOARD_CONFIG.API_URL);
        url.searchParams.set('difficulty', difficulty);
        url.searchParams.set('limit', Math.min(limit, 100));
        
        const response = await fetch(url, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal
        });
        
        clearTimeout(timeout);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        return data.entries || [];
      } catch (error) {
        if (attempt < LEADERBOARD_CONFIG.RETRY_ATTEMPTS - 1) {
          await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        } else {
          throw error;
        }
      }
    }
  },
  
  /**
   * Save score to local storage
   * @private
   */
  _saveToLocal(entry) {
    try {
      const data = this._getLocalData();
      data.push(entry);
      
      // Sort by score descending
      data.sort((a, b) => b.score - a.score);
      
      // Keep only top entries
      if (data.length > LEADERBOARD_CONFIG.MAX_LOCAL_ENTRIES) {
        data.splice(LEADERBOARD_CONFIG.MAX_LOCAL_ENTRIES);
      }
      
      localStorage.setItem(LEADERBOARD_CONFIG.LOCAL_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save local leaderboard:', error);
    }
  },
  
  /**
   * Fetch scores from local storage
   * @private
   */
  _fetchFromLocal(difficulty, limit) {
    const data = this._getLocalData();
    
    return data
      .filter(entry => difficulty === 'all' || entry.difficulty === difficulty)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  },
  
  /**
   * Get local leaderboard data
   * @private
   */
  _getLocalData() {
    try {
      const stored = localStorage.getItem(LEADERBOARD_CONFIG.LOCAL_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      return [];
    }
  },
  
  /**
   * Calculate user's rank in local leaderboard
   * @private
   */
  _calculateLocalRank(entry) {
    const data = this._getLocalData();
    const higherScores = data.filter(e => 
      e.score > entry.score && 
      (entry.difficulty === 'all' || e.difficulty === entry.difficulty)
    );
    return higherScores.length + 1;
  }
};

// Make available globally
if (typeof window !== 'undefined') {
  window.LeaderboardSystem = LeaderboardSystem;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { LeaderboardSystem, LEADERBOARD_CONFIG };
}
