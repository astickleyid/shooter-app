/**
 * Unified Authentication System
 * Single source of truth for user authentication and session management
 * Integrates with backend API (Vercel) for persistent global data
 * Falls back to local storage for offline functionality
 */

const AUTH_CONFIG = {
  API_BASE: 'https://shooter-app-one.vercel.app/api',
  STORAGE_KEY: 'voidrift_session',
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
  TIMEOUT_MS: 5000
};

/**
 * Unified Auth System
 * Provides single authentication interface for all game features
 */
const AuthSystem = {
  // Current session state
  session: null,
  
  // Callbacks for auth state changes
  onAuthChangeCallbacks: [],
  
  /**
   * Initialize the auth system
   * Loads any existing session from storage
   */
  initialize() {
    this.loadSession();
    return this.session;
  },
  
  /**
   * Check if user is currently authenticated
   */
  isAuthenticated() {
    if (!this.session) return false;
    if (this.session.expiresAt && this.session.expiresAt < Date.now()) {
      this.logout();
      return false;
    }
    return true;
  },
  
  /**
   * Get current user data
   */
  getCurrentUser() {
    return this.isAuthenticated() ? this.session.user : null;
  },
  
  /**
   * Get session token for API requests
   */
  getToken() {
    return this.isAuthenticated() ? this.session.token : null;
  },
  
  /**
   * Register a new user
   * @param {string} username - Username (3-20 characters)
   * @param {string} password - Password (4+ characters)
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async register(username, password) {
    try {
      // Validate input
      if (!username || username.trim().length < 3) {
        return { success: false, error: 'Username must be at least 3 characters' };
      }
      if (!password || password.length < 4) {
        return { success: false, error: 'Password must be at least 4 characters' };
      }
      
      const cleanUsername = username.trim();
      
      // Try backend registration first
      try {
        const response = await this._apiRequest('/users?action=register', {
          method: 'POST',
          body: JSON.stringify({ username: cleanUsername, password })
        });
        
        if (response.success) {
          // Create session from backend response
          this.session = {
            user: {
              id: response.user.id,
              username: response.user.username,
              profile: response.user.profile
            },
            token: response.sessionToken,
            createdAt: Date.now(),
            expiresAt: Date.now() + AUTH_CONFIG.SESSION_TIMEOUT,
            source: 'backend'
          };
          
          this.saveSession();
          this.notifyAuthChange();
          
          return { success: true };
        }
        
        return { success: false, error: response.error || 'Registration failed' };
      } catch (apiError) {
        // Backend unavailable - fall back to local registration
        console.warn('Backend registration failed, using local mode:', apiError.message);
        return this._registerLocal(cleanUsername, password);
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: error.message || 'Registration failed' };
    }
  },
  
  /**
   * Login with username and password
   * @param {string} username
   * @param {string} password
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async login(username, password) {
    try {
      if (!username || !password) {
        return { success: false, error: 'Username and password are required' };
      }
      
      const cleanUsername = username.trim();
      
      // Try backend login first
      try {
        const response = await this._apiRequest('/users?action=login', {
          method: 'POST',
          body: JSON.stringify({ username: cleanUsername, password })
        });
        
        if (response.success) {
          // Create session from backend response
          this.session = {
            user: {
              id: response.user.id,
              username: response.user.username,
              email: response.user.email,
              profile: response.user.profile,
              stats: response.user.stats,
              friends: response.user.friends
            },
            token: response.sessionToken,
            createdAt: Date.now(),
            expiresAt: Date.now() + AUTH_CONFIG.SESSION_TIMEOUT,
            source: 'backend'
          };
          
          this.saveSession();
          this.notifyAuthChange();
          
          return { success: true };
        }
        
        return { success: false, error: response.error || 'Invalid credentials' };
      } catch (apiError) {
        // Backend unavailable - try local login
        console.warn('Backend login failed, trying local mode:', apiError.message);
        return this._loginLocal(cleanUsername, password);
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message || 'Login failed' };
    }
  },
  
  /**
   * Logout current user
   */
  logout() {
    this.session = null;
    this.clearSession();
    this.notifyAuthChange();
  },
  
  /**
   * Update user profile
   * @param {Object} updates - Profile fields to update
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async updateProfile(updates) {
    if (!this.isAuthenticated()) {
      return { success: false, error: 'Not authenticated' };
    }
    
    try {
      // Update backend if online
      if (this.session.source === 'backend') {
        const response = await this._apiRequest('/users?action=update', {
          method: 'PUT',
          body: JSON.stringify({
            userId: this.session.user.id,
            updates: { profile: updates }
          })
        });
        
        if (response.success) {
          this.session.user.profile = { ...this.session.user.profile, ...updates };
          this.saveSession();
          this.notifyAuthChange();
          return { success: true };
        }
        
        return { success: false, error: response.error };
      }
      
      // Update local profile
      this.session.user.profile = { ...this.session.user.profile, ...updates };
      this.saveSession();
      this.notifyAuthChange();
      return { success: true };
    } catch (error) {
      console.error('Profile update error:', error);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Update game statistics
   * @param {Object} gameData - Game statistics (score, level, kills, deaths, etc.)
   * @returns {Promise<{success: boolean, xpGain?: number, levelUp?: boolean}>}
   */
  async updateStats(gameData) {
    if (!this.isAuthenticated()) {
      return { success: false, error: 'Not authenticated' };
    }
    
    try {
      // Update backend if online
      if (this.session.source === 'backend') {
        const response = await this._apiRequest('/users?action=stats', {
          method: 'POST',
          body: JSON.stringify({
            userId: this.session.user.id,
            ...gameData
          })
        });
        
        if (response.success) {
          const oldLevel = this.session.user.profile?.level || 1;
          this.session.user.profile = response.profile;
          this.session.user.stats = response.stats;
          this.saveSession();
          this.notifyAuthChange();
          
          return {
            success: true,
            xpGain: response.xpGain || 0,
            levelUp: response.profile.level > oldLevel
          };
        }
        
        return { success: false, error: response.error };
      }
      
      // Update local stats
      if (!this.session.user.profile) this.session.user.profile = {};
      if (!this.session.user.stats) this.session.user.stats = {};
      
      const profile = this.session.user.profile;
      const stats = this.session.user.stats;
      
      // Update profile stats
      profile.gamesPlayed = (profile.gamesPlayed || 0) + 1;
      profile.totalScore = (profile.totalScore || 0) + (gameData.score || 0);
      profile.highScore = Math.max(profile.highScore || 0, gameData.score || 0);
      
      // Update detailed stats
      stats.kills = (stats.kills || 0) + (gameData.kills || 0);
      stats.deaths = (stats.deaths || 0) + (gameData.deaths || 0);
      stats.playTime = (stats.playTime || 0) + (gameData.duration || 0);
      
      // Calculate XP gain
      const xpGain = Math.floor((gameData.score || 0) / 10);
      profile.xp = (profile.xp || 0) + xpGain;
      const oldLevel = profile.level || 1;
      profile.level = Math.floor(profile.xp / 100) + 1;
      
      this.saveSession();
      this.notifyAuthChange();
      
      return {
        success: true,
        xpGain,
        levelUp: profile.level > oldLevel
      };
    } catch (error) {
      console.error('Stats update error:', error);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Register callback for auth state changes
   * @param {Function} callback - Function to call when auth state changes
   */
  onAuthChange(callback) {
    if (typeof callback === 'function') {
      this.onAuthChangeCallbacks.push(callback);
    }
  },
  
  /**
   * Notify all registered callbacks of auth state change
   */
  notifyAuthChange() {
    this.onAuthChangeCallbacks.forEach(callback => {
      try {
        callback(this.session);
      } catch (error) {
        console.error('Auth change callback error:', error);
      }
    });
  },
  
  /**
   * Save session to localStorage
   */
  saveSession() {
    try {
      if (this.session) {
        localStorage.setItem(AUTH_CONFIG.STORAGE_KEY, JSON.stringify(this.session));
      }
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  },
  
  /**
   * Load session from localStorage
   */
  loadSession() {
    try {
      const stored = localStorage.getItem(AUTH_CONFIG.STORAGE_KEY);
      if (stored) {
        this.session = JSON.parse(stored);
        
        // Validate session hasn't expired
        if (this.session.expiresAt && this.session.expiresAt < Date.now()) {
          this.session = null;
          this.clearSession();
        }
      }
    } catch (error) {
      console.error('Failed to load session:', error);
      this.session = null;
    }
  },
  
  /**
   * Clear session from localStorage
   */
  clearSession() {
    try {
      localStorage.removeItem(AUTH_CONFIG.STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear session:', error);
    }
  },
  
  /**
   * Make authenticated API request
   * @private
   */
  async _apiRequest(endpoint, options = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), AUTH_CONFIG.TIMEOUT_MS);
    
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers
      };
      
      // Add auth token if available
      if (this.session?.token) {
        headers.Authorization = `Bearer ${this.session.token}`;
      }
      
      const response = await fetch(`${AUTH_CONFIG.API_BASE}${endpoint}`, {
        ...options,
        headers,
        signal: controller.signal
      });
      
      clearTimeout(timeout);
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }
      
      return data;
    } catch (error) {
      clearTimeout(timeout);
      throw error;
    }
  },
  
  /**
   * Local registration fallback
   * @private
   */
  async _registerLocal(username, password) {
    try {
      // Check if user already exists locally
      const existingUsers = this._getLocalUsers();
      const userKey = username.toLowerCase();
      
      if (existingUsers[userKey]) {
        return { success: false, error: 'Username already exists' };
      }
      
      // Hash password
      const passwordHash = await this._hashPassword(password);
      
      // Create local user
      const userId = `local_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      existingUsers[userKey] = {
        id: userId,
        username,
        passwordHash,
        createdAt: Date.now()
      };
      
      this._saveLocalUsers(existingUsers);
      
      // Create session
      this.session = {
        user: {
          id: userId,
          username,
          profile: {
            level: 1,
            xp: 0,
            gamesPlayed: 0,
            totalScore: 0,
            highScore: 0,
            achievements: []
          },
          stats: {
            kills: 0,
            deaths: 0,
            playTime: 0
          }
        },
        token: null,
        createdAt: Date.now(),
        expiresAt: Date.now() + AUTH_CONFIG.SESSION_TIMEOUT,
        source: 'local'
      };
      
      this.saveSession();
      this.notifyAuthChange();
      
      return { success: true };
    } catch (error) {
      console.error('Local registration error:', error);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Local login fallback
   * @private
   */
  async _loginLocal(username, password) {
    try {
      const existingUsers = this._getLocalUsers();
      const userKey = username.toLowerCase();
      const user = existingUsers[userKey];
      
      if (!user) {
        return { success: false, error: 'Invalid credentials' };
      }
      
      // Verify password
      const passwordHash = await this._hashPassword(password);
      if (user.passwordHash !== passwordHash) {
        return { success: false, error: 'Invalid credentials' };
      }
      
      // Create session
      this.session = {
        user: {
          id: user.id,
          username: user.username,
          profile: user.profile || {
            level: 1,
            xp: 0,
            gamesPlayed: 0,
            totalScore: 0,
            highScore: 0,
            achievements: []
          },
          stats: user.stats || {
            kills: 0,
            deaths: 0,
            playTime: 0
          }
        },
        token: null,
        createdAt: Date.now(),
        expiresAt: Date.now() + AUTH_CONFIG.SESSION_TIMEOUT,
        source: 'local'
      };
      
      this.saveSession();
      this.notifyAuthChange();
      
      return { success: true };
    } catch (error) {
      console.error('Local login error:', error);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Get local users from storage
   * @private
   */
  _getLocalUsers() {
    try {
      const stored = localStorage.getItem('voidrift_local_users');
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      return {};
    }
  },
  
  /**
   * Save local users to storage
   * @private
   */
  _saveLocalUsers(users) {
    try {
      localStorage.setItem('voidrift_local_users', JSON.stringify(users));
    } catch (error) {
      console.error('Failed to save local users:', error);
    }
  },
  
  /**
   * Hash password using Web Crypto API
   * @private
   */
  async _hashPassword(password) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      // Fallback for environments without Web Crypto API
      console.warn('Web Crypto API not available, using simple hash');
      let hash = 0;
      for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      return hash.toString(16);
    }
  }
};

// Auto-initialize on load
if (typeof window !== 'undefined') {
  window.AuthSystem = AuthSystem;
  AuthSystem.initialize();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AuthSystem, AUTH_CONFIG };
}
