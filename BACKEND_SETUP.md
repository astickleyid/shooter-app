# Global Leaderboard Backend Setup

This guide explains how to deploy the global leaderboard backend for VOID RIFT with persistent storage using Vercel KV.

## Overview

The game now supports a **global leaderboard** that stores scores from all players across all devices using **Vercel KV (Redis)** for persistent storage. Scores are saved permanently and will persist across server restarts.

## Quick Setup (Recommended: Vercel with KV)

### Prerequisites
- GitHub account (you already have one!)
- Vercel account (free, sign up with GitHub)

### Step-by-Step Instructions

1. **Deploy to Vercel**

   **Option A: Using Vercel Web Interface (Recommended)**
   - Go to https://vercel.com
   - Click "New Project"
   - Import your GitHub repository: astickleyid/shooter-app
   - Click "Deploy"

   **Option B: Using Vercel CLI**
   ```bash
   npm install -g vercel
   cd shooter-app
   vercel login
   vercel --prod
   ```

2. **Set Up Vercel KV (Persistent Storage)**

   After deployment:
   - Go to your project dashboard on Vercel
   - Click "Storage" tab
   - Click "Create Database" → Select "KV"
   - Name it `shooter-leaderboard`
   - Click "Create"
   - Vercel will automatically add the required environment variables

3. **Update API URL**
   
   After deployment, Vercel will give you a URL like:
   ```
   https://shooter-app-xxx.vercel.app
   ```
   
   Update `backend-api.js` line 9:
   ```javascript
   API_URL: 'https://YOUR-APP-NAME.vercel.app/api/leaderboard',
   ```

4. **Redeploy**
   
   Push your changes to trigger a new deployment:
   ```bash
   git add backend-api.js
   git commit -m "Update API URL for production"
   git push
   ```

5. **Test the Backend**
   
   Open your game and check the browser console. You should see:
   ```
   ✓ Fetched X global scores (persistent storage)
   🌍 Global Leaderboard
   ```

## How It Works

### Architecture
```
Player Browser → backend-api.js → Vercel API → Vercel KV (Redis)
                                             ↓
                               Scores persist permanently!
```

### Files
- **api/leaderboard.js** - Serverless API endpoint with KV integration
- **backend-api.js** - Frontend client that calls the API
- **vercel.json** - Vercel deployment configuration
- **package.json** - Includes @vercel/kv dependency

### API Endpoints

**GET /api/leaderboard**
- Fetches leaderboard entries from persistent storage
- Query params: `difficulty=all|easy|normal|hard`, `limit=100`
- Returns: `{ success: true, entries: [...], storage: 'persistent', count: X }`

**POST /api/leaderboard**
- Submits a new score to persistent storage
- Body: `{ username, score, level, difficulty, timestamp }`
- Returns: `{ success: true, entry: {...}, rank: 1, storage: 'persistent' }`

## Features

### Persistent Storage ✅
- Scores are stored in Vercel KV (Redis)
- Data persists across server restarts
- No data loss when serverless function scales down

### Fallback System
- If KV is unavailable, falls back to in-memory storage
- API response includes `storage` field indicating which storage is used

### Retry Logic
- Frontend retries failed requests up to 2 times
- Exponential backoff between retries

### Score Validation
- Username limited to 30 characters
- Score must be non-negative integer
- Difficulty must be 'easy', 'normal', or 'hard'

## Vercel KV Pricing

**Free Tier (Hobby):**
- 256 MB storage
- 30,000 requests/month
- 100 concurrent connections
- **Cost: $0** 🎉

**Pro Tier ($20/month):**
- 1 GB storage
- Unlimited requests
- 1,000 concurrent connections

For most indie games, the free tier is plenty!

## Troubleshooting

### "Failed to fetch scores" in console
- Check if API_URL is correct in `backend-api.js`
- Verify Vercel deployment succeeded
- Check if Vercel KV is set up correctly

### Storage shows "memory" instead of "persistent"
- Vercel KV environment variables not set
- Go to Vercel dashboard → Storage → Connect existing database
- Or create a new KV database

### Leaderboard shows "Local Scores"
- Backend connection failed
- Game falls back to localStorage
- Check browser console for error details

### Scores not appearing after submission
- Check browser console for errors
- Verify KV database is connected in Vercel dashboard
- Check KV database contents in Vercel dashboard

## Security Notes

Current implementation is suitable for casual games. For production:

1. ✅ CORS enabled (all origins allowed)
2. ✅ Input validation (username, score, difficulty)
3. ✅ Basic rate limiting (5 submissions/min per authenticated player, 2 unauthenticated attempts)
4. ✅ Authentication required (SocialAPI sessions attach `Authorization: Bearer <token>`)
5. ✅ Score sanity checks (reject extreme/implausible values)

**Recommendations for Production:**
- Tune rate limits for your audience (edit `RATE_LIMIT_*` in `api/leaderboard.js`)
- Keep SocialAPI sessions short-lived and rotate on login
- Add server-side signing/hashing for scores if you need stronger anti-cheat

## Alternative Storage Options

If you prefer not to use Vercel KV:

### Supabase (PostgreSQL)
1. Create free account at https://supabase.com
2. Create table:
   ```sql
   CREATE TABLE leaderboard (
     id BIGSERIAL PRIMARY KEY,
     username TEXT NOT NULL,
     score INTEGER NOT NULL,
     level INTEGER NOT NULL,
     difficulty TEXT NOT NULL,
     timestamp BIGINT NOT NULL
   );
   
   CREATE INDEX idx_score ON leaderboard(score DESC);
   CREATE INDEX idx_difficulty ON leaderboard(difficulty);
   ```
3. Update api/leaderboard.js to use Supabase client

### Firebase Realtime Database
1. Create Firebase project
2. Enable Realtime Database
3. Update api/leaderboard.js to use Firebase SDK

---

**That's it!** Your game now has a global leaderboard with persistent storage! 🚀🏆
