/**
 * Serverless API Function for Global Leaderboard
 * Deploy this to Vercel (recommended - free and easy)
 */

let leaderboardData = [];

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const { difficulty = 'all', limit = 50 } = req.query;
      
      let filtered = leaderboardData;
      if (difficulty !== 'all') {
        filtered = filtered.filter(e => e.difficulty === difficulty);
      }
      
      filtered.sort((a, b) => b.score - a.score);
      const limited = filtered.slice(0, parseInt(limit));
      
      return res.status(200).json({ success: true, entries: limited });
    }
    
    if (req.method === 'POST') {
      const { username, score, level, difficulty, timestamp } = req.body;
      
      if (!username || typeof score !== 'number' || !difficulty) {
        return res.status(400).json({ success: false, error: 'Invalid data' });
      }
      
      const entry = {
        id: Date.now() + Math.random(),
        username: String(username).slice(0, 30),
        score: Math.floor(score),
        level: Math.floor(level || 1),
        difficulty,
        timestamp: timestamp || Date.now()
      };
      
      leaderboardData.push(entry);
      
      if (leaderboardData.length > 1000) {
        leaderboardData.sort((a, b) => b.score - a.score);
        leaderboardData = leaderboardData.slice(0, 1000);
      }
      
      const sorted = [...leaderboardData].sort((a, b) => b.score - a.score);
      const rank = sorted.findIndex(e => e.id === entry.id) + 1;
      
      return res.status(201).json({ success: true, entry, rank });
    }
    
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
