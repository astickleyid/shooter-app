/**
 * Social Hub UI Components
 * Renders profile cards, friends list, activity feed, player search
 * Now integrated with unified authentication system
 */

const SocialHub = {
  // Show login/register modal - unified with main game auth
  showAuthModal(mode = 'login') {
    // Remove any existing auth modal first to avoid duplicate IDs
    const existingModal = document.getElementById('socialAuthModal');
    if (existingModal) {
      existingModal.remove();
    }

    const modalHTML = `
      <div id="socialAuthModal" class="social-modal">
        <div class="social-modal-content">
          <span class="close-modal" onclick="SocialHub.closeModal('socialAuthModal')">&times;</span>
          <h2>${mode === 'login' ? '🎮 Player Login' : '✨ Create Account'}</h2>
          <p style="color: #94a3b8; font-size: 14px; margin-bottom: 16px; text-align: center;">
            One account for all features: Leaderboards, Social Hub, Profile & more!
          </p>
          
          <div id="authTabs" class="auth-tabs">
            <button class="auth-tab ${mode === 'login' ? 'active' : ''}" onclick="SocialHub.switchAuthTab('login')">Login</button>
            <button class="auth-tab ${mode === 'register' ? 'active' : ''}" onclick="SocialHub.switchAuthTab('register')">Register</button>
          </div>

          <form id="socialAuthForm" onsubmit="SocialHub.handleAuth(event, '${mode}')">
            <input type="text" id="socialAuthUsername" placeholder="Username" required minlength="3">
            <input type="password" id="socialAuthPassword" placeholder="Password" required minlength="4">
            ${mode === 'register' ? '<input type="email" id="socialAuthEmail" placeholder="Email (optional)">' : ''}
            
            <button type="submit" class="btn-primary">${mode === 'login' ? 'Login' : 'Create Account'}</button>
          </form>

          <div id="socialAuthError" class="error-message"></div>
          <div id="socialAuthSuccess" class="success-message"></div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
  },

  switchAuthTab(mode) {
    document.querySelectorAll('.auth-tab').forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');
    
    const emailInput = document.getElementById('socialAuthEmail');
    const submitBtn = document.querySelector('#socialAuthForm button[type="submit"]');
    
    if (mode === 'register') {
      if (!emailInput) {
        document.querySelector('#socialAuthPassword').insertAdjacentHTML('afterend', 
          '<input type="email" id="socialAuthEmail" placeholder="Email (optional)">');
      }
      submitBtn.textContent = 'Create Account';
      document.querySelector('#socialAuthForm').setAttribute('onsubmit', "SocialHub.handleAuth(event, 'register')");
    } else {
      if (emailInput) emailInput.remove();
      submitBtn.textContent = 'Login';
      document.querySelector('#socialAuthForm').setAttribute('onsubmit', "SocialHub.handleAuth(event, 'login')");
    }
  },

  async handleAuth(event, mode) {
    event.preventDefault();
    
    const username = document.getElementById('socialAuthUsername').value;
    const password = document.getElementById('socialAuthPassword').value;

    const errorEl = document.getElementById('socialAuthError');
    const successEl = document.getElementById('socialAuthSuccess');
    
    errorEl.textContent = '';
    successEl.textContent = '';

    try {
      // Use unified Auth system which syncs with SocialAPI
      let result;
      if (mode === 'register') {
        // Access Auth from main script via window
        if (typeof window.__VOID_RIFT__ !== 'undefined') {
          // Try direct API call first
          result = await SocialAPI.register(username, password);
        } else {
          result = await SocialAPI.register(username, password);
        }
        successEl.textContent = '✅ Account created! Welcome to Void Rift!';
      } else {
        if (typeof window.__VOID_RIFT__ !== 'undefined') {
          result = await SocialAPI.login(username, password);
        } else {
          result = await SocialAPI.login(username, password);
        }
        successEl.textContent = '✅ Welcome back!';
      }

      setTimeout(() => {
        this.closeModal('socialAuthModal');
        this.updateUI();
        // Also update main game UI
        if (typeof updateAuthUI === 'function') {
          updateAuthUI();
        }
        // Refresh login button
        const loginBtn = document.getElementById('loginButton');
        if (loginBtn && SocialAPI.isLoggedIn()) {
          loginBtn.textContent = SocialAPI.currentUser.username;
          loginBtn.onclick = () => SocialHub.showProfile();
        }
      }, 1500);
    } catch (error) {
      // Show more helpful error message for network failures
      if (this.isNetworkError(error)) {
        errorEl.textContent = '⚠️ Unable to connect to server. Please check your connection and try again.';
      } else {
        errorEl.textContent = error.message || 'Authentication failed';
      }
    }
  },

  // Helper to detect network errors
  isNetworkError(error) {
    return error.name === 'TypeError' || 
           error.message === 'Failed to fetch' ||
           error.message.includes('NetworkError') ||
           error.message.includes('network') ||
           error.name === 'AbortError';
  },

  // Check if user is logged in (checks both SocialAPI and local Auth)
  isLoggedIn() {
    // Check SocialAPI first
    if (SocialAPI.isLoggedIn()) {
      return true;
    }
    // Check local Auth storage
    try {
      const authKey = 'void_rift_auth';
      const authData = JSON.parse(localStorage.getItem(authKey) || '{}');
      if (authData.currentUser && authData.users?.[authData.currentUser]) {
        return true;
      }
    } catch (err) {
      // Ignore errors
    }
    return false;
  },

  // Show player profile modal with achievements, prestige, and all unified data
  async showProfile(userId = null, username = null) {
    // If viewing own profile (no userId/username provided), check if logged in
    if (!userId && !username) {
      // Check both SocialAPI and local Auth
      if (!this.isLoggedIn()) {
        this.showAuthModal('login');
        return;
      }
      // Use current user's ID if available, otherwise use local profile
      if (SocialAPI.currentUser) {
        userId = SocialAPI.currentUser.id;
      }
    }

    try {
      // Get profile from SocialAPI or local
      let user;
      try {
        if (userId) {
          user = await SocialAPI.getProfile(userId, username);
        } else {
          // Use local profile
          user = this.getLocalProfile();
        }
      } catch (err) {
        // If social API fails, create mock profile from local data
        user = this.getLocalProfile();
      }
      
      const isOwnProfile = !userId || (SocialAPI.currentUser && user.id === SocialAPI.currentUser?.id) || user.username === this.getLocalProfile().username;
      const isFriend = SocialAPI.currentUser && SocialAPI.currentUser.friends?.includes(user.id);

      // Get local game data for enhanced profile
      const localProfile = this.getLocalProfile();
      
      // Merge local achievements and prestige data
      const prestige = localProfile.prestige || 0;
      const prestigeLevel = localProfile.prestigeLevel || 1;
      const achievements = localProfile.unlockedAchievements || [];
      const title = localProfile.title || 'Rookie Pilot';

      const modalHTML = `
        <div id="profileModal" class="social-modal">
          <div class="social-modal-content profile-card enhanced-profile">
            <span class="close-modal" onclick="SocialHub.closeModal('profileModal')">&times;</span>
            
            <div class="profile-header">
              <img src="${user.profile?.avatar || this.generateAvatar(user.username)}" alt="${user.username}" class="profile-avatar-large">
              <div class="profile-info">
                <h2>${user.username} ${user.settings?.privacy === 'private' ? '🔒' : ''}</h2>
                <div class="profile-title">${title}</div>
                <div class="profile-badges">
                  ${(user.profile?.badges || []).map(b => `<span class="badge">${this.getBadgeEmoji(b)}</span>`).join('')}
                </div>
                <p class="profile-level">
                  ${prestige > 0 ? `<span class="prestige-badge">P${prestige}</span>` : ''}
                  Pilot Level ${localProfile.pilotLevel || 1} • ${localProfile.credits || 0} CR
                </p>
                ${user.profile?.bio ? `<p class="profile-bio">${user.profile.bio}</p>` : ''}
              </div>
            </div>

            <div class="profile-stats">
              <div class="stat-card">
                <div class="stat-value">${(localProfile.bestScore || 0).toLocaleString()}</div>
                <div class="stat-label">Best Score</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${localProfile.highestLevel || 1}</div>
                <div class="stat-label">Highest Level</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${localProfile.gamesPlayed || 0}</div>
                <div class="stat-label">Games Played</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${localProfile.totalKills || 0}</div>
                <div class="stat-label">Total Kills</div>
              </div>
            </div>

            ${isOwnProfile ? `
              <div class="profile-section">
                <h3>🏆 Achievements (${achievements.length}/${this.getTotalAchievements()})</h3>
                <div class="achievements-grid">
                  ${this.renderAchievements(achievements)}
                </div>
              </div>

              <div class="profile-section">
                <h3>🌟 Prestige Progress</h3>
                <div class="prestige-info">
                  <div class="prestige-level">
                    ${prestige > 0 ? `<span class="prestige-star">⭐</span> Prestige ${prestige}` : 'Not Yet Prestiged'}
                  </div>
                  <div class="prestige-progress">
                    <div class="prestige-bar">
                      <div class="prestige-fill" style="width: ${Math.min(100, ((localProfile.pilotLevel || 1) / 50) * 100)}%"></div>
                    </div>
                    <span>Level ${localProfile.pilotLevel || 1}/50</span>
                  </div>
                  ${this.canPrestige(localProfile) ? `
                    <button class="btn-prestige" onclick="SocialHub.doPrestige()">
                      🌟 PRESTIGE NOW
                    </button>
                    <p class="prestige-warning">Warning: Prestige resets your pilot level to 1, but unlocks exclusive rewards!</p>
                  ` : `
                    <p class="prestige-hint">Reach Pilot Level 50 to prestige and unlock rare rewards!</p>
                  `}
                </div>
              </div>

              <div class="profile-section">
                <h3>🚀 Ships & Equipment</h3>
                <div class="ships-grid">
                  ${this.renderUnlockedShips(localProfile)}
                </div>
              </div>
            ` : ''}

            ${!isOwnProfile ? `
              <div class="profile-actions">
                ${!isFriend ? 
                  `<button class="btn-primary" onclick="SocialHub.sendFriendRequest('${user.id}')">
                    ➕ Add Friend
                  </button>` : 
                  `<button class="btn-secondary" onclick="SocialHub.removeFriend('${user.id}')">
                    ✓ Friends
                  </button>`
                }
              </div>
            ` : ''}

            ${isOwnProfile ? `
              <div class="profile-actions">
                <button class="btn-secondary" onclick="SocialHub.showEditProfile()">
                  ✏️ Edit Profile
                </button>
                <button class="btn-secondary" onclick="SocialHub.logout()">
                  🚪 Logout
                </button>
              </div>
            ` : ''}
          </div>
        </div>
      `;

      document.body.insertAdjacentHTML('beforeend', modalHTML);
    } catch (error) {
      console.error('Failed to load profile:', error);
      // Show offline profile with local data
      this.showOfflineProfile();
    }
  },

  // Get local profile data from localStorage
  getLocalProfile() {
    try {
      const saveKey = 'void_rift_v11';
      const authKey = 'void_rift_auth';
      
      const saveData = JSON.parse(localStorage.getItem(saveKey) || '{}');
      const authData = JSON.parse(localStorage.getItem(authKey) || '{}');
      
      // Get profile for current user
      const currentUser = authData.currentUser;
      const profileKey = `${authKey}_profile_${currentUser || 'guest'}`;
      const profileData = JSON.parse(localStorage.getItem(profileKey) || '{}');
      
      return {
        username: currentUser ? authData.users?.[currentUser]?.username : 'Guest',
        pilotLevel: saveData.pilotLevel || 1,
        pilotXp: saveData.pilotXp || 0,
        credits: saveData.credits || 0,
        bestScore: saveData.bestScore || 0,
        highestLevel: saveData.highestLevel || 1,
        prestige: profileData.prestige || 0,
        prestigeLevel: profileData.prestigeLevel || 1,
        unlockedAchievements: profileData.unlockedAchievements || [],
        totalKills: profileData.totalKills || 0,
        bossKills: profileData.bossKills || 0,
        eliteKills: profileData.eliteKills || 0,
        gamesPlayed: profileData.gamesPlayed || 0,
        flawlessLevels: profileData.flawlessLevels || 0,
        unlockedShips: profileData.unlockedShips || ['vanguard'],
        title: profileData.title || 'Rookie Pilot'
      };
    } catch (err) {
      console.error('Failed to load local profile:', err);
      return {
        username: 'Guest',
        pilotLevel: 1,
        prestige: 0,
        unlockedAchievements: [],
        totalKills: 0,
        gamesPlayed: 0,
        unlockedShips: ['vanguard'],
        title: 'Rookie Pilot'
      };
    }
  },

  // Check if player can prestige
  canPrestige(profile) {
    return (profile.pilotLevel || 1) >= 50 && (profile.prestige || 0) < 10;
  },

  // Trigger prestige from profile
  doPrestige() {
    if (typeof window.__VOID_RIFT__ !== 'undefined') {
      // Prestige is handled through the Auth system in script.js
      // For now, show a message
      alert('🌟 Prestige system activated! This would reset your pilot level and unlock exclusive rewards.');
    }
    this.closeModal('profileModal');
  },

  // Generate avatar URL from username
  generateAvatar(username) {
    // Use a deterministic avatar based on username
    const colors = ['4ade80', '60a5fa', 'f97316', 'a855f7', 'f43f5e', '22d3ee'];
    const colorIndex = username ? username.charCodeAt(0) % colors.length : 0;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(username || 'P')}&background=${colors[colorIndex]}&color=fff&bold=true`;
  },

  // Get total achievements count
  getTotalAchievements() {
    // Standard achievement count
    return 24;
  },

  // Render achievements grid
  renderAchievements(unlockedIds) {
    const achievements = [
      { id: 'first_blood', name: 'First Blood', icon: '🎯' },
      { id: 'centurion', name: 'Centurion', icon: '⚔️' },
      { id: 'slayer', name: 'Slayer', icon: '💀' },
      { id: 'boss_hunter', name: 'Boss Hunter', icon: '👹' },
      { id: 'elite_destroyer', name: 'Elite Destroyer', icon: '💎' },
      { id: 'survivor', name: 'Survivor', icon: '🛡️' },
      { id: 'veteran', name: 'Veteran', icon: '⭐' },
      { id: 'champion', name: 'Champion', icon: '🏆' },
      { id: 'legend', name: 'Legend', icon: '👑' },
      { id: 'flawless', name: 'Flawless', icon: '✨' },
      { id: 'scorer', name: 'Point Scorer', icon: '📊' },
      { id: 'high_roller', name: 'High Roller', icon: '💰' },
      { id: 'millionaire', name: 'Millionaire', icon: '💎' },
      { id: 'pilot_10', name: 'Experienced', icon: '🎖️' },
      { id: 'pilot_25', name: 'Ace Pilot', icon: '🏅' },
      { id: 'pilot_50', name: 'Master Pilot', icon: '🥇' },
      { id: 'prestige_1', name: 'Ascended', icon: '🌟' },
      { id: 'prestige_5', name: 'Transcendent', icon: '💫' },
      { id: 'prestige_10', name: 'Immortal', icon: '🔱' },
      { id: 'collector', name: 'Collector', icon: '🗃️' },
      { id: 'arsenal', name: 'Arsenal', icon: '🎒' },
      { id: 'ship_collector', name: 'Ship Collector', icon: '🚀' },
      { id: 'wealthy', name: 'Wealthy', icon: '💵' },
      { id: 'upgrader', name: 'Upgrader', icon: '⬆️' }
    ];

    return achievements.map(a => {
      const unlocked = unlockedIds.includes(a.id);
      return `
        <div class="achievement-item ${unlocked ? 'unlocked' : 'locked'}" title="${a.name}">
          <span class="achievement-icon">${a.icon}</span>
          <span class="achievement-name">${a.name}</span>
        </div>
      `;
    }).join('');
  },

  // Render unlocked ships
  renderUnlockedShips(profile) {
    const ships = [
      { id: 'vanguard', name: 'Vanguard Mk.I', icon: '🚀' },
      { id: 'phantom', name: 'Phantom-X', icon: '👻' },
      { id: 'bulwark', name: 'Bulwark-7', icon: '🛡️' },
      { id: 'emberwing', name: 'Emberwing', icon: '🔥' },
      { id: 'spectre', name: 'Spectre-9', icon: '💜' },
      { id: 'titan', name: 'Titan Heavy', icon: '⚔️' }
    ];

    const unlockedShips = profile.unlockedShips || ['vanguard'];

    return ships.map(s => {
      const unlocked = unlockedShips.includes(s.id);
      return `
        <div class="ship-item ${unlocked ? 'unlocked' : 'locked'}">
          <span class="ship-icon">${s.icon}</span>
          <span class="ship-name">${s.name}</span>
          ${!unlocked ? '<span class="ship-lock">🔒</span>' : ''}
        </div>
      `;
    }).join('');
  },

  // Show offline profile
  showOfflineProfile() {
    const localProfile = this.getLocalProfile();
    
    const modalHTML = `
      <div id="profileModal" class="social-modal">
        <div class="social-modal-content profile-card">
          <span class="close-modal" onclick="SocialHub.closeModal('profileModal')">&times;</span>
          
          <div class="profile-header">
            <div class="profile-avatar-large" style="background: linear-gradient(135deg, #4ade80, #22c55e); display: flex; align-items: center; justify-content: center; font-size: 48px;">
              👤
            </div>
            <div class="profile-info">
              <h2>${localProfile.username}</h2>
              <div class="profile-title">${localProfile.title}</div>
              <p class="profile-level">Pilot Level ${localProfile.pilotLevel} • ${localProfile.credits} CR</p>
              <p style="color: #f59e0b; font-size: 12px;">⚠️ Offline Mode - Social features unavailable</p>
            </div>
          </div>

          <div class="profile-stats">
            <div class="stat-card">
              <div class="stat-value">${localProfile.bestScore.toLocaleString()}</div>
              <div class="stat-label">Best Score</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${localProfile.highestLevel}</div>
              <div class="stat-label">Highest Level</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${localProfile.gamesPlayed}</div>
              <div class="stat-label">Games Played</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${localProfile.totalKills}</div>
              <div class="stat-label">Total Kills</div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
  },

  // Logout function
  logout() {
    SocialAPI.logout();
    // Also clear local auth
    try {
      const authKey = 'void_rift_auth';
      const authData = JSON.parse(localStorage.getItem(authKey) || '{}');
      authData.currentUser = null;
      localStorage.setItem(authKey, JSON.stringify(authData));
    } catch (err) {
      console.error('Failed to clear local auth:', err);
    }
    
    this.closeModal('profileModal');
    this.updateUI();
    
    // Update login button
    const loginBtn = document.getElementById('loginButton');
    if (loginBtn) {
      loginBtn.textContent = 'Login';
      loginBtn.onclick = () => SocialHub.showAuthModal('login');
    }
  },

  // Show friends list modal
  async showFriendsList() {
    if (!SocialAPI.isLoggedIn()) {
      this.showAuthModal('login');
      return;
    }

    try {
      const friends = await SocialAPI.getFriendsList();
      const requests = await SocialAPI.getFriendRequests();

      const modalHTML = `
        <div id="friendsModal" class="social-modal">
          <div class="social-modal-content">
            <span class="close-modal" onclick="SocialHub.closeModal('friendsModal')">&times;</span>
            <h2>👥 Friends</h2>

            ${requests.received.length > 0 ? `
              <div class="friend-requests">
                <h3>Friend Requests (${requests.received.length})</h3>
                ${requests.received.map(req => `
                  <div class="friend-request-card">
                    <img src="${req.profile.avatar}" alt="${req.username}" class="friend-avatar">
                    <div class="friend-info">
                      <strong>${req.username}</strong>
                      <span class="friend-level">Lvl ${req.profile.level}</span>
                    </div>
                    <div class="friend-actions">
                      <button class="btn-sm btn-primary" onclick="SocialHub.acceptRequest('${req.id}')">✓</button>
                      <button class="btn-sm btn-secondary" onclick="SocialHub.declineRequest('${req.id}')">✗</button>
                    </div>
                  </div>
                `).join('')}
              </div>
            ` : ''}

            <div class="friends-list">
              <h3>Friends (${friends.length})</h3>
              <div class="friend-search">
                <input type="text" id="friendSearchInput" placeholder="🔍 Search players..." onkeyup="SocialHub.searchPlayers(event)">
                <div id="searchResults"></div>
              </div>

              ${friends.length > 0 ? friends.map(friend => `
                <div class="friend-card" onclick="SocialHub.showProfile('${friend.id}')">
                  <img src="${friend.profile.avatar}" alt="${friend.username}" class="friend-avatar">
                  <div class="friend-info">
                    <strong>${friend.username}</strong>
                    <span class="friend-level">Lvl ${friend.profile.level}</span>
                    <div class="friend-badges">
                      ${friend.profile.badges.slice(0, 3).map(b => this.getBadgeEmoji(b)).join('')}
                    </div>
                  </div>
                  <div class="friend-status ${friend.online ? 'online' : 'offline'}">
                    ${friend.online ? '🟢' : '⚫'}
                  </div>
                </div>
              `).join('') : '<p class="no-friends">No friends yet. Search for players above!</p>'}
            </div>
          </div>
        </div>
      `;

      document.body.insertAdjacentHTML('beforeend', modalHTML);
    } catch (error) {
      console.error('Failed to load friends:', error);
      this.showErrorModal('Friends Unavailable', 'Unable to load friends list. The social server may be temporarily unavailable. Please try again later.');
    }
  },

  // Show activity feed
  async showActivityFeed() {
    if (!SocialAPI.isLoggedIn()) {
      this.showAuthModal('login');
      return;
    }

    try {
      const activities = await SocialAPI.getActivityFeed();

      const modalHTML = `
        <div id="activityModal" class="social-modal">
          <div class="social-modal-content">
            <span class="close-modal" onclick="SocialHub.closeModal('activityModal')">&times;</span>
            <h2>📰 Activity Feed</h2>

            <div class="activity-feed">
              ${activities.length > 0 ? activities.map(act => `
                <div class="activity-card">
                  <img src="${act.avatar}" alt="${act.username}" class="activity-avatar">
                  <div class="activity-content">
                    <strong>${act.username}</strong> ${this.getActivityText(act)}
                    <div class="activity-time">${this.formatTime(act.timestamp)}</div>
                  </div>
                </div>
              `).join('') : '<p class="no-activity">No recent activity. Play some games!</p>'}
            </div>
          </div>
        </div>
      `;

      document.body.insertAdjacentHTML('beforeend', modalHTML);
    } catch (error) {
      console.error('Failed to load activity:', error);
      this.showErrorModal('Activity Unavailable', 'Unable to load activity feed. The social server may be temporarily unavailable. Please try again later.');
    }
  },

  // Helper: Get activity text
  getActivityText(activity) {
    switch (activity.type) {
      case 'high_score':
        return `achieved a new high score of <strong>${activity.data.score.toLocaleString()}</strong>! 🎉`;
      case 'achievement':
        return `unlocked "${activity.data.name}" achievement! 🏆`;
      case 'level_up':
        return `leveled up to <strong>Level ${activity.data.level}</strong>! ⬆️`;
      case 'game_complete':
        return `completed a game on ${activity.data.difficulty} difficulty! 🎮`;
      case 'prestige':
        return `reached <strong>Prestige ${activity.data.prestige}</strong>! 🌟`;
      default:
        return 'did something cool!';
    }
  },

  // Search players
  async searchPlayers(event) {
    const query = event.target.value.trim();
    const resultsEl = document.getElementById('searchResults');

    if (query.length < 2) {
      resultsEl.innerHTML = '';
      return;
    }

    try {
      const users = await SocialAPI.searchUsers(query, 10);
      
      resultsEl.innerHTML = users.length > 0 ? `
        <div class="search-results-dropdown">
          ${users.map(user => `
            <div class="search-result-item" onclick="SocialHub.showProfile('${user.id}')">
              <img src="${user.profile.avatar}" alt="${user.username}" class="search-avatar">
              <div>
                <strong>${user.username}</strong>
                <span class="search-level">Lvl ${user.profile.level}</span>
              </div>
            </div>
          `).join('')}
        </div>
      ` : '<div class="search-no-results">No players found</div>';
    } catch (error) {
      console.error('Search failed:', error);
    }
  },

  // Friend actions
  async sendFriendRequest(userId) {
    try {
      await SocialAPI.sendFriendRequest(userId);
      alert('✅ Friend request sent!');
      this.closeModal('profileModal');
    } catch (error) {
      alert('Failed to send friend request: ' + error.message);
    }
  },

  async acceptRequest(friendId) {
    try {
      await SocialAPI.acceptFriendRequest(friendId);
      this.closeModal('friendsModal');
      this.showFriendsList();
    } catch (error) {
      alert('Failed to accept request: ' + error.message);
    }
  },

  async declineRequest(friendId) {
    try {
      await SocialAPI.declineFriendRequest(friendId);
      this.closeModal('friendsModal');
      this.showFriendsList();
    } catch (error) {
      alert('Failed to decline request: ' + error.message);
    }
  },

  async removeFriend(friendId) {
    if (!confirm('Remove this friend?')) return;
    
    try {
      await SocialAPI.removeFriend(friendId);
      alert('✅ Friend removed');
      this.closeModal('profileModal');
    } catch (error) {
      alert('Failed to remove friend: ' + error.message);
    }
  },

  // Show edit profile modal
  showEditProfile() {
    alert('Profile editing coming soon! For now, your profile is automatically updated as you play.');
  },

  // Helpers
  getBadgeEmoji(badge) {
    const badges = {
      rookie: '🌟',
      veteran: '⭐',
      elite: '💫',
      legend: '👑',
      sharpshooter: '🎯',
      survivor: '🛡️',
      speedrunner: '⚡',
      prestige1: '🌟',
      prestige5: '💫',
      prestige10: '🔱'
    };
    return badges[badge] || '🏅';
  },

  formatTime(timestamp) {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  },

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.remove();
  },

  // Show error modal with helpful message
  showErrorModal(title, message) {
    // Remove any existing error modal to avoid duplicates
    const existingModal = document.getElementById('errorModal');
    if (existingModal) {
      existingModal.remove();
    }

    const modalHTML = `
      <div id="errorModal" class="social-modal">
        <div class="social-modal-content">
          <span class="close-modal" onclick="SocialHub.closeModal('errorModal')">&times;</span>
          <h2>⚠️ ${title}</h2>
          <p style="color: #94a3b8; margin: 20px 0; line-height: 1.6;">${message}</p>
          <button class="btn-primary" onclick="SocialHub.closeModal('errorModal')">OK</button>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  },

  // Update UI based on login state
  updateUI() {
    const user = SocialAPI.currentUser;
    const loginBtn = document.getElementById('loginButton');

    if (user && loginBtn) {
      loginBtn.textContent = user.username;
      loginBtn.onclick = () => SocialHub.showProfile();
    } else if (loginBtn) {
      loginBtn.textContent = 'Login';
      loginBtn.onclick = () => SocialHub.showAuthModal('login');
    }
  }
};

// Make available globally
if (typeof window !== 'undefined') {
  window.SocialHub = SocialHub;
}
