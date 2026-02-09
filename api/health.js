/**
 * Health Check / Monitoring Endpoint
 * Used to verify all backend services are online
 */

// Check if Vercel KV is available
let kv;
try {
  kv = require('@vercel/kv').kv;
} catch (e) {
  kv = null;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

module.exports = async (req, res) => {
  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const health = {
      status: 'healthy',
      timestamp: Date.now(),
      services: {
        api: 'online',
        storage: kv ? 'online' : 'degraded'
      },
      environment: {
        node: process.version,
        platform: process.platform
      }
    };

    // Test KV connection if available
    if (kv) {
      try {
        const testKey = 'health:ping';
        await kv.set(testKey, Date.now(), { ex: 10 });
        const testValue = await kv.get(testKey);
        health.services.storage = testValue ? 'online' : 'degraded';
      } catch (kvError) {
        health.services.storage = 'error';
        health.storageError = kvError.message;
      }
    }

    // Overall status
    const allOnline = Object.values(health.services).every(s => s === 'online');
    health.status = allOnline ? 'healthy' : 'degraded';

    const statusCode = health.status === 'healthy' ? 200 : 503;
    return res.status(statusCode).json(health);
  } catch (error) {
    console.error('Health check error:', error);
    return res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: Date.now()
    });
  }
};
