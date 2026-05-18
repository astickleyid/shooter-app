/**
 * hangar-ui.js — Full-screen Persistent Upgrade Shop UI for VOID RIFT
 *
 * Vanilla JS, no external dependencies. Communicates with HangarSystem.js
 * for all state reads/writes.
 *
 * Usage (from script.js or index.html inline script):
 *
 *   import { openHangar, closeHangar } from './hangar-ui.js';
 *
 *   // Or, if loaded as a plain <script type="module">, call via window:
 *   window.openHangar({ credits: Save.data.credits });
 *
 * The module reads and writes its own localStorage key (voidrift_hangar)
 * via the HangarSystem helpers. It does NOT modify Save.data.credits directly
 * — the two credit pools are intentionally separate so the Hangar can
 * optionally bridge into the main save or remain standalone.
 *
 * To share the main game credit pool, call openHangar() with syncCredits
 * callbacks:
 *
 *   openHangar({
 *     getCredits: () => Save.data.credits,
 *     spendCredits: (n) => Save.spendCredits(n),   // returns boolean
 *   });
 */

import {
  HANGAR_CATALOG,
  loadHangar,
  saveHangar,
  getUpgradeCost,
  purchaseUpgrade
} from './src/systems/HangarSystem.js';

// ─────────────────────────────────────────────────────────────────────────────
// Style injection — dark sci-fi aesthetic matching VOID RIFT's visual language
// ─────────────────────────────────────────────────────────────────────────────

