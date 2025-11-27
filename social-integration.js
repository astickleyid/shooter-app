/**
 * Social Integration
 * Connects social features with the existing game
 * Now integrated with unified authentication system
 */

// Initialize social features when page loads
document.addEventListener('DOMContentLoaded', () => {
  // Load user session from SocialAPI
  SocialAPI.loadSession();
  
  // Sync with unified auth in main script
  updateSocialUI();

  // Set up periodic online status update
  if (SocialAPI.isLoggedIn()) {
    setInterval(async () => {
      try {
        // Update last active timestamp
        await SocialAPI.updateProfile({});
      } catch (error) {
        // Silently ignore online status update errors
      }
    }, 60000); // Every minute
  }
});

// Update UI based on login state - unified with main game
function updateSocialUI() {
  const user = SocialAPI.currentUser;
  const loginBtn = document.getElementById('loginButton');
  const profileBtn = document.getElementById('profileButton');

  if (user && loginBtn) {
    // Update login button to show username
    loginBtn.textContent = user.username;
    loginBtn.onclick = () => SocialHub.showProfile();
    loginBtn.classList.remove('footer-btn-text');
    loginBtn.classList.add('footer-btn-logged-in');

    // Show level badge on profile button
    if (profileBtn) {
      profileBtn.innerHTML = `👤`;
      profileBtn.title = `Profile (Lvl ${user.profile?.level || 1})`;
    }
  } else if (loginBtn) {
    // Not logged in - show login button
    loginBtn.textContent = 'Login';
    loginBtn.onclick = () => SocialHub.showAuthModal('login');
    loginBtn.classList.add('footer-btn-text');
    loginBtn.classList.remove('footer-btn-logged-in');
  }
  
  // Also update any other UI elements that depend on login state
  updateLeaderboardUI();
}

// Update leaderboard UI elements
function updateLeaderboardUI() {
  const leaderboardUsername = document.getElementById('leaderboardUsername');
  const leaderboardLogin = document.getElementById('leaderboardLogin');
  const leaderboardLogout = document.getElementById('leaderboardLogout');
  
  const isLoggedIn = SocialAPI.isLoggedIn();
  const username = isLoggedIn ? SocialAPI.currentUser?.username : null;
  
  if (leaderboardUsername) {
    leaderboardUsername.textContent = isLoggedIn ? username : 'Not logged in';
  }
  
  if (leaderboardLogin) {
    leaderboardLogin.style.display = isLoggedIn ? 'none' : 'inline-block';
  }
  
  if (leaderboardLogout) {
    leaderboardLogout.style.display = isLoggedIn ? 'inline-block' : 'none';
  }
}

// Hook into game over to submit stats and post activity
window.socialGameOver = async function(finalScore, level, difficulty, stats) {
  if (!SocialAPI.isLoggedIn()) return;

  try {
    // Update user stats
    const result = await SocialAPI.updateStats({
      score: finalScore,
      level: level,
      kills: stats?.kills || 0,
      deaths: stats?.deaths || 0,
      accuracy: stats?.accuracy || 0,
      duration: stats?.playTime || 0
    });

    // Post activity if new high score
    if (result && finalScore >= SocialAPI.currentUser.profile.highScore) {
      await SocialAPI.postActivity('high_score', {
        score: finalScore,
        level: level,
        difficulty: difficulty
      });
    }

    // Post level up activity
    if (result && result.xpGain > 0) {
      const oldLevel = Math.floor((SocialAPI.currentUser.profile.xp - result.xpGain) / 100) + 1;
      const newLevel = result.profile.level;
      
      if (newLevel > oldLevel) {
        await SocialAPI.postActivity('level_up', {
          level: newLevel
        });
      }
    }

    // Update UI
    updateSocialUI();
  } catch (error) {
    // Silently ignore social stats errors
  }
};

// Enhanced leaderboard with social features
window.enhanceLeaderboardWithSocial = function() {
  // Add click handlers to leaderboard entries
  document.querySelectorAll('.leaderboard-entry').forEach(entry => {
    const username = entry.querySelector('.leaderboard-username')?.textContent;
    if (username) {
      entry.style.cursor = 'pointer';
      entry.onclick = () => {
        SocialHub.showProfile(null, username);
      };
    }
  });
};

// Submit score to social leaderboard
window.submitSocialScore = async function(username, score, level, difficulty) {
  if (!SocialAPI.isLoggedIn()) {
    // Use old system
    return GlobalLeaderboard.submitScore({
      username,
      score,
      level,
      difficulty,
      timestamp: Date.now()
    });
  }

  // Submit with user ID
  return GlobalLeaderboard.submitScore({
    userId: SocialAPI.currentUser.id,
    username: SocialAPI.currentUser.username,
    score,
    level,
    difficulty,
    timestamp: Date.now()
  });
};

// Fetch leaderboard with social profiles
window.fetchSocialLeaderboard = async function(difficulty = 'all', limit = 50) {
  const entries = await GlobalLeaderboard.fetchScores(difficulty, limit);
  
  // Enhance leaderboard after render
  setTimeout(enhanceLeaderboardWithSocial, 100);
  
  return entries;
};

// Notification badge counter
async function updateNotificationBadge() {
  if (!SocialAPI.isLoggedIn()) return;

  try {
    const requests = await SocialAPI.getFriendRequests();
    const notifications = await SocialAPI.getNotifications(10);
    
    const unreadCount = requests.received.length + notifications.filter(n => !n.read).length;
    
    const friendsBtn = document.getElementById('friendsButton');
    if (friendsBtn && unreadCount > 0) {
      friendsBtn.innerHTML = `👥`;
      const badge = document.createElement('span');
      badge.className = 'notification-badge-small';
      badge.textContent = unreadCount;
      friendsBtn.appendChild(badge);
    }
  } catch (error) {
    // Silently ignore notification errors
  }
}

// Check for notifications periodically
if (typeof SocialAPI !== 'undefined' && SocialAPI.isLoggedIn()) {
  updateNotificationBadge();
  setInterval(updateNotificationBadge, 30000); // Every 30 seconds
}

// Export for use in other scripts
if (typeof window !== 'undefined') {
  window.SocialIntegration = {
    updateUI: updateSocialUI,
    gameOver: socialGameOver,
    submitScore: submitSocialScore,
    fetchLeaderboard: fetchSocialLeaderboard,
    updateNotifications: updateNotificationBadge
  };
}
