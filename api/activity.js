/**
 * Activity Feed API
 * Tracks and displays friend activities, achievements, high scores
 */

// Use @vercel/kv with fallback for production robustness
let kv;
try {
  kv = require('@vercel/kv').kv;
} catch (e) {
  console.warn('Vercel KV not available, activity API will be disabled');
  kv = null;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

function normalizeSession(session) {
  if (!session) return null;
  if (typeof session === 'string') {
    try {
      return JSON.parse(session);
    } catch (err) {
      return null;
    }
  }
  return session;
}

async function getSessionFromToken(token) {
  if (!token || !kv) return null;
  try {
    const session = normalizeSession(await kv.get(`session:${token}`));
    if (session?.expiresAt && session.expiresAt < Date.now()) return null;
    return session;
  } catch (err) {
    console.error('Session lookup failed:', err.message);
    return null;
  }
}

// Verifies the request carries a valid session for `actingUserId` (the user
// performing the mutation). Returns the session, or writes a 401/403 and
// returns null.
async function requireSessionFor(req, res, actingUserId) {
  const authHeader = req.headers.authorization || '';
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const session = await getSessionFromToken(bearer);
  if (!session) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return null;
  }
  if (actingUserId && session.userId !== actingUserId) {
    res.status(403).json({ success: false, error: 'User mismatch for session' });
    return null;
  }
  return session;
}

module.exports = async (req, res) => {
  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action } = req.query;

  // Health check / ping endpoint
  if (action === 'ping' && req.method === 'GET') {
    return res.status(200).json({ 
      success: true, 
      status: 'online',
      service: 'activity',
      timestamp: Date.now() 
    });
  }

  // Check if KV is available for operations
  if (!kv) {
    return res.status(503).json({ 
      success: false,
      error: 'Activity service temporarily unavailable',
      message: 'Backend storage not configured. Please deploy with Vercel KV.' 
    });
  }

  try {
    // Post activity
    if (action === 'post' && req.method === 'POST') {
      const { userId, type, data } = req.body;

      if (!(await requireSessionFor(req, res, userId))) return;

      const user = await kv.get(`user:${userId}`);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const activity = {
        id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        userId,
        username: user.username,
        avatar: user.profile.avatar,
        type, // 'high_score', 'achievement', 'level_up', 'game_complete'
        data,
        timestamp: Date.now()
      };

      // Add to global activity feed
      await kv.lpush('activity:global', JSON.stringify(activity));
      await kv.ltrim('activity:global', 0, 499); // Keep last 500

      // Add to user's activity
      await kv.lpush(`activity:user:${userId}`, JSON.stringify(activity));
      await kv.ltrim(`activity:user:${userId}`, 0, 99); // Keep last 100

      // Notify friends
      for (const friendId of user.friends) {
        await kv.lpush(`activity:feed:${friendId}`, JSON.stringify(activity));
        await kv.ltrim(`activity:feed:${friendId}`, 0, 199); // Keep last 200
      }

      return res.status(201).json({ success: true, activity });
    }

    // Get activity feed (friends' activities)
    if (action === 'feed' && req.method === 'GET') {
      const { userId, limit = 50 } = req.query;

      const activities = await kv.lrange(`activity:feed:${userId}`, 0, parseInt(limit) - 1);
      const parsed = activities.map(a => JSON.parse(a));

      return res.status(200).json({ success: true, activities: parsed });
    }

    // Get global activity (all players)
    if (action === 'global' && req.method === 'GET') {
      const { limit = 50 } = req.query;

      const activities = await kv.lrange('activity:global', 0, parseInt(limit) - 1);
      const parsed = activities.map(a => JSON.parse(a));

      return res.status(200).json({ success: true, activities: parsed });
    }

    // Get user's activity history
    if (action === 'user' && req.method === 'GET') {
      const { userId, limit = 50 } = req.query;

      const activities = await kv.lrange(`activity:user:${userId}`, 0, parseInt(limit) - 1);
      const parsed = activities.map(a => JSON.parse(a));

      return res.status(200).json({ success: true, activities: parsed });
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (error) {
    console.error('Activity API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
