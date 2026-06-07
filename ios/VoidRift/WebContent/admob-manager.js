/**
 * AdMob Manager — VOID RIFT
 *
 * Cross-platform rewarded ad system.
 * On iOS: delegates to native GameBridge via webkit.messageHandlers.adShowRewarded
 * On web: logs a placeholder (real web AdSense requires server-side setup)
 *
 * Ad Unit IDs — replace placeholders with real IDs from AdMob console:
 * https://admob.google.com/
 *
 * iOS Ad Unit ID format: ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX
 * Android Ad Unit ID format: ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX
 */

const AdMobManager = {
  // ── Config ─────────────────────────────────────────────────────────────────
  testMode: true, // Set to false and replace with real IDs before App Store submission
  AD_UNITS: {
    ios:     { rewarded: 'ca-app-pub-3940256099942544/1712485313' },
    android: { rewarded: 'ca-app-pub-3940256099942544/5224354917' },
    // For testing, use Google test IDs:
    // ios test:     'ca-app-pub-3940256099942544/1712485313'
    // android test: 'ca-app-pub-3940256099942544/5224354917'
  },

  // ── State ──────────────────────────────────────────────────────────────────
  isReady: false,
  isLoading: false,
  _rewardCallback: null,
  _cancelCallback: null,

  // ── Platform detection ─────────────────────────────────────────────────────
  get platform() {
    if (typeof window.webkit?.messageHandlers?.adShowRewarded !== 'undefined') return 'ios';
    if (typeof window.AndroidBridge?.showRewardedAd !== 'undefined') return 'android';
    return 'web';
  },

  // ── Init ───────────────────────────────────────────────────────────────────
  initialize() {
    // Listen for native ad callbacks
    window.addEventListener('adRewarded', (e) => this._onRewarded(e.detail));
    window.addEventListener('adClosed', ()  => this._onClosed());
    window.addEventListener('adLoaded', ()  => { this.isReady = true; this.isLoading = false; });
    window.addEventListener('adFailed', ()  => { this.isReady = false; this.isLoading = false; });

    // Pre-load on iOS/Android
    if (this.platform !== 'web') {
      this._preload();
    }
    console.log(`[AdMob] Initialized on platform: ${this.platform}`);
  },

  // ── Pre-load ad (called after each ad is dismissed) ────────────────────────
  _preload() {
    if (this.isLoading || this.isReady) return;
    this.isLoading = true;
    const unitId = this.AD_UNITS[this.platform]?.rewarded;
    if (!unitId) return;

    if (this.platform === 'ios') {
      window.webkit.messageHandlers.adPreloadRewarded.postMessage({ unitId });
    } else if (this.platform === 'android') {
      window.AndroidBridge.preloadRewardedAd(unitId);
    }
  },

  // ── Show rewarded ad ───────────────────────────────────────────────────────
  /**
   * @param {Function} onRewarded - called when player earns the reward
   * @param {Function} onCancelled - called when player skips/closes without reward
   */
  showRewarded(onRewarded, onCancelled) {
    this._rewardCallback = onRewarded;
    this._cancelCallback = onCancelled;

    if (this.platform === 'ios') {
      if (!this.isReady) {
        console.warn('[AdMob] Ad not ready yet, preloading...');
        this._preload();
        // Show fallback message
        if (onCancelled) onCancelled('not_ready');
        return;
      }
      window.webkit.messageHandlers.adShowRewarded.postMessage({});
      this.isReady = false;
    } else if (this.platform === 'android') {
      window.AndroidBridge.showRewardedAd();
      this.isReady = false;
    } else {
      // Web: simulate ad (no real web rewarded ads without AdSense account)
      console.log('[AdMob] Web platform — simulating rewarded ad (3s delay)');
      this._showWebPlaceholder(onRewarded, onCancelled);
    }
  },

  // ── Web placeholder (dev/testing) ──────────────────────────────────────────
  _showWebPlaceholder(onRewarded, onCancelled) {
    const overlay = document.createElement('div');
    overlay.id = 'admob-web-placeholder';
    overlay.style.cssText = `
      position: fixed; inset: 0; background: rgba(0,0,0,0.92);
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      z-index: 99999; font-family: 'Orbitron', monospace; color: #fff;
    `;
    overlay.innerHTML = `
      <div style="text-align:center; max-width:320px; padding:24px;">
        <div style="font-size:48px; margin-bottom:16px;">📺</div>
        <div style="font-size:18px; font-weight:700; margin-bottom:8px; color:#4ade80;">REWARDED AD</div>
        <div style="font-size:13px; color:#94a3b8; margin-bottom:24px;">
          Ad would play here on iOS / Android.<br>Simulating 3-second ad…
        </div>
        <div id="admob-countdown" style="font-size:32px; font-weight:900; color:#4ade80;">3</div>
      </div>
    `;
    document.body.appendChild(overlay);

    let count = 3;
    const timer = setInterval(() => {
      count--;
      const el = document.getElementById('admob-countdown');
      if (el) el.textContent = count;
      if (count <= 0) {
        clearInterval(timer);
        overlay.remove();
        if (onRewarded) onRewarded({ type: 'coins', amount: 1 });
        this._postAdCleanup();
      }
    }, 1000);
  },

  // ── Callbacks from native ──────────────────────────────────────────────────
  _onRewarded(detail) {
    if (this._rewardCallback) { this._rewardCallback(detail); this._rewardCallback = null; }
    this._cancelCallback = null;
    this._postAdCleanup();
  },

  _onClosed() {
    // Ad closed without reward
    if (this._cancelCallback) { this._cancelCallback('closed'); this._cancelCallback = null; }
    this._rewardCallback = null;
    this._postAdCleanup();
  },

  _postAdCleanup() {
    // Pre-load next ad
    setTimeout(() => this._preload(), 1000);
  },

  // ── Util ───────────────────────────────────────────────────────────────────
  get canShow() {
    return this.platform !== 'web' ? this.isReady : true;
  }
};