const HANGAR_UI_CSS = `
  /* ── Overlay ─────────────────────────────────────────────────── */
  #hangarOverlay {
    position: fixed;
    inset: 0;
    z-index: 9000;
    background: rgba(0, 0, 0, 0.92);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    padding: 0;
    overflow: hidden;
    animation: hangar-fade-in 0.25s ease forwards;
    font-family: Arial, Helvetica, sans-serif;
  }

  @keyframes hangar-fade-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  /* ── Scanline overlay texture ──────────────────────────────── */
  #hangarOverlay::before {
    content: '';
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(0, 0, 0, 0.06) 2px,
      rgba(0, 0, 0, 0.06) 4px
    );
    pointer-events: none;
    z-index: 0;
  }

  /* ── Panel ─────────────────────────────────────────────────── */
  #hangarPanel {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: 820px;
    height: 100%;
    max-height: 100%;
    display: flex;
    flex-direction: column;
    background: rgba(6, 9, 20, 0.97);
    border-left: 1px solid rgba(74, 222, 128, 0.2);
    border-right: 1px solid rgba(74, 222, 128, 0.2);
    overflow: hidden;
  }

  /* ── Header ────────────────────────────────────────────────── */
  #hangarHeader {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px 16px;
    border-bottom: 1px solid rgba(74, 222, 128, 0.2);
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(12px);
  }

  .hangar-title-block {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .hangar-title {
    font-size: 28px;
    font-weight: 900;
    color: #4ade80;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    text-shadow:
      0 0 20px rgba(74, 222, 128, 0.8),
      0 0 40px rgba(74, 222, 128, 0.4);
    line-height: 1;
    margin: 0;
  }

  .hangar-subtitle {
    font-size: 11px;
    font-weight: 600;
    color: rgba(100, 200, 140, 0.6);
    letter-spacing: 0.22em;
    text-transform: uppercase;
    margin: 0;
  }

  .hangar-credits-badge {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 18px;
    background: rgba(74, 222, 128, 0.08);
    border: 1px solid rgba(74, 222, 128, 0.35);
    border-radius: 8px;
    font-size: 18px;
    font-weight: 800;
    color: #4ade80;
    letter-spacing: 0.05em;
    text-shadow: 0 0 12px rgba(74, 222, 128, 0.6);
    white-space: nowrap;
    transition: all 0.3s ease;
  }

  .hangar-credits-badge .cr-icon {
    font-size: 20px;
    line-height: 1;
    filter: drop-shadow(0 0 6px rgba(74, 222, 128, 0.8));
  }

  .hangar-credits-badge .cr-label {
    font-size: 10px;
    font-weight: 700;
    color: rgba(74, 222, 128, 0.55);
    letter-spacing: 0.14em;
    text-transform: uppercase;
    margin-right: -2px;
  }

  .hangar-close-btn {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 6px;
    color: rgba(255, 255, 255, 0.6);
    font-size: 18px;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    margin-left: 16px;
    flex-shrink: 0;
  }

  .hangar-close-btn:hover {
    background: rgba(255, 80, 80, 0.15);
    border-color: rgba(255, 80, 80, 0.5);
    color: #f87171;
    box-shadow: 0 0 12px rgba(255, 80, 80, 0.3);
  }

  .hangar-header-right {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  /* ── Scrollable content area ───────────────────────────────── */
  #hangarContent {
    flex: 1 1 0;
    overflow-y: auto;
    padding: 24px;
    scrollbar-width: thin;
    scrollbar-color: rgba(74, 222, 128, 0.4) rgba(0, 0, 0, 0.3);
  }

  #hangarContent::-webkit-scrollbar {
    width: 6px;
  }

  #hangarContent::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 3px;
  }

  #hangarContent::-webkit-scrollbar-thumb {
    background: rgba(74, 222, 128, 0.4);
    border-radius: 3px;
  }

  #hangarContent::-webkit-scrollbar-thumb:hover {
    background: rgba(74, 222, 128, 0.65);
  }

  /* ── Upgrade grid ──────────────────────────────────────────── */
  .hangar-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
    gap: 16px;
  }

  /* ── Upgrade card ──────────────────────────────────────────── */
  .hangar-card {
    background: rgba(10, 16, 32, 0.9);
    border: 1px solid rgba(74, 222, 128, 0.18);
    border-radius: 10px;
    padding: 18px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    transition: all 0.22s ease;
    position: relative;
    overflow: hidden;
  }

  .hangar-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg,
      transparent,
      rgba(74, 222, 128, 0.5),
      transparent);
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .hangar-card:hover {
    border-color: rgba(74, 222, 128, 0.45);
    background: rgba(10, 20, 40, 0.95);
    box-shadow:
      0 0 24px rgba(74, 222, 128, 0.12),
      inset 0 0 30px rgba(74, 222, 128, 0.04);
    transform: translateY(-2px);
  }

  .hangar-card:hover::before {
    opacity: 1;
  }

  .hangar-card.is-maxed {
    border-color: rgba(167, 139, 250, 0.35);
    background: rgba(16, 10, 32, 0.9);
  }

  .hangar-card.is-maxed::before {
    background: linear-gradient(90deg,
      transparent,
      rgba(167, 139, 250, 0.5),
      transparent);
    opacity: 1;
  }

  .hangar-card.is-maxed:hover {
    border-color: rgba(167, 139, 250, 0.6);
    box-shadow:
      0 0 24px rgba(167, 139, 250, 0.12),
      inset 0 0 30px rgba(167, 139, 250, 0.04);
  }

  /* ── Card header row ───────────────────────────────────────── */
  .hangar-card-header {
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }

  .hangar-card-icon {
    font-size: 28px;
    line-height: 1;
    flex-shrink: 0;
    filter: drop-shadow(0 0 8px rgba(74, 222, 128, 0.5));
  }

  .hangar-card.is-maxed .hangar-card-icon {
    filter: drop-shadow(0 0 8px rgba(167, 139, 250, 0.6));
  }

  .hangar-card-title-block {
    flex: 1;
    min-width: 0;
  }

  .hangar-card-name {
    font-size: 13px;
    font-weight: 800;
    color: #e2e8f0;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    line-height: 1.2;
    margin-bottom: 2px;
  }

  .hangar-card-desc {
    font-size: 12px;
    color: rgba(148, 163, 184, 0.85);
    line-height: 1.45;
  }

  /* ── Level pips ────────────────────────────────────────────── */
  .hangar-level-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .hangar-pips {
    display: flex;
    gap: 4px;
    flex: 1;
  }

  .hangar-pip {
    flex: 1;
    height: 6px;
    border-radius: 3px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.08);
    transition: all 0.3s ease;
  }

  .hangar-pip.filled {
    background: linear-gradient(90deg, #22c55e, #4ade80);
    border-color: rgba(74, 222, 128, 0.5);
    box-shadow: 0 0 6px rgba(74, 222, 128, 0.5);
  }

  .hangar-card.is-maxed .hangar-pip.filled {
    background: linear-gradient(90deg, #7c3aed, #a78bfa);
    border-color: rgba(167, 139, 250, 0.5);
    box-shadow: 0 0 6px rgba(167, 139, 250, 0.5);
  }

  .hangar-level-label {
    font-size: 10px;
    font-weight: 700;
    color: rgba(148, 163, 184, 0.6);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .hangar-level-label.maxed {
    color: rgba(167, 139, 250, 0.8);
  }

  /* ── Purchase button ───────────────────────────────────────── */
  .hangar-buy-btn {
    width: 100%;
    padding: 10px 16px;
    border-radius: 7px;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.09em;
    text-transform: uppercase;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    transition: all 0.2s ease;
    border: 1px solid transparent;
    position: relative;
    overflow: hidden;
  }

  .hangar-buy-btn::before {
    content: '';
    position: absolute;
    inset: 0;
    background: rgba(255, 255, 255, 0.05);
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  .hangar-buy-btn:hover:not(:disabled)::before {
    opacity: 1;
  }

  .hangar-buy-btn:not(:disabled) {
    background: rgba(74, 222, 128, 0.12);
    border-color: rgba(74, 222, 128, 0.5);
    color: #4ade80;
    text-shadow: 0 0 8px rgba(74, 222, 128, 0.4);
  }

  .hangar-buy-btn:hover:not(:disabled) {
    background: rgba(74, 222, 128, 0.22);
    border-color: #4ade80;
    box-shadow: 0 0 16px rgba(74, 222, 128, 0.3);
    transform: translateY(-1px);
  }

  .hangar-buy-btn:active:not(:disabled) {
    transform: translateY(0);
  }

  .hangar-buy-btn.cant-afford:not(:disabled) {
    background: rgba(100, 116, 139, 0.1);
    border-color: rgba(100, 116, 139, 0.3);
    color: rgba(100, 116, 139, 0.7);
    text-shadow: none;
    cursor: not-allowed;
  }

  .hangar-buy-btn.cant-afford:not(:disabled):hover {
    box-shadow: none;
    transform: none;
    background: rgba(100, 116, 139, 0.1);
    border-color: rgba(100, 116, 139, 0.3);
  }

  .hangar-buy-btn:disabled {
    background: rgba(100, 116, 139, 0.08);
    border-color: rgba(100, 116, 139, 0.15);
    color: rgba(100, 116, 139, 0.4);
    cursor: default;
    text-shadow: none;
  }

  .hangar-buy-btn.is-maxed-btn {
    background: rgba(167, 139, 250, 0.08);
    border-color: rgba(167, 139, 250, 0.3);
    color: rgba(167, 139, 250, 0.7);
    cursor: default;
  }

  .hangar-buy-cost {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  /* ── Purchase flash animation ──────────────────────────────── */
  @keyframes hangar-purchase-flash {
    0%   { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.8); }
    50%  { box-shadow: 0 0 0 8px rgba(74, 222, 128, 0); }
    100% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0); }
  }

  .hangar-card.purchased-flash {
    animation: hangar-purchase-flash 0.5s ease forwards;
  }

  /* ── Footer info bar ───────────────────────────────────────── */
  #hangarFooter {
    flex-shrink: 0;
    padding: 12px 24px;
    border-top: 1px solid rgba(74, 222, 128, 0.12);
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  .hangar-footer-hint {
    font-size: 11px;
    color: rgba(100, 116, 139, 0.7);
    letter-spacing: 0.04em;
  }

  .hangar-footer-hint kbd {
    display: inline-block;
    padding: 1px 5px;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 3px;
    font-size: 10px;
    font-family: monospace;
    color: rgba(255, 255, 255, 0.5);
    letter-spacing: 0;
  }

  .hangar-footer-version {
    font-size: 10px;
    color: rgba(74, 222, 128, 0.3);
    font-family: 'SF Mono', 'Monaco', 'Courier New', monospace;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  /* ── Responsive adjustments ────────────────────────────────── */
  @media (max-width: 480px) {
    .hangar-title {
      font-size: 22px;
    }
    .hangar-credits-badge {
      font-size: 15px;
      padding: 8px 12px;
    }
    #hangarContent {
      padding: 16px;
    }
    .hangar-grid {
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }
    .hangar-card {
      padding: 14px;
    }
    .hangar-card-icon {
      font-size: 22px;
    }
    .hangar-card-name {
      font-size: 11px;
    }
    .hangar-card-desc {
      font-size: 11px;
    }
  }

  @media (max-width: 340px) {
    .hangar-grid {
      grid-template-columns: 1fr;
    }
  }
`;

