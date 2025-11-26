# 🚀 Quick Start - Global Leaderboard

## Status Check

✅ Navigation features (pause, restart, exit) - **ALREADY WORKING**  
✅ Code implemented and pushed to GitHub  
⏳ Backend deployment - **NEEDS YOUR ACTION**

## Deploy in 3 Steps

### Step 1: Install Vercel CLI (one time only)
```bash
npm install -g vercel
```

### Step 2: Deploy
```bash
cd /Users/austinstickley/shooter-app
./deploy.sh
```

### Step 3: Update API URL
After deployment, copy your URL (e.g., `https://shooter-app-xxx.vercel.app`)

Edit `backend-api.js` line 14:
```javascript
API_URL: 'https://YOUR-URL-HERE.vercel.app/api/leaderboard',
```

Then commit:
```bash
git add backend-api.js
git commit -m "Update API URL for production"
git push
```

## Test It

1. **Test Backend:**
   - Open `test-backend.html` in browser
   - Click "Test Connection"
   - Should see ✅ Backend is reachable!

2. **Test In-Game:**
   - Play game and submit score
   - Open leaderboard
   - Should see "🌍 Global Leaderboard" badge

## Troubleshooting

**"Backend not reachable"**
- Check if you deployed with `./deploy.sh`
- Verify API_URL is correct in backend-api.js

**"📱 Local Scores" showing**
- Backend not deployed yet, or URL incorrect
- Game works fine, just using local storage

**Need help?**
- Read: `BACKEND_SETUP.md`
- Full docs: `GLOBAL_LEADERBOARD_IMPLEMENTATION.md`

## Alternative: Skip Backend Deployment

The game works perfectly without the backend! It will use localStorage (device-local scores only).

To disable global leaderboard entirely, edit `backend-api.js` line 16:
```javascript
USE_GLOBAL: false,  // Change true to false
```

---

**That's it!** 🎮 Your game is ready with or without the backend.
