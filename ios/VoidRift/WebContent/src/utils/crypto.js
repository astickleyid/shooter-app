/**
 * Cryptographic utilities using Web Crypto API
 */

/**
 * Hash a password using PBKDF2 (better than plain SHA-256)
 * Note: For production, consider using a backend with bcrypt/argon2
 * @param {string} password - The password to hash
 * @param {string} salt - Salt for the hash (username or unique ID)
 * @returns {Promise<string>} Hex string of the hash
 */
export const hashPassword = async (password, salt = 'void_rift_default_salt') => {
  try {
    const encoder = new TextEncoder();
    
    // Import password as key material
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );
    
    // Derive bits using PBKDF2 with 100,000 iterations
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: encoder.encode(salt),
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      256 // 256 bits = 32 bytes
    );
    
    // Convert to hex string
    const hashArray = Array.from(new Uint8Array(derivedBits));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (error) {
    console.error('Error hashing password:', error);
    throw new Error('Failed to hash password');
  }
};

/**
 * Legacy SHA-256 hash for backward compatibility
 * @deprecated Use hashPassword with PBKDF2 instead
 * @param {string} message - The message to hash
 * @returns {Promise<string>} Hex string of the hash
 */
export const sha256 = async (message) => {
  try {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (error) {
    console.error('Error hashing:', error);
    throw new Error('Failed to hash');
  }
};

