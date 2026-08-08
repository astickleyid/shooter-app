/**
 * Friends System API
 * Handles friend requests, friends list, online status
 */

// Use @vercel/kv with fallback for production robustness
let kv;
try {
  kv = require('@vercel/kv').kv;
} catch (e) {
  console.warn('Vercel KV not available, friends API will be disabled');
  kv = null;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

const LOCK_TTL_SECONDS = 5;
const LOCK_RETRIES = 8;
const LOCK_RETRY_DELAY_MS = 100;

// Acquire a short-lived per-user-pair lock before a read-modify-write on the
// friends KV store, so two concurrent requests (e.g. accept + remove firing
// at once) can't interleave and corrupt either user's friends array.
async function withUserPairLock(userA, userB, fn) {
  const lockKey = `lock:friends:${[userA, userB].sort().join(':')}`;

  for (let attempt = 0; attempt <= LOCK_RETRIES; attempt++) {
    const acquired = await kv.set(lockKey, '1', { nx: true, ex: LOCK_TTL_SECONDS });
    if (acquired) {
      try {
        return await fn();
      } finally {
        await kv.del(lockKey).catch(() => {});
      }
    }
    await new Promise(resolve => setTimeout(resolve, LOCK_RETRY_DELAY_MS));
  }

  throw new Error('Friends service is busy, please try again');
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
      service: 'friends',
      timestamp: Date.now() 
    });
  }

  // Check if KV is available for operations
  if (!kv) {
    return res.status(503).json({ 
      success: false,
      error: 'Friends service temporarily unavailable',
      message: 'Backend storage not configured. Please deploy with Vercel KV.' 
    });
  }

  try {
    // Send friend request
    if (action === 'request' && req.method === 'POST') {
      const { fromUserId, toUserId } = req.body;

      if (fromUserId === toUserId) {
        return res.status(400).json({ error: 'Cannot send a friend request to yourself' });
      }

      return await withUserPairLock(fromUserId, toUserId, async () => {
        const fromUser = await kv.get(`user:${fromUserId}`);
        const toUser = await kv.get(`user:${toUserId}`);

        if (!fromUser || !toUser) {
          return res.status(404).json({ error: 'User not found' });
        }

        // Check if already friends
        if (fromUser.friends.includes(toUserId)) {
          return res.status(400).json({ error: 'Already friends' });
        }

        // Check if request already sent
        if (fromUser.friendRequests.sent.includes(toUserId)) {
          return res.status(400).json({ error: 'Request already sent' });
        }

        // Add request
        fromUser.friendRequests.sent.push(toUserId);
        toUser.friendRequests.received.push(fromUserId);

        await kv.set(`user:${fromUserId}`, fromUser);
        await kv.set(`user:${toUserId}`, toUser);

        // Create notification
        const notification = {
          id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          type: 'friend_request',
          fromUserId,
          fromUsername: fromUser.username,
          timestamp: Date.now(),
          read: false
        };
        await kv.lpush(`notifications:${toUserId}`, JSON.stringify(notification));
        await kv.ltrim(`notifications:${toUserId}`, 0, 99); // Keep last 100

        return res.status(200).json({ success: true, message: 'Friend request sent' });
      });
    }

    // Accept friend request
    if (action === 'accept' && req.method === 'POST') {
      const { userId, friendId } = req.body;

      if (userId === friendId) {
        return res.status(400).json({ error: 'Invalid friend request' });
      }

      return await withUserPairLock(userId, friendId, async () => {
        const user = await kv.get(`user:${userId}`);
        const friend = await kv.get(`user:${friendId}`);

        if (!user || !friend) {
          return res.status(404).json({ error: 'User not found' });
        }

        // Remove from requests
        user.friendRequests.received = user.friendRequests.received.filter(id => id !== friendId);
        friend.friendRequests.sent = friend.friendRequests.sent.filter(id => id !== userId);

        // Add as friends
        if (!user.friends.includes(friendId)) {
          user.friends.push(friendId);
        }
        if (!friend.friends.includes(userId)) {
          friend.friends.push(userId);
        }

        await kv.set(`user:${userId}`, user);
        await kv.set(`user:${friendId}`, friend);

        // Notification
        const notification = {
          id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          type: 'friend_accepted',
          fromUserId: userId,
          fromUsername: user.username,
          timestamp: Date.now(),
          read: false
        };
        await kv.lpush(`notifications:${friendId}`, JSON.stringify(notification));
        await kv.ltrim(`notifications:${friendId}`, 0, 99);

        return res.status(200).json({ success: true, message: 'Friend request accepted' });
      });
    }

    // Decline friend request
    if (action === 'decline' && req.method === 'POST') {
      const { userId, friendId } = req.body;

      if (userId === friendId) {
        return res.status(400).json({ error: 'Invalid friend request' });
      }

      return await withUserPairLock(userId, friendId, async () => {
        const user = await kv.get(`user:${userId}`);
        const friend = await kv.get(`user:${friendId}`);

        if (!user || !friend) {
          return res.status(404).json({ error: 'User not found' });
        }

        user.friendRequests.received = user.friendRequests.received.filter(id => id !== friendId);
        friend.friendRequests.sent = friend.friendRequests.sent.filter(id => id !== userId);

        await kv.set(`user:${userId}`, user);
        await kv.set(`user:${friendId}`, friend);

        return res.status(200).json({ success: true, message: 'Request declined' });
      });
    }

    // Remove friend
    if (action === 'remove' && req.method === 'DELETE') {
      const { userId, friendId } = req.body;

      if (userId === friendId) {
        return res.status(400).json({ error: 'Invalid friend' });
      }

      return await withUserPairLock(userId, friendId, async () => {
        const user = await kv.get(`user:${userId}`);
        const friend = await kv.get(`user:${friendId}`);

        if (!user || !friend) {
          return res.status(404).json({ error: 'User not found' });
        }

        user.friends = user.friends.filter(id => id !== friendId);
        friend.friends = friend.friends.filter(id => id !== userId);

        await kv.set(`user:${userId}`, user);
        await kv.set(`user:${friendId}`, friend);

        return res.status(200).json({ success: true, message: 'Friend removed' });
      });
    }

    // Get friends list with profiles
    if (action === 'list' && req.method === 'GET') {
      const { userId } = req.query;

      const user = await kv.get(`user:${userId}`);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const friends = await Promise.all(
        user.friends.map(async (friendId) => {
          const friend = await kv.get(`user:${friendId}`);
          if (!friend) return null;

          const isOnline = Date.now() - friend.lastActive < 5 * 60 * 1000; // 5 min

          return {
            id: friend.id,
            username: friend.username,
            profile: {
              avatar: friend.profile.avatar,
              level: friend.profile.level,
              highScore: friend.profile.highScore,
              badges: friend.profile.badges
            },
            online: isOnline,
            lastActive: friend.lastActive
          };
        })
      );

      return res.status(200).json({
        success: true,
        friends: friends.filter(f => f !== null)
      });
    }

    // Get friend requests
    if (action === 'requests' && req.method === 'GET') {
      const { userId } = req.query;

      const user = await kv.get(`user:${userId}`);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const received = await Promise.all(
        user.friendRequests.received.map(async (requesterId) => {
          const requester = await kv.get(`user:${requesterId}`);
          if (!requester) return null;
          return {
            id: requester.id,
            username: requester.username,
            profile: {
              avatar: requester.profile.avatar,
              level: requester.profile.level
            }
          };
        })
      );

      const sent = await Promise.all(
        user.friendRequests.sent.map(async (targetId) => {
          const target = await kv.get(`user:${targetId}`);
          if (!target) return null;
          return {
            id: target.id,
            username: target.username,
            profile: {
              avatar: target.profile.avatar,
              level: target.profile.level
            }
          };
        })
      );

      return res.status(200).json({
        success: true,
        received: received.filter(r => r !== null),
        sent: sent.filter(s => s !== null)
      });
    }

    // Get notifications
    if (action === 'notifications' && req.method === 'GET') {
      const { userId, limit = 20 } = req.query;

      const notifications = await kv.lrange(`notifications:${userId}`, 0, parseInt(limit) - 1);
      const parsed = notifications.map(n => JSON.parse(n));

      return res.status(200).json({ success: true, notifications: parsed });
    }

    // Mark notifications as read (flags entries in place; does not discard history)
    if (action === 'mark-read' && req.method === 'POST') {
      const { userId, notificationIds } = req.body;

      const key = `notifications:${userId}`;
      const raw = await kv.lrange(key, 0, -1);
      const notifications = raw.map(n => typeof n === 'string' ? JSON.parse(n) : n);

      const updated = notifications.map(n => {
        if (!notificationIds || notificationIds.includes(n.id)) {
          return { ...n, read: true };
        }
        return n;
      });

      if (updated.length > 0) {
        // lrange returns newest-first (lpush prepends); rpush preserves that order
        await kv.del(key);
        await kv.rpush(key, ...updated.map(n => JSON.stringify(n)));
      }

      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (error) {
    console.error('Friends API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
