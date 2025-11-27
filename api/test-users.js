const { kv } = require('./redis-client');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      return res.status(200).json({ status: 'ok', message: 'Test endpoint working' });
    }

    if (req.method === 'POST') {
      const { username } = req.body;
      
      if (!username) {
        return res.status(400).json({ error: 'Username required' });
      }

      // Test Redis
      const testKey = `test:user:${username}`;
      await kv.set(testKey, { username, timestamp: Date.now() });
      const result = await kv.get(testKey);

      return res.status(200).json({ 
        success: true, 
        username,
        redisTest: result 
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ 
      error: error.message,
      stack: error.stack
    });
  }
};
