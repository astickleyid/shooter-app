/**
 * Authentication System - Handles user authentication
 */

import { AUTH_KEY } from '../core/config.js';
import { hashPassword } from '../utils/crypto.js';
import { validateUsername, validatePassword } from '../utils/validation.js';

/**
 * AuthSystem class for managing user authentication
 */
export class AuthSystem {
  constructor() {
    this.users = {};
    this.currentUser = null;
  }

  /**
   * Load auth data from localStorage
   */
  load() {
    try {
      const raw = localStorage.getItem(AUTH_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        this.users = parsed.users || {};
        this.currentUser = parsed.currentUser || null;
      }
    } catch (err) {
      console.warn('Failed to load auth data:', err);
      this.users = {};
      this.currentUser = null;
    }
  }

  /**
   * Save auth data to localStorage
   */
  save() {
    try {
      localStorage.setItem(AUTH_KEY, JSON.stringify({
        users: this.users,
        currentUser: this.currentUser
      }));
    } catch (err) {
      console.error('Failed to save auth data:', err);
    }
  }

  /**
   * Register a new user
   * @param {string} username - Username
   * @param {string} password - Password
   * @returns {Promise<{success: boolean, error?: string}>} Result
   */
  async register(username, password) {
    // Validate username
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid) {
      return { success: false, error: usernameValidation.error };
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return { success: false, error: passwordValidation.error };
    }

    const cleanUsername = username.trim().toLowerCase();

    // Check if username already exists
    if (this.users[cleanUsername]) {
      return { success: false, error: 'Username already exists' };
    }

    try {
      // Hash the password before storing
      const hashedPassword = await hashPassword(password);

      this.users[cleanUsername] = {
        username: username.trim(),
        passwordHash: hashedPassword,
        createdAt: Date.now()
      };

      this.currentUser = cleanUsername;
      this.save();

      return { success: true };
    } catch (err) {
      console.error('Registration error:', err);
      return { success: false, error: 'Failed to register user' };
    }
  }

  /**
   * Login a user
   * @param {string} username - Username
   * @param {string} password - Password
   * @returns {Promise<{success: boolean, error?: string}>} Result
   */
  async login(username, password) {
    // Validate inputs
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid) {
      return { success: false, error: 'Invalid username or password' };
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return { success: false, error: 'Invalid username or password' };
    }

    const cleanUsername = username.trim().toLowerCase();
    const user = this.users[cleanUsername];

    if (!user) {
      return { success: false, error: 'Invalid username or password' };
    }

    try {
      // Support legacy plaintext passwords and migrate them
      if (user.password && !user.passwordHash) {
        if (user.password === password) {
          // Migrate to hashed password
          user.passwordHash = await hashPassword(password);
          delete user.password;
          this.save();
          this.currentUser = cleanUsername;
          return { success: true };
        }
        return { success: false, error: 'Invalid username or password' };
      }

      // Verify hashed password
      const hashedPassword = await hashPassword(password);
      if (user.passwordHash !== hashedPassword) {
        return { success: false, error: 'Invalid username or password' };
      }

      this.currentUser = cleanUsername;
      this.save();

      return { success: true };
    } catch (err) {
      console.error('Login error:', err);
      return { success: false, error: 'Login failed' };
    }
  }

  /**
   * Logout current user
   */
  logout() {
    this.currentUser = null;
    this.save();
  }

  /**
   * Check if user is logged in
   * @returns {boolean} True if logged in
   */
  isLoggedIn() {
    return this.currentUser !== null;
  }

  /**
   * Get current username
   * @returns {string|null} Username or null
   */
  getCurrentUsername() {
    if (!this.currentUser) return null;
    const user = this.users[this.currentUser];
    return user ? user.username : null;
  }
}
