/**
 * Unified Social Manager
 * Bridges web-based social features with iOS Game Center
 * Provides seamless social experience across platforms
 * 
 * @global SocialAPI - Web social API (from social-api.js)
 * @global SocialHub - Web social hub UI (from social-hub.js)
 * @global GlobalLeaderboard - Global leaderboard system (from backend-api.js)
 * @global submitSocialScore - Score submission function (from social-integration.js)
 * @global socialGameOver - Game over handler (from social-integration.js)
 * @global updateSocialUI - UI update function (from social-integration.js)
 * @global module - Node.js module object
 */

/* global SocialAPI, SocialHub, GlobalLeaderboard, submitSocialScore, socialGameOver, updateSocialUI, module */

const UnifiedSocial = {
  // Platform detection
  isIOS: typeof window.iOSBridge !== 'undefined',
  isGameCenterAvailable: false,
  isGameCenterAuthenticated: false,
  
  // Configuration
  leaderboardIDs: {
    highScore: 'com.voidrift.highscore',
    survival: 'com.voidrift.survival',
    weekly: 'com.voidrift.weekly'
  },
  
  achievementIDs: {
    firstBlood: 'com.voidrift.achievement.firstblood',
    centurion: 'com.voidrift.achievement.centurion',
    slayer: 'com.voidrift.achievement.slayer',
    bossHunter: 'com.voidrift.achievement.bosshunter',
    survivor: 'com.voidrift.achievement.survivor',
    veteran: 'com.voidrift.achievement.veteran',
    champion: 'com.voidrift.achievement.champion',
    flawless: 'com.voidrift.achievement.flawless',
    prestige1: 'com.voidrift.achievement.prestige1',
    prestige5: 'com.voidrift.achievement.prestige5',
    prestige10: 'com.voidrift.achievement.prestige10'
  },

  // Initialize unified social system
  async initialize() {
    // Check for Game Center on iOS
    if (this.isIOS && window.iOSBridge?.gameCenter) {
      this.isGameCenterAvailable = true;
      
      // Listen for Game Center auth changes
      window.onGameCenterAuthChanged = (authenticated, _playerInfo) => {
        this.isGameCenterAuthenticated = authenticated;
        
        // Update UI
        this.updateSocialUI();
      };
      
      // Try to authenticate
      window.iOSBridge.gameCenter.authenticate();
    }
    
    // Initialize web-based social (always available)
    if (typeof SocialAPI !== 'undefined') {
      SocialAPI.loadSession();
    }
    
    this.updateSocialUI();
  },

  // Submit score to both systems
  async submitScore(score, level, difficulty) {
    // Submit to Game Center (iOS only)
    if (this.isGameCenterAuthenticated) {
      try {
        window.iOSBridge.gameCenter.submitScore(score, this.leaderboardIDs.highScore);
      } catch (error) {
        // Silently ignore Game Center errors
      }
    }
    
    // Submit to web leaderboard
    if (typeof submitSocialScore === 'function') {
      try {
        const username = this.getUsername();
        await submitSocialScore(username, score, level, difficulty);
      } catch (error) {
        // Silently ignore web leaderboard errors
      }
    }
  },

  // Report achievement to both systems
  async reportAchievement(achievementKey, percentComplete = 100) {
    // Report to Game Center (iOS only)
    if (this.isGameCenterAuthenticated) {
      const gcID = this.achievementIDs[achievementKey];
      if (gcID) {
        try {
          window.iOSBridge.gameCenter.reportAchievement(gcID, percentComplete);
        } catch (error) {
          // Silently ignore Game Center errors
        }
      }
    }
    
    // Store locally for web
    try {
      const authKey = 'void_rift_auth';
      const currentUser = JSON.parse(localStorage.getItem(authKey) || '{}').currentUser;
      const profileKey = `${authKey}_profile_${currentUser || 'guest'}`;
      const profile = JSON.parse(localStorage.getItem(profileKey) || '{}');
      
      if (!profile.unlockedAchievements) {
        profile.unlockedAchievements = [];
      }
      
      if (!profile.unlockedAchievements.includes(achievementKey)) {
        profile.unlockedAchievements.push(achievementKey);
        localStorage.setItem(profileKey, JSON.stringify(profile));
        
        // Show achievement notification
        this.showAchievementNotification(achievementKey);
      }
    } catch (error) {
      // Silently ignore local achievement errors
    }
  },

  // Show leaderboard UI
  showLeaderboard(leaderboardType = 'highScore') {
    if (this.isGameCenterAuthenticated) {
      // Show native Game Center leaderboard
      const leaderboardID = this.leaderboardIDs[leaderboardType];
      window.iOSBridge.gameCenter.showLeaderboard(leaderboardID);
    } else if (typeof GlobalLeaderboard !== 'undefined') {
      // Show web leaderboard modal
      GlobalLeaderboard.showModal();
    }
  },

  // Show achievements UI
  showAchievements() {
    if (this.isGameCenterAuthenticated) {
      // Show native Game Center achievements
      window.iOSBridge.gameCenter.showAchievements();
    } else if (typeof SocialHub !== 'undefined') {
      // Show web profile with achievements
      SocialHub.showProfile();
    }
  },

  // Load friends from both systems
  async loadFriends() {
    const allFriends = [];
    
    // Load Game Center friends (iOS only)
    if (this.isGameCenterAuthenticated) {
      try {
        const gcFriends = await new Promise((resolve) => {
          window.iOSBridge.gameCenter.loadFriends((friends) => {
            resolve(friends || []);
          });
        });
        
        allFriends.push(...gcFriends.map(f => ({
          source: 'gameCenter',
          alias: f.alias,
          playerID: f.playerID
        })));
      } catch (error) {
        // Silently ignore Game Center friend loading errors
      }
    }
    
    // Load web friends
    if (typeof SocialAPI !== 'undefined' && SocialAPI.isLoggedIn()) {
      try {
        const webFriends = await SocialAPI.getFriendsList();
        allFriends.push(...webFriends.map(f => ({
          source: 'web',
          username: f.username,
          id: f.id
        })));
      } catch (error) {
        // Silently ignore web friend loading errors
      }
    }
    
    return allFriends;
  },

  // Get current username
  getUsername() {
    // Try Game Center first (iOS)
    if (this.isGameCenterAuthenticated && window.iOSBridge?.gameCenter?.playerInfo) {
      return window.iOSBridge.gameCenter.playerInfo.alias;
    }
    
    // Try web social API
    if (typeof SocialAPI !== 'undefined' && SocialAPI.currentUser) {
      return SocialAPI.currentUser.username;
    }
    
    // Try local auth
    try {
      const authKey = 'void_rift_auth';
      const authData = JSON.parse(localStorage.getItem(authKey) || '{}');
      if (authData.currentUser && authData.users?.[authData.currentUser]) {
        return authData.users[authData.currentUser].username;
      }
    } catch (err) {
      // Ignore
    }
    
    return 'Guest';
  },

  // Check if user is logged in anywhere
  isLoggedIn() {
    return this.isGameCenterAuthenticated || 
           (typeof SocialAPI !== 'undefined' && SocialAPI.isLoggedIn()) ||
           this.getUsername() !== 'Guest';
  },

  // Update UI based on login state
  updateSocialUI() {
    const username = this.getUsername();
    const loginBtn = document.getElementById('loginButton');
    
    if (loginBtn && username !== 'Guest') {
      loginBtn.textContent = username;
      loginBtn.onclick = () => this.showProfile();
      loginBtn.classList.remove('footer-btn-text');
      loginBtn.classList.add('footer-btn-logged-in');
      
      // Add Game Center indicator if authenticated
      if (this.isGameCenterAuthenticated) {
        loginBtn.innerHTML = `🎮 ${username}`;
      }
    } else if (loginBtn) {
      loginBtn.textContent = 'Login';
      loginBtn.onclick = () => {
        if (typeof SocialHub !== 'undefined') {
          SocialHub.showAuthModal('login');
        }
      };
      loginBtn.classList.add('footer-btn-text');
      loginBtn.classList.remove('footer-btn-logged-in');
    }
    
    // Update other UI elements
    if (typeof updateSocialUI === 'function') {
      updateSocialUI();
    }
  },

  // Show profile (unified)
  showProfile() {
    if (this.isGameCenterAuthenticated) {
      // Show Game Center profile
      this.showAchievements();
    } else if (typeof SocialHub !== 'undefined') {
      // Show web profile
      SocialHub.showProfile();
    }
  },

  // Show achievement notification
  showAchievementNotification(achievementKey) {
    const achievementNames = {
      firstBlood: 'First Blood',
      centurion: 'Centurion',
      slayer: 'Slayer',
      bossHunter: 'Boss Hunter',
      survivor: 'Survivor',
      veteran: 'Veteran',
      champion: 'Champion',
      flawless: 'Flawless Victory',
      prestige1: 'Prestige I',
      prestige5: 'Prestige V',
      prestige10: 'Prestige X'
    };
    
    const achievementIcons = {
      firstBlood: '🎯',
      centurion: '⚔️',
      slayer: '💀',
      bossHunter: '👹',
      survivor: '🛡️',
      veteran: '⭐',
      champion: '🏆',
      flawless: '✨',
      prestige1: '🌟',
      prestige5: '💫',
      prestige10: '🔱'
    };
    
    const name = achievementNames[achievementKey] || achievementKey;
    const icon = achievementIcons[achievementKey] || '🏅';
    
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = 'achievement-toast';
    toast.innerHTML = `
      <div class="achievement-toast-icon">${icon}</div>
      <div class="achievement-toast-content">
        <div class="achievement-toast-title">ACHIEVEMENT UNLOCKED!</div>
        <div class="achievement-toast-name">${name}</div>
      </div>
    `;
    
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 100);
    
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentNode) toast.remove();
      }, 300);
    }, 4000);
  },

  // Handle game over with unified social features
  async handleGameOver(finalScore, level, difficulty, stats) {
    // Submit score to both systems
    await this.submitScore(finalScore, level, difficulty);
    
    // Check and report achievements
    this.checkAchievements(finalScore, level, stats);
    
    // Update web social if available
    if (typeof socialGameOver === 'function') {
      await socialGameOver(finalScore, level, difficulty, stats);
    }
  },

  // Check for achievement unlocks
  checkAchievements(score, level, stats) {
    const kills = stats?.kills || 0;
    const deaths = stats?.deaths || 0;
    
    // First Blood - Get 1 kill
    if (kills >= 1) {
      this.reportAchievement('firstBlood', 100);
    }
    
    // Centurion - Get 100 kills
    if (kills >= 100) {
      this.reportAchievement('centurion', 100);
    }
    
    // Slayer - Get 1000 kills (lifetime)
    // This would need to track lifetime stats
    
    // Boss Hunter - Kill a boss
    if (stats?.bossKills >= 1) {
      this.reportAchievement('bossHunter', 100);
    }
    
    // Survivor - Reach level 10
    if (level >= 10) {
      this.reportAchievement('survivor', 100);
    }
    
    // Veteran - Reach level 25
    if (level >= 25) {
      this.reportAchievement('veteran', 100);
    }
    
    // Champion - Reach level 50
    if (level >= 50) {
      this.reportAchievement('champion', 100);
    }
    
    // Flawless - Complete a level without taking damage
    if (deaths === 0 && level >= 5) {
      this.reportAchievement('flawless', 100);
    }
  }
};

// Auto-initialize on page load
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    UnifiedSocial.initialize();
  });
  
  // Make available globally
  window.UnifiedSocial = UnifiedSocial;
}

// Export for module systems
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = { UnifiedSocial };
}
