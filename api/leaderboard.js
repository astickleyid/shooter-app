/**
 * Global Leaderboard API - Now with persistent Redis storage
 * Supports both guest and authenticated users
 */

const { kv } = require('./redis-client');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

module.exports = async (req, res) => {
  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const { difficulty = 'all', limit = 50, userId } = req.query;
      
      // Get scores from Redis sorted set
      const key = difficulty === 'all' ? 'leaderboard:global' : `leaderboard:${difficulty}`;
      
      try {
        const entries = await kv.zrange(key, 0, parseInt(limit) - 1, { rev: true, withScores: true });
        
        // Format entries with user data
        const formatted = [];
        for (let i = 0; i < entries.length; i += 2) {
          try {
            const scoreData = JSON.parse(entries[i]);
            const score = entries[i + 1];
            
            // Get user profile if available
            let profile = null;
            if (scoreData.userId) {
              try {
                const user = await kv.get(`user:${scoreData.userId}`);
                if (user) {
                  profile = {
                    avatar: user.profile.avatar,
                    level: user.profile.level,
                    badges: user.profile.badges
                  };
                }
              } catch (e) {
                // User not found, continue without profile
              }
            }
            
            formatted.push({
              rank: Math.floor(i / 2) + 1,
              userId: scoreData.userId,
              username: scoreData.username,
              score: score,
              level: scoreData.level,
              difficulty: scoreData.difficulty,
              timestamp: scoreData.timestamp,
              profile
            });
          } catch (e) {
            // Skip malformed entry
            console.error('Malformed entry:', e);
          }
        }
        
        // If userId provided, include their rank
        let userRank = null;
        if (userId) {
          try {
            const userScore = await kv.zscore(key, userId);
            if (userScore !== null) {
              userRank = await kv.zrevrank(key, userId);
              if (userRank !== null) userRank = userRank + 1;
            }
          } catch (e) {
            // User rank not found
          }
        }
        
        return res.status(200).json({ 
          success: true, 
          entries: formatted,
          userRank
        });
      } catch (kvError) {
        console.error('KV Error:', kvError);
        // Fallback to empty array if KV not available
        return res.status(200).json({ success: true, entries: [], userRank: null });
      }
    }
    
    if (req.method === 'POST') {
      const { userId, username, score, level, difficulty, timestamp } = req.body;
      
      if (!username || typeof score !== 'number' || !difficulty) {
        return res.status(400).json({ success: false, error: 'Invalid data' });
      }
      
      const entry = {
        userId: userId || null,
        username: String(username).slice(0, 30),
        level: Math.floor(level || 1),
        difficulty,
        timestamp: timestamp || Date.now()
      };
      
      try {
        // Store in Redis sorted set (score as the sort key)
        const key = `leaderboard:${difficulty}`;
        const globalKey = 'leaderboard:global';
        const memberKey = userId || `guest_${Date.now()}`;
        
        // Only keep highest score per user
        const existingScore = await kv.zscore(key, memberKey);
        if (!existingScore || score > existingScore) {
          await kv.zadd(key, { score, member: JSON.stringify(entry) });
          await kv.zadd(globalKey, { score, member: JSON.stringify(entry) });
          
          // Trim to top 1000
          await kv.zremrangebyrank(key, 0, -1001);
          await kv.zremrangebyrank(globalKey, 0, -1001);
        }
        
        // Get rank
        const rank = await kv.zrevrank(key, memberKey);
        
        return res.status(201).json({ 
          success: true, 
          entry, 
          rank: rank !== null ? rank + 1 : null,
          score 
        });
      } catch (kvError) {
        console.error('KV Error on submit:', kvError);
        // Fallback response
        return res.status(201).json({ success: true, entry, rank: null, score });
      }
    }
    
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
