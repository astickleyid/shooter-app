/**
 * Serverless API Function for Global Leaderboard
 * Uses Vercel KV (Redis) for persistent storage when available
 * Falls back to file-based storage in /tmp for basic persistence
 */

const fs = require('fs');
const path = require('path');

// Import Vercel KV for persistent storage
let kv;
try {
  kv = require('@vercel/kv').kv;
} catch (e) {
  // Fallback for local development or if KV not configured
  kv = null;
}

// File-based fallback storage (persists within same serverless instance)
const STORAGE_FILE = '/tmp/leaderboard-data.json';

// Load data from file storage
function loadFromFile() {
  try {
    if (fs.existsSync(STORAGE_FILE)) {
      const data = fs.readFileSync(STORAGE_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error loading from file:', e);
  }
  return [];
}

// Save data to file storage
function saveToFile(data) {
  try {
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(data), 'utf8');
  } catch (e) {
    console.error('Error saving to file:', e);
  }
}

// In-memory cache (initialized from file on cold start)
let memoryCache = null;

function getMemoryData() {
  if (memoryCache === null) {
    memoryCache = loadFromFile();
  }
  return memoryCache;
}

function setMemoryData(data) {
  memoryCache = data;
  saveToFile(data);
}

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
      let storageType = 'file';
      let kvSucceeded = false;
      
      if (kv) {
        // Use Vercel KV for persistent storage
        try {
          const rawEntries = await kv.zrange(ALL_ENTRIES_KEY, 0, -1, { rev: true });
          
          // KV query succeeded (even if empty) - mark as successful
          if (rawEntries !== null && rawEntries !== undefined) {
            kvSucceeded = true;
            storageType = 'kv';
            
            if (rawEntries.length > 0) {
              entries = rawEntries
                .map(e => typeof e === 'string' ? JSON.parse(e) : e)
                .filter(e => difficulty === 'all' || e.difficulty === difficulty)
                .slice(0, parsedLimit);
            }
          }
        } catch (kvError) {
          console.error('KV error:', kvError);
          kvSucceeded = false;
        }
      }
      
      // Only fallback to file-based storage if KV failed (not just empty)
      if (!kvSucceeded) {
        const allData = getMemoryData();
        entries = allData
          .filter(e => difficulty === 'all' || e.difficulty === difficulty)
          .sort((a, b) => b.score - a.score)
          .slice(0, parsedLimit);
        storageType = 'file';
      }
      
      return res.status(200).json({ 
        success: true, 
        entries,
        storage: storageType,
        count: entries.length,
        debug: {
          kvAvailable: !!kv,
          kvSucceeded,
          timestamp: Date.now()
        }
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
      
      // Generate unique ID
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
      let storageType = 'file';
      
      if (kv) {
        // Use Vercel KV for persistent storage
        try {
          const entryJson = JSON.stringify(entry);
          
          await kv.zadd(ALL_ENTRIES_KEY, { score: entry.score, member: entryJson });
          
          const higherScores = await kv.zcount(ALL_ENTRIES_KEY, entry.score + 1, '+inf');
          rank = higherScores + 1;
          
          const count = await kv.zcard(ALL_ENTRIES_KEY);
          if (count > 1000) {
            await kv.zremrangebyrank(ALL_ENTRIES_KEY, 0, count - 1001);
          }
          storageType = 'kv';
        } catch (kvError) {
          console.error('KV write error:', kvError);
        }
      }
      
      // Always also save to file-based storage as backup
      const allData = getMemoryData();
      allData.push(entry);
      allData.sort((a, b) => b.score - a.score);
      if (allData.length > 1000) {
        allData.splice(1000);
      }
      setMemoryData(allData);
      
      if (storageType === 'file') {
        rank = allData.findIndex(e => e.id === entry.id) + 1;
      }
      
      return res.status(201).json({ 
        success: true, 
        entry, 
        rank,
        storage: storageType,
        debug: {
          kvAvailable: !!kv,
          totalEntries: allData.length
        }
      });
    }
    
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
