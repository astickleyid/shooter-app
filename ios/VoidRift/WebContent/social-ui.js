/**
 * Unified Social UI Manager
 * Provides UI components for authentication, profile, and leaderboard
 * Works with AuthSystem and LeaderboardSystem
 */

const SocialUI = {
  initialized: false,
  currentModal: null,
  
  /**
   * Initialize social UI
   * Sets up event listeners and initial state
   */
  initialize() {
    if (this.initialized) return;
    
    // Listen for auth state changes
    if (typeof AuthSystem !== 'undefined') {
      AuthSystem.onAuthChange(() => {
        this.updateUI();
      });
    }
    
    // Update UI on load
    this.updateUI();
    
    this.initialized = true;
  },
  
  /**
   * Update all UI elements based on auth state
   */
  updateUI() {
    const user = typeof AuthSystem !== 'undefined' ? AuthSystem.getCurrentUser() : null;
    const isLoggedIn = typeof AuthSystem !== 'undefined' ? AuthSystem.isAuthenticated() : false;
    
    // Update login button
    const loginBtn = document.getElementById('loginButton');
    if (loginBtn) {
      if (isLoggedIn && user) {
        loginBtn.textContent = user.username;
        loginBtn.onclick = () => this.showProfileModal();
        loginBtn.classList.add('logged-in');
        loginBtn.classList.remove('logged-out');
      } else {
        loginBtn.textContent = 'Login';
        loginBtn.onclick = () => this.showAuthModal('login');
        loginBtn.classList.add('logged-out');
        loginBtn.classList.remove('logged-in');
      }
    }
    
    // Update profile button
    const profileBtn = document.getElementById('profileButton');
    if (profileBtn) {
      if (isLoggedIn && user) {
        profileBtn.style.display = 'inline-block';
        profileBtn.innerHTML = `👤 Lvl ${user.profile?.level || 1}`;
        profileBtn.onclick = () => this.showProfileModal();
      } else {
        profileBtn.style.display = 'none';
      }
    }
    
    // Update any other auth-dependent UI
    this._updateLeaderboardUI();
  },
  
  /**
   * Show authentication modal (login or register)
   * @param {string} mode - 'login' or 'register'
   */
  showAuthModal(mode = 'login') {
    this.closeCurrentModal();
    
    const modal = document.createElement('div');
    modal.className = 'social-modal';
    modal.innerHTML = `
      <div class="social-modal-content">
        <div class="social-modal-header">
          <h2>${mode === 'login' ? 'Login' : 'Create Account'}</h2>
          <button class="social-modal-close" onclick="SocialUI.closeCurrentModal()">×</button>
        </div>
        <div class="social-modal-body">
          <div class="backend-status" id="backendStatus">
            <span class="status-indicator">🔄</span> Checking backend connection...
          </div>
          <form id="authForm" onsubmit="return false;">
            <div class="form-group">
              <label>Username</label>
              <input type="text" id="authUsername" placeholder="Enter username" required minlength="3" autocomplete="username">
              <small class="input-hint">Minimum 3 characters</small>
            </div>
            <div class="form-group">
              <label>Password</label>
              <input type="password" id="authPassword" placeholder="Enter password" required minlength="4" autocomplete="${mode === 'login' ? 'current-password' : 'new-password'}">
              <small class="input-hint">Minimum 4 characters</small>
            </div>
            <div id="authError" class="error-message" style="display: none;"></div>
            <div class="form-actions">
              <button type="submit" class="btn-primary" id="authSubmit">
                ${mode === 'login' ? 'Login' : 'Register'}
              </button>
            </div>
            <div class="form-footer">
              ${mode === 'login' 
                ? `<p>Don't have an account? <a href="#" onclick="SocialUI.showAuthModal('register'); return false;">Register</a></p>` 
                : `<p>Already have an account? <a href="#" onclick="SocialUI.showAuthModal('login'); return false;">Login</a></p>`
              }
            </div>
          </form>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    this.currentModal = modal;
    
    // Check backend status
    this._checkBackendStatus();
    
    // Setup form submission
    const form = document.getElementById('authForm');
    const submitBtn = document.getElementById('authSubmit');
    const errorDiv = document.getElementById('authError');
    
    form.onsubmit = async (e) => {
      e.preventDefault();
      
      const username = document.getElementById('authUsername').value;
      const password = document.getElementById('authPassword').value;
      
      // Disable form
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner">⏳</span> Please wait...';
      errorDiv.style.display = 'none';
      
      try {
        let result;
        if (mode === 'login') {
          result = await AuthSystem.login(username, password);
        } else {
          result = await AuthSystem.register(username, password);
        }
        
        if (result.success) {
          this.closeCurrentModal();
          this.showNotification(`✅ Welcome, ${username}!`, 'success');
        } else {
          // Enhanced error display
          errorDiv.innerHTML = `
            <div class="error-title">❌ ${mode === 'login' ? 'Login' : 'Registration'} Failed</div>
            <div class="error-details">${this._formatErrorMessage(result.error)}</div>
          `;
          errorDiv.style.display = 'block';
          
          // Scroll error into view
          errorDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      } catch (error) {
        errorDiv.innerHTML = `
          <div class="error-title">❌ Error</div>
          <div class="error-details">${this._formatErrorMessage(error.message || 'An unexpected error occurred')}</div>
        `;
        errorDiv.style.display = 'block';
        errorDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = mode === 'login' ? 'Login' : 'Register';
      }
    };
    
    // Focus username input
    setTimeout(() => {
      document.getElementById('authUsername')?.focus();
    }, 100);
  },
  
  /**
   * Check backend connection status
   * @private
   */
  async _checkBackendStatus() {
    const statusDiv = document.getElementById('backendStatus');
    if (!statusDiv) return;
    
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('https://shooter-app-one.vercel.app/api/users?action=ping', {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeout);
      
      if (response.ok) {
        statusDiv.innerHTML = '<span class="status-indicator success">✅</span> Backend online';
        statusDiv.className = 'backend-status success';
        setTimeout(() => {
          statusDiv.style.display = 'none';
        }, 2000);
      } else {
        throw new Error('Backend returned error');
      }
    } catch (error) {
      statusDiv.innerHTML = `
        <span class="status-indicator error">⚠️</span> 
        <strong>Backend connection failed</strong><br>
        <small>API: https://shooter-app-one.vercel.app/api</small><br>
        <small>Make sure backend is deployed to Vercel</small>
      `;
      statusDiv.className = 'backend-status error';
    }
  },
  
  /**
   * Format error message with line breaks
   * @private
   */
  _formatErrorMessage(error) {
    if (!error) return 'An error occurred';
    // Convert \n to <br> for display
    return error.replace(/\n/g, '<br>');
  },
  
  /**
   * Show user profile modal
   */
  showProfileModal() {
    const user = typeof AuthSystem !== 'undefined' ? AuthSystem.getCurrentUser() : null;
    if (!user) {
      this.showAuthModal('login');
      return;
    }
    
    this.closeCurrentModal();
    
    const profile = user.profile || {};
    const stats = user.stats || {};
    
    const modal = document.createElement('div');
    modal.className = 'social-modal';
    modal.innerHTML = `
      <div class="social-modal-content social-profile">
        <div class="social-modal-header">
          <h2>Profile</h2>
          <button class="social-modal-close" onclick="SocialUI.closeCurrentModal()">×</button>
        </div>
        <div class="social-modal-body">
          <div class="profile-header">
            <div class="profile-avatar">
              ${this._getAvatarEmoji(user.username)}
            </div>
            <div class="profile-info">
              <h3>${user.username}</h3>
              <div class="profile-level">Level ${profile.level || 1}</div>
              <div class="profile-xp">
                <div class="xp-bar">
                  <div class="xp-fill" style="width: ${this._getXPProgress(profile)}%"></div>
                </div>
                <div class="xp-text">${profile.xp || 0} / ${this._getXPForNextLevel(profile)} XP</div>
              </div>
            </div>
          </div>
          
          <div class="profile-stats">
            <h4>Statistics</h4>
            <div class="stats-grid">
              <div class="stat-item">
                <div class="stat-label">Games Played</div>
                <div class="stat-value">${profile.gamesPlayed || 0}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">High Score</div>
                <div class="stat-value">${(profile.highScore || 0).toLocaleString()}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">Total Kills</div>
                <div class="stat-value">${(stats.kills || 0).toLocaleString()}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">Total Score</div>
                <div class="stat-value">${(profile.totalScore || 0).toLocaleString()}</div>
              </div>
            </div>
          </div>
          
          <div class="profile-actions">
            <button class="btn-secondary" onclick="SocialUI.showLeaderboardModal()">View Leaderboard</button>
            <button class="btn-danger" onclick="SocialUI.confirmLogout()">Logout</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    this.currentModal = modal;
  },
  
  /**
   * Show leaderboard modal
   */
  async showLeaderboardModal(difficulty = 'all') {
    this.closeCurrentModal();
    
    const modal = document.createElement('div');
    modal.className = 'social-modal';
    modal.innerHTML = `
      <div class="social-modal-content social-leaderboard">
        <div class="social-modal-header">
          <h2>Global Leaderboard</h2>
          <button class="social-modal-close" onclick="SocialUI.closeCurrentModal()">×</button>
        </div>
        <div class="social-modal-body">
          <div class="leaderboard-filters">
            <select id="difficultyFilter" onchange="SocialUI.changeLeaderboardDifficulty(this.value)">
              <option value="all" ${difficulty === 'all' ? 'selected' : ''}>All Difficulties</option>
              <option value="easy" ${difficulty === 'easy' ? 'selected' : ''}>Easy</option>
              <option value="normal" ${difficulty === 'normal' ? 'selected' : ''}>Normal</option>
              <option value="hard" ${difficulty === 'hard' ? 'selected' : ''}>Hard</option>
            </select>
          </div>
          <div id="leaderboardContent" class="leaderboard-content">
            <div class="loading">Loading leaderboard...</div>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    this.currentModal = modal;
    
    // Load leaderboard data
    this._loadLeaderboardData(difficulty);
  },
  
  /**
   * Change leaderboard difficulty filter
   */
  changeLeaderboardDifficulty(difficulty) {
    this._loadLeaderboardData(difficulty);
  },
  
  /**
   * Confirm logout
   */
  confirmLogout() {
    if (confirm('Are you sure you want to logout?')) {
      if (typeof AuthSystem !== 'undefined') {
        AuthSystem.logout();
      }
      this.closeCurrentModal();
      this.showNotification('Logged out successfully', 'info');
    }
  },
  
  /**
   * Close current modal
   */
  closeCurrentModal() {
    if (this.currentModal && this.currentModal.parentNode) {
      this.currentModal.remove();
      this.currentModal = null;
    }
  },
  
  /**
   * Show notification toast
   */
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 100);
    
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 300);
    }, 3000);
  },
  
  /**
   * Load leaderboard data
   * @private
   */
  async _loadLeaderboardData(difficulty) {
    const content = document.getElementById('leaderboardContent');
    if (!content) return;
    
    try {
      content.innerHTML = '<div class="loading">Loading leaderboard...</div>';
      
      const scores = typeof LeaderboardSystem !== 'undefined' 
        ? await LeaderboardSystem.fetchScores(difficulty, 50)
        : [];
      
      if (scores.length === 0) {
        content.innerHTML = '<div class="empty-state">No scores yet. Be the first!</div>';
        return;
      }
      
      const user = typeof AuthSystem !== 'undefined' ? AuthSystem.getCurrentUser() : null;
      
      let html = '<div class="leaderboard-list">';
      scores.forEach((entry, index) => {
        const rank = index + 1;
        const isCurrentUser = user && entry.userId === user.id;
        const rankClass = rank <= 3 ? `rank-${rank}` : '';
        const userClass = isCurrentUser ? 'current-user' : '';
        
        html += `
          <div class="leaderboard-entry ${rankClass} ${userClass}">
            <div class="entry-rank">${this._getRankDisplay(rank)}</div>
            <div class="entry-username">${entry.username}</div>
            <div class="entry-score">${entry.score.toLocaleString()}</div>
            <div class="entry-level">Lvl ${entry.level}</div>
            <div class="entry-difficulty">${this._getDifficultyBadge(entry.difficulty)}</div>
          </div>
        `;
      });
      html += '</div>';
      
      content.innerHTML = html;
    } catch (error) {
      content.innerHTML = `<div class="error-state">Failed to load leaderboard: ${error.message}</div>`;
    }
  },
  
  /**
   * Update leaderboard UI elements
   * @private
   */
  _updateLeaderboardUI() {
    // Update any leaderboard-specific UI elements
  },
  
  /**
   * Get avatar emoji based on username
   * @private
   */
  _getAvatarEmoji(username) {
    const emojis = ['🚀', '🛸', '⭐', '💫', '🌟', '✨', '🔥', '⚡', '💎', '🎯'];
    const hash = username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return emojis[hash % emojis.length];
  },
  
  /**
   * Get XP progress percentage
   * @private
   */
  _getXPProgress(profile) {
    const currentXP = profile.xp || 0;
    const currentLevel = profile.level || 1;
    const xpForCurrentLevel = (currentLevel - 1) * 100;
    const xpIntoLevel = currentXP - xpForCurrentLevel;
    return Math.min(100, (xpIntoLevel / 100) * 100);
  },
  
  /**
   * Get XP needed for next level
   * @private
   */
  _getXPForNextLevel(profile) {
    const currentLevel = profile.level || 1;
    return currentLevel * 100;
  },
  
  /**
   * Get rank display (medal for top 3)
   * @private
   */
  _getRankDisplay(rank) {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  },
  
  /**
   * Get difficulty badge HTML
   * @private
   */
  _getDifficultyBadge(difficulty) {
    const badges = {
      easy: '<span class="badge badge-easy">Easy</span>',
      normal: '<span class="badge badge-normal">Normal</span>',
      hard: '<span class="badge badge-hard">Hard</span>'
    };
    return badges[difficulty] || badges.normal;
  }
};

// Auto-initialize on load
if (typeof window !== 'undefined') {
  window.SocialUI = SocialUI;
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      SocialUI.initialize();
    });
  } else {
    SocialUI.initialize();
  }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SocialUI };
}
