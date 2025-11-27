/**
 * Social Hub UI Components
 * Renders profile cards, friends list, activity feed, player search
 */

const SocialHub = {
  // Show login/register modal
  showAuthModal(mode = 'login') {
    const modalHTML = `
      <div id="authModal" class="social-modal">
        <div class="social-modal-content">
          <span class="close-modal" onclick="SocialHub.closeModal('authModal')">&times;</span>
          <h2>${mode === 'login' ? '🎮 Login' : '✨ Create Account'}</h2>
          
          <div id="authTabs" class="auth-tabs">
            <button class="auth-tab ${mode === 'login' ? 'active' : ''}" onclick="SocialHub.switchAuthTab('login')">Login</button>
            <button class="auth-tab ${mode === 'register' ? 'active' : ''}" onclick="SocialHub.switchAuthTab('register')">Register</button>
          </div>

          <form id="authForm" onsubmit="SocialHub.handleAuth(event, '${mode}')">
            <input type="text" id="authUsername" placeholder="Username" required minlength="3">
            <input type="password" id="authPassword" placeholder="Password" required minlength="6">
            ${mode === 'register' ? '<input type="email" id="authEmail" placeholder="Email (optional)">' : ''}
            
            <button type="submit" class="btn-primary">${mode === 'login' ? 'Login' : 'Create Account'}</button>
          </form>

          <div id="authError" class="error-message"></div>
          <div id="authSuccess" class="success-message"></div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
  },

  switchAuthTab(mode) {
    document.querySelectorAll('.auth-tab').forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');
    
    const emailInput = document.getElementById('authEmail');
    const submitBtn = document.querySelector('#authForm button[type="submit"]');
    
    if (mode === 'register') {
      if (!emailInput) {
        document.querySelector('#authPassword').insertAdjacentHTML('afterend', 
          '<input type="email" id="authEmail" placeholder="Email (optional)">');
      }
      submitBtn.textContent = 'Create Account';
      document.querySelector('#authForm').setAttribute('onsubmit', "SocialHub.handleAuth(event, 'register')");
    } else {
      if (emailInput) emailInput.remove();
      submitBtn.textContent = 'Login';
      document.querySelector('#authForm').setAttribute('onsubmit', "SocialHub.handleAuth(event, 'login')");
    }
  },

  async handleAuth(event, mode) {
    event.preventDefault();
    
    const username = document.getElementById('authUsername').value;
    const password = document.getElementById('authPassword').value;
    const email = document.getElementById('authEmail')?.value || null;

    const errorEl = document.getElementById('authError');
    const successEl = document.getElementById('authSuccess');
    
    errorEl.textContent = '';
    successEl.textContent = '';

    try {
      let result;
      if (mode === 'register') {
        result = await SocialAPI.register(username, password, email);
        successEl.textContent = '✅ Account created! Welcome to Void Rift!';
      } else {
        result = await SocialAPI.login(username, password);
        successEl.textContent = '✅ Welcome back!';
      }

      setTimeout(() => {
        this.closeModal('authModal');
        this.updateUI();
      }, 1500);
    } catch (error) {
      errorEl.textContent = error.message || 'Authentication failed';
    }
  },

  // Show player profile modal
  async showProfile(userId = null, username = null) {
    try {
      const user = await SocialAPI.getProfile(userId, username);
      const isOwnProfile = SocialAPI.currentUser && user.id === SocialAPI.currentUser.id;
      const isFriend = SocialAPI.currentUser && SocialAPI.currentUser.friends?.includes(user.id);

      const modalHTML = `
        <div id="profileModal" class="social-modal">
          <div class="social-modal-content profile-card">
            <span class="close-modal" onclick="SocialHub.closeModal('profileModal')">&times;</span>
            
            <div class="profile-header">
              <img src="${user.profile.avatar}" alt="${user.username}" class="profile-avatar-large">
              <div class="profile-info">
                <h2>${user.username} ${user.settings?.privacy === 'private' ? '🔒' : ''}</h2>
                <div class="profile-badges">
                  ${user.profile.badges.map(b => `<span class="badge">${this.getBadgeEmoji(b)}</span>`).join('')}
                </div>
                <p class="profile-level">Level ${user.profile.level} • ${user.profile.xp} XP</p>
                ${user.profile.bio ? `<p class="profile-bio">${user.profile.bio}</p>` : ''}
              </div>
            </div>

            <div class="profile-stats">
              <div class="stat-card">
                <div class="stat-value">${user.profile.highScore.toLocaleString()}</div>
                <div class="stat-label">High Score</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${user.profile.gamesPlayed}</div>
                <div class="stat-label">Games Played</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${user.stats.kills}</div>
                <div class="stat-label">Kills</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${user.stats.accuracy}%</div>
                <div class="stat-label">Accuracy</div>
              </div>
            </div>

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
              </div>
            ` : ''}
          </div>
        </div>
      `;

      document.body.insertAdjacentHTML('beforeend', modalHTML);
    } catch (error) {
      console.error('Failed to load profile:', error);
      alert('Failed to load profile');
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
      alert('Failed to load friends list');
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
      alert('Failed to load activity feed');
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

  // Helpers
  getBadgeEmoji(badge) {
    const badges = {
      rookie: '🌟',
      veteran: '⭐',
      elite: '💫',
      legend: '👑',
      sharpshooter: '🎯',
      survivor: '🛡️',
      speedrunner: '⚡'
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

  // Update UI based on login state
  updateUI() {
    const user = SocialAPI.currentUser;
    const loginBtn = document.querySelector('.login-btn');
    const profileBtn = document.querySelector('.profile-btn');

    if (user && loginBtn) {
      loginBtn.outerHTML = `
        <button class="profile-btn" onclick="SocialHub.showProfile()">
          <img src="${user.profile.avatar}" alt="${user.username}" class="nav-avatar">
          ${user.username}
        </button>
      `;
    }
  }
};

// Make available globally
if (typeof window !== 'undefined') {
  window.SocialHub = SocialHub;
}
