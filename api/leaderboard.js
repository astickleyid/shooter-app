/**
 * Serverless API Function for Global Leaderboard
 * Uses Vercel KV (Redis) for persistent storage
 * Deploy this to Vercel (recommended - free tier available)
 */

// Import Vercel KV for persistent storage
let kv;
try {
  kv = require('@vercel/kv').kv;
} catch (e) {
  // Fallback for local development or if KV not configured
  kv = null;
}

// In-memory fallback for when KV is not available
let memoryFallback = [];

// Key for storing all entries in a sorted set
const ALL_ENTRIES_KEY = 'leaderboard:all_entries';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const { difficulty = 'all', limit = 100 } = req.query;
      const parsedLimit = Math.min(parseInt(limit) || 100, 100);
      
      let entries = [];
      
      if (kv) {
        // Use Vercel KV for persistent storage
        try {
          // Fetch entries from Redis sorted set (sorted by score descending)
          // Note: Filtering by difficulty is done client-side for simplicity
          // A production system could use separate sorted sets per difficulty
          const rawEntries = await kv.zrange(ALL_ENTRIES_KEY, 0, -1, { rev: true });
          
          if (rawEntries && rawEntries.length > 0) {
            // Parse entries and filter by difficulty if needed
            entries = rawEntries
              .map(e => typeof e === 'string' ? JSON.parse(e) : e)
              .filter(e => difficulty === 'all' || e.difficulty === difficulty)
              .slice(0, parsedLimit);
          }
        } catch (kvError) {
          console.error('KV error:', kvError);
          // Fall back to memory
          entries = memoryFallback
            .filter(e => difficulty === 'all' || e.difficulty === difficulty)
            .sort((a, b) => b.score - a.score)
            .slice(0, parsedLimit);
        }
      } else {
        // Use in-memory fallback
        entries = memoryFallback
          .filter(e => difficulty === 'all' || e.difficulty === difficulty)
          .sort((a, b) => b.score - a.score)
          .slice(0, parsedLimit);
      }
      
      return res.status(200).json({ 
        success: true, 
        entries,
        storage: kv ? 'persistent' : 'memory',
        count: entries.length
      });
    }
    
    if (req.method === 'POST') {
      const { username, score, level, difficulty, timestamp } = req.body;
      
      if (!username || typeof score !== 'number' || !difficulty) {
        return res.status(400).json({ success: false, error: 'Invalid data' });
      }
      
      // Validate difficulty
      const validDifficulties = ['easy', 'normal', 'hard'];
      if (!validDifficulties.includes(difficulty)) {
        return res.status(400).json({ success: false, error: 'Invalid difficulty' });
      }
      
      // Generate unique ID using substring instead of deprecated substr
      const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      
      const entry = {
        id: uniqueId,
        username: String(username).slice(0, 30).trim(),
        score: Math.max(0, Math.floor(score)),
        level: Math.max(1, Math.floor(level || 1)),
        difficulty,
        timestamp: timestamp || Date.now()
      };
      
      let rank = 1;
      
      if (kv) {
        // Use Vercel KV for persistent storage
        try {
          const entryJson = JSON.stringify(entry);
          
          // Add entry to sorted set with score as the sort value
          await kv.zadd(ALL_ENTRIES_KEY, { score: entry.score, member: entryJson });
          
          // Get rank by counting entries with higher scores
          // Using zcount is more reliable than zrevrank with JSON strings
          const higherScores = await kv.zcount(ALL_ENTRIES_KEY, entry.score + 1, '+inf');
          rank = higherScores + 1;
          
          // Trim to keep only top 1000 entries
          const count = await kv.zcard(ALL_ENTRIES_KEY);
          if (count > 1000) {
            await kv.zremrangebyrank(ALL_ENTRIES_KEY, 0, count - 1001);
          }
        } catch (kvError) {
          console.error('KV write error:', kvError);
          // Fall back to memory storage
          memoryFallback.push(entry);
          memoryFallback.sort((a, b) => b.score - a.score);
          if (memoryFallback.length > 1000) {
            memoryFallback = memoryFallback.slice(0, 1000);
          }
          rank = memoryFallback.findIndex(e => e.id === entry.id) + 1;
        }
      } else {
        // Use in-memory fallback
        memoryFallback.push(entry);
        memoryFallback.sort((a, b) => b.score - a.score);
        if (memoryFallback.length > 1000) {
          memoryFallback = memoryFallback.slice(0, 1000);
        }
        rank = memoryFallback.findIndex(e => e.id === entry.id) + 1;
      }
      
      return res.status(201).json({ 
        success: true, 
        entry, 
        rank,
        storage: kv ? 'persistent' : 'memory'
      });
    }
    
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
