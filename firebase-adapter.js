/**
 * Firebase Adapter
 * Makes Firebase Backend compatible with existing game code
 * Provides the same interface as the old Vercel KV backend
 */

// Auth System Adapter
if (typeof AUTH_CONFIG !== 'undefined') {
  // Override auth functions to use Firebase
  const OriginalAuthSystem = window.AuthSystem || {};
  
  window.AuthSystem = {
    currentUser: null,
    
    async register(username, password, email = null) {
      const result = await FirebaseBackend.register(username, password, email);
      if (result.success) {
        this.currentUser = result.user;
      }
      return result;
    },
    
    async login(username, password) {
      const result = await FirebaseBackend.login(username, password);
      if (result.success) {
        this.currentUser = result.user;
      }
      return result;
    },
    
    async logout() {
      const result = await FirebaseBackend.logout();
      if (result.success) {
        this.currentUser = null;
      }
      return result;
    },
    
    isLoggedIn() {
      return !!FirebaseBackend.getCurrentUser();
    },
    
    getCurrentUser() {
      const fbUser = FirebaseBackend.getCurrentUser();
      if (fbUser && !this.currentUser) {
        // Lazy load user data
        FirebaseBackend.getUserProfile(fbUser.uid).then(result => {
          if (result.success) {
            this.currentUser = result.user;
          }
        });
      }
      return this.currentUser;
    }
  };
}

// Leaderboard System Adapter
if (typeof LEADERBOARD_CONFIG !== 'undefined') {
  const OriginalLeaderboardSystem = window.LeaderboardSystem || {};
  
  window.LeaderboardSystem = {
    async submitScore(entry) {
      const user = FirebaseBackend.getCurrentUser();
      if (!user) {
        return { success: false, error: 'Must be logged in' };
      }
      
      return await FirebaseBackend.submitScore(
        entry.score,
        entry.level,
        entry.difficulty,
        entry.username
      );
    },
    
    async getLeaderboard(difficulty = 'all', limit = 100) {
      return await FirebaseBackend.getLeaderboard(difficulty, limit);
    }
  };
}

// Social API Adapter
if (typeof SOCIAL_CONFIG !== 'undefined') {
  const OriginalSocialAPI = window.SocialAPI || {};
  
  window.SocialAPI = {
    currentUser: null,
    
    async updateStats(stats) {
      return await FirebaseBackend.updateStats(stats);
    },
    
    async sendFriendRequest(userId) {
      return await FirebaseBackend.sendFriendRequest(userId);
    },
    
    async acceptFriendRequest(requestId) {
      return await FirebaseBackend.acceptFriendRequest(requestId);
    },
    
    async getUserProfile(userId) {
      return await FirebaseBackend.getUserProfile(userId);
    },
    
    async postActivity(type, data) {
      return await FirebaseBackend.postActivity(type, data);
    },
    
    async getActivityFeed(limit = 50) {
      return await FirebaseBackend.getActivityFeed(limit);
    }
  };
}

// Backend Monitor Adapter
if (typeof BackendMonitor !== 'undefined') {
  // Override health check to use Firebase
  const originalCheckHealth = BackendMonitor.checkHealth;
  
  BackendMonitor.checkHealth = async function() {
    try {
      const result = await FirebaseBackend.healthCheck();
      
      if (result.success && result.status === 'healthy') {
        this.handleHealthyResponse(result);
      } else {
        this.handleUnhealthyResponse(result.status || 'unhealthy');
      }
    } catch (error) {
      this.handleError(error);
    }
  };
}

console.log('✅ Firebase adapter loaded - game code now uses Firebase backend');
