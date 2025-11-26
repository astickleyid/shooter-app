/**
 * Migration Script: Upload existing local scores to global leaderboard
 * Run this in the browser console on the game page
 */

const LEADERBOARD_KEY = 'void_rift_leaderboard';
const API_URL = 'https://shooter-app-one.vercel.app/api/leaderboard';

async function migrateLocalScores() {
  console.log('🔄 Starting score migration...');
  
  // Get local scores
  const raw = localStorage.getItem(LEADERBOARD_KEY);
  if (!raw) {
    console.log('❌ No local scores found');
    return;
  }
  
  let entries;
  try {
    entries = JSON.parse(raw);
  } catch (e) {
    console.error('❌ Failed to parse local scores:', e);
    return;
  }
  
  if (!Array.isArray(entries) || entries.length === 0) {
    console.log('❌ No valid entries to migrate');
    return;
  }
  
  console.log(`📊 Found ${entries.length} local scores to upload`);
  
  let success = 0;
  let failed = 0;
  
  for (const entry of entries) {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: entry.username || 'Anonymous',
          score: entry.score,
          level: entry.level || 1,
          difficulty: entry.difficulty || 'normal',
          timestamp: entry.timestamp || Date.now()
        })
      });
      
      if (response.ok) {
        success++;
        console.log(`✅ Uploaded: ${entry.username} - ${entry.score} points`);
      } else {
        failed++;
        console.error(`❌ Failed to upload: ${entry.username}`);
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      failed++;
      console.error(`❌ Error uploading ${entry.username}:`, error.message);
    }
  }
  
  console.log('\n📈 Migration Complete!');
  console.log(`✅ Success: ${success}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total: ${entries.length}`);
}

// Run the migration
migrateLocalScores();
