/**
 * Social Features API Client
 * Handles all social interactions: profiles, friends, activity
 */

const SOCIAL_CONFIG = {
  // Auto-detect API URL based on environment
  API_BASE: (function() {
    const PROD = 'https://shooter-app-one.vercel.app/api';
    if (typeof window === 'undefined') return PROD;
    const host = window.location.hostname || '';
    const protocol = window.location.protocol || '';
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '' ||
      protocol === 'file:' ||
      protocol === 'capacitor:' ||
      protocol === 'ionic:' ||
      protocol.indexOf('capacitor') === 0
    ) {
      return PROD;
    }
    try {
      return new URL('/api', window.location.origin).href.replace(/\/$/, '');
    } catch (_) {
      return PROD;
    }
  })(),
  TIMEOUT_MS: 5000
};

const SocialAPI = {
  // AuthSystem (voidrift_session) is the single source of truth for
  // username/password sessions; this only holds state directly when the
  // Firebase path is active, which AuthSystem doesn't cover.
  currentUser: null,

  // Helper: Check if Firebase is ready
  _isFirebaseReady() {
    return typeof FirebaseBackend !== 'undefined' && FirebaseBackend.initialized;
  },

  // Mirror AuthSystem's session into currentUser so every SocialAPI call
  // (friends/activity/profile) sees the same logged-in user as the rest of
  // the game, regardless of which login form was used.
  _syncFromAuthSystem() {
    if (typeof AuthSystem === 'undefined') return;
    const user = AuthSystem.getCurrentUser();
    this.currentUser = user ? { ...user, sessionToken: AuthSystem.getToken() } : null;
  },

  // Helper: Make API request
  async request(endpoint, options = {}) {
    try {
      const authHeaders = this.currentUser?.sessionToken
        ? { Authorization: `Bearer ${this.currentUser.sessionToken}` }
        : {};

      // Setup abort signal: use provided signal or create timeout-based one
      let signal = options.signal;
      let timeout = null;
      
      if (!signal) {
        const controller = new AbortController();
        timeout = setTimeout(() => controller.abort(), SOCIAL_CONFIG.TIMEOUT_MS);
        signal = controller.signal;
      }

      const response = await fetch(`${SOCIAL_CONFIG.API_BASE}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
          ...options.headers
        },
        signal
      });

      if (timeout) clearTimeout(timeout);

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  // USER AUTHENTICATION
  // Delegates to AuthSystem (the game's single username/password auth source)
  // instead of maintaining an independent 'social_user' session — two parallel
  // login systems meant a user logged in via one modal could look logged-out
  // to the other.
  async register(username, password, email = null) {
    if (this._isFirebaseReady()) {
      const data = await FirebaseBackend.register(username, password, email);
      if (data.success) {
        this.currentUser = { ...data.user, sessionToken: null };
      }
      return data;
    }

    if (typeof AuthSystem === 'undefined') {
      throw new Error('Auth system unavailable');
    }
    const result = await AuthSystem.register(username, password);
    if (!result.success) {
      throw new Error(result.error || 'Registration failed');
    }
    this._syncFromAuthSystem();
    return { success: true, user: this.currentUser, sessionToken: this.currentUser?.sessionToken || null };
  },

  async login(username, password) {
    if (this._isFirebaseReady()) {
      const data = await FirebaseBackend.login(username, password);
      if (data.success) {
        this.currentUser = { ...data.user, sessionToken: null };
      }
      return data;
    }

    if (typeof AuthSystem === 'undefined') {
      throw new Error('Auth system unavailable');
    }
    const result = await AuthSystem.login(username, password);
    if (!result.success) {
      throw new Error(result.error || 'Invalid credentials');
    }
    this._syncFromAuthSystem();
    return { success: true, user: this.currentUser, sessionToken: this.currentUser?.sessionToken || null };
  },

  async logout() {
    if (this._isFirebaseReady()) {
      await FirebaseBackend.logout();
    }
    if (typeof AuthSystem !== 'undefined') {
      AuthSystem.logout();
    }
    this.currentUser = null;
  },

  loadSession() {
    if (this._isFirebaseReady()) {
      const firebaseUser = FirebaseBackend.getCurrentUser();
      if (firebaseUser) {
        this.currentUser = {
          id: firebaseUser.uid,
          username: firebaseUser.displayName || firebaseUser.email.split('@')[0],
          email: firebaseUser.email,
          sessionToken: null
        };
        return this.currentUser;
      }
    }

    this._syncFromAuthSystem();
    return this.currentUser;
  },

  isLoggedIn() {
    if (this._isFirebaseReady()) {
      return !!FirebaseBackend.getCurrentUser();
    }
    if (typeof AuthSystem !== 'undefined') {
      return AuthSystem.isAuthenticated();
    }
    return this.currentUser !== null;
  },

  // PROFILES
  async getProfile(userId = null, username = null) {
    const params = new URLSearchParams({ action: 'profile' });
    if (userId) params.set('userId', userId);
    if (username) params.set('username', username);
    
    const data = await this.request(`/users?${params}`);
    return data.user;
  },

  async updateProfile(updates) {
    if (!this.currentUser) throw new Error('Not logged in');
    
    const data = await this.request('/users?action=update', {
      method: 'PUT',
      body: JSON.stringify({
        userId: this.currentUser.id,
        updates
      })
    });

    if (data.success) {
      if (this._isFirebaseReady()) {
        this.currentUser.profile = data.user;
      } else if (typeof AuthSystem !== 'undefined' && AuthSystem.isAuthenticated()) {
        AuthSystem.session.user.profile = data.user;
        AuthSystem.saveSession();
        this._syncFromAuthSystem();
      }
    }

    return data;
  },

  async updateStats(gameData) {
    if (!this.currentUser) return null;
    
    const data = await this.request('/users?action=stats', {
      method: 'POST',
      body: JSON.stringify({
        userId: this.currentUser.id,
        ...gameData
      })
    });

    if (data.success) {
      if (this._isFirebaseReady()) {
        this.currentUser.profile = data.profile;
        this.currentUser.stats = data.stats;
      } else if (typeof AuthSystem !== 'undefined' && AuthSystem.isAuthenticated()) {
        AuthSystem.session.user.profile = data.profile;
        AuthSystem.session.user.stats = data.stats;
        AuthSystem.saveSession();
        this._syncFromAuthSystem();
      }
    }

    return data;
  },

  async searchUsers(query, limit = 20, signal = null) {
    const params = new URLSearchParams({ action: 'search', query, limit });
    const options = signal ? { signal } : {};
    const data = await this.request(`/users?${params}`, options);
    return data.users;
  },

  // FRIENDS
  async sendFriendRequest(toUserId, toUsername = null) {
    if (!this.currentUser) throw new Error('Not logged in');

    if (this._isFirebaseReady() && toUsername) {
      const firebaseUser = FirebaseBackend.getCurrentUser();
      const fromUserId = firebaseUser ? firebaseUser.uid : this.currentUser.id;
      return await FirebaseBackend.sendFriendRequestByUsername(fromUserId, toUsername);
    }

    return await this.request('/friends?action=request', {
      method: 'POST',
      body: JSON.stringify({
        fromUserId: this.currentUser.id,
        toUserId
      })
    });
  },

  async acceptFriendRequest(friendId) {
    if (!this.currentUser) throw new Error('Not logged in');
    
    return await this.request('/friends?action=accept', {
      method: 'POST',
      body: JSON.stringify({
        userId: this.currentUser.id,
        friendId
      })
    });
  },

  async declineFriendRequest(friendId) {
    if (!this.currentUser) throw new Error('Not logged in');
    
    return await this.request('/friends?action=decline', {
      method: 'POST',
      body: JSON.stringify({
        userId: this.currentUser.id,
        friendId
      })
    });
  },

  async removeFriend(friendId) {
    if (!this.currentUser) throw new Error('Not logged in');
    
    return await this.request('/friends?action=remove', {
      method: 'DELETE',
      body: JSON.stringify({
        userId: this.currentUser.id,
        friendId
      })
    });
  },

  async getFriendsList() {
    if (!this.currentUser) return [];

    if (this._isFirebaseReady()) {
      const firebaseUser = FirebaseBackend.getCurrentUser();
      const userId = firebaseUser ? firebaseUser.uid : this.currentUser.id;
      const result = await FirebaseBackend.getFriends(userId);
      if (result.success) return result.friends;
    }

    const params = new URLSearchParams({
      action: 'list',
      userId: this.currentUser.id
    });
    const data = await this.request(`/friends?${params}`);
    return data.friends;
  },

  async getFriendRequests() {
    if (!this.currentUser) return { received: [], sent: [] };
    
    const params = new URLSearchParams({ 
      action: 'requests', 
      userId: this.currentUser.id 
    });
    const data = await this.request(`/friends?${params}`);
    return data;
  },

  async getNotifications(limit = 20) {
    if (!this.currentUser) return [];
    
    const params = new URLSearchParams({ 
      action: 'notifications', 
      userId: this.currentUser.id,
      limit
    });
    const data = await this.request(`/friends?${params}`);
    return data.notifications;
  },

  async markNotificationsRead() {
    if (!this.currentUser) return;
    
    return await this.request('/friends?action=mark-read', {
      method: 'POST',
      body: JSON.stringify({ userId: this.currentUser.id })
    });
  },

  // ACTIVITY
  async postActivity(type, data) {
    if (!this.currentUser) return null;
    
    return await this.request('/activity?action=post', {
      method: 'POST',
      body: JSON.stringify({
        userId: this.currentUser.id,
        type,
        data
      })
    });
  },

  async getActivityFeed(limit = 50) {
    if (!this.currentUser) return [];

    if (this._isFirebaseReady()) {
      const firebaseUser = FirebaseBackend.getCurrentUser();
      const userId = firebaseUser ? firebaseUser.uid : this.currentUser.id;
      const result = await FirebaseBackend.getActivityFeed(userId, limit);
      if (result.success) return result.feed;
    }

    const params = new URLSearchParams({
      action: 'feed',
      userId: this.currentUser.id,
      limit
    });
    const data = await this.request(`/activity?${params}`);
    return data.activities;
  },

  async getGlobalActivity(limit = 50) {
    const params = new URLSearchParams({ action: 'global', limit });
    const data = await this.request(`/activity?${params}`);
    return data.activities;
  },

  async getUserActivity(userId, limit = 50) {
    const params = new URLSearchParams({ action: 'user', userId, limit });
    const data = await this.request(`/activity?${params}`);
    return data.activities;
  }
};

// Auto-load session on page load
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    SocialAPI.loadSession();
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SocialAPI, SOCIAL_CONFIG };
}
