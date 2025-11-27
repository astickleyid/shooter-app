const { kv } = require('./redis-client');
const crypto = require('crypto');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action } = req.query;

  try {
    console.log('Action:', action, 'Method:', req.method);

    if (action === 'register' && req.method === 'POST') {
      console.log('Register request body:', req.body);
      
      const { username, password, email } = req.body;

      if (!username || !password || username.length < 3) {
        return res.status(400).json({ error: 'Invalid username or password' });
      }

      console.log('Checking existing user...');
      const existingUser = await kv.get(`user:username:${username.toLowerCase()}`);
      console.log('Existing user:', existingUser);
      
      if (existingUser) {
        return res.status(409).json({ error: 'Username already taken' });
      }

      const userId = 'u_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
      const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

      console.log('Creating user object...');
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

      console.log('Saving user to Redis...');
      await kv.set(`user:${userId}`, user);
      console.log('Saving username mapping...');
      await kv.set(`user:username:${username.toLowerCase()}`, userId);
      console.log('Adding to users set...');
      await kv.sadd('users:all', userId);

      console.log('Registration complete!');
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
      const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

      if (user.passwordHash !== passwordHash) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

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

    // Get profile
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

    // Update stats
    if (action === 'stats' && req.method === 'POST') {
      const { userId, score, level, kills, deaths, accuracy, duration } = req.body;

      const user = await kv.get(`user:${userId}`);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

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
    console.error('Fatal error:', error);
    return res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
