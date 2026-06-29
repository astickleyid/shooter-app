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
  // Simulates a 5-second rewarded ad (matches AdMob minimum watch time for reward).
  // Skip button is locked for the first 5 seconds — skipping before completion cancels reward.
  // After 5 seconds the countdown turns green and a "Claim Reward" button replaces the skip.
  _showWebPlaceholder(onRewarded, onCancelled) {
    const AD_DURATION = 5; // seconds — matches AdMob rewarded minimum

    const overlay = document.createElement('div');
    overlay.id = 'admob-web-placeholder';
    overlay.style.cssText = `
      position: fixed; inset: 0; background: rgba(0,0,0,0.96);
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      z-index: 99999; font-family: 'Orbitron', monospace; color: #fff;
    `;

    overlay.innerHTML = `
      <div style="
        text-align:center; max-width:340px; padding:32px 24px;
        border: 1px solid rgba(255,255,255,0.08); border-radius:16px;
        background: rgba(255,255,255,0.04); backdrop-filter:blur(12px);
      ">
        <div style="font-size:11px; letter-spacing:3px; color:rgba(255,255,255,0.3); margin-bottom:20px; text-transform:uppercase;">
          Rewarded Ad · Web Preview
        </div>

        <!-- Simulated ad creative -->
        <div style="
          background:linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#0f172a 100%);
          border-radius:12px; padding:24px; margin-bottom:20px;
          border:1px solid rgba(99,102,241,0.3);
        ">
          <div style="font-size:36px; margin-bottom:10px;">🚀</div>
          <div style="font-size:16px; font-weight:800; color:#818cf8; margin-bottom:6px;">VOID RIFT</div>
          <div style="font-size:11px; color:rgba(255,255,255,0.5);">Twin-stick space shooter</div>
          <div style="font-size:10px; color:rgba(99,102,241,0.7); margin-top:8px; letter-spacing:1px;">PLAY FREE</div>
        </div>

        <!-- Progress bar -->
        <div style="
          width:100%; height:4px; background:rgba(255,255,255,0.1);
          border-radius:2px; overflow:hidden; margin-bottom:14px;
        ">
          <div id="admob-progress-bar" style="
            height:100%; width:0%; background:#4ade80;
            border-radius:2px; transition:width 1s linear;
          "></div>
        </div>

        <!-- Countdown + skip row -->
        <div style="display:flex; align-items:center; justify-content:space-between;">
          <div style="font-size:12px; color:rgba(255,255,255,0.4);">
            Ad ends in <span id="admob-countdown" style="color:#fff; font-weight:700;">${AD_DURATION}</span>s
          </div>
          <button id="admob-skip-btn" style="
            font-family:'Orbitron',monospace; font-size:11px; font-weight:700;
            padding:6px 14px; border-radius:6px; border:none; cursor:not-allowed;
            background:rgba(255,255,255,0.06); color:rgba(255,255,255,0.25);
            letter-spacing:1px; transition:all 0.3s;
          " disabled>SKIP ›</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    let elapsed = 0;
    let rewarded = false;

    const skipBtn = document.getElementById('admob-skip-btn');
    const progressBar = document.getElementById('admob-progress-bar');
    const countdownEl = document.getElementById('admob-countdown');

    // Animate progress bar (CSS transition handles smoothness)
    // Kick off progress after a brief paint frame
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (progressBar) progressBar.style.width = '100%';
        if (progressBar) progressBar.style.transition = `width ${AD_DURATION}s linear`;
      });
    });

    const timer = setInterval(() => {
      elapsed++;
      const remaining = AD_DURATION - elapsed;

      if (countdownEl) countdownEl.textContent = Math.max(0, remaining);

      if (elapsed >= AD_DURATION) {
        // Ad complete — unlock reward
        clearInterval(timer);
        rewarded = true;
        if (progressBar) progressBar.style.background = '#4ade80';
        if (countdownEl) {
          countdownEl.textContent = '0';
          countdownEl.style.color = '#4ade80';
        }
        // Swap skip for "Claim Reward"
        if (skipBtn) {
          skipBtn.textContent = 'CLAIM REWARD ✓';
          skipBtn.style.background = '#4ade80';
          skipBtn.style.color = '#000';
          skipBtn.style.cursor = 'pointer';
          skipBtn.style.cursor = 'pointer';
          skipBtn.disabled = false;
          skipBtn.onclick = () => {
            overlay.remove();
            if (onRewarded) onRewarded({ type: 'continue', amount: 1 });
            this._postAdCleanup();
          };
        }
      } else if (elapsed >= 3) {
        // After 3s, allow skipping (without reward)
        if (skipBtn && skipBtn.disabled) {
          skipBtn.disabled = false;
          skipBtn.style.cursor = 'pointer';
          skipBtn.style.color = 'rgba(255,255,255,0.5)';
          skipBtn.style.background = 'rgba(255,255,255,0.1)';
          skipBtn.onclick = () => {
            clearInterval(timer);
            overlay.remove();
            if (onCancelled) onCancelled('skipped');
          };
        }
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
