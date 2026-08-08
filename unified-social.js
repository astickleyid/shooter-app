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
    first_blood: 'com.voidrift.achievement.firstblood',
    centurion: 'com.voidrift.achievement.centurion',
    slayer: 'com.voidrift.achievement.slayer',
    bossHunter: 'com.voidrift.achievement.bosshunter',
    boss_hunter: 'com.voidrift.achievement.bosshunter',
    survivor: 'com.voidrift.achievement.survivor',
    veteran: 'com.voidrift.achievement.veteran',
    champion: 'com.voidrift.achievement.champion',
    flawless: 'com.voidrift.achievement.flawless',
    prestige1: 'com.voidrift.achievement.prestige1',
    prestige_1: 'com.voidrift.achievement.prestige1',
    prestige5: 'com.voidrift.achievement.prestige5',
    prestige_5: 'com.voidrift.achievement.prestige5',
    prestige10: 'com.voidrift.achievement.prestige10',
    prestige_10: 'com.voidrift.achievement.prestige10',
    voidBreaker: 'com.voidrift.achievement.voidbreaker',
    void_breaker: 'com.voidrift.achievement.voidbreaker'
  },

  // Initialize unified social system
  async initialize() {
    // Detect iOS after bridge inject (bridge is atDocumentStart but race is still possible)
    this.isIOS = typeof window.iOSBridge !== 'undefined' ||
      !!(window.webkit?.messageHandlers?.gcAuthenticate);

    if (this.isIOS) {
      this.isGameCenterAvailable = true;
      if (!window.iOSBridge) {
        window.iOSBridge = { gameCenter: { isAvailable: true, isAuthenticated: false, playerInfo: null } };
      }

      const prev = window.onGameCenterAuthChanged;
      window.onGameCenterAuthChanged = (authenticated, playerInfo) => {
        this.isGameCenterAuthenticated = !!authenticated;
        if (playerInfo) this._gcPlayer = playerInfo;
        this.updateSocialUI();
        if (typeof prev === 'function') prev(authenticated, playerInfo);
      };

      if (window.iOSBridge?.gameCenter?.authenticate) {
        window.iOSBridge.gameCenter.authenticate();
      } else if (window.webkit?.messageHandlers?.gcAuthenticate) {
        try { window.webkit.messageHandlers.gcAuthenticate.postMessage({}); } catch (_) {}
      }

      // Pick up late auth state
      if (window.iOSBridge?.gameCenter?.isAuthenticated) {
        this.isGameCenterAuthenticated = true;
      }
    }

    // Initialize web-based social (skip custom accounts on GC-only iOS)
    if (!window.VOID_RIFT_GC_ONLY && typeof SocialAPI !== 'undefined') {
      SocialAPI.loadSession();
    }

    this.updateSocialUI();
  },

  // Submit score to both systems
  async submitScore(score, level, difficulty) {
    const n = Math.max(0, Math.floor(Number(score) || 0));

    // Re-check GC auth (bridge may have authenticated after initialize)
    if (window.iOSBridge?.gameCenter?.isAuthenticated) {
      this.isGameCenterAuthenticated = true;
    }

    // Submit to Game Center (iOS only)
    if (this.isGameCenterAuthenticated && window.iOSBridge?.gameCenter) {
      try {
        window.iOSBridge.gameCenter.submitScore(n, this.leaderboardIDs.highScore);
        // Survival board tracks the same run score for v1
        window.iOSBridge.gameCenter.submitScore(n, this.leaderboardIDs.survival);
        if (window.DAILY_CHALLENGE_ACTIVE) {
          window.iOSBridge.gameCenter.submitScore(n, this.leaderboardIDs.weekly);
        }
      } catch (error) {
        console.warn('[UnifiedSocial] GC score submit failed', error);
      }
    }

    // Submit to web leaderboard (skipped in GC-only iOS mode to avoid custom accounts)
    if (window.VOID_RIFT_GC_ONLY) return;

    if (typeof submitSocialScore === 'function') {
      try {
        const username = this.getUsername();
        await submitSocialScore(username, n, level, difficulty);
      } catch (error) {
        // Silently ignore web leaderboard errors
      }
    }
  },

  // Report achievement to Game Center. Local/web achievement tracking and
  // toasts are owned exclusively by Auth.checkAchievements() (script.js) —
  // this used to also write to an orphaned `void_rift_auth_profile_*` key
  // and fire its own '.achievement-toast', which meant every unlock showed
  // two stacked "Achievement Unlocked" toasts for the same milestone.
  async reportAchievement(achievementKey, percentComplete = 100) {
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
        const gcFriends = await new Promise((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            reject(new Error('Game Center friends loading timed out'));
          }, 10000); // 10 second timeout
          
          window.iOSBridge.gameCenter.loadFriends((friends) => {
            clearTimeout(timeoutId);
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
      loginBtn.onclick = (e) => {
        if (e && typeof e.preventDefault === 'function') e.preventDefault();
        // Prefer SocialHub when present; fall back so Login never goes dead
        // (social-hub.js was previously omitted from index.html, which made
        // this handler a silent no-op and looked like a frozen menu button).
        try {
          if (typeof SocialHub !== 'undefined' && typeof SocialHub.showAuthModal === 'function') {
            SocialHub.showAuthModal('login');
            return;
          }
          if (typeof SocialUI !== 'undefined' && typeof SocialUI.showAuthModal === 'function') {
            SocialUI.showAuthModal('login');
            return;
          }
          const auth = document.getElementById('authModal');
          if (auth) {
            auth.style.display = 'flex';
            return;
          }
          console.warn('[UnifiedSocial] No auth UI available for Login button');
        } catch (err) {
          console.error('[UnifiedSocial] Login open failed', err);
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
    try {
      if (this.isGameCenterAuthenticated) {
        this.showAchievements();
        return;
      }
      if (typeof SocialHub !== 'undefined' && typeof SocialHub.showProfile === 'function') {
        SocialHub.showProfile();
        return;
      }
      if (typeof SocialUI !== 'undefined' && typeof SocialUI.showProfileModal === 'function') {
        SocialUI.showProfileModal();
      }
    } catch (err) {
      console.error('[UnifiedSocial] showProfile failed', err);
    }
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
    const bossKills = stats?.bossKills || 0;
    const voidSurgeKills = stats?.voidSurgeKills || 0;
    const flawless = !!stats?.flawless;

    // Lifetime totals when Auth profile is available
    let totalKills = kills;
    let prestige = 0;
    try {
      if (typeof Auth !== 'undefined' && Auth.playerProfile) {
        totalKills = Math.max(totalKills, Auth.playerProfile.totalKills || 0);
        prestige = Auth.playerProfile.prestige || 0;
      }
    } catch (_) {}

    if (kills >= 1 || totalKills >= 1) this.reportAchievement('firstBlood', 100);
    if (totalKills >= 100) this.reportAchievement('centurion', Math.min(100, (totalKills / 100) * 100));
    if (totalKills >= 1000) this.reportAchievement('slayer', 100);
    if (bossKills >= 1) this.reportAchievement('bossHunter', 100);
    if (voidSurgeKills >= 1) this.reportAchievement('voidBreaker', 100);
    if (level >= 10) this.reportAchievement('survivor', 100);
    if (level >= 25) this.reportAchievement('veteran', 100);
    if (level >= 50) this.reportAchievement('champion', 100);
    if (flawless && level >= 1) this.reportAchievement('flawless', 100);
    if (prestige >= 1) this.reportAchievement('prestige1', 100);
    if (prestige >= 5) this.reportAchievement('prestige5', 100);
    if (prestige >= 10) this.reportAchievement('prestige10', 100);
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