// ─────────────────────────────────────────────────────────────────────────────
// Module state
// ─────────────────────────────────────────────────────────────────────────────

let _overlay = null;
let _hangarState = null;
let _options = {};
let _keyHandler = null;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function injectStyles() {
  if (document.getElementById('hangar-ui-styles')) return;
  const style = document.createElement('style');
  style.id = 'hangar-ui-styles';
  style.textContent = HANGAR_UI_CSS;
  document.head.appendChild(style);
}

/**
 * Retrieve the live credits value.
 * Prefers an external getCredits() callback (to sync with main save),
 * otherwise falls back to the hangar's own credit pool.
 */
function getLiveCredits() {
  if (typeof _options.getCredits === 'function') {
    const val = _options.getCredits();
    if (typeof val === 'number' && !isNaN(val)) return val;
  }
  return _hangarState.credits;
}

/**
 * Attempt to spend credits. Returns true on success.
 * Uses external spendCredits() callback when provided, falling back to
 * the hangar's own internal credit pool.
 */
function trySpendCredits(amount) {
  if (typeof _options.spendCredits === 'function') {
    const result = _options.spendCredits(amount);
    // If the external handler explicitly returns false, the spend failed.
    // If it returns true (or any truthy value) the spend succeeded and
    // the external system owns the credit balance — don't double-deduct.
    if (result !== false) return true;
    // Fall through to internal pool if external handler returned false
  }
  if (_hangarState.credits >= amount) {
    _hangarState.credits -= amount;
    saveHangar(_hangarState);
    return true;
  }
  return false;
}

