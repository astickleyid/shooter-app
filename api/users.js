/**
 * User Profile & Authentication API
 * Handles user registration, profiles, stats
 */

const { kv } = require("@vercel/kv");

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

// Helper: Hash password (simple SHA-256)
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Helper: Generate user ID
function generateUserId() {
  return 'u_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

module.exports = async(req, res) {
  // CORS
  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action } = req.query;

  try {
    // Register new user
    if (action === 'register' && req.method === 'POST') {
      const { username, password, email } = req.body;

      if (!username || !password || username.length < 3) {
        return res.status(400).json({ error: 'Invalid username or password' });
      }

      // Check if username exists
      const existingUser = await kv.get(`user:username:${username.toLowerCase()}`);
      if (existingUser) {
        return res.status(409).json({ error: 'Username already taken' });
      }

      const userId = generateUserId();
      const passwordHash = await hashPassword(password);

      const user = {
        id: userId,
        username,
        email: email || null,
        passwordHash,
        createdAt: Date.now(),
        profile: {
          avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${userId}`,
          bio: '',
          level: 1,
          xp: 0,
          gamesPlayed: 0,
          totalScore: 0,
          highScore: 0,
          achievements: [],
          badges: ['rookie']
        },
        stats: {
          wins: 0,
          losses: 0,
          kills: 0,
          deaths: 0,
          accuracy: 0,
          playTime: 0
        },
        friends: [],
        friendRequests: {
          sent: [],
          received: []
        },
        settings: {
          privacy: 'public',
          showOnlineStatus: true,
          allowFriendRequests: true
        },
        lastActive: Date.now()
      };

      // Save user
      await kv.set(`user:${userId}`, user);
      await kv.set(`user:username:${username.toLowerCase()}`, userId);

      // Add to users list
      await kv.sadd('users:all', userId);

      return res.status(201).json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          profile: user.profile
        }
      });
    }

    // Login
    if (action === 'login' && req.method === 'POST') {
      const { username, password } = req.body;

      const userId = await kv.get(`user:username:${username.toLowerCase()}`);
      if (!userId) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const user = await kv.get(`user:${userId}`);
      const passwordHash = await hashPassword(password);

      if (user.passwordHash !== passwordHash) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Update last active
      user.lastActive = Date.now();
      await kv.set(`user:${userId}`, user);

      return res.status(200).json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          profile: user.profile,
          stats: user.stats,
          friends: user.friends,
          lastActive: user.lastActive
        }
      });
    }

    // Get user profile
    if (action === 'profile' && req.method === 'GET') {
      const { userId, username } = req.query;

      let user;
      if (userId) {
        user = await kv.get(`user:${userId}`);
      } else if (username) {
        const id = await kv.get(`user:username:${username.toLowerCase()}`);
        if (id) user = await kv.get(`user:${id}`);
      }

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Don't send sensitive data
      const { passwordHash, email, ...publicProfile } = user;

      return res.status(200).json({
        success: true,
        user: publicProfile
      });
    }

    // Update profile
    if (action === 'update' && req.method === 'PUT') {
      const { userId, updates } = req.body;

      const user = await kv.get(`user:${userId}`);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Allowed updates
      if (updates.profile) {
        user.profile = { ...user.profile, ...updates.profile };
      }
      if (updates.settings) {
        user.settings = { ...user.settings, ...updates.settings };
      }

      user.lastActive = Date.now();
      await kv.set(`user:${userId}`, user);

      return res.status(200).json({ success: true, user: user.profile });
    }

    // Update stats after game
    if (action === 'stats' && req.method === 'POST') {
      const { userId, score, level, kills, deaths, accuracy, duration } = req.body;

      const user = await kv.get(`user:${userId}`);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Update stats
      user.profile.gamesPlayed += 1;
      user.profile.totalScore += score || 0;
      user.profile.highScore = Math.max(user.profile.highScore, score || 0);

      user.stats.kills += kills || 0;
      user.stats.deaths += deaths || 0;
      user.stats.playTime += duration || 0;
      if (accuracy) {
        user.stats.accuracy = Math.round(
          (user.stats.accuracy * (user.profile.gamesPlayed - 1) + accuracy) / user.profile.gamesPlayed
        );
      }

      // Level up system (100 XP per level)
      const xpGain = Math.floor(score / 10);
      user.profile.xp += xpGain;
      user.profile.level = Math.floor(user.profile.xp / 100) + 1;

      user.lastActive = Date.now();
      await kv.set(`user:${userId}`, user);

      return res.status(200).json({
        success: true,
        profile: user.profile,
        stats: user.stats,
        xpGain
      });
    }

    // Search users
    if (action === 'search' && req.method === 'GET') {
      const { query, limit = 20 } = req.query;

      const allUserIds = await kv.smembers('users:all');
      const users = await Promise.all(
        allUserIds.slice(0, 100).map(id => kv.get(`user:${id}`))
      );

      const filtered = users
        .filter(u => u && u.username.toLowerCase().includes(query.toLowerCase()))
        .slice(0, parseInt(limit))
        .map(u => ({
          id: u.id,
          username: u.username,
          profile: {
            avatar: u.profile.avatar,
            level: u.profile.level,
            highScore: u.profile.highScore
          },
          lastActive: u.lastActive
        }));

      return res.status(200).json({ success: true, users: filtered });
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (error) {
    console.error('Users API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
