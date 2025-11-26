/**
 * Node.js Migration Script: Upload sample/existing scores to global leaderboard
 * Usage: node migrate-scores-node.js
 */

const API_URL = 'https://shooter-app-one.vercel.app/api/leaderboard';

// Add your existing scores here
const existingScores = [
  // Example format:
  // { username: 'Player1', score: 5000, level: 10, difficulty: 'hard', timestamp: Date.now() },
  // Add more entries here...
];

async function uploadScore(entry) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry)
    });
    
    const data = await response.json();
    if (data.success) {
      console.log(`✅ ${entry.username}: ${entry.score} pts (Rank #${data.rank})`);
      return true;
    } else {
      console.error(`❌ ${entry.username}: Failed - ${data.error || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ ${entry.username}: Error - ${error.message}`);
    return false;
  }
}

async function migrateScores() {
  console.log('🔄 Starting score migration to global leaderboard...\n');
  
  if (existingScores.length === 0) {
    console.log('⚠️  No scores to migrate. Edit this file and add scores to the existingScores array.');
    console.log('\nExample format:');
    console.log('const existingScores = [');
    console.log('  { username: "Player1", score: 5000, level: 10, difficulty: "hard" },');
    console.log('  { username: "Player2", score: 3000, level: 7, difficulty: "normal" },');
    console.log('];');
    return;
  }
  
  console.log(`📊 Found ${existingScores.length} scores to upload\n`);
  
  let success = 0;
  let failed = 0;
  
  for (const entry of existingScores) {
    // Ensure timestamp exists
    if (!entry.timestamp) {
      entry.timestamp = Date.now() - Math.floor(Math.random() * 86400000 * 7); // Random within last week
    }
    
    const result = await uploadScore(entry);
    if (result) success++;
    else failed++;
    
    // Small delay to avoid overwhelming the API
    await new Promise(resolve => setTimeout(resolve, 150));
  }
  
  console.log('\n📈 Migration Complete!');
  console.log(`✅ Success: ${success}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total: ${existingScores.length}`);
  console.log(`\n🌍 View leaderboard: https://shooter-app-one.vercel.app`);
}

migrateScores().catch(console.error);
