/**
 * Firebase Backend for VOID RIFT
 * Simple, easy-to-setup backend using Firebase Realtime Database
 * No server infrastructure required - just add your Firebase config
 */

const FirebaseBackend = {
  db: null,
  auth: null,
  initialized: false,
  config: null,

  /**
   * Initialize Firebase with your project config
   * Get config from: https://console.firebase.google.com/
   * 
   * @param {Object} config - Firebase configuration object
   * @example
   * FirebaseBackend.initialize({
   *   apiKey: "YOUR_API_KEY",
   *   authDomain: "your-app.firebaseapp.com",
   *   databaseURL: "https://your-app.firebaseio.com",
   *   projectId: "your-app",
   *   storageBucket: "your-app.appspot.com",
   *   messagingSenderId: "123456789",
   *   appId: "1:123456789:web:abcdef"
   * });
   */
  async initialize(config) {
    if (this.initialized) {
      console.log('🔥 Firebase already initialized');
      return;
    }

    if (!config) {
      console.error('❌ Firebase config required. See FIREBASE_SETUP.md');
      return;
    }

    try {
      // Initialize Firebase
      const app = firebase.initializeApp(config);
      this.db = firebase.database();
      this.auth = firebase.auth();
      this.config = config;
      this.initialized = true;

      console.log('✅ Firebase initialized successfully');

      // Set up auth state listener
      this.auth.onAuthStateChanged((user) => {
        if (user) {
          console.log('👤 User signed in:', user.uid);
          this.updateUserActivity(user.uid);
        }
      });

      return true;
    } catch (error) {
      console.error('❌ Firebase initialization failed:', error);
      return false;
    }
  },

  /**
   * Register a new user
   */
  async register(username, password, email = null) {
    try {
      // Create auth account
      const userCredential = await this.auth.createUserWithEmailAndPassword(
        email || `${username}@voidrift.game`,
        password
      );
      
      const userId = userCredential.user.uid;

      // Create user profile
      const userProfile = {
        id: userId,
        username,
        email: email || null,
        createdAt: Date.now(),
        profile: {
          avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${userId}`,
          bio: '',
          level: 1,
          xp: 0,
          gamesPlayed: 0,
          totalScore: 0,
          highScore: 0,
          achievements: [],
          badges: ['rookie']
        },
        stats: {
          wins: 0,
          losses: 0,
          kills: 0,
          deaths: 0,
          accuracy: 0,
          playTime: 0
        },
        friends: [],
        lastActive: Date.now()
      };

      // Save to database
      await this.db.ref(`users/${userId}`).set(userProfile);
      await this.db.ref(`usernames/${username.toLowerCase()}`).set(userId);

      console.log('✅ User registered:', username);
      return { success: true, user: userProfile };
    } catch (error) {
      console.error('❌ Registration failed:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Login user
   */
  async login(username, password) {
    try {
      // Get userId from username
      const userIdSnapshot = await this.db.ref(`usernames/${username.toLowerCase()}`).once('value');
      const userId = userIdSnapshot.val();

      if (!userId) {
        return { success: false, error: 'User not found' };
      }

      // Get user profile to find email
      const userSnapshot = await this.db.ref(`users/${userId}`).once('value');
      const user = userSnapshot.val();

      if (!user) {
        return { success: false, error: 'User not found' };
      }

      // Sign in
      const email = user.email || `${username}@voidrift.game`;
      await this.auth.signInWithEmailAndPassword(email, password);

      // Update last active
      await this.db.ref(`users/${userId}/lastActive`).set(Date.now());

      console.log('✅ User logged in:', username);
      return { success: true, user };
    } catch (error) {
      console.error('❌ Login failed:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Logout user
   */
  async logout() {
    try {
      await this.auth.signOut();
      console.log('✅ User logged out');
      return { success: true };
    } catch (error) {
      console.error('❌ Logout failed:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get current user
   */
  getCurrentUser() {
    return this.auth.currentUser;
  },

  /**
   * Submit score to leaderboard
   */
  async submitScore(score, level, difficulty, username = null) {
    try {
      const user = this.getCurrentUser();
      if (!user) {
        return { success: false, error: 'Must be logged in to submit scores' };
      }

      const scoreEntry = {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: user.uid,
        username: username || user.displayName || user.email.split('@')[0],
        score: Math.floor(score),
        level: Math.floor(level),
        difficulty,
        timestamp: Date.now()
      };

      // Add to leaderboard (sorted by score)
      await this.db.ref(`leaderboard/${difficulty}/${scoreEntry.id}`).set(scoreEntry);

      // Update user high score
      const userRef = this.db.ref(`users/${user.uid}`);
      const userSnapshot = await userRef.once('value');
      const userData = userSnapshot.val();

      if (userData && score > userData.profile.highScore) {
        await userRef.child('profile/highScore').set(score);
      }

      console.log('✅ Score submitted:', score);
      return { success: true, entry: scoreEntry };
    } catch (error) {
      console.error('❌ Score submission failed:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get leaderboard scores
   */
  async getLeaderboard(difficulty = 'all', limit = 100) {
    try {
      let entries = [];

      if (difficulty === 'all') {
        // Get from all difficulties
        const difficulties = ['easy', 'normal', 'hard'];
        for (const diff of difficulties) {
          const snapshot = await this.db.ref(`leaderboard/${diff}`)
            .orderByChild('score')
            .limitToLast(limit)
            .once('value');
          
          if (snapshot.exists()) {
            const diffEntries = Object.values(snapshot.val());
            entries = entries.concat(diffEntries);
          }
        }
      } else {
        // Get from specific difficulty
        const snapshot = await this.db.ref(`leaderboard/${difficulty}`)
          .orderByChild('score')
          .limitToLast(limit)
          .once('value');
        
        if (snapshot.exists()) {
          entries = Object.values(snapshot.val());
        }
      }

      // Sort by score descending
      entries.sort((a, b) => b.score - a.score);
      entries = entries.slice(0, limit);

      console.log('✅ Leaderboard fetched:', entries.length, 'entries');
      return { success: true, entries, count: entries.length };
    } catch (error) {
      console.error('❌ Leaderboard fetch failed:', error);
      return { success: false, error: error.message, entries: [] };
    }
  },

  /**
   * Get user profile
   */
  async getUserProfile(userId) {
    try {
      const snapshot = await this.db.ref(`users/${userId}`).once('value');
      const user = snapshot.val();

      if (!user) {
        return { success: false, error: 'User not found' };
      }

      // Remove sensitive data
      delete user.email;

      return { success: true, user };
    } catch (error) {
      console.error('❌ Profile fetch failed:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Update user stats after game
   */
  async updateStats(stats) {
    try {
      const user = this.getCurrentUser();
      if (!user) {
        return { success: false, error: 'Must be logged in' };
      }

      const userRef = this.db.ref(`users/${user.uid}`);
      const snapshot = await userRef.once('value');
      const userData = snapshot.val();

      if (!userData) {
        return { success: false, error: 'User not found' };
      }

      // Update stats
      const updates = {};
      updates['profile/gamesPlayed'] = (userData.profile.gamesPlayed || 0) + 1;
      updates['profile/totalScore'] = (userData.profile.totalScore || 0) + (stats.score || 0);
      updates['profile/highScore'] = Math.max(userData.profile.highScore || 0, stats.score || 0);
      updates['stats/kills'] = (userData.stats.kills || 0) + (stats.kills || 0);
      updates['stats/deaths'] = (userData.stats.deaths || 0) + (stats.deaths || 0);
      updates['stats/playTime'] = (userData.stats.playTime || 0) + (stats.duration || 0);

      // Update XP and level
      const xpGain = Math.floor((stats.score || 0) / 10);
      const newXP = (userData.profile.xp || 0) + xpGain;
      const newLevel = Math.floor(newXP / 100) + 1;
      updates['profile/xp'] = newXP;
      updates['profile/level'] = newLevel;

      // Update accuracy
      if (stats.accuracy) {
        const gamesPlayed = userData.profile.gamesPlayed || 0;
        const currentAccuracy = userData.stats.accuracy || 0;
        const newAccuracy = Math.round((currentAccuracy * gamesPlayed + stats.accuracy) / (gamesPlayed + 1));
        updates['stats/accuracy'] = newAccuracy;
      }

      updates['lastActive'] = Date.now();

      await userRef.update(updates);

      console.log('✅ Stats updated');
      return { success: true, xpGain, level: newLevel };
    } catch (error) {
      console.error('❌ Stats update failed:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Send friend request
   */
  async sendFriendRequest(toUserId) {
    try {
      const user = this.getCurrentUser();
      if (!user) {
        return { success: false, error: 'Must be logged in' };
      }

      const requestId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const request = {
        id: requestId,
        from: user.uid,
        to: toUserId,
        timestamp: Date.now(),
        status: 'pending'
      };

      await this.db.ref(`friendRequests/${toUserId}/${requestId}`).set(request);

      console.log('✅ Friend request sent');
      return { success: true };
    } catch (error) {
      console.error('❌ Friend request failed:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Accept friend request
   */
  async acceptFriendRequest(requestId) {
    try {
      const user = this.getCurrentUser();
      if (!user) {
        return { success: false, error: 'Must be logged in' };
      }

      // Get request
      const requestSnapshot = await this.db.ref(`friendRequests/${user.uid}/${requestId}`).once('value');
      const request = requestSnapshot.val();

      if (!request) {
        return { success: false, error: 'Request not found' };
      }

      // Add to friends lists (store as array for consistency with friends: [])
      await this.db.ref(`users/${user.uid}/friends`).transaction((current) => {
        const friendUid = request.from;
        if (Array.isArray(current)) {
          if (current.includes(friendUid)) {
            return current;
          }
          return current.concat(friendUid);
        }
        if (current === null || current === undefined) {
          return [friendUid];
        }
        // If existing data is not an array, preserve it by returning it unchanged
        // to avoid unexpected data loss. Callers should normalize if needed.
        return current;
      });

      await this.db.ref(`users/${request.from}/friends`).transaction((current) => {
        const friendUid = user.uid;
        if (Array.isArray(current)) {
          if (current.includes(friendUid)) {
            return current;
          }
          return current.concat(friendUid);
        }
        if (current === null || current === undefined) {
          return [friendUid];
        }
        // If existing data is not an array, preserve it by returning it unchanged
        // to avoid unexpected data loss. Callers should normalize if needed.
        return current;
      });
      // Remove request
      await this.db.ref(`friendRequests/${user.uid}/${requestId}`).remove();

      console.log('✅ Friend request accepted');
      return { success: true };
    } catch (error) {
      console.error('❌ Accept friend request failed:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Post activity
   */
  async postActivity(type, data) {
    try {
      const user = this.getCurrentUser();
      if (!user) {
        return { success: false, error: 'Must be logged in' };
      }

      const activity = {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: user.uid,
        type,
        data,
        timestamp: Date.now()
      };

      // Add to global activity feed
      await this.db.ref(`activity/global`).push(activity);

      // Add to user's activity
      await this.db.ref(`activity/user/${user.uid}`).push(activity);

      console.log('✅ Activity posted');
      return { success: true };
    } catch (error) {
      console.error('❌ Post activity failed:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get activity feed
   */
  async getActivityFeed(limit = 50) {
    try {
      const snapshot = await this.db.ref('activity/global')
        .orderByChild('timestamp')
        .limitToLast(limit)
        .once('value');

      const activities = snapshot.exists() ? Object.values(snapshot.val()) : [];
      activities.sort((a, b) => b.timestamp - a.timestamp);

      return { success: true, activities };
    } catch (error) {
      console.error('❌ Activity feed fetch failed:', error);
      return { success: false, error: error.message, activities: [] };
    }
  },

  /**
   * Update user activity timestamp
   */
  async updateUserActivity(userId = null) {
    try {
      const user = userId || (this.getCurrentUser() && this.getCurrentUser().uid);
      if (!user) return;

      await this.db.ref(`users/${user}/lastActive`).set(Date.now());
    } catch (error) {
      console.error('❌ Update activity failed:', error);
    }
  },

  /**
   * Health check
   */
  async healthCheck() {
    try {
      if (!this.initialized) {
        return { success: false, status: 'not_initialized' };
      }

      // Test database connection
      await this.db.ref('.info/connected').once('value');

      return {
        success: true,
        status: 'healthy',
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        success: false,
        status: 'error',
        error: error.message,
        timestamp: Date.now()
      };
    }
  }
};

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.FirebaseBackend = FirebaseBackend;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = FirebaseBackend;
}
