/**
 * Unified Leaderboard System - Production Ready
 * Requires backend connectivity for all operations
 * No offline fallback - ensures data consistency
 */

const LEADERBOARD_CONFIG = {
  // Auto-detect API URL based on environment
  API_URL: (function() {
    if (typeof window !== 'undefined') {
      const { protocol, hostname } = window.location;

      // Local development - use deployed API directly
      if (hostname === 'localhost') {
        return 'https://shooter-app-one.vercel.app/api/leaderboard';
      }

      // iOS WKWebView / file:// bundle - hostname is empty and protocol is "file:"
      if (protocol === 'file:' || hostname === '') {
        return 'https://shooter-app-one.vercel.app/api/leaderboard';
      }
    }

    // Browser-based deployment - relative to current origin
    return '/api/leaderboard';
  })(),
  TIMEOUT_MS: 10000, // Increased for reliability
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000
};

const LeaderboardSystem = {
  lastError: null,
  
  /**
   * Submit score to leaderboard - REQUIRES BACKEND
   * @param {Object} entry - Score entry {score, level, difficulty}
   * @returns {Promise<{success: boolean, rank?: number, error?: string}>}
   */
  async submitScore(entry) {
    if (!entry || typeof entry.score !== 'number') {
      return { success: false, error: 'Invalid score data' };
    }
    
    // Get authenticated user - REQUIRED
    const user = typeof AuthSystem !== 'undefined' ? AuthSystem.getCurrentUser() : null;
    const token = typeof AuthSystem !== 'undefined' ? AuthSystem.getToken() : null;
    
    if (!user || !token) {
      return { success: false, error: 'You must be logged in to submit scores to the global leaderboard' };
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
    
    // Submit to backend - REQUIRED
    try {
      const result = await this._submitToBackend(scoreEntry, token);
      if (result.success) {
        this.lastError = null;
        return result;
      }
      return { success: false, error: result.error || 'Failed to submit score' };
    } catch (error) {
      console.error('Leaderboard submission error:', error);
      this.lastError = error.message;
      
      if (error.message.includes('fetch') || error.message.includes('network')) {
        return { success: false, error: 'Unable to submit score. Please check your internet connection.' };
      }
      return { success: false, error: 'Failed to submit score. Please try again.' };
    }
  },
  
  /**
   * Fetch leaderboard scores - REQUIRES BACKEND
   * @param {string} difficulty - 'all', 'easy', 'normal', or 'hard'
   * @param {number} limit - Maximum number of entries to fetch
   * @returns {Promise<Array>} Array of leaderboard entries
   */
  async fetchScores(difficulty = 'all', limit = 50) {
    try {
      const scores = await this._fetchFromBackend(difficulty, limit);
      this.lastError = null;
      return scores || [];
    } catch (error) {
      console.error('Leaderboard fetch error:', error);
      this.lastError = error.message;
      
      if (error.message.includes('fetch') || error.message.includes('network')) {
        throw new Error('Unable to load leaderboard. Please check your internet connection.');
      }
      throw new Error('Failed to load leaderboard. Please try again.');
    }
  },
  
  /**
   * Get user's personal best scores from backend
   * @returns {Promise<Array>} User's top scores
   */
  async getUserBestScores() {
    const user = typeof AuthSystem !== 'undefined' ? AuthSystem.getCurrentUser() : null;
    if (!user) return [];
    
    try {
      // Fetch user's scores from backend
      const allScores = await this.fetchScores('all', 100);
      return allScores
        .filter(entry => entry.userId === user.id)
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
    } catch (error) {
      console.error('Failed to fetch user scores:', error);
      return [];
    }
  },
  
  /**
   * Get user's rank for a specific score
   * @param {number} score
   * @param {string} difficulty
   * @returns {Promise<number>} User's rank (1-based)
   */
  async getUserRank(score, difficulty = 'all') {
    try {
      const scores = await this.fetchScores(difficulty, 1000);
      const higherScores = scores.filter(entry => entry.score > score);
      return higherScores.length + 1;
    } catch (error) {
      console.error('Failed to get user rank:', error);
      return 1;
    }
  },
  
  /**
   * Submit score to backend with retry logic
   * @private
   */
  async _submitToBackend(entry, token) {
    let lastError = null;
    
    for (let attempt = 0; attempt < LEADERBOARD_CONFIG.RETRY_ATTEMPTS; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), LEADERBOARD_CONFIG.TIMEOUT_MS);
        
        const headers = { 'Content-Type': 'application/json' };
        if (token) {
          headers.Authorization = `******;
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
        
        console.log(`✓ Score submitted successfully (attempt ${attempt + 1})`);
        return {
          success: true,
          rank: data.rank,
          storage: data.storage || 'kv'
        };
      } catch (error) {
        lastError = error;
        if (attempt < LEADERBOARD_CONFIG.RETRY_ATTEMPTS - 1) {
          console.warn(`Submit attempt ${attempt + 1} failed, retrying...`, error.message);
          await new Promise(r => setTimeout(r, LEADERBOARD_CONFIG.RETRY_DELAY * (attempt + 1)));
        }
      }
    }
    
    console.error('Score submission failed after all retries:', lastError);
    throw lastError;
  },
  
  /**
   * Fetch scores from backend with retry logic
   * @private
   */
  async _fetchFromBackend(difficulty, limit) {
    let lastError = null;
    
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
        console.log(`✓ Fetched ${data.entries?.length || 0} scores (attempt ${attempt + 1})`);
        return data.entries || [];
      } catch (error) {
        lastError = error;
        if (attempt < LEADERBOARD_CONFIG.RETRY_ATTEMPTS - 1) {
          console.warn(`Fetch attempt ${attempt + 1} failed, retrying...`, error.message);
          await new Promise(r => setTimeout(r, LEADERBOARD_CONFIG.RETRY_DELAY * (attempt + 1)));
        }
      }
    }
    
    console.error('Leaderboard fetch failed after all retries:', lastError);
    throw lastError;
  }
};
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
  
// Make available globally
if (typeof window !== 'undefined') {
  window.LeaderboardSystem = LeaderboardSystem;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { LeaderboardSystem, LEADERBOARD_CONFIG };
}
