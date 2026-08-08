/**
 * Serverless API Function for Global Leaderboard
 * Uses Vercel KV (Redis) for persistent storage when available
 * Falls back to file-based storage in /tmp for basic persistence
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Import Vercel KV for persistent storage
let kv;
try {
  kv = require('@vercel/kv').kv;
} catch (e) {
  // Fallback for local development or if KV not configured
  kv = null;
}

const MAX_SCORE = 2_000_000;
const MAX_LEVEL = 300;
const MAX_SCORE_PER_LEVEL = 25000;
const FUTURE_TIME_SKEW_MS = 5 * 60 * 1000;
const RATE_LIMIT_WINDOW_SECONDS = 60;
const RATE_LIMIT_AUTHED = 5;
const RATE_LIMIT_ANON = 2;

const rateLimitCache = new Map();

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

function getClientId(req) {
  const headerIp = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.headers['cf-connecting-ip'];
  if (headerIp) return String(headerIp).split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

async function checkRateLimit(key, limit, windowSeconds) {
  const now = Date.now();
  if (kv && typeof kv.incr === 'function') {
    const count = await kv.incr(key);
    if (count === 1) {
      if (typeof kv.expire === 'function') {
        await kv.expire(key, windowSeconds);
      } else if (typeof kv.set === 'function') {
        await kv.set(key, count, { ex: windowSeconds });
      }
    }
    return { allowed: count <= limit, count, reset: now + windowSeconds * 1000 };
  }

  const existing = rateLimitCache.get(key) || { count: 0, reset: now + windowSeconds * 1000 };
  if (existing.reset < now) {
    existing.count = 0;
    existing.reset = now + windowSeconds * 1000;
  }
  existing.count += 1;
  rateLimitCache.set(key, existing);
  return { allowed: existing.count <= limit, count: existing.count, reset: existing.reset };
}

function validateScorePayload(score, level, timestamp) {
  if (!Number.isFinite(score)) return 'Score must be a number';
  if (score < 0) return 'Score must be positive';
  if (score > MAX_SCORE) return 'Score exceeds allowed maximum';
  const numericLevel = Math.max(1, Math.floor(level || 1));
  if (numericLevel > MAX_LEVEL) return 'Level is out of allowed range';
  if (score > numericLevel * MAX_SCORE_PER_LEVEL) return 'Score is not credible for provided level';
  if (timestamp && timestamp > Date.now() + FUTURE_TIME_SKEW_MS) return 'Timestamp appears invalid';
  return null;
}

// Key for storing all entries in a sorted set
const ALL_ENTRIES_KEY = 'leaderboard:all_entries';
const IDEMPOTENCY_TTL_SECONDS = 60 * 60; // 1h is plenty to cover client retry windows

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Health check / ping endpoint
  const { action } = req.query || {};
  if (action === 'ping' && req.method === 'GET') {
    return res.status(200).json({ 
      success: true, 
      status: 'online',
      service: 'leaderboard',
      storage: kv ? 'kv' : 'file',
      timestamp: Date.now() 
    });
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
      const { username, score, level, difficulty, timestamp, userId, authToken, submissionId } = req.body;

      const authHeader = req.headers.authorization || '';
      const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
      const token = authToken || bearer;
      const session = await getSessionFromToken(token);

      const clientId = session?.userId || getClientId(req);
      if (!session) {
        const anonLimit = await checkRateLimit(`rate:leaderboard:anon:${clientId}`, RATE_LIMIT_ANON, RATE_LIMIT_WINDOW_SECONDS);
        if (!anonLimit.allowed) {
          return res.status(429).json({
            success: false,
            error: 'Too many unauthenticated attempts. Please sign in.',
            retryAfter: Math.ceil((anonLimit.reset - Date.now()) / 1000)
          });
        }
        return res.status(401).json({ success: false, error: 'Authentication required for global leaderboard submissions' });
      }

      if (userId && userId !== session.userId) {
        return res.status(403).json({ success: false, error: 'User mismatch for session' });
      }

      const rateLimitState = await checkRateLimit(`rate:leaderboard:${session.userId}`, RATE_LIMIT_AUTHED, RATE_LIMIT_WINDOW_SECONDS);
      if (!rateLimitState.allowed) {
        return res.status(429).json({
          success: false,
          error: 'Rate limit exceeded. Please wait before submitting again.',
          retryAfter: Math.ceil((rateLimitState.reset - Date.now()) / 1000)
        });
      }

      if (typeof score !== 'number' || !difficulty) {
        return res.status(400).json({ success: false, error: 'Invalid data' });
      }
      
      // Validate difficulty
      const validDifficulties = ['easy', 'normal', 'hard'];
      if (!validDifficulties.includes(difficulty)) {
        return res.status(400).json({ success: false, error: 'Invalid difficulty' });
      }

      const validationError = validateScorePayload(score, level, timestamp);
      if (validationError) {
        return res.status(400).json({ success: false, error: validationError });
      }

      const safeUsername = (session?.username || username || 'pilot').toString().slice(0, 30).trim();
      const resolvedUserId = session.userId;

      // Idempotency: client retries (up to 3x) reuse the same submissionId, so a
      // lost response after a successful write can't create a duplicate entry.
      const idemKey = submissionId ? `leaderboard:idem:${resolvedUserId}:${submissionId}` : null;
      if (kv && idemKey) {
        try {
          const cached = await kv.get(idemKey);
          if (cached) {
            const cachedResult = typeof cached === 'string' ? JSON.parse(cached) : cached;
            return res.status(201).json({ ...cachedResult, deduped: true });
          }
        } catch (kvError) {
          console.error('KV idempotency lookup error:', kvError);
        }
      }

      // Generate unique ID
      const uniqueId = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;

      const entry = {
        id: uniqueId,
        username: safeUsername,
        score: Math.max(0, Math.floor(score)),
        level: Math.max(1, Math.floor(level || 1)),
        difficulty,
        timestamp: timestamp || Date.now(),
        userId: resolvedUserId
      };

      let rank = 1;
      let storageType = 'file';

      if (kv) {
        // Use Vercel KV for persistent storage
        try {
          // Enforce a single best entry per user per difficulty — replace their
          // previous entry instead of letting every submission occupy a slot.
          const bestKey = `leaderboard:best:${resolvedUserId}:${difficulty}`;
          const existingRaw = await kv.get(bestKey);
          const existing = existingRaw ? (typeof existingRaw === 'string' ? JSON.parse(existingRaw) : existingRaw) : null;

          if (existing && existing.score >= entry.score) {
            // Not a new best for this user/difficulty — report their existing rank
            // without adding a duplicate slot to the leaderboard.
            const higherScores = await kv.zcount(ALL_ENTRIES_KEY, existing.score + 1, '+inf');
            rank = higherScores + 1;
            storageType = 'kv';
          } else {
            const entryJson = JSON.stringify(entry);

            if (existing) {
              await kv.zrem(ALL_ENTRIES_KEY, JSON.stringify(existing));
            }
            await kv.zadd(ALL_ENTRIES_KEY, { score: entry.score, member: entryJson });
            await kv.set(bestKey, entryJson);

            const higherScores = await kv.zcount(ALL_ENTRIES_KEY, entry.score + 1, '+inf');
            rank = higherScores + 1;

            const count = await kv.zcard(ALL_ENTRIES_KEY);
            if (count > 1000) {
              await kv.zremrangebyrank(ALL_ENTRIES_KEY, 0, count - 1001);
            }
            storageType = 'kv';
          }
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

      const result = {
        success: true,
        entry,
        rank,
        storage: storageType,
        debug: {
          kvAvailable: !!kv,
          totalEntries: allData.length,
          rateLimit: {
            count: rateLimitState.count,
            windowSeconds: RATE_LIMIT_WINDOW_SECONDS
          }
        }
      };

      if (kv && idemKey) {
        try {
          await kv.set(idemKey, JSON.stringify(result), { ex: IDEMPOTENCY_TTL_SECONDS });
        } catch (kvError) {
          console.error('KV idempotency write error:', kvError);
        }
      }

      return res.status(201).json(result);
    }
    
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
