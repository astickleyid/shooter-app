/**
 * Friends System API
 * Handles friend requests, friends list, online status
 */

const { kv } = require("@vercel/kv");

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

module.exports = async (req, res) => {
  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action } = req.query;

  try {
    // Send friend request
    if (action === 'request' && req.method === 'POST') {
      const { fromUserId, toUserId } = req.body;

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
    }

    // Accept friend request
    if (action === 'accept' && req.method === 'POST') {
      const { userId, friendId } = req.body;

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
    }

    // Decline friend request
    if (action === 'decline' && req.method === 'POST') {
      const { userId, friendId } = req.body;

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
    }

    // Remove friend
    if (action === 'remove' && req.method === 'DELETE') {
      const { userId, friendId } = req.body;

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

    // Mark notifications as read
    if (action === 'mark-read' && req.method === 'POST') {
      const { userId } = req.body;

      // Just clear for simplicity (or implement read tracking)
      await kv.del(`notifications:${userId}`);

      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (error) {
    console.error('Friends API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