/**
 * Build the pip row HTML for a given currentLevel / maxLevel.
 */
function buildPips(currentLevel, maxLevel) {
  let html = '';
  for (let i = 0; i < maxLevel; i++) {
    html += `<div class="hangar-pip${i < currentLevel ? ' filled' : ''}"></div>`;
  }
  return html;
}

/**
 * Render/refresh a single card element based on current state.
 */
function renderCard(item) {
  const currentLevel = _hangarState.upgrades[item.id] || 0;
  const isMaxed = currentLevel >= item.maxLevel;
  const cost = isMaxed ? 0 : getUpgradeCost(item, currentLevel);
  const credits = getLiveCredits();
  const canAfford = !isMaxed && credits >= cost;

  const card = document.createElement('div');
  card.className = `hangar-card${isMaxed ? ' is-maxed' : ''}`;
  card.dataset.upgradeId = item.id;

  const levelLabel = isMaxed
    ? `<span class="hangar-level-label maxed">MAX</span>`
    : `<span class="hangar-level-label">Lv ${currentLevel} / ${item.maxLevel}</span>`;

  let btnClass = 'hangar-buy-btn';
  let btnContent = '';
  let btnDisabled = '';

  if (isMaxed) {
    btnClass += ' is-maxed-btn';
    btnContent = '✦ MAXED OUT';
    btnDisabled = 'disabled';
  } else if (!canAfford) {
    btnClass += ' cant-afford';
    btnContent = `<span class="hangar-buy-cost">⚡ ${cost.toLocaleString()} CR</span> — Need More`;
  } else {
    btnContent = `<span class="hangar-buy-cost">⚡ ${cost.toLocaleString()} CR</span> — UPGRADE`;
  }

  card.innerHTML = `
    <div class="hangar-card-header">
      <div class="hangar-card-icon">${item.icon}</div>
      <div class="hangar-card-title-block">
        <div class="hangar-card-name">${item.name}</div>
        <div class="hangar-card-desc">${item.description}</div>
      </div>
    </div>
    <div class="hangar-level-row">
      <div class="hangar-pips">${buildPips(currentLevel, item.maxLevel)}</div>
      ${levelLabel}
    </div>
    <button class="${btnClass}" data-upgrade-id="${item.id}" ${btnDisabled}>${btnContent}</button>
  `;

  const btn = card.querySelector('.hangar-buy-btn');
  if (btn && !isMaxed) {
    btn.addEventListener('click', () => handlePurchase(item.id));
  }

  return card;
}

/**
 * Rebuild the entire grid without tearing down the full overlay.
 */
