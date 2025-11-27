/**
 * Global Leaderboard Backend API Client
 * Handles communication with the serverless backend
 * Uses Vercel KV for persistent storage
 */

const BACKEND_CONFIG = {
  // Update this URL after deploying to Vercel
  // Example: 'https://your-app.vercel.app/api/leaderboard'
  API_URL: 'https://shooter-app-one.vercel.app/api/leaderboard',
  USE_GLOBAL: true,
  TIMEOUT_MS: 8000, // Increased timeout for KV operations
  RETRY_ATTEMPTS: 2
};

const GlobalLeaderboard = {
  async submitScore(entry) {
    if (!BACKEND_CONFIG.USE_GLOBAL) {
      return null;
    }

    let lastError = null;
    
    for (let attempt = 0; attempt < BACKEND_CONFIG.RETRY_ATTEMPTS; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), BACKEND_CONFIG.TIMEOUT_MS);

        const response = await fetch(BACKEND_CONFIG.API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: entry.username,
            score: entry.score,
            level: entry.level,
            difficulty: entry.difficulty,
            timestamp: entry.timestamp || Date.now()
          }),
          signal: controller.signal
        });

        clearTimeout(timeout);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        console.log(`✓ Score submitted to global leaderboard (${data.storage || 'unknown'} storage)`);
        return data;
      } catch (error) {
        lastError = error;
        console.warn(`Attempt ${attempt + 1} failed:`, error.message);
        if (attempt < BACKEND_CONFIG.RETRY_ATTEMPTS - 1) {
          await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        }
      }
    }
    
    console.error('Failed to submit score after retries:', lastError?.message);
    return null;
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
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        const storageType = data.storage || 'unknown';
        console.log(`✓ Fetched ${data.entries?.length || 0} global scores (${storageType} storage)`);
        return data.entries || [];
      } catch (error) {
        lastError = error;
        console.warn(`Fetch attempt ${attempt + 1} failed:`, error.message);
        if (attempt < BACKEND_CONFIG.RETRY_ATTEMPTS - 1) {
          await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        }
      }
    }
    
    console.error('Failed to fetch scores after retries:', lastError?.message);
    return [];
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
