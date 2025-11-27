/**
 * Social Integration
 * Connects social features with the existing game
 */

// Initialize social features when page loads
document.addEventListener('DOMContentLoaded', () => {
  // Load user session
  SocialAPI.loadSession();
  updateSocialUI();

  // Set up periodic online status update
  if (SocialAPI.isLoggedIn()) {
    setInterval(async () => {
      try {
        // Update last active timestamp
        await SocialAPI.updateProfile({});
      } catch (error) {
        console.error('Failed to update online status:', error);
      }
    }, 60000); // Every minute
  }
});

// Update UI based on login state
function updateSocialUI() {
  const user = SocialAPI.currentUser;
  const loginBtn = document.getElementById('loginButton');
  const profileBtn = document.getElementById('profileButton');

  if (user && loginBtn) {
    loginBtn.innerHTML = `
      <img src="${user.profile.avatar}" alt="${user.username}" class="nav-avatar">
      ${user.username}
    `;
    loginBtn.onclick = () => SocialHub.showProfile();
    loginBtn.classList.remove('menuTertiary');
    loginBtn.classList.add('menuSecondary');

    // Show level badge
    if (profileBtn) {
      profileBtn.innerHTML = `👤 Profile (Lvl ${user.profile.level})`;
    }
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
    console.error('Failed to update social stats:', error);
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
  const userId = SocialAPI.currentUser?.id;
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
      friendsBtn.innerHTML = `👥 Friends <span class="notification-badge">${unreadCount}</span>`;
    }
  } catch (error) {
    console.error('Failed to update notifications:', error);
  }
}

// Check for notifications periodically
if (SocialAPI.isLoggedIn()) {
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
