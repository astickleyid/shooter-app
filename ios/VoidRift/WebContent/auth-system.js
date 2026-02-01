/**
 * Unified Authentication System - Production Ready
 * Single source of truth for user authentication and session management
 * Requires backend API (Vercel) connectivity for all operations
 * No offline fallback - production mode only
 */

const AUTH_CONFIG = {
  API_BASE: 'https://shooter-app-one.vercel.app/api',
  STORAGE_KEY: 'voidrift_session',
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
  TIMEOUT_MS: 10000, // Increased to 10s for reliability
  RETRY_ATTEMPTS: 3, // Retry failed requests
  RETRY_DELAY: 1000 // 1 second between retries
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
   * Register a new user - REQUIRES BACKEND
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
      
      // Backend registration - REQUIRED for production
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
    } catch (error) {
      console.error('Registration error:', error);
      // Return network error for user feedback
      if (error.message.includes('fetch') || error.message.includes('network')) {
        return { success: false, error: 'Unable to connect to server. Please check your internet connection.' };
      }
      return { success: false, error: error.message || 'Registration failed. Please try again.' };
    }
  },
  
  /**
   * Login with username and password - REQUIRES BACKEND
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
      
      // Backend login - REQUIRED for production
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
    } catch (error) {
      console.error('Login error:', error);
      // Return network error for user feedback
      if (error.message.includes('fetch') || error.message.includes('network')) {
        return { success: false, error: 'Unable to connect to server. Please check your internet connection.' };
      }
      return { success: false, error: error.message || 'Login failed. Please try again.' };
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
   * Update game statistics - REQUIRES BACKEND
   * @param {Object} gameData - Game statistics (score, level, kills, deaths, etc.)
   * @returns {Promise<{success: boolean, xpGain?: number, levelUp?: boolean}>}
   */
  async updateStats(gameData) {
    if (!this.isAuthenticated()) {
      return { success: false, error: 'Not authenticated' };
    }
    
    try {
      // Backend stats update - REQUIRED for production
      if (this.session.source !== 'backend' || !this.session.token) {
        return { success: false, error: 'Backend session required for stats update' };
      }
      
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
    } catch (error) {
      console.error('Stats update error:', error);
      if (error.message.includes('fetch') || error.message.includes('network')) {
        return { success: false, error: 'Unable to save stats. Please check your internet connection.' };
      }
      return { success: false, error: error.message };
    }
  },
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
   * Make authenticated API request with retry logic for production
   * @private
   */
  async _apiRequest(endpoint, options = {}) {
    let lastError = null;
    
    // Retry logic for production reliability
    for (let attempt = 0; attempt < AUTH_CONFIG.RETRY_ATTEMPTS; attempt++) {
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
        lastError = error;
        
        // Log retry attempt
        if (attempt < AUTH_CONFIG.RETRY_ATTEMPTS - 1) {
          console.warn(`API request attempt ${attempt + 1} failed, retrying...`, error.message);
          await new Promise(resolve => setTimeout(resolve, AUTH_CONFIG.RETRY_DELAY * (attempt + 1)));
        }
      }
    }
    
    // All retries failed
    console.error('API request failed after all retries:', lastError);
    throw lastError;
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
