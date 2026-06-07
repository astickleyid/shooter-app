/* ============================================================
   VOID RIFT — Game Center-only mode (iOS v1)

   When running inside the native iOS shell (detected via the
   Game Center message bridge), this disables the custom
   email/password account + social system and routes identity
   and leaderboards through Apple Game Center only.

   Rationale: avoids App Store guideline 5.1.1(v) (account
   deletion requirement for apps with custom account creation)
   and removes the dependency on the web backend for v1.

   Fully reversible — additive module, no edits to game logic.
   ============================================================ */
(function () {
  'use strict';

  // The native shell registers `gcAuthenticate`; the plain web build does not.
  var isNativeIOS = !!(window.webkit &&
                       window.webkit.messageHandlers &&
                       window.webkit.messageHandlers.gcAuthenticate);
  if (!isNativeIOS) return;

  document.documentElement.classList.add('gc-only');

  function openGameCenterLeaderboard() {
    try { window.webkit.messageHandlers.gcShowLeaderboard.postMessage({}); } catch (e) {}
    return false;
  }

  function neutralizeSocial() {
    if (window.SocialUI) {
      var noop = function () { return false; };
      SocialUI.showAuthModal = noop;
      SocialUI.showProfileModal = noop;
      SocialUI.showLoginModal = noop;
      // Any in-game "leaderboard" entry point defers to Apple Game Center.
      SocialUI.showLeaderboardModal = openGameCenterLeaderboard;
      if (typeof SocialUI.init === 'function') SocialUI.init = function () {};
    }
    // Remove any social/auth modal nodes already injected into the DOM.
    var modals = document.querySelectorAll('.social-modal, #authModal');
    for (var i = 0; i < modals.length; i++) {
      if (modals[i] && modals[i].parentNode) modals[i].parentNode.removeChild(modals[i]);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', neutralizeSocial);
  } else {
    neutralizeSocial();
  }
  // Re-apply after late initialization from other scripts.
  window.addEventListener('load', neutralizeSocial);
})();
