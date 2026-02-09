/**
 * Global Leaderboard Backend API Client
 * Handles communication with the serverless backend
 * Uses Vercel KV for persistent storage
 */

const BACKEND_CONFIG = {
  // Auto-detect API URL based on environment
  // Uses relative URL for deployed version, can be overridden for development
  API_URL: (function() {
    // Check if running on localhost for development
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      // For local development, you may need to point to deployed backend
      return 'https://shooter-app-one.vercel.app/api/leaderboard';
    }
    // For production/deployed version, use relative URL
    return '/api/leaderboard';
  })(),
  USE_GLOBAL: true,
  TIMEOUT_MS: 8000, // Increased timeout for KV operations
  RETRY_ATTEMPTS: 2
};

const GlobalLeaderboard = {
  lastError: null,

  getAuthContext(entry) {
    if (entry?.authToken) return { token: entry.authToken, userId: entry.userId, username: entry.username };
    if (typeof SocialAPI !== 'undefined' && SocialAPI.currentUser) {
      const user = SocialAPI.currentUser;
      return {
        token: user.sessionToken || null,
        userId: entry?.userId || user.id,
        username: entry?.username || user.username
      };
    }
    return { token: null, userId: entry?.userId, username: entry?.username };
  },

  async submitScore(entry) {
    if (!BACKEND_CONFIG.USE_GLOBAL) {
      return null;
    }

    let lastError = null;
    
    for (let attempt = 0; attempt < BACKEND_CONFIG.RETRY_ATTEMPTS; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), BACKEND_CONFIG.TIMEOUT_MS);

        const auth = this.getAuthContext(entry);
        const headers = { 'Content-Type': 'application/json' };
        if (auth.token) {
          headers.Authorization = `Bearer ${auth.token}`;
        }

        const response = await fetch(BACKEND_CONFIG.API_URL, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            username: auth.username || entry.username,
            userId: auth.userId || entry.userId,
            authToken: auth.token || undefined,
            score: entry.score,
            level: entry.level,
            difficulty: entry.difficulty,
            timestamp: entry.timestamp || Date.now()
          }),
          signal: controller.signal
        });

        clearTimeout(timeout);

        const rawText = await response.text();
        let data = {};
        try {
          data = rawText ? JSON.parse(rawText) : {};
        } catch (parseErr) {
          data = {};
        }

        if (!response.ok) {
          const message = data?.error || `HTTP ${response.status}`;
          this.lastError = message;
          return { success: false, error: message, status: response.status, fallback: 'local' };
        }

        console.log(`✓ Score submitted to global leaderboard (${data.storage || 'unknown'} storage)`);
        this.lastError = null;
        return data;
      } catch (error) {
        lastError = error;
        console.warn(`Attempt ${attempt + 1} failed:`, error.message);
        if (attempt < BACKEND_CONFIG.RETRY_ATTEMPTS - 1) {
          await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        }
      }
    }
    
    this.lastError = lastError?.message || 'Unknown submission error';
    console.error('Failed to submit score after retries:', this.lastError);
    return { success: false, error: this.lastError, fallback: 'local' };
  },

  async fetchScores(difficulty = 'all', limit = 100) {
    if (!BACKEND_CONFIG.USE_GLOBAL) {
      return [];
    }

    let lastError = null;
    
    for (let attempt = 0; attempt < BACKEND_CONFIG.RETRY_ATTEMPTS; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), BACKEND_CONFIG.TIMEOUT_MS);

        const url = new URL(BACKEND_CONFIG.API_URL);
        url.searchParams.set('difficulty', difficulty);
        url.searchParams.set('limit', Math.min(limit, 100));

        const response = await fetch(url, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal
        });

        clearTimeout(timeout);

        if (!response.ok) {
          const errData = await response.json().catch(() => null);
          const message = errData?.error || `HTTP ${response.status}`;
          this.lastError = message;
          throw new Error(message);
        }

        const data = await response.json();
        const storageType = data.storage || 'unknown';
        console.log(`✓ Fetched ${data.entries?.length || 0} global scores (${storageType} storage)`);
        this.lastError = null;
        return data.entries || [];
      } catch (error) {
        lastError = error;
        console.warn(`Fetch attempt ${attempt + 1} failed:`, error.message);
        if (attempt < BACKEND_CONFIG.RETRY_ATTEMPTS - 1) {
          await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        }
      }
    }
    
    this.lastError = lastError?.message || 'Unable to fetch global scores';
    console.error('Failed to fetch scores after retries:', this.lastError);
    return null;
  },

  async checkConnection() {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(BACKEND_CONFIG.API_URL + '?limit=1', {
        method: 'GET',
        signal: controller.signal
      });

      clearTimeout(timeout);
      return response.ok;
    } catch (error) {
      return false;
    }
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GlobalLeaderboard, BACKEND_CONFIG };
}
