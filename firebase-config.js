/**
 * VOID RIFT — Firebase Configuration
 *
 * 1. Go to https://console.firebase.google.com/
 * 2. Create a project → Add Web App → copy the config object
 * 3. Paste your values below — NEVER commit real keys to public repos
 * 4. Enable: Authentication (Email/Password) + Realtime Database
 *    Database rules: start with test mode, then lock down per FIREBASE_SETUP.md
 */
window.FIREBASE_CONFIG = {
  apiKey:            "PASTE_YOUR_API_KEY",
  authDomain:        "your-project.firebaseapp.com",
  databaseURL:       "https://your-project-default-rtdb.firebaseio.com",
  projectId:         "your-project",
  storageBucket:     "your-project.appspot.com",
  messagingSenderId: "000000000000",
  appId:             "1:000000000000:web:xxxxxxxxxxxx"
};
