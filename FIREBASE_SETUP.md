# Firebase Configuration Guide for VOID RIFT v2.0

This guide will help you set up Firebase to enable cloud features (authentication and leaderboard).

## Prerequisites
- A Google account
- Basic knowledge of Firebase console

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add project" or "Create a project"
3. Enter project name: `void-rift` (or your preferred name)
4. Enable Google Analytics (optional)
5. Click "Create project" and wait for setup to complete

## Step 2: Enable Authentication

1. In your Firebase project, click "Authentication" in the left sidebar
2. Click "Get started"
3. Click on "Email/Password" under Sign-in providers
4. Toggle "Enable" and click "Save"

## Step 3: Create Firestore Database

1. Click "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in production mode" (we'll set rules later)
4. Select a location closest to your users
5. Click "Enable"

## Step 4: Set Firestore Security Rules

1. In Firestore Database, click on the "Rules" tab
2. Replace the rules with the following:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read access to leaderboard for everyone
    match /leaderboard/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow users to read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Health check for connectivity
    match /_health/{document} {
      allow read, write: if true;
    }
  }
}
```

3. Click "Publish"

## Step 5: Get Your Firebase Config

1. Click the gear icon ⚙️ next to "Project Overview"
2. Click "Project settings"
3. Scroll down to "Your apps" section
4. Click the web icon `</>` to add a web app
5. Register app with nickname: `VOID RIFT Web`
6. Copy the Firebase configuration object

It will look something like this:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};
```

## Step 6: Update Your Game Code

1. Open `script.js` in a text editor
2. Find the `FIREBASE_CONFIG` constant near the top (around line 3)
3. Replace the demo config with your actual config:

```javascript
const FIREBASE_CONFIG = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

4. Save the file

## Step 7: Test Your Setup

1. Open your game in a web browser
2. You should see "ALL SYSTEMS ONLINE" in green instead of "OFFLINE MODE"
3. Click "Sign In / Create Account"
4. Create a test account with any email and password (minimum 6 characters)
5. Play a game and check if your score appears on the leaderboard

## Troubleshooting

### "OFFLINE MODE" still showing
- Check that your Firebase config is correct
- Open browser console (F12) and look for error messages
- Verify that Authentication and Firestore are enabled in Firebase Console

### Authentication errors
- Make sure Email/Password provider is enabled in Firebase Authentication
- Check that the email format is valid
- Password must be at least 6 characters

### Leaderboard not updating
- Check Firestore security rules are published correctly
- Verify user is signed in (check console logs)
- Look for errors in browser console

### CORS or network errors
- Make sure you're accessing the game via HTTP/HTTPS, not file://
- Check that your domain is authorized in Firebase settings

## Production Deployment

When deploying to production:

1. **Firebase Hosting (Recommended)**:
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase init hosting
   firebase deploy
   ```

2. **Other hosting**: Simply upload `index.html`, `script.js`, and `style.css` to your host

3. **Authorized domains**: Add your domain in Firebase Console → Authentication → Settings → Authorized domains

## Cost Considerations

Firebase free tier includes:
- 50,000 reads/day for Firestore
- 20,000 writes/day for Firestore
- 10,000 auth users

This is more than sufficient for most games. Monitor usage in Firebase Console.

## Support

For Firebase-specific issues, check:
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Status](https://status.firebase.google.com/)
- [Stack Overflow - Firebase Tag](https://stackoverflow.com/questions/tagged/firebase)
