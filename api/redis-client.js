/**
 * Redis Client Wrapper
 * Works with any Redis instance (Redis Labs, Upstash, etc.)
 */

const Redis = require('ioredis');

let client = null;

function getRedisClient() {
  if (client) return client;

  const redisUrl = process.env.SHOOTERSTORAGE_REDIS_URL || 
                   process.env.KV_REST_API_URL || 
                   process.env.REDIS_URL;

  if (!redisUrl) {
    console.warn('No Redis URL found, using in-memory fallback');
    return null;
  }

  try {
    client = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true
    });

    client.on('error', (err) => {
      console.error('Redis error:', err.message);
    });

    client.on('connect', () => {
      console.log('✓ Redis connected');
    });

    // Connect asynchronously
    client.connect().catch(err => {
      console.error('Redis connection failed:', err.message);
    });

    return client;
  } catch (error) {
    console.error('Failed to create Redis client:', error.message);
    return null;
  }
}

// Wrapper object that mimics @vercel/kv API
const kv = {
  async get(key) {
    const redis = getRedisClient();
    if (!redis) return null;
    
    try {
      const value = await redis.get(key);
      if (!value) return null;
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch (error) {
      console.error('Redis get error:', error.message);
      return null;
    }
  },

  async set(key, value, options = {}) {
    const redis = getRedisClient();
    if (!redis) return null;
    
    try {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      
      if (options.ex) {
        await redis.setex(key, options.ex, serialized);
      } else {
        await redis.set(key, serialized);
      }
      
      return 'OK';
    } catch (error) {
      console.error('Redis set error:', error.message);
      return null;
    }
  },

  async del(key) {
    const redis = getRedisClient();
    if (!redis) return 0;
    
    try {
      return await redis.del(key);
    } catch (error) {
      console.error('Redis del error:', error.message);
      return 0;
    }
  },

  async sadd(key, ...members) {
    const redis = getRedisClient();
    if (!redis) return 0;
    
    try {
      return await redis.sadd(key, ...members);
    } catch (error) {
      console.error('Redis sadd error:', error.message);
      return 0;
    }
  },

  async smembers(key) {
    const redis = getRedisClient();
    if (!redis) return [];
    
    try {
      return await redis.smembers(key);
    } catch (error) {
      console.error('Redis smembers error:', error.message);
      return [];
    }
  },

  async lpush(key, ...values) {
    const redis = getRedisClient();
    if (!redis) return 0;
    
    try {
      return await redis.lpush(key, ...values);
    } catch (error) {
      console.error('Redis lpush error:', error.message);
      return 0;
    }
  },

  async ltrim(key, start, stop) {
    const redis = getRedisClient();
    if (!redis) return 'OK';
    
    try {
      return await redis.ltrim(key, start, stop);
    } catch (error) {
      console.error('Redis ltrim error:', error.message);
      return 'OK';
    }
  },

  async lrange(key, start, stop) {
    const redis = getRedisClient();
    if (!redis) return [];
    
    try {
      return await redis.lrange(key, start, stop);
    } catch (error) {
      console.error('Redis lrange error:', error.message);
      return [];
    }
  },

  async zadd(key, ...args) {
    const redis = getRedisClient();
    if (!redis) return 0;
    
    try {
      // Convert {score, member} format to [score, member]
      if (args.length === 1 && typeof args[0] === 'object') {
        const { score, member } = args[0];
        return await redis.zadd(key, score, typeof member === 'string' ? member : JSON.stringify(member));
      }
      return await redis.zadd(key, ...args);
    } catch (error) {
      console.error('Redis zadd error:', error.message);
      return 0;
    }
  },

  async zrange(key, start, stop, options = {}) {
    const redis = getRedisClient();
    if (!redis) return [];
    
    try {
      if (options.rev && options.withScores) {
        return await redis.zrevrange(key, start, stop, 'WITHSCORES');
      } else if (options.withScores) {
        return await redis.zrange(key, start, stop, 'WITHSCORES');
      } else if (options.rev) {
        return await redis.zrevrange(key, start, stop);
      } else {
        return await redis.zrange(key, start, stop);
      }
    } catch (error) {
      console.error('Redis zrange error:', error.message);
      return [];
    }
  },

  async zscore(key, member) {
    const redis = getRedisClient();
    if (!redis) return null;
    
    try {
      const memberStr = typeof member === 'string' ? member : JSON.stringify(member);
      return await redis.zscore(key, memberStr);
    } catch (error) {
      console.error('Redis zscore error:', error.message);
      return null;
    }
  },

  async zrevrank(key, member) {
    const redis = getRedisClient();
    if (!redis) return null;
    
    try {
      const memberStr = typeof member === 'string' ? member : JSON.stringify(member);
      return await redis.zrevrank(key, memberStr);
    } catch (error) {
      console.error('Redis zrevrank error:', error.message);
      return null;
    }
  },

  async zremrangebyrank(key, start, stop) {
    const redis = getRedisClient();
    if (!redis) return 0;
    
    try {
      return await redis.zremrangebyrank(key, start, stop);
    } catch (error) {
      console.error('Redis zremrangebyrank error:', error.message);
      return 0;
    }
  }
};

module.exports = { kv };
