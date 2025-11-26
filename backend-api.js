/**
 * Global Leaderboard Backend API Client
 * Handles communication with the serverless backend
 */

const BACKEND_CONFIG = {
  // Update this URL after deploying to Vercel
  // Example: 'https://your-app.vercel.app/api/leaderboard'
  API_URL: 'http://localhost:3000/api/leaderboard', // Change for production
  USE_GLOBAL: true,
  TIMEOUT_MS: 5000
};

const GlobalLeaderboard = {
  async submitScore(entry) {
    if (!BACKEND_CONFIG.USE_GLOBAL) {
      return null;
    }

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
      console.log('✓ Score submitted to global leaderboard');
      return data;
    } catch (error) {
      console.error('Failed to submit score:', error.message);
      return null;
    }
  },

  async fetchScores(difficulty = 'all', limit = 50) {
    if (!BACKEND_CONFIG.USE_GLOBAL) {
      return [];
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), BACKEND_CONFIG.TIMEOUT_MS);

      const url = new URL(BACKEND_CONFIG.API_URL);
      url.searchParams.set('difficulty', difficulty);
      url.searchParams.set('limit', limit);

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
      console.log(`✓ Fetched ${data.entries?.length || 0} global scores`);
      return data.entries || [];
    } catch (error) {
      console.error('Failed to fetch scores:', error.message);
      return [];
    }
  },

  async checkConnection() {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);

      await fetch(BACKEND_CONFIG.API_URL, {
        method: 'HEAD',
        signal: controller.signal
      });

      clearTimeout(timeout);
      return true;
    } catch (error) {
      return false;
    }
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GlobalLeaderboard, BACKEND_CONFIG };
}