function refreshGrid() {
  const grid = document.querySelector('#hangarOverlay .hangar-grid');
  const badge = document.getElementById('hangar-credits-amount');
  if (!grid) return;

  grid.innerHTML = '';
  HANGAR_CATALOG.forEach(item => {
    grid.appendChild(renderCard(item));
  });

  if (badge) {
    badge.textContent = getLiveCredits().toLocaleString();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Purchase handler
// ─────────────────────────────────────────────────────────────────────────────

function handlePurchase(upgradeId) {
  const item = HANGAR_CATALOG.find(u => u.id === upgradeId);
  if (!item) return;

  const currentLevel = _hangarState.upgrades[upgradeId] || 0;
  if (currentLevel >= item.maxLevel) return;

  const cost = getUpgradeCost(item, currentLevel);

  // Deduct credits using whatever mechanism is configured
  const spent = trySpendCredits(cost);
  if (!spent) return;

  // Update upgrade level in hangar state
  _hangarState.upgrades[upgradeId] = currentLevel + 1;
  saveHangar(_hangarState);

  // Flash the card
  const card = document.querySelector(`.hangar-card[data-upgrade-id="${upgradeId}"]`);
  if (card) {
    card.classList.add('purchased-flash');
    card.addEventListener('animationend', () => card.classList.remove('purchased-flash'), { once: true });
  }

  // Re-render grid to reflect new levels and costs
  refreshGrid();

  // Fire optional callback
  if (typeof _options.onPurchase === 'function') {
    _options.onPurchase(upgradeId, _hangarState.upgrades[upgradeId], _hangarState);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Open the Hangar overlay.
 *
 * @param {Object} [opts]
 * @param {Function} [opts.getCredits]  - () => number. If provided, reads live
 *   credits from the main game save instead of the hangar's own pool.
 * @param {Function} [opts.spendCredits] - (amount: number) => boolean. If
 *   provided, debits the main save rather than the internal pool.
 * @param {Function} [opts.onClose]     - Called when the overlay is closed.
 * @param {Function} [opts.onPurchase]  - Called after a successful purchase
 *   with (upgradeId, newLevel, hangarState).
 */
export function openHangar(opts = {}) {
  if (_overlay) return; // already open

  injectStyles();
  _options = opts;
  _hangarState = loadHangar();

  // ── Build DOM ────────────────────────────────────────────────

  _overlay = document.createElement('div');
  _overlay.id = 'hangarOverlay';
  _overlay.setAttribute('role', 'dialog');
  _overlay.setAttribute('aria-modal', 'true');
  _overlay.setAttribute('aria-label', 'Hangar — Permanent Upgrades');

  // Grid HTML is built dynamically; collect card markup here
  const cardsHTML = HANGAR_CATALOG.map(item => {
    // placeholder — will be populated after overlay insertion
    return `<div></div>`;
  }).join('');

  _overlay.innerHTML = `
    <div id="hangarPanel">
      <div id="hangarHeader">
        <div class="hangar-title-block">
          <h1 class="hangar-title">HANGAR</h1>
          <p class="hangar-subtitle">Permanent Upgrades</p>
        </div>
        <div class="hangar-header-right">
          <div class="hangar-credits-badge">
            <span class="cr-icon">⚡</span>
            <span class="cr-label">CR</span>
            <span id="hangar-credits-amount">${getLiveCredits().toLocaleString()}</span>
          </div>
          <button class="hangar-close-btn" id="hangarCloseBtn" aria-label="Close Hangar">✕</button>
        </div>
      </div>

      <div id="hangarContent">
        <div class="hangar-grid"></div>
      </div>

      <div id="hangarFooter">
        <span class="hangar-footer-hint">Press <kbd>ESC</kbd> to close</span>
        <span class="hangar-footer-version">VOID RIFT // HANGAR v1.0</span>
      </div>
    </div>
  `;

  document.body.appendChild(_overlay);

  // Render real cards now that the overlay is in the DOM
  refreshGrid();

  // ── Event listeners ──────────────────────────────────────────

  document.getElementById('hangarCloseBtn').addEventListener('click', closeHangar);

  // Close on backdrop click (outside the panel)
  _overlay.addEventListener('click', (e) => {
    if (e.target === _overlay) closeHangar();
  });

  // ESC key
  _keyHandler = (e) => {
    if (e.key === 'Escape') closeHangar();
  };
  document.addEventListener('keydown', _keyHandler);

  // Focus trap — keep focus inside the overlay for accessibility
  _overlay.setAttribute('tabindex', '-1');
  _overlay.focus();
}

/**
 * Close and destroy the Hangar overlay.
 */
export function closeHangar() {
  if (!_overlay) return;

  if (_keyHandler) {
    document.removeEventListener('keydown', _keyHandler);
    _keyHandler = null;
  }

  // Fade out then remove
  _overlay.style.animation = 'hangar-fade-in 0.2s ease reverse forwards';
  setTimeout(() => {
    if (_overlay && _overlay.parentNode) {
      _overlay.parentNode.removeChild(_overlay);
    }
    _overlay = null;

    if (typeof _options.onClose === 'function') {
      _options.onClose(_hangarState);
    }
    _options = {};
  }, 200);
}

// ── Expose on window for non-module script contexts ──────────────────────────
if (typeof window !== 'undefined') {
  window.openHangar = openHangar;
  window.closeHangar = closeHangar;
}
