/**
 * Validation utilities for user input and data
 */

/**
 * Validate username
 * @param {string} username - Username to validate
 * @returns {{valid: boolean, error?: string}} Validation result
 */
export const validateUsername = (username) => {
  if (!username || typeof username !== 'string') {
    return { valid: false, error: 'Username is required' };
  }
  
  const trimmed = username.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: 'Username cannot be empty' };
  }
  
  if (trimmed.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters' };
  }
  
  if (trimmed.length > 20) {
    return { valid: false, error: 'Username must be at most 20 characters' };
  }
  
  // Allow alphanumeric, underscore, and dash
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return { valid: false, error: 'Username can only contain letters, numbers, underscore, and dash' };
  }
  
  return { valid: true };
};

/**
 * Validate password
 * @param {string} password - Password to validate
 * @returns {{valid: boolean, error?: string}} Validation result
 */
export const validatePassword = (password) => {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Password is required' };
  }
  
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' };
  }
  
  if (password.length > 100) {
    return { valid: false, error: 'Password is too long' };
  }
  
  return { valid: true };
};

/**
 * Validate score value
 * @param {number} score - Score to validate
 * @returns {boolean} True if valid
 */
export const validateScore = (score) => {
  return typeof score === 'number' && 
         !isNaN(score) && 
         isFinite(score) && 
         score >= 0 && 
         score <= Number.MAX_SAFE_INTEGER;
};

/**
 * Validate level value
 * @param {number} level - Level to validate
 * @returns {boolean} True if valid
 */
export const validateLevel = (level) => {
  return typeof level === 'number' && 
         Number.isInteger(level) && 
         level >= 1 && 
         level <= 10000;
};

/**
 * Sanitize object by removing invalid properties
 * @param {Object} obj - Object to sanitize
 * @param {Object} schema - Schema defining valid properties and types
 * @returns {Object} Sanitized object
 */
export const sanitizeObject = (obj, schema) => {
  if (!obj || typeof obj !== 'object') {
    return {};
  }
  
  const sanitized = {};
  
  for (const [key, validator] of Object.entries(schema)) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      if (validator(value)) {
        sanitized[key] = value;
      }
    }
  }
  
  return sanitized;
};

/**
 * Escape HTML special characters to prevent XSS
 * @param {string} str - String to escape
 * @returns {string} HTML-safe string
 */
export const escapeHtml = (str) => {
  if (typeof str !== 'string') {
    return '';
  }
  
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
};

/**
 * Sanitize HTML string by escaping and allowing only newlines as <br>
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized HTML string
 */
export const sanitizeHtml = (str) => {
  if (!str || typeof str !== 'string') {
    return '';
  }
  
  // First escape all HTML
  const escaped = escapeHtml(str);
  // Then allow newlines as <br>
  return escaped.replace(/\n/g, '<br>');
};

