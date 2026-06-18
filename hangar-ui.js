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

import {
  ACHIEVEMENT_CATALOG,
  loadAchievements,
  updateStats,
  getUnlocked
} from './src/systems/AchievementSystem.js';

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

  /* ── Tab bar ───────────────────────────────────────────────── */
  #hangarTabBar {
    flex-shrink: 0;
    display: flex;
    gap: 6px;
    padding: 12px 24px 0;
    border-bottom: 1px solid rgba(74, 222, 128, 0.2);
    background: rgba(0, 0, 0, 0.3);
  }

  .hangar-tab-btn {
    padding: 8px 20px;
    border-radius: 6px 6px 0 0;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    cursor: pointer;
    border: 1px solid transparent;
    border-bottom: none;
    color: rgba(100, 116, 139, 0.8);
    background: rgba(255, 255, 255, 0.03);
    transition: all 0.2s ease;
    position: relative;
    bottom: -1px;
  }

  .hangar-tab-btn:hover {
    color: rgba(74, 222, 128, 0.7);
    background: rgba(74, 222, 128, 0.05);
  }

  .hangar-tab-btn.active {
    color: #4ade80;
    background: rgba(6, 9, 20, 0.97);
    border-color: rgba(74, 222, 128, 0.2);
    text-shadow: 0 0 10px rgba(74, 222, 128, 0.5);
  }

  /* ── Achievement grid ──────────────────────────────────────── */
  .achievement-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
    gap: 16px;
  }

  .achievement-count {
    font-size: 11px;
    font-weight: 700;
    color: rgba(74, 222, 128, 0.55);
    letter-spacing: 0.14em;
    text-transform: uppercase;
    margin-bottom: 18px;
  }

  .achievement-count span {
    color: #4ade80;
    text-shadow: 0 0 10px rgba(74, 222, 128, 0.5);
  }

  /* ── Achievement card ──────────────────────────────────────── */
  .achievement-card {
    background: rgba(10, 16, 32, 0.9);
    border: 1px solid rgba(74, 222, 128, 0.18);
    border-radius: 10px;
    padding: 18px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    position: relative;
    overflow: hidden;
    transition: all 0.22s ease;
  }

  .achievement-card::before {
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

  .achievement-card.is-unlocked {
    border-color: rgba(74, 222, 128, 0.4);
    box-shadow:
      0 0 18px rgba(74, 222, 128, 0.1),
      inset 0 0 24px rgba(74, 222, 128, 0.04);
  }

  .achievement-card.is-unlocked::before {
    opacity: 1;
  }

  .achievement-card.is-unlocked:hover {
    border-color: rgba(74, 222, 128, 0.65);
    box-shadow:
      0 0 28px rgba(74, 222, 128, 0.18),
      inset 0 0 30px rgba(74, 222, 128, 0.06);
    transform: translateY(-2px);
  }

  .achievement-card.is-locked {
    border-color: rgba(255, 255, 255, 0.07);
    opacity: 0.55;
    filter: grayscale(0.6);
  }

  .achievement-card-header {
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }

  .achievement-card-icon {
    font-size: 28px;
    line-height: 1;
    flex-shrink: 0;
  }

  .achievement-card.is-unlocked .achievement-card-icon {
    filter: drop-shadow(0 0 8px rgba(74, 222, 128, 0.6));
  }

  .achievement-card.is-locked .achievement-card-icon {
    filter: grayscale(1) brightness(0.5);
  }

  .achievement-card-title-block {
    flex: 1;
    min-width: 0;
  }

  .achievement-card-name {
    font-size: 13px;
    font-weight: 800;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    line-height: 1.2;
    margin-bottom: 4px;
  }

  .achievement-card.is-unlocked .achievement-card-name {
    color: #e2e8f0;
  }

  .achievement-card.is-locked .achievement-card-name {
    color: rgba(148, 163, 184, 0.5);
  }

  .achievement-card-desc {
    font-size: 12px;
    line-height: 1.45;
  }

  .achievement-card.is-unlocked .achievement-card-desc {
    color: rgba(148, 163, 184, 0.85);
  }

  .achievement-card.is-locked .achievement-card-desc {
    color: rgba(100, 116, 139, 0.6);
    font-style: italic;
    letter-spacing: 0.05em;
  }

  .achievement-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    padding: 3px 8px;
    border-radius: 4px;
    align-self: flex-start;
  }

  .achievement-badge.unlocked {
    background: rgba(74, 222, 128, 0.12);
    border: 1px solid rgba(74, 222, 128, 0.35);
    color: #4ade80;
    text-shadow: 0 0 8px rgba(74, 222, 128, 0.4);
  }

  .achievement-badge.locked {
    background: rgba(100, 116, 139, 0.08);
    border: 1px solid rgba(100, 116, 139, 0.2);
    color: rgba(100, 116, 139, 0.5);
  }

  /* ── Achievement unlock toast ──────────────────────────────── */
  #hangar-toast-container {
    position: absolute;
    top: 80px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 9100;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    pointer-events: none;
    width: 360px;
    max-width: calc(100vw - 32px);
  }

  .hangar-toast {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 20px;
    background: rgba(6, 9, 20, 0.97);
    border: 1px solid rgba(74, 222, 128, 0.55);
    border-radius: 10px;
    box-shadow:
      0 0 30px rgba(74, 222, 128, 0.2),
      0 8px 24px rgba(0, 0, 0, 0.6);
    width: 100%;
    animation: toast-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    pointer-events: none;
  }

  .hangar-toast.toast-out {
    animation: toast-out 0.3s ease forwards;
  }

  @keyframes toast-in {
    from {
      opacity: 0;
      transform: translateY(-16px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @keyframes toast-out {
    from {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
    to {
      opacity: 0;
      transform: translateY(-10px) scale(0.95);
    }
  }

  .hangar-toast-icon {
    font-size: 28px;
    line-height: 1;
    filter: drop-shadow(0 0 8px rgba(74, 222, 128, 0.7));
    flex-shrink: 0;
  }

  .hangar-toast-body {
    flex: 1;
    min-width: 0;
  }

  .hangar-toast-label {
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: rgba(74, 222, 128, 0.65);
    margin-bottom: 3px;
  }

  .hangar-toast-name {
    font-size: 14px;
    font-weight: 800;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    color: #e2e8f0;
    line-height: 1.2;
    text-shadow: 0 0 12px rgba(74, 222, 128, 0.3);
  }

  .hangar-toast-desc {
    font-size: 11px;
    color: rgba(148, 163, 184, 0.75);
    margin-top: 2px;
    line-height: 1.4;
  }

  /* ── Responsive achievements ────────────────────────────────── */
  @media (max-width: 480px) {
    .achievement-grid {
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }
    .achievement-card {
      padding: 14px;
    }
    .achievement-card-icon {
      font-size: 22px;
    }
    .achievement-card-name {
      font-size: 11px;
    }
    .achievement-card-desc {
      font-size: 11px;
    }
    #hangarTabBar {
      padding: 10px 16px 0;
    }
    .hangar-tab-btn {
      padding: 7px 14px;
      font-size: 10px;
    }
  }

  @media (max-width: 340px) {
    .achievement-grid {
      grid-template-columns: 1fr;
    }
  }

  /* ── Skins tab ─────────────────────────────────────────────── */
  .skins-ship-selector {
    display: flex;
    gap: 8px;
    padding: 16px 24px 12px;
    border-bottom: 1px solid rgba(74, 222, 128, 0.1);
    flex-shrink: 0;
    flex-wrap: wrap;
  }

  .skin-ship-btn {
    padding: 6px 14px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    cursor: pointer;
    border: 1px solid rgba(100, 116, 139, 0.3);
    color: rgba(100, 116, 139, 0.7);
    background: rgba(255, 255, 255, 0.03);
    transition: all 0.15s ease;
  }

  .skin-ship-btn:hover {
    border-color: rgba(74, 222, 128, 0.4);
    color: rgba(74, 222, 128, 0.8);
  }

  .skin-ship-btn.active {
    border-color: rgba(74, 222, 128, 0.6);
    color: #4ade80;
    background: rgba(74, 222, 128, 0.08);
    text-shadow: 0 0 8px rgba(74, 222, 128, 0.4);
  }

  .skins-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 14px;
    padding: 20px 24px;
    overflow-y: auto;
    flex: 1;
  }

  .skin-card {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(74, 222, 128, 0.12);
    border-radius: 10px;
    padding: 16px 14px 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    transition: all 0.2s ease;
    cursor: pointer;
    position: relative;
    overflow: hidden;
  }

  .skin-card:hover {
    border-color: rgba(74, 222, 128, 0.3);
    background: rgba(74, 222, 128, 0.04);
    transform: translateY(-1px);
  }

  .skin-card.is-equipped {
    border-color: rgba(74, 222, 128, 0.7);
    background: rgba(74, 222, 128, 0.08);
    box-shadow: 0 0 16px rgba(74, 222, 128, 0.1);
  }

  .skin-card.is-equipped::before {
    content: 'EQUIPPED';
    position: absolute;
    top: 8px;
    right: 8px;
    font-size: 8px;
    font-weight: 800;
    letter-spacing: 0.12em;
    color: #4ade80;
    background: rgba(74, 222, 128, 0.15);
    padding: 2px 6px;
    border-radius: 3px;
    border: 1px solid rgba(74, 222, 128, 0.3);
  }

  .skin-swatch-row {
    display: flex;
    gap: 6px;
    align-items: center;
  }

  .skin-swatch {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    flex-shrink: 0;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.15), 0 2px 6px rgba(0,0,0,0.4);
  }

  .skin-swatch-mini {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .skin-swatch-accent {
    width: 24px;
    height: 10px;
    border-radius: 3px;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .skin-swatch-engine {
    width: 24px;
    height: 10px;
    border-radius: 3px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    opacity: 0.8;
  }

  .skin-info {
    flex: 1;
  }

  .skin-name {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: #e2e8f0;
    text-transform: uppercase;
    margin-bottom: 3px;
  }

  .skin-desc {
    font-size: 10px;
    color: rgba(100, 116, 139, 0.8);
    line-height: 1.4;
  }

  .skin-action-btn {
    width: 100%;
    padding: 7px 10px;
    border-radius: 5px;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    cursor: pointer;
    border: 1px solid transparent;
    transition: all 0.2s ease;
    text-align: center;
  }

  .skin-action-btn.free {
    background: rgba(74, 222, 128, 0.12);
    border-color: rgba(74, 222, 128, 0.4);
    color: #4ade80;
  }

  .skin-action-btn.free:hover {
    background: rgba(74, 222, 128, 0.2);
  }

  .skin-action-btn.buy {
    background: rgba(251, 191, 36, 0.1);
    border-color: rgba(251, 191, 36, 0.4);
    color: #fbbf24;
  }

  .skin-action-btn.buy:hover {
    background: rgba(251, 191, 36, 0.18);
  }

  .skin-action-btn.buy.cant-afford {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .skin-action-btn.equipped-btn {
    background: rgba(74, 222, 128, 0.08);
    border-color: rgba(74, 222, 128, 0.3);
    color: rgba(74, 222, 128, 0.6);
    cursor: default;
  }

  .skin-action-btn.owned {
    background: rgba(148, 163, 184, 0.08);
    border-color: rgba(148, 163, 184, 0.3);
    color: #94a3b8;
  }

  .skin-action-btn.owned:hover {
    background: rgba(74, 222, 128, 0.08);
    border-color: rgba(74, 222, 128, 0.3);
    color: #4ade80;
  }

  @media (max-width: 480px) {
    .skins-grid {
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      padding: 14px 16px;
    }
    .skins-ship-selector {
      padding: 12px 16px 10px;
    }
  }

  /* ── Settings tab ──────────────────────────────────────────── */
  .hangar-settings { padding: 20px; }
  .hangar-settings-section { margin-bottom: 24px; }
  .hangar-settings-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: rgba(255,255,255,0.5); margin-bottom: 12px; }
  .hangar-settings-row { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
  .hangar-settings-row span { font-size: 13px; color: rgba(255,255,255,0.8); width: 110px; flex-shrink: 0; }
  .hangar-settings-slider { flex: 1; accent-color: #4ade80; height: 4px; }
  .hangar-settings-vol { font-size: 12px; color: rgba(255,255,255,0.4); width: 30px; text-align: right; }
  .hangar-mute-btn { padding: 8px 18px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.15); background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.7); font-size: 13px; cursor: pointer; transition: background 0.2s; }
  .hangar-mute-btn:hover { background: rgba(255,255,255,0.12); }
  .hangar-mute-btn.muted { border-color: #ef4444; color: #ef4444; }

  /* ── Remove Ads IAP section ──────────────────────────────────── */
  .hangar-iap-section { margin-top: 8px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.08); }
  .hangar-iap-buy-btn { padding: 10px 20px; border-radius: 8px; border: 1px solid #4ade80; background: rgba(74,222,128,0.1); color: #4ade80; font-size: 13px; font-weight: 600; cursor: pointer; transition: background 0.2s, color 0.2s; }
  .hangar-iap-buy-btn:hover { background: rgba(74,222,128,0.2); }
  .hangar-iap-buy-btn:disabled { opacity: 0.5; cursor: default; }
  .hangar-iap-purchased { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 8px; background: rgba(74,222,128,0.12); border: 1px solid rgba(74,222,128,0.35); color: #4ade80; font-size: 13px; font-weight: 600; }
  .hangar-iap-unavailable { font-size: 12px; color: rgba(255,255,255,0.35); font-style: italic; margin-top: 4px; }
  .hangar-iap-hint { font-size: 11px; color: rgba(255,255,255,0.35); margin-top: 6px; }
  .hangar-iap-restore-btn { background: none; border: none; font-size: 11px; color: rgba(255,255,255,0.3); text-decoration: underline; cursor: pointer; margin-top: 8px; padding: 0; display: block; }
  .hangar-iap-restore-btn:hover { color: rgba(255,255,255,0.55); }
  .hangar-iap-restore-btn:disabled { opacity: 0.4; cursor: default; }
`;

// ─────────────────────────────────────────────────────────────────────────────
// Skin data
// ─────────────────────────────────────────────────────────────────────────────

const SHIP_SKINS = {
  vanguard: [
    { id: 'vanguard_default', name: 'Default', price: 0, colors: { primary: '#0ea5e9', accent: '#38bdf8', thruster: '#f97316' }, desc: 'Stock sky blue' },
    { id: 'vanguard_crimson', name: 'Crimson', price: 200, colors: { primary: '#f87171', accent: '#fca5a5', thruster: '#ef4444' }, desc: 'Blood red variant' },
    { id: 'vanguard_gold', name: 'Gold Rush', price: 350, colors: { primary: '#fbbf24', accent: '#fde68a', thruster: '#f59e0b' }, desc: 'Elite gilded finish' },
    { id: 'vanguard_void', name: 'Void Dark', price: 500, colors: { primary: '#818cf8', accent: '#c4b5fd', thruster: '#6366f1' }, desc: 'Deep space purple' },
  ],
  phantom: [
    { id: 'phantom_default', name: 'Default', price: 0, colors: { primary: '#14b8a6', accent: '#34d399', thruster: '#22d3ee' }, desc: 'Stock teal' },
    { id: 'phantom_emerald', name: 'Emerald', price: 200, colors: { primary: '#34d399', accent: '#6ee7b7', thruster: '#10b981' }, desc: 'Stealth green' },
    { id: 'phantom_gold', name: 'Gold Rush', price: 350, colors: { primary: '#fbbf24', accent: '#fde68a', thruster: '#f59e0b' }, desc: 'Elite gilded finish' },
    { id: 'phantom_neon', name: 'Neon Pink', price: 500, colors: { primary: '#f472b6', accent: '#fbcfe8', thruster: '#ec4899' }, desc: 'Hot pink neon' },
  ],
  spectre: [
    { id: 'spectre_default', name: 'Default', price: 0, colors: { primary: '#6366f1', accent: '#818cf8', thruster: '#c084fc' }, desc: 'Stock indigo' },
    { id: 'spectre_arctic', name: 'Arctic', price: 200, colors: { primary: '#67e8f9', accent: '#a5f3fc', thruster: '#22d3ee' }, desc: 'Ice blue variant' },
    { id: 'spectre_gold', name: 'Gold Rush', price: 350, colors: { primary: '#fbbf24', accent: '#fde68a', thruster: '#f59e0b' }, desc: 'Elite gilded finish' },
    { id: 'spectre_void', name: 'Void Dark', price: 500, colors: { primary: '#e879f9', accent: '#f0abfc', thruster: '#d946ef' }, desc: 'Neon magenta' },
  ],
  bulwark: [
    { id: 'bulwark_default', name: 'Default', price: 0, colors: { primary: '#475569', accent: '#94a3b8', thruster: '#facc15' }, desc: 'Stock slate' },
    { id: 'bulwark_crimson', name: 'Crimson', price: 200, colors: { primary: '#f87171', accent: '#fca5a5', thruster: '#ef4444' }, desc: 'Battle red' },
    { id: 'bulwark_gold', name: 'Gold Rush', price: 350, colors: { primary: '#fbbf24', accent: '#fde68a', thruster: '#f59e0b' }, desc: 'Elite gilded finish' },
    { id: 'bulwark_void', name: 'Void Dark', price: 500, colors: { primary: '#818cf8', accent: '#c4b5fd', thruster: '#6366f1' }, desc: 'Deep space purple' },
  ],
  titan: [
    { id: 'titan_default', name: 'Default', price: 0, colors: { primary: '#78716c', accent: '#57534e', thruster: '#dc2626' }, desc: 'Stock stone' },
    { id: 'titan_arctic', name: 'Arctic', price: 200, colors: { primary: '#67e8f9', accent: '#a5f3fc', thruster: '#22d3ee' }, desc: 'Ice blue variant' },
    { id: 'titan_gold', name: 'Gold Rush', price: 350, colors: { primary: '#fbbf24', accent: '#fde68a', thruster: '#f59e0b' }, desc: 'Elite gilded finish' },
    { id: 'titan_void', name: 'Void Dark', price: 500, colors: { primary: '#e879f9', accent: '#f0abfc', thruster: '#d946ef' }, desc: 'Neon magenta' },
  ],
  emberwing: [
    { id: 'emberwing_default', name: 'Default', price: 0, colors: { primary: '#ef4444', accent: '#fb7185', thruster: '#f97316' }, desc: 'Stock ember red' },
    { id: 'emberwing_plasma', name: 'Plasma', price: 200, colors: { primary: '#38bdf8', accent: '#7dd3fc', thruster: '#0ea5e9' }, desc: 'Electric blue' },
    { id: 'emberwing_gold', name: 'Gold Rush', price: 350, colors: { primary: '#fbbf24', accent: '#fde68a', thruster: '#f59e0b' }, desc: 'Elite gilded finish' },
    { id: 'emberwing_void', name: 'Void Dark', price: 500, colors: { primary: '#c084fc', accent: '#e9d5ff', thruster: '#a855f7' }, desc: 'Dark purple' },
  ],
};

const SKINS_STORAGE_KEY = 'voidrift_skins';

function loadSkinsState() {
  try {
    const raw = localStorage.getItem(SKINS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return {
          owned: Array.isArray(parsed.owned) ? parsed.owned : [],
          equipped: (parsed.equipped && typeof parsed.equipped === 'object') ? parsed.equipped : {},
        };
      }
    }
  } catch (e) {
    // ignore
  }
  return { owned: [], equipped: {} };
}

function saveSkinsState(state) {
  try {
    localStorage.setItem(SKINS_STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    // ignore
  }
}

function getEquippedSkinId(shipId) {
  const state = loadSkinsState();
  return state.equipped[shipId] || (shipId + '_default');
}

function getEquippedSkin(shipId) {
  const skinId = getEquippedSkinId(shipId);
  const skins = SHIP_SKINS[shipId] || [];
  return skins.find(s => s.id === skinId) || skins[0] || null;
}

function isSkinOwned(skinId) {
  const state = loadSkinsState();
  return state.owned.includes(skinId);
}

function equipSkin(shipId, skinId) {
  const state = loadSkinsState();
  state.equipped[shipId] = skinId;
  saveSkinsState(state);
}

function buySkin(skinId, price) {
  const credits = getLiveCredits();
  if (credits < price) return false;
  const spent = trySpendCredits(price);
  if (!spent) return false;
  const state = loadSkinsState();
  if (!state.owned.includes(skinId)) state.owned.push(skinId);
  saveSkinsState(state);
  return true;
}

// Expose getEquippedSkin for use by the main game (script.js / index.html)
if (typeof window !== 'undefined') {
  window.getEquippedSkin = getEquippedSkin;
}

// ─────────────────────────────────────────────────────────────────────────────
// Module state
// ─────────────────────────────────────────────────────────────────────────────

let _overlay = null;
let _hangarState = null;
let _options = {};
let _keyHandler = null;
let _activeTab = 'upgrades'; // 'upgrades' | 'achievements' | 'skins' | 'settings'
let _skinsShipFilter = null; // which ship's skins are shown

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
 * Rebuild the entire upgrade grid without tearing down the full overlay.
 * No-ops when the achievements tab is active.
 */
function refreshGrid() {
  if (_activeTab !== 'upgrades') return;

  const grid = document.querySelector('#hangarContent .hangar-grid');
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

/**
 * Show a brief toast notification for a newly-unlocked achievement.
 */
function showAchievementToast(achievement) {
  let container = document.getElementById('hangar-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'hangar-toast-container';
    const panel = document.getElementById('hangarPanel');
    if (panel) panel.appendChild(container);
    else document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'hangar-toast';
  toast.innerHTML = `
    <div class="hangar-toast-icon">${achievement.icon}</div>
    <div class="hangar-toast-body">
      <div class="hangar-toast-label">Achievement Unlocked</div>
      <div class="hangar-toast-name">${achievement.name}</div>
      <div class="hangar-toast-desc">${achievement.desc}</div>
    </div>
  `;
  container.appendChild(toast);

  // Auto-dismiss after 3.5 s
  setTimeout(() => {
    toast.classList.add('toast-out');
    toast.addEventListener('animationend', () => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, { once: true });
  }, 3500);
}

/**
 * Render a single achievement card element.
 */
function renderAchievementCard(achievement, isUnlocked) {
  const card = document.createElement('div');
  card.className = `achievement-card ${isUnlocked ? 'is-unlocked' : 'is-locked'}`;
  card.dataset.achievementId = achievement.id;

  const desc = isUnlocked ? achievement.desc : '???';
  const badgeClass = isUnlocked ? 'unlocked' : 'locked';
  const badgeText = isUnlocked ? '✦ Unlocked' : '— Locked';

  card.innerHTML = `
    <div class="achievement-card-header">
      <div class="achievement-card-icon">${achievement.icon}</div>
      <div class="achievement-card-title-block">
        <div class="achievement-card-name">${achievement.name}</div>
        <div class="achievement-card-desc">${desc}</div>
      </div>
    </div>
    <div class="achievement-badge ${badgeClass}">${badgeText}</div>
  `;

  return card;
}

/**
 * Rebuild the achievements view inside #hangarContent.
 */
function renderAchievementsView() {
  const content = document.getElementById('hangarContent');
  if (!content) return;

  const { unlockedIds } = loadAchievements();
  const unlockedCount = unlockedIds.length;
  const total = ACHIEVEMENT_CATALOG.length;

  content.innerHTML = '';

  const countEl = document.createElement('div');
  countEl.className = 'achievement-count';
  countEl.innerHTML = `<span>${unlockedCount}</span> / ${total} UNLOCKED`;
  content.appendChild(countEl);

  const grid = document.createElement('div');
  grid.className = 'achievement-grid';

  // Unlocked first, then locked
  const unlocked = ACHIEVEMENT_CATALOG.filter(a => unlockedIds.includes(a.id));
  const locked = ACHIEVEMENT_CATALOG.filter(a => !unlockedIds.includes(a.id));

  for (const a of unlocked) grid.appendChild(renderAchievementCard(a, true));
  for (const a of locked)   grid.appendChild(renderAchievementCard(a, false));

  content.appendChild(grid);
}

/**
 * Rebuild the upgrades view inside #hangarContent (wraps existing grid).
 */
function renderUpgradesView() {
  const content = document.getElementById('hangarContent');
  if (!content) return;
  content.innerHTML = '<div class="hangar-grid"></div>';
  refreshGrid();
}

/**
 * Render the skins tab. Shows a ship filter row and a grid of skin cards
 * for the currently selected ship filter.
 */
function renderSkinsView() {
  const content = document.getElementById('hangarContent');
  if (!content) return;

  // Determine which ships have skin definitions
  const shipIds = Object.keys(SHIP_SKINS);

  // Default filter: prefer the currently equipped ship, fall back to first
  const currentShipId = (
    (typeof _options.getSelectedShip === 'function' && _options.getSelectedShip()) ||
    (typeof window !== 'undefined' && window.Save && window.Save.data && window.Save.data.selectedShip) ||
    shipIds[0]
  );

  if (!_skinsShipFilter || !SHIP_SKINS[_skinsShipFilter]) {
    _skinsShipFilter = SHIP_SKINS[currentShipId] ? currentShipId : shipIds[0];
  }

  const skinLabels = {
    vanguard: 'Vanguard',
    phantom: 'Phantom',
    spectre: 'Spectre',
    bulwark: 'Bulwark',
    titan: 'Titan',
    emberwing: 'Emberwing',
  };

  // Build ship filter buttons
  const filterHtml = shipIds.map(sid => {
    const active = sid === _skinsShipFilter ? ' active' : '';
    const label = skinLabels[sid] || sid;
    return `<button class="skin-ship-btn${active}" data-ship="${sid}">${label}</button>`;
  }).join('');

  // Build skin cards
  const skins = SHIP_SKINS[_skinsShipFilter] || [];
  const equippedId = getEquippedSkinId(_skinsShipFilter);
  const credits = getLiveCredits();

  const cardsHtml = skins.map(skin => {
    const isEquipped = skin.id === equippedId;
    const owned = skin.price === 0 || isSkinOwned(skin.id);
    const canAfford = credits >= skin.price;
    const cardClass = isEquipped ? ' is-equipped' : '';

    let btnHtml;
    if (isEquipped) {
      btnHtml = `<button class="skin-action-btn equipped-btn" disabled>✦ Equipped</button>`;
    } else if (owned) {
      btnHtml = `<button class="skin-action-btn owned" data-action="equip" data-skin="${skin.id}" data-ship="${_skinsShipFilter}">Equip</button>`;
    } else if (skin.price === 0) {
      btnHtml = `<button class="skin-action-btn free" data-action="equip" data-skin="${skin.id}" data-ship="${_skinsShipFilter}">Equip Free</button>`;
    } else {
      const affordClass = canAfford ? '' : ' cant-afford';
      const label = canAfford ? `Buy — ${skin.price.toLocaleString()} CR` : `${skin.price.toLocaleString()} CR`;
      btnHtml = `<button class="skin-action-btn buy${affordClass}" ${canAfford ? '' : 'disabled'} data-action="buy" data-skin="${skin.id}" data-ship="${_skinsShipFilter}" data-price="${skin.price}">${label}</button>`;
    }

    return `
      <div class="skin-card${cardClass}" data-skin-id="${skin.id}">
        <div class="skin-swatch-row">
          <div class="skin-swatch" style="background:${skin.colors.primary};"></div>
          <div class="skin-swatch-mini">
            <div class="skin-swatch-accent" style="background:${skin.colors.accent};"></div>
            <div class="skin-swatch-engine" style="background:${skin.colors.thruster};"></div>
          </div>
          <div class="skin-info">
            <div class="skin-name">${skin.name}</div>
            <div class="skin-desc">${skin.desc}</div>
          </div>
        </div>
        ${btnHtml}
      </div>`;
  }).join('');

  content.innerHTML = `
    <div class="skins-ship-selector">${filterHtml}</div>
    <div class="skins-grid">${cardsHtml}</div>
  `;

  // ── Event listeners ──────────────────────────────────────────

  // Ship filter buttons
  content.querySelectorAll('.skin-ship-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      _skinsShipFilter = btn.dataset.ship;
      renderSkinsView();
    });
  });

  // Skin action buttons (equip / buy)
  content.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      const skinId = btn.dataset.skin;
      const shipId = btn.dataset.ship;
      const price = parseInt(btn.dataset.price || '0', 10);

      if (action === 'equip') {
        equipSkin(shipId, skinId);
        // Notify game of skin change if callback is provided
        if (typeof _options.onSkinEquip === 'function') {
          const skin = (SHIP_SKINS[shipId] || []).find(s => s.id === skinId);
          _options.onSkinEquip(shipId, skinId, skin);
        }
        renderSkinsView();
      } else if (action === 'buy') {
        const success = buySkin(skinId, price);
        if (success) {
          equipSkin(shipId, skinId);
          if (typeof _options.onSkinEquip === 'function') {
            const skin = (SHIP_SKINS[shipId] || []).find(s => s.id === skinId);
            _options.onSkinEquip(shipId, skinId, skin);
          }
          // Refresh credits display
          const crEl = document.getElementById('hangar-credits-amount');
          if (crEl) crEl.textContent = getLiveCredits().toLocaleString();
          renderSkinsView();
        }
      }
    });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// IAPManager — In-App Purchase for "Remove Ads"
// ─────────────────────────────────────────────────────────────────────────────
const IAPManager = {
  PRODUCT_ID: 'com.voidrift.game.removeads',
  STORAGE_KEY: 'vr_ads_removed',

  get platform() {
    if (typeof window.webkit?.messageHandlers?.iapPurchase !== 'undefined') return 'ios';
    if (typeof window.AndroidBridge?.iapPurchase !== 'undefined') return 'android';
    return 'web';
  },

  get isPurchased() {
    try { return localStorage.getItem(this.STORAGE_KEY) === 'true'; } catch (_) { return false; }
  },

  initialize() {
    window.addEventListener('iapPurchased', (e) => {
      const productId = e.detail?.productId || e.detail;
      if (productId === this.PRODUCT_ID || !productId) {
        try { localStorage.setItem(this.STORAGE_KEY, 'true'); } catch (_) {}
        console.log('[IAP] Remove Ads purchased successfully');
        // Refresh the settings view if it is currently visible
        const content = document.getElementById('hangarContent');
        if (content && content.querySelector('.hangar-iap-section')) {
          renderSettingsView();
        }
      }
    });
    window.addEventListener('iapFailed', (e) => {
      const productId = e.detail?.productId || e.detail;
      if (productId === this.PRODUCT_ID || !productId) {
        console.warn('[IAP] Purchase failed:', e.detail?.reason || 'unknown');
        const btn = document.getElementById('hangar-iap-buy-btn');
        if (btn) {
          btn.disabled = false;
          btn.textContent = 'Remove Ads — $2.99';
        }
        const hint = document.getElementById('hangar-iap-hint');
        if (hint) { hint.textContent = 'Purchase failed. Please try again.'; hint.style.color = '#ef4444'; }
      }
    });
    // Restore purchases result handler (required by App Store guidelines)
    window.addEventListener('iapRestored', (e) => {
      const productIds = e.detail?.productIds || (e.detail ? [e.detail] : []);
      const restored = productIds.includes(this.PRODUCT_ID);
      if (restored) {
        try { localStorage.setItem(this.STORAGE_KEY, 'true'); } catch (_) {}
        console.log('[IAP] Remove Ads restored');
      } else {
        console.log('[IAP] Restore complete — no matching purchases found');
      }
      const content = document.getElementById('hangarContent');
      if (content && content.querySelector('.hangar-iap-section')) {
        renderSettingsView();
        const hint = document.getElementById('hangar-iap-hint');
        if (hint && !restored) {
          hint.textContent = restored ? '' : 'No previous purchases found.';
          hint.style.color = '#94a3b8';
        }
      }
    });
    window.addEventListener('iapRestoreFailed', () => {
      console.warn('[IAP] Restore failed');
      const hint = document.getElementById('hangar-iap-hint');
      if (hint) { hint.textContent = 'Restore failed. Please try again.'; hint.style.color = '#ef4444'; }
      const restoreBtn = document.getElementById('hangar-iap-restore-btn');
      if (restoreBtn) { restoreBtn.disabled = false; restoreBtn.textContent = 'Restore purchases'; }
    });
    console.log(`[IAP] Initialized on platform: ${this.platform}`);
  },

  restore() {
    if (this.platform === 'web') return; // no-op on web; button is hidden
    const restoreBtn = document.getElementById('hangar-iap-restore-btn');
    if (restoreBtn) { restoreBtn.disabled = true; restoreBtn.textContent = 'Restoring…'; }
    if (this.platform === 'ios') {
      window.webkit.messageHandlers.iapRestore.postMessage({});
    } else if (this.platform === 'android') {
      window.AndroidBridge.iapRestore();
    }
  },

  purchase() {
    if (this.platform === 'web') {
      // Show a brief overlay message instead of a blocking alert
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed; inset: 0; background: rgba(0,0,0,0.85);
        display: flex; align-items: center; justify-content: center;
        z-index: 99999; font-family: 'Orbitron', monospace;
      `;
      overlay.innerHTML = `
        <div style="text-align:center; max-width:300px; padding:28px; background:rgba(15,23,42,0.95);
                    border:1px solid rgba(255,255,255,0.12); border-radius:16px;">
          <div style="font-size:36px; margin-bottom:12px;">📱</div>
          <div style="font-size:15px; font-weight:700; color:#fff; margin-bottom:8px;">Mobile Only</div>
          <div style="font-size:13px; color:#94a3b8; margin-bottom:20px;">
            In-app purchases are available on iOS &amp; Android.
          </div>
          <button style="padding:8px 20px; border-radius:8px; border:1px solid rgba(255,255,255,0.2);
                         background:rgba(255,255,255,0.08); color:#fff; font-size:13px; cursor:pointer;"
                  onclick="this.closest('[style]').remove()">Got it</button>
        </div>
      `;
      document.body.appendChild(overlay);
      return;
    }
    if (this.platform === 'ios') {
      window.webkit.messageHandlers.iapPurchase.postMessage({ productId: this.PRODUCT_ID });
    } else if (this.platform === 'android') {
      window.AndroidBridge.iapPurchase(this.PRODUCT_ID);
    }
  },
};

/**
 * Render the settings tab inside #hangarContent.
 * Wires volume sliders and mute toggle to AudioManager if it is available
 * on window. Degrades gracefully if AudioManager is not present.
 */
function renderSettingsView() {
  const content = document.getElementById('hangarContent');
  if (!content) return;

  // Read current values from AudioManager (or fall back to defaults)
  const AM = (typeof window !== 'undefined' && window.AudioManager) || null;
  const masterVal = AM ? Math.round(AM.getVolume('master') * 100) : 70;
  const sfxVal    = AM ? Math.round(AM.getVolume('sfx')    * 100) : 80;
  const musicVal  = AM ? Math.round(AM.getVolume('music')  * 100) : 50;
  const isMuted   = AM ? AM.getMuted() : false;

  content.innerHTML = `
    <div class="hangar-settings">
      <div class="hangar-settings-section">
        <div class="hangar-settings-label">🔊 Audio</div>

        <div class="hangar-settings-row">
          <span>Master</span>
          <input type="range" class="hangar-settings-slider" id="settings-master-vol"
                 min="0" max="100" value="${masterVal}">
          <span class="hangar-settings-vol" id="settings-master-vol-label">${masterVal}</span>
        </div>

        <div class="hangar-settings-row">
          <span>Sound Effects</span>
          <input type="range" class="hangar-settings-slider" id="settings-sfx-vol"
                 min="0" max="100" value="${sfxVal}">
          <span class="hangar-settings-vol" id="settings-sfx-vol-label">${sfxVal}</span>
        </div>

        <div class="hangar-settings-row">
          <span>Music</span>
          <input type="range" class="hangar-settings-slider" id="settings-music-vol"
                 min="0" max="100" value="${musicVal}">
          <span class="hangar-settings-vol" id="settings-music-vol-label">${musicVal}</span>
        </div>

        <div class="hangar-settings-row">
          <span>Mute All</span>
          <button class="hangar-mute-btn${isMuted ? ' muted' : ''}" id="settings-mute-btn">
            ${isMuted ? '🔇 Muted' : '🔊 Sound On'}
          </button>
        </div>
      </div>

      <div class="hangar-settings-section hangar-iap-section">
        <div class="hangar-settings-label">🚫 Ads</div>
        ${IAPManager.isPurchased
          ? `<div class="hangar-iap-purchased">✓ Ads Removed</div>`
          : IAPManager.platform === 'web'
            ? `<button class="hangar-iap-buy-btn" id="hangar-iap-buy-btn" disabled>Remove Ads — $2.99</button>
               <div class="hangar-iap-unavailable">Available on iOS &amp; Android</div>`
            : `<button class="hangar-iap-buy-btn" id="hangar-iap-buy-btn">Remove Ads — $2.99</button>
               <div class="hangar-iap-hint" id="hangar-iap-hint">One-time purchase. Removes ad prompts forever.</div>
               <button class="hangar-iap-restore-btn" id="hangar-iap-restore-btn">Restore purchases</button>`
        }
      </div>
    </div>
  `;

  // Wire up sliders
  function wireSlider(sliderId, labelId, channel) {
    const slider = document.getElementById(sliderId);
    const label  = document.getElementById(labelId);
    if (!slider) return;
    slider.addEventListener('input', () => {
      const val = parseInt(slider.value, 10);
      if (label) label.textContent = val;
      if (AM) AM.setVolume(channel, val / 100);
    });
  }

  wireSlider('settings-master-vol', 'settings-master-vol-label', 'master');
  wireSlider('settings-sfx-vol',    'settings-sfx-vol-label',    'sfx');
  wireSlider('settings-music-vol',  'settings-music-vol-label',  'music');

  // Wire up mute toggle
  const muteBtn = document.getElementById('settings-mute-btn');
  if (muteBtn) {
    muteBtn.addEventListener('click', () => {
      const newMuted = AM ? AM.toggleMute() : !muteBtn.classList.contains('muted');
      muteBtn.classList.toggle('muted', newMuted);
      muteBtn.textContent = newMuted ? '🔇 Muted' : '🔊 Sound On';
    });
  }

  // Wire up Remove Ads purchase button
  const iapBtn = document.getElementById('hangar-iap-buy-btn');
  if (iapBtn && !iapBtn.disabled) {
    iapBtn.addEventListener('click', () => {
      iapBtn.disabled = true;
      iapBtn.textContent = 'Processing…';
      IAPManager.purchase();
      // Re-enable after 8 seconds in case the native callback never fires
      setTimeout(() => {
        if (iapBtn && iapBtn.disabled && !IAPManager.isPurchased) {
          iapBtn.disabled = false;
          iapBtn.textContent = 'Remove Ads — $2.99';
        }
      }, 8000);
    });
  }

  // Wire up Restore Purchases button (required by App Store Review guidelines)
  const restoreBtn = document.getElementById('hangar-iap-restore-btn');
  if (restoreBtn) {
    restoreBtn.addEventListener('click', () => IAPManager.restore());
  }
}

/**
 * Switch the active tab ('upgrades', 'achievements', 'skins', or 'settings'),
 * update tab buttons, and re-render the content area.
 */
function switchTab(tab) {
  _activeTab = tab;

  const tabBtns = document.querySelectorAll('.hangar-tab-btn');
  tabBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });

  if (tab === 'achievements') {
    renderAchievementsView();
  } else if (tab === 'skins') {
    renderSkinsView();
  } else if (tab === 'settings') {
    renderSettingsView();
  } else {
    renderUpgradesView();
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
  if (!IAPManager._initialized) {
    IAPManager.initialize();
    IAPManager._initialized = true;
  }
  _options = opts;
  _hangarState = loadHangar();
  _activeTab = 'upgrades';
  _skinsShipFilter = null; // reset so it picks up current ship on open

  // ── Build DOM ────────────────────────────────────────────────

  _overlay = document.createElement('div');
  _overlay.id = 'hangarOverlay';
  _overlay.setAttribute('role', 'dialog');
  _overlay.setAttribute('aria-modal', 'true');
  _overlay.setAttribute('aria-label', 'Hangar — Permanent Upgrades');

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

      <div id="hangarTabBar">
        <button class="hangar-tab-btn active" data-tab="upgrades">Upgrades</button>
        <button class="hangar-tab-btn" data-tab="skins">Skins</button>
        <button class="hangar-tab-btn" data-tab="achievements">Achievements</button>
        <button class="hangar-tab-btn" data-tab="settings">Settings</button>
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

  // Tab switching
  document.querySelectorAll('.hangar-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

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
  // Expose achievement helpers so gameplay code can call them directly
  window.updateAchievementStats = function(partialStats) {
    const newlyUnlocked = updateStats(partialStats);
    newlyUnlocked.forEach(a => showAchievementToast(a));
    return newlyUnlocked;
  };
}

// ── Named achievement exports for module consumers ────────────────────────────
export { updateStats, getUnlocked, loadAchievements };
