/**
 * Cryptographic utilities using Web Crypto API
 */

/**
 * Hash a password using SHA-256
 * @param {string} message - The message to hash
 * @returns {Promise<string>} Hex string of the hash
 */
export const hashPassword = async (message) => {
  try {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (error) {
    console.error('Error hashing password:', error);
    throw new Error('Failed to hash password');
  }
};
