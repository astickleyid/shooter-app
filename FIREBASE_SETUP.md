# Firebase Backend Setup Guide

> **Note:** This Firebase integration was never wired into a live build (`firebase-config.js`
> always shipped with placeholder credentials, so it never actually initialized) and has
> since been removed from the codebase — `firebase-backend.js`/`firebase-adapter.js`/
> `firebase-config.js` no longer exist. Vercel (`api/*.js`) is the app's real, sole
> production backend. This guide is kept for historical reference only.

## Why Firebase?

Firebase is a simple, easy-to-use backend solution that requires **no server infrastructure**. Perfect for browser games!

### Benefits
- ✅ **Easy Setup** - Just add script tags and config
- ✅ **Free Tier** - Generous limits for indie games
- ✅ **No Servers** - Fully managed infrastructure
- ✅ **Realtime** - Built-in realtime database
- ✅ **Authentication** - Easy user auth system
- ✅ **Works Everywhere** - Browser, iOS, Android

## Quick Setup (5 minutes)

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Name it "void-rift" (or any name you like)
4. Disable Google Analytics (optional)
5. Click "Create project"

### Step 2: Enable Services

#### Enable Realtime Database
1. In Firebase Console, click "Realtime Database"
2. Click "Create Database"
3. Choose location (closest to your users)
4. Start in **test mode** (we'll secure it later)
5. Click "Enable"

#### Enable Authentication
1. Click "Authentication" in sidebar
2. Click "Get started"
3. Click "Email/Password" provider
4. Enable it and click "Save"

### Step 3: Get Your Config

1. Click the gear icon (⚙️) → "Project settings"
2. Scroll down to "Your apps"
3. Click the web icon (</>)
4. Register app name: "void-rift-web"
5. Copy the Firebase config object

It will look like this:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-app.firebaseapp.com",
  databaseURL: "https://your-app.firebaseio.com",
  projectId: "your-app",
  storageBucket: "your-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

### Step 4: Add to Your Game

1. Open `index.html`
2. Add Firebase SDKs before `</body>`:

```html
<!-- Firebase SDKs -->
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-database-compat.js"></script>

<!-- Firebase Backend -->
<script src="firebase-backend.js"></script>

<!-- Initialize Firebase -->
<script>
  // Paste your config here
  const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "your-app.firebaseapp.com",
    databaseURL: "https://your-app.firebaseio.com",
    projectId: "your-app",
    storageBucket: "your-app.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef"
  };

  // Initialize
  FirebaseBackend.initialize(firebaseConfig);
</script>
```

### Step 5: Test It

Open your game in browser and check console. You should see:
```
✅ Firebase initialized successfully
```

**That's it! Your backend is ready!** 🎉

## Usage Examples

### Register a User
```javascript
const result = await FirebaseBackend.register('playerone', 'password123');
if (result.success) {
  console.log('Registered:', result.user);
}
```

### Login
```javascript
const result = await FirebaseBackend.login('playerone', 'password123');
if (result.success) {
  console.log('Logged in:', result.user);
}
```

### Submit Score
```javascript
const result = await FirebaseBackend.submitScore(15000, 20, 'hard', 'playerone');
if (result.success) {
  console.log('Score submitted!');
}
```

### Get Leaderboard
```javascript
const result = await FirebaseBackend.getLeaderboard('all', 100);
console.log('Top scores:', result.entries);
```

### Update Stats
```javascript
await FirebaseBackend.updateStats({
  score: 15000,
  kills: 250,
  deaths: 3,
  accuracy: 78,
  duration: 600000
});
```

## Database Structure

Firebase uses a simple JSON-like structure:

```
void-rift-db/
├── users/
│   └── {userId}/
│       ├── username
│       ├── profile/
│       │   ├── avatar
│       │   ├── level
│       │   ├── xp
│       │   └── highScore
│       ├── stats/
│       │   ├── kills
│       │   ├── deaths
│       │   └── accuracy
│       └── friends/
├── leaderboard/
│   ├── easy/
│   ├── normal/
│   └── hard/
│       └── {scoreId}/
│           ├── userId
│           ├── username
│           ├── score
│           └── timestamp
├── usernames/
│   └── {username}: userId
├── friendRequests/
│   └── {userId}/
└── activity/
    ├── global/
    └── user/
        └── {userId}/
```

## Security Rules

After testing, secure your database:

1. Go to Firebase Console → Realtime Database → Rules
2. Replace with these rules:

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": true,
        ".write": "$uid === auth.uid"
      }
    },
    "leaderboard": {
      ".read": true,
      "$difficulty": {
        ".write": "auth != null"
      }
    },
    "usernames": {
      ".read": true,
      ".write": "auth != null"
    },
    "friendRequests": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "auth != null"
      }
    },
    "activity": {
      "global": {
        ".read": true,
        ".write": "auth != null"
      },
      "user": {
        "$uid": {
          ".read": true,
          ".write": "$uid === auth.uid"
        }
      }
    }
  }
}
```

3. Click "Publish"

## Free Tier Limits

Firebase Spark Plan (Free):
- **Realtime Database**: 1 GB storage, 10 GB/month download
- **Authentication**: Unlimited users
- **Hosting**: 10 GB storage, 360 MB/day
- **Good for**: Up to ~50,000 active players

## Upgrading to Blaze (Pay-as-you-go)

Only pay for what you use:
- Realtime Database: $5/GB stored, $1/GB downloaded
- Still free for low usage
- No monthly fee

## Troubleshooting

### "Firebase not defined"
- Make sure Firebase SDKs are loaded before `firebase-backend.js`
- Check console for script loading errors

### "Permission denied"
- User must be logged in to write data
- Check Firebase security rules
- Verify authentication is working

### "Invalid API key"
- Double-check your Firebase config
- Make sure all config fields are correct
- Verify project is active in Firebase Console

### Database not updating
- Check Firebase Console → Realtime Database → Data tab
- Look for errors in browser console
- Verify security rules allow your operations

## Migration from Vercel KV

If you were using Vercel KV, no migration needed! Firebase Backend uses the same interface:

```javascript
// Old (Vercel KV)
await LeaderboardSystem.submitScore(entry);

// New (Firebase) - same interface!
await FirebaseBackend.submitScore(score, level, difficulty);
```

The game code doesn't need to change!

## Monitoring

View your data in real-time:
1. Go to Firebase Console
2. Click "Realtime Database"
3. Click "Data" tab
4. See all data update in real-time!

## Cost Calculator

Estimate your costs:
- [Firebase Pricing](https://firebase.google.com/pricing)
- [Pricing Calculator](https://firebase.google.com/pricing#blaze-calculator)

For most indie games, you'll stay in the free tier! 🎉

## Support

- [Firebase Documentation](https://firebase.google.com/docs)
- [Realtime Database Guide](https://firebase.google.com/docs/database)
- [Authentication Guide](https://firebase.google.com/docs/auth)

---

**Setup takes 5 minutes. No server infrastructure needed! 🚀**
