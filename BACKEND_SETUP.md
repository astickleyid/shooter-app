# Global Leaderboard Backend Setup

This guide explains how to deploy the global leaderboard backend for VOID RIFT.

## Overview

The game now supports a **global leaderboard** that stores scores from all players across all devices. This requires deploying a simple serverless API.

## Quick Setup (Recommended: Vercel)

### Prerequisites
- GitHub account (you already have one!)
- Vercel account (free, sign up with GitHub)

### Step-by-Step Instructions

1. **Install Vercel CLI** (optional, but recommended)
   ```bash
   npm install -g vercel
   ```

2. **Deploy to Vercel**
   
   **Option A: Using Vercel CLI (Easiest)**
   ```bash
   cd shooter-app
   vercel login
   vercel
   ```
   Follow the prompts:
   - Link to existing project? No
   - Project name: shooter-app (or any name you want)
   - Directory: ./ (current directory)
   - Deploy? Yes

   **Option B: Using Vercel Web Interface**
   - Go to https://vercel.com
   - Click "New Project"
   - Import your GitHub repository: astickleyid/shooter-app
   - Click "Deploy"

3. **Update API URL**
   
   After deployment, Vercel will give you a URL like:
   ```
   https://shooter-app-xxx.vercel.app
   ```
   
   Update `backend-api.js` line 14:
   ```javascript
   API_URL: 'https://YOUR-APP-NAME.vercel.app/api/leaderboard',
   ```

4. **Test the Backend**
   
   Open your game and check the browser console. You should see:
   ```
   ✓ Fetched X global scores
   🌍 Global Leaderboard
   ```

5. **Commit and Push**
   ```bash
   git add backend-api.js
   git commit -m "Update API URL for production"
   git push
   ```

## How It Works

### Architecture
```
Player Browser → backend-api.js → Vercel Serverless Function → In-Memory Storage
```

### Files
- **api/leaderboard.js** - Serverless API endpoint
- **backend-api.js** - Frontend client that calls the API
- **vercel.json** - Vercel deployment configuration

### API Endpoints

**GET /api/leaderboard**
- Fetches leaderboard entries
- Query params: `difficulty=all|easy|normal|hard`, `limit=50`
- Returns: `{ success: true, entries: [...] }`

**POST /api/leaderboard**
- Submits a new score
- Body: `{ username, score, level, difficulty, timestamp }`
- Returns: `{ success: true, entry: {...}, rank: 1 }`

## Important Notes

### Data Persistence
⚠️ The current implementation uses **in-memory storage**, which means:
- Data resets when the serverless function restarts (every ~15 minutes of inactivity)
- For permanent storage, upgrade to a database (see below)

### Production-Ready Upgrade

For a production game with permanent storage, choose one of these options:

#### Option 1: Vercel KV (Redis) - Easiest
```bash
npm install @vercel/kv
```

Update `api/leaderboard.js`:
```javascript
import { kv } from '@vercel/kv';

// Save score
await kv.zadd('leaderboard', { score: entry.score, member: JSON.stringify(entry) });

// Get top scores
const entries = await kv.zrange('leaderboard', 0, 49, { rev: true });
```

#### Option 2: Supabase (PostgreSQL) - Most Powerful
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
3. Use Supabase client in your API

#### Option 3: Firebase Realtime Database
1. Create Firebase project
2. Enable Realtime Database
3. Use Firebase SDK in your API

## Alternative: Use Existing Backend Services

If you don't want to deploy your own backend:

1. **PocketBase** (Self-hosted)
   - Download from https://pocketbase.io
   - Run locally or on a VPS
   - Built-in admin UI

2. **Firebase** (Google)
   - No deployment needed
   - Free tier: 10GB storage, 100k reads/day

3. **Supabase** (Open source)
   - PostgreSQL database
   - Free tier: 500MB storage, unlimited API requests

## Troubleshooting

### "Failed to fetch scores" in console
- Check if API_URL is correct in `backend-api.js`
- Verify Vercel deployment succeeded
- Check CORS headers are enabled

### Leaderboard shows "Local Scores"
- Backend connection failed
- Game falls back to localStorage
- Check browser console for error details

### Scores not persisting between sessions
- Expected behavior with in-memory storage
- Upgrade to database solution (see above)

## Security Notes

Current implementation is basic and suitable for casual games. For production:

1. **Add rate limiting** to prevent spam
2. **Validate scores** on backend (prevent cheating)
3. **Add authentication** to verify users
4. **Use database** for persistence
5. **Add score verification** (hash scores, server-side validation)

## Cost

**Vercel Free Tier:**
- 100GB bandwidth/month
- 100 serverless function executions/day
- Plenty for most indie games!

**Estimated usage:**
- 1000 players/day
- ~2000 API calls (view + submit)
- ~20MB bandwidth
- **Cost: $0** 🎉

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify API endpoint is accessible
3. Check Vercel deployment logs
4. Create GitHub issue on shooter-app repo

---

**That's it!** Your game now has a global leaderboard! 🚀🏆
