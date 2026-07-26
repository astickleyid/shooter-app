/* ============================================================
   VOID RIFT — Game Center-first mode (iOS native)

   On native iOS, routes identity / leaderboards / achievements
   through Apple Game Center. Keeps local progress (saves, hangar)
   but disables custom account-creation UI (App Store 5.1.1(v)).

   No-op on web builds.
   ============================================================ */
(function () {
  'use strict';

  var isNativeIOS = !!(window.webkit &&
                       window.webkit.messageHandlers &&
                       window.webkit.messageHandlers.gcAuthenticate);
  if (!isNativeIOS) return;

  document.documentElement.classList.add('gc-only');
  window.VOID_RIFT_GC_ONLY = true;

  function gc() {
    return window.iOSBridge && window.iOSBridge.gameCenter;
  }

  function isGCAuthed() {
    var g = gc();
    return !!(g && g.isAuthenticated);
  }

  function openGameCenterLeaderboard(leaderboardID) {
    try {
      if (window.UnifiedSocial && typeof window.UnifiedSocial.showLeaderboard === 'function') {
        window.UnifiedSocial.showLeaderboard(leaderboardID || 'highScore');
        return false;
      }
      if (gc() && typeof gc().showLeaderboard === 'function') {
        gc().showLeaderboard(leaderboardID || 'com.voidrift.highscore');
        return false;
      }
      window.webkit.messageHandlers.gcShowLeaderboard.postMessage({
        leaderboardID: leaderboardID || 'com.voidrift.highscore'
      });
    } catch (e) {
      console.warn('[GC] showLeaderboard failed', e);
    }
    return false;
  }

  function openGameCenterAchievements() {
    try {
      if (window.UnifiedSocial && typeof window.UnifiedSocial.showAchievements === 'function') {
        window.UnifiedSocial.showAchievements();
        return false;
      }
      if (gc() && typeof gc().showAchievements === 'function') {
        gc().showAchievements();
        return false;
      }
      window.webkit.messageHandlers.gcShowAchievements.postMessage({});
    } catch (e) {
      console.warn('[GC] showAchievements failed', e);
    }
    return false;
  }

  function promptGameCenterSignIn() {
    try {
      if (gc() && typeof gc().authenticate === 'function') {
        gc().authenticate();
      } else {
        window.webkit.messageHandlers.gcAuthenticate.postMessage({});
      }
    } catch (e) {
      console.warn('[GC] authenticate failed', e);
    }
    return false;
  }

  function updateLoginChrome() {
    var alias = null;
    if (isGCAuthed() && gc().playerInfo && gc().playerInfo.alias) {
      alias = gc().playerInfo.alias;
    } else if (window.UnifiedSocial && window.UnifiedSocial.isGameCenterAuthenticated) {
      alias = window.UnifiedSocial.getUsername && window.UnifiedSocial.getUsername();
      if (alias === 'Guest') alias = null;
    }

    var loginBtn = document.getElementById('loginButton');
    if (loginBtn) {
      if (alias) {
        loginBtn.textContent = 'GC · ' + alias;
        loginBtn.setAttribute('aria-label', 'Game Center profile for ' + alias);
        loginBtn.onclick = function (e) {
          e.preventDefault();
          openGameCenterAchievements();
        };
      } else {
        loginBtn.textContent = 'Game Center';
        loginBtn.setAttribute('aria-label', 'Sign in with Game Center');
        loginBtn.onclick = function (e) {
          e.preventDefault();
          promptGameCenterSignIn();
        };
      }
    }

    // Leaderboard nav button → native GC
    var lbBtn = document.getElementById('leaderboardButton');
    if (lbBtn) {
      lbBtn.onclick = function (e) {
        e.preventDefault();
        openGameCenterLeaderboard('com.voidrift.highscore');
      };
    }

    // Hide auth prompts that imply custom accounts
    var loginPrompt = document.getElementById('gameOverLoginPrompt');
    if (loginPrompt) {
      if (alias) {
        loginPrompt.style.display = 'none';
      } else {
        loginPrompt.style.display = '';
        loginPrompt.innerHTML =
          '<p>Sign in with Game Center to climb the global leaderboards and unlock achievements.</p>';
      }
    }
    var goLogin = document.getElementById('gameOverLoginBtn');
    if (goLogin) {
      goLogin.textContent = alias ? 'Achievements' : 'Game Center';
      goLogin.onclick = function (e) {
        e.preventDefault();
        if (alias) openGameCenterAchievements();
        else promptGameCenterSignIn();
      };
    }
  }

  function neutralizeSocial() {
    if (window.SocialUI) {
      var openLB = function () { return openGameCenterLeaderboard(); };
      var openAuth = function () { return promptGameCenterSignIn(); };
      var openAch = function () { return openGameCenterAchievements(); };
      SocialUI.showAuthModal = openAuth;
      SocialUI.showProfileModal = openAch;
      SocialUI.showLoginModal = openAuth;
      SocialUI.showLeaderboardModal = openLB;
      if (typeof SocialUI.init === 'function') SocialUI.init = function () {};
    }

    // Strip any injected custom-auth modals
    var modals = document.querySelectorAll('.social-modal, #authModal');
    for (var i = 0; i < modals.length; i++) {
      if (modals[i] && modals[i].parentNode) modals[i].parentNode.removeChild(modals[i]);
    }

    updateLoginChrome();
  }

  // Native share helper for game-over / high scores
  window.shareVoidRiftScore = function (score, level) {
    var text = 'I scored ' + (score || 0).toLocaleString() +
      ' on wave ' + (level || 1) + ' in VOID RIFT! 🚀';
    try {
      if (window.iOSBridge && typeof window.iOSBridge.share === 'function') {
        window.iOSBridge.share({ text: text });
        return true;
      }
      if (navigator.share) {
        navigator.share({ title: 'VOID RIFT', text: text });
        return true;
      }
    } catch (e) {}
    return false;
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', neutralizeSocial);
  } else {
    neutralizeSocial();
  }
  window.addEventListener('load', neutralizeSocial);
  window.addEventListener('gameCenterAuth', function () {
    neutralizeSocial();
  });
  window.onGameCenterAuthChanged = function (authed, player) {
    if (window.UnifiedSocial) {
      window.UnifiedSocial.isGameCenterAuthenticated = !!authed;
      if (player) window.UnifiedSocial._gcPlayer = player;
    }
    neutralizeSocial();
  };

  // Ensure GC auth is requested shortly after bridge injects
  setTimeout(function () {
    if (!isGCAuthed()) promptGameCenterSignIn();
    neutralizeSocial();
  }, 800);
  setTimeout(neutralizeSocial, 2000);
})();
