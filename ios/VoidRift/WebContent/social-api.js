/**
 * Social Features API Client
 * Handles all social interactions: profiles, friends, activity
 */

const SOCIAL_CONFIG = {
  API_BASE: 'https://shooter-app-one.vercel.app/api',
  TIMEOUT_MS: 5000
};

const SocialAPI = {
  currentUser: null,

  // Helper: Make API request
  async request(endpoint, options = {}) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), SOCIAL_CONFIG.TIMEOUT_MS);

      const authHeaders = this.currentUser?.sessionToken
        ? { Authorization: `Bearer ${this.currentUser.sessionToken}` }
        : {};

      const response = await fetch(`${SOCIAL_CONFIG.API_BASE}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
          ...options.headers
        },
        signal: controller.signal
      });

      clearTimeout(timeout);

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
  async register(username, password, email = null) {
    const data = await this.request('/users?action=register', {
      method: 'POST',
      body: JSON.stringify({ username, password, email })
    });
    
    if (data.success) {
      this.currentUser = { ...data.user, sessionToken: data.sessionToken || null };
      localStorage.setItem('social_user', JSON.stringify(this.currentUser));
    }
    
    return data;
  },

  async login(username, password) {
    const data = await this.request('/users?action=login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    
    if (data.success) {
      this.currentUser = { ...data.user, sessionToken: data.sessionToken || null };
      localStorage.setItem('social_user', JSON.stringify(this.currentUser));
    }
    
    return data;
  },

  logout() {
    this.currentUser = null;
    localStorage.removeItem('social_user');
  },

  loadSession() {
    const stored = localStorage.getItem('social_user');
    if (stored) {
      this.currentUser = JSON.parse(stored);
      return this.currentUser;
    }
    return null;
  },

  isLoggedIn() {
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
      this.currentUser.profile = data.user;
      localStorage.setItem('social_user', JSON.stringify(this.currentUser));
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
      this.currentUser.profile = data.profile;
      this.currentUser.stats = data.stats;
      localStorage.setItem('social_user', JSON.stringify(this.currentUser));
    }
    
    return data;
  },

  async searchUsers(query, limit = 20) {
    const params = new URLSearchParams({ action: 'search', query, limit });
    const data = await this.request(`/users?${params}`);
    return data.users;
  },

  // FRIENDS
  async sendFriendRequest(toUserId) {
    if (!this.currentUser) throw new Error('Not logged in');
    
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
