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
  purchaseUpgrade,
  prestigePilot
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

  /* ── Pilot XP badge ────────────────────────────────────────── */
  .hangar-pilot-badge {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
    padding: 7px 14px;
    background: rgba(139, 92, 246, 0.08);
    border: 1px solid rgba(139, 92, 246, 0.35);
    border-radius: 8px;
    min-width: 110px;
  }

  .hangar-pilot-badge__top {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
  }

  .hangar-pilot-badge__icon {
    font-size: 13px;
    line-height: 1;
    filter: drop-shadow(0 0 5px rgba(139, 92, 246, 0.8));
  }

  .hangar-pilot-badge__lvl {
    font-size: 11px;
    font-weight: 700;
    color: rgba(167, 139, 250, 0.55);
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  .hangar-pilot-badge__num {
    font-size: 18px;
    font-weight: 800;
    color: #a78bfa;
    letter-spacing: 0.04em;
    text-shadow: 0 0 12px rgba(139, 92, 246, 0.6);
    margin-left: auto;
  }

  .hangar-pilot-xp-bar {
    width: 100%;
    height: 3px;
    background: rgba(139, 92, 246, 0.15);
    border-radius: 2px;
    overflow: hidden;
  }

  .hangar-pilot-xp-fill {
    height: 100%;
    background: linear-gradient(90deg, #7c3aed, #a78bfa);
    border-radius: 2px;
    box-shadow: 0 0 6px rgba(139, 92, 246, 0.7);
    transition: width 0.4s ease;
  }

  /* ── Pilot rank tier themes ────────────────────────────────── */
  /* RECRUIT — muted slate/blue */
  [data-rank="recruit"] { background: rgba(100,116,139,0.08); border-color: rgba(100,116,139,0.35); }
  [data-rank="recruit"] .hangar-pilot-badge__icon  { filter: drop-shadow(0 0 5px rgba(100,116,139,0.8)); }
  [data-rank="recruit"] .hangar-pilot-badge__lvl   { color: rgba(148,163,184,0.7); }
  [data-rank="recruit"] .hangar-pilot-badge__num   { color: #94a3b8; text-shadow: 0 0 10px rgba(100,116,139,0.5); }
  [data-rank="recruit"] .hangar-pilot-xp-fill      { background: linear-gradient(90deg,#475569,#94a3b8); box-shadow: 0 0 4px rgba(100,116,139,0.6); }

  /* PILOT — purple (original, already styled via base rules — just reinforce) */
  [data-rank="pilot"] { background: rgba(139,92,246,0.08); border-color: rgba(139,92,246,0.35); }
  [data-rank="pilot"] .hangar-pilot-badge__icon  { filter: drop-shadow(0 0 5px rgba(139,92,246,0.8)); }
  [data-rank="pilot"] .hangar-pilot-badge__lvl   { color: rgba(167,139,250,0.55); }
  [data-rank="pilot"] .hangar-pilot-badge__num   { color: #a78bfa; text-shadow: 0 0 12px rgba(139,92,246,0.6); }
  [data-rank="pilot"] .hangar-pilot-xp-fill      { background: linear-gradient(90deg,#7c3aed,#a78bfa); box-shadow: 0 0 6px rgba(139,92,246,0.7); }

  /* ACE — cyan */
  [data-rank="ace"] { background: rgba(6,182,212,0.08); border-color: rgba(6,182,212,0.35); }
  [data-rank="ace"] .hangar-pilot-badge__icon  { filter: drop-shadow(0 0 5px rgba(6,182,212,0.9)); }
  [data-rank="ace"] .hangar-pilot-badge__lvl   { color: rgba(34,211,238,0.65); }
  [data-rank="ace"] .hangar-pilot-badge__num   { color: #22d3ee; text-shadow: 0 0 12px rgba(6,182,212,0.7); }
  [data-rank="ace"] .hangar-pilot-xp-fill      { background: linear-gradient(90deg,#0e7490,#22d3ee); box-shadow: 0 0 6px rgba(6,182,212,0.7); }

  /* VETERAN — green */
  [data-rank="veteran"] { background: rgba(22,163,74,0.08); border-color: rgba(22,163,74,0.35); }
  [data-rank="veteran"] .hangar-pilot-badge__icon  { filter: drop-shadow(0 0 5px rgba(22,163,74,0.9)); }
  [data-rank="veteran"] .hangar-pilot-badge__lvl   { color: rgba(74,222,128,0.65); }
  [data-rank="veteran"] .hangar-pilot-badge__num   { color: #4ade80; text-shadow: 0 0 12px rgba(22,163,74,0.7); }
  [data-rank="veteran"] .hangar-pilot-xp-fill      { background: linear-gradient(90deg,#15803d,#4ade80); box-shadow: 0 0 6px rgba(22,163,74,0.7); }

  /* ELITE — gold */
  [data-rank="elite"] { background: rgba(234,179,8,0.08); border-color: rgba(234,179,8,0.4); }
  [data-rank="elite"] .hangar-pilot-badge__icon  { filter: drop-shadow(0 0 5px rgba(234,179,8,0.9)); }
  [data-rank="elite"] .hangar-pilot-badge__lvl   { color: rgba(250,204,21,0.7); }
  [data-rank="elite"] .hangar-pilot-badge__num   { color: #facc15; text-shadow: 0 0 14px rgba(234,179,8,0.8); }
  [data-rank="elite"] .hangar-pilot-xp-fill      { background: linear-gradient(90deg,#a16207,#facc15); box-shadow: 0 0 8px rgba(234,179,8,0.7); }

  /* LEGEND — crimson */
  [data-rank="legend"] { background: rgba(220,38,38,0.1); border-color: rgba(220,38,38,0.45); }
  [data-rank="legend"] .hangar-pilot-badge__icon  { filter: drop-shadow(0 0 6px rgba(220,38,38,1)); }
  [data-rank="legend"] .hangar-pilot-badge__lvl   { color: rgba(248,113,113,0.8); }
  [data-rank="legend"] .hangar-pilot-badge__num   { color: #f87171; text-shadow: 0 0 16px rgba(220,38,38,0.9); }
  [data-rank="legend"] .hangar-pilot-xp-fill      { background: linear-gradient(90deg,#991b1b,#f87171); box-shadow: 0 0 10px rgba(220,38,38,0.8); }

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

  .hangar-nav-badge {
    position: absolute;
    top: -6px;
    right: -6px;
    min-width: 16px;
    height: 16px;
    padding: 0 4px;
    border-radius: 999px;
    background: #f97316;
    color: #0b0f1a;
    font-size: 10px;
    font-weight: 900;
    line-height: 16px;
    text-align: center;
    box-shadow: 0 0 6px rgba(249, 115, 22, 0.7);
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

  /* ── Missions tab ──────────────────────────────────────────── */
  .hangar-missions { padding: 16px; }
  .hangar-missions-header { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(255,255,255,0.35); margin-bottom: 14px; display: flex; align-items: center; gap: 8px; }
  .hangar-missions-header span { color: rgba(255,255,255,0.55); }
  .hangar-missions-header .hm-resets { margin-left: auto; font-style: italic; color: rgba(255,255,255,0.22); }
  .hangar-mission-card {
    border-radius: 10px; padding: 14px 16px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.03);
    display: flex; flex-direction: column; gap: 8px;
    margin-bottom: 8px; transition: border-color 0.2s;
  }
  .hangar-mission-card.completed { border-color: rgba(99,102,241,0.35); background: rgba(99,102,241,0.06); }
  .hangar-mission-card.claimed   { border-color: rgba(255,255,255,0.05); opacity: 0.5; }
  .hangar-mission-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
  .hangar-mission-name { font-size: 12px; font-weight: 700; color: rgba(255,255,255,0.88); letter-spacing: -0.01em; }
  .hangar-mission-desc { font-size: 10px; color: rgba(255,255,255,0.4); margin-top: 2px; line-height: 1.4; }
  .hangar-mission-reward {
    flex-shrink: 0; display: flex; align-items: center; gap: 4px;
    font-size: 11px; font-family: 'Orbitron', monospace; font-weight: 700;
    color: #fbbf24; white-space: nowrap;
  }
  .hangar-mission-bar-wrap { display: flex; align-items: center; gap: 8px; }
  .hangar-mission-bar-track {
    flex: 1; height: 5px; border-radius: 3px;
    background: rgba(255,255,255,0.08);
    overflow: hidden;
  }
  .hangar-mission-bar-fill {
    height: 100%; border-radius: 3px;
    background: linear-gradient(90deg, #6366f1, #818cf8);
    transition: width 0.4s ease;
  }
  .hangar-mission-bar.done .hangar-mission-bar-fill { background: linear-gradient(90deg, #22c55e, #4ade80); }
  .hangar-mission-progress-txt { font-size: 10px; font-family: 'Orbitron', monospace; color: rgba(255,255,255,0.4); white-space: nowrap; }
  .hangar-mission-badges { display: flex; gap: 5px; flex-wrap: wrap; }
  .hangar-mission-badge {
    font-size: 9px; font-weight: 700; letter-spacing: 0.07em; text-transform: uppercase;
    padding: 2px 7px; border-radius: 4px; border: 1px solid;
  }
  .hangar-mission-badge.frag { color: #c084fc; background: rgba(168,85,247,0.12); border-color: rgba(168,85,247,0.3); }
  .hangar-mission-badge.xp   { color: #38bdf8; background: rgba(56,189,248,0.12); border-color: rgba(56,189,248,0.3); }
  .hangar-mission-claim-btn {
    align-self: flex-end; padding: 6px 14px; border-radius: 6px; border: none; cursor: pointer;
    font-size: 10px; font-family: 'Orbitron', monospace; font-weight: 700; letter-spacing: 0.08em;
    text-transform: uppercase; background: linear-gradient(135deg, #6366f1, #4f46e5);
    color: #fff; transition: opacity 0.15s, transform 0.1s;
  }
  .hangar-mission-claim-btn:hover { opacity: 0.85; transform: translateY(-1px); }
  .hangar-mission-claim-btn:active { transform: translateY(0); }
  .hangar-mission-claim-btn.claimed-label { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.3); cursor: default; }
  .hangar-missions-empty { padding: 40px 16px; text-align: center; color: rgba(255,255,255,0.25); font-size: 12px; }

  /* ── Active Bounties (in Missions tab) ─────────────────────── */
  .hangar-bounties-header { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(255,255,255,0.35); margin: 18px 0 10px; }
  .hangar-bounty-card {
    border-radius: 10px; padding: 12px 16px;
    border: 1px solid var(--bounty-color, rgba(251,191,36,0.3));
    background: rgba(255,255,255,0.03);
    display: flex; align-items: center; justify-content: space-between; gap: 10px;
    margin-bottom: 8px;
  }
  .hangar-bounty-name { font-size: 12px; font-weight: 700; color: var(--bounty-color, #fbbf24); letter-spacing: -0.01em; }
  .hangar-bounty-desc { font-size: 10px; color: rgba(255,255,255,0.4); margin-top: 2px; line-height: 1.4; }
  .hangar-bounty-difficulty { font-size: 9px; font-weight: 700; letter-spacing: 0.07em; text-transform: uppercase; color: rgba(255,255,255,0.45); margin-top: 4px; }
  .hangar-bounty-reward {
    flex-shrink: 0; display: flex; flex-direction: column; align-items: flex-end; gap: 2px;
    font-size: 11px; font-family: 'Orbitron', monospace; font-weight: 700;
    color: #fbbf24; white-space: nowrap;
  }
  .hangar-bounty-reward .frag-tag { font-size: 9px; color: #c084fc; }

  /* ── Fragments tab ─────────────────────────────────────────── */
  .hangar-fragments { padding: 16px; }
  .hangar-fragments-header { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(255,255,255,0.35); margin-bottom: 14px; display: flex; align-items: center; gap: 8px; }
  .hangar-fragments-header span { color: rgba(255,255,255,0.55); }
  .hangar-fragments-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 10px; }
  .hangar-frag-card {
    border-radius: 10px;
    padding: 12px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.03);
    display: flex;
    flex-direction: column;
    gap: 6px;
    transition: border-color 0.2s;
    position: relative;
    overflow: hidden;
  }
  .hangar-frag-card.collected { background: rgba(255,255,255,0.04); }
  .hangar-frag-card.locked { opacity: 0.45; filter: grayscale(0.7); }
  .hangar-frag-card::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 10px;
    opacity: 0;
    transition: opacity 0.2s;
    pointer-events: none;
  }
  .hangar-frag-card.collected::before { background: var(--frag-glow, rgba(168,85,247,0.06)); opacity: 1; }
  .hangar-frag-card-top { display: flex; align-items: center; gap: 8px; }
  .hangar-frag-gem {
    width: 28px; height: 28px; border-radius: 6px;
    display: flex; align-items: center; justify-content: center;
    font-size: 15px; flex-shrink: 0;
    background: var(--frag-bg, rgba(168,85,247,0.15));
    border: 1px solid var(--frag-border, rgba(168,85,247,0.3));
  }
  .hangar-frag-name { font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.9); letter-spacing: -0.01em; }
  .hangar-frag-rarity {
    display: inline-block; padding: 1px 6px; border-radius: 4px;
    font-size: 9px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase;
    background: var(--frag-rarity-bg, rgba(168,85,247,0.15));
    color: var(--frag-color, #c084fc);
    border: 1px solid var(--frag-border, rgba(168,85,247,0.3));
  }
  .hangar-frag-desc { font-size: 10px; color: rgba(255,255,255,0.4); line-height: 1.5; }
  .hangar-frag-footer { display: flex; align-items: center; justify-content: space-between; margin-top: 2px; }
  .hangar-frag-count { font-size: 10px; font-family: 'Orbitron', monospace; color: var(--frag-color, #c084fc); font-weight: 700; }
  .hangar-frag-unlock { font-size: 9px; color: rgba(255,255,255,0.3); font-style: italic; }
  .hangar-frag-lock { font-size: 18px; position: absolute; top: 10px; right: 10px; opacity: 0.3; }

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

  /* ── Daily Challenge section ─────────────────────────────────── */
  .hangar-daily-section { margin-top: 8px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.08); }
  .hangar-daily-desc { font-size: 12px; color: rgba(255,255,255,0.45); line-height: 1.55; margin-bottom: 14px; }
  .hangar-daily-meta { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; min-height: 20px; }
  .hangar-daily-date { font-family: 'Orbitron', monospace; font-size: 11px; letter-spacing: 0.08em; color: rgba(255,255,255,0.35); }
  .hangar-daily-best { font-size: 12px; color: rgba(74,222,128,0.8); }
  .hangar-daily-best strong { color: #4ade80; font-weight: 700; }
  .hangar-daily-btn { display: block; width: 100%; padding: 11px 16px; background: linear-gradient(135deg, rgba(99,102,241,0.18) 0%, rgba(74,222,128,0.12) 100%); border: 1px solid rgba(99,102,241,0.45); border-radius: 8px; color: #a5b4fc; font-family: 'Orbitron', monospace; font-size: 12px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer; transition: background 0.2s, border-color 0.2s, color 0.2s; }
  .hangar-daily-btn:hover:not(:disabled) { background: linear-gradient(135deg, rgba(99,102,241,0.32) 0%, rgba(74,222,128,0.22) 100%); border-color: rgba(99,102,241,0.75); color: #c7d2fe; }
  .hangar-daily-btn:disabled { opacity: 0.5; cursor: default; }

  /* ── HUD Theme picker ─────────────────────────────────── */
  .hangar-theme-section { margin-top: 8px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.08); }
  .hangar-theme-swatches { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 10px; }
  .hangar-theme-swatch { width: 32px; height: 32px; border-radius: 50%; border: 2px solid transparent; cursor: pointer; transition: transform 0.15s, border-color 0.15s; }
  .hangar-theme-swatch:hover { transform: scale(1.15); }
  .hangar-theme-swatch.active { border-color: #fff; box-shadow: 0 0 0 2px rgba(255,255,255,0.3); transform: scale(1.1); }
  .hangar-theme-hint { font-size: 11px; color: rgba(255,255,255,0.35); margin-top: 8px; }

  /* ── Accessibility section ───────────────────────────────── */
  .hangar-accessibility-section { margin-top: 8px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.08); }
  .hangar-toggle-switch { position: relative; display: inline-block; width: 42px; height: 24px; flex-shrink: 0; }
  .hangar-toggle-switch input { opacity: 0; width: 0; height: 0; }
  .hangar-toggle-slider { position: absolute; inset: 0; background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.15); border-radius: 999px; cursor: pointer; transition: background 0.2s; }
  .hangar-toggle-slider::before { content: ''; position: absolute; width: 16px; height: 16px; left: 3px; top: 3px; background: rgba(255,255,255,0.7); border-radius: 50%; transition: transform 0.2s, background 0.2s; }
  .hangar-toggle-switch input:checked + .hangar-toggle-slider { background: rgba(74,222,128,0.35); border-color: #4ade80; }
  .hangar-toggle-switch input:checked + .hangar-toggle-slider::before { transform: translateX(18px); background: #4ade80; }

  /* ── Leaderboard tab ─────────────────────────────────────────── */
  .hangar-lb-tabs { display: flex; gap: 4px; padding: 12px 16px 0; }
  .hangar-lb-tab { flex: 1; padding: 7px 12px; font-family: 'Orbitron', monospace; font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; border: 1px solid rgba(255,255,255,0.12); border-radius: 6px; background: transparent; color: rgba(255,255,255,0.35); cursor: pointer; transition: all 0.15s; }
  .hangar-lb-tab:hover { border-color: rgba(255,255,255,0.25); color: rgba(255,255,255,0.6); }
  .hangar-lb-tab.active { background: rgba(99,102,241,0.2); border-color: rgba(99,102,241,0.6); color: #a5b4fc; }
  .hangar-lb-loading { text-align: center; padding: 40px 20px; font-size: 12px; color: rgba(255,255,255,0.3); font-family: 'Orbitron', monospace; letter-spacing: 0.1em; }
  .hangar-lb-error { text-align: center; padding: 24px 20px; font-size: 12px; color: rgba(248,113,113,0.7); }
  .hangar-lb-header { display: flex; align-items: baseline; justify-content: space-between; padding: 16px 20px 8px; }
  .hangar-lb-title { font-family: 'Orbitron', monospace; font-size: 13px; font-weight: 700; letter-spacing: 0.12em; color: rgba(255,255,255,0.55); text-transform: uppercase; }
  .hangar-lb-count { font-size: 11px; color: rgba(255,255,255,0.3); }
  .hangar-lb-table { width: 100%; border-collapse: collapse; }
  .hangar-lb-table th { font-size: 10px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(255,255,255,0.3); padding: 8px 12px; border-bottom: 1px solid rgba(255,255,255,0.07); text-align: left; }
  .hangar-lb-table th:last-child, .hangar-lb-table td:last-child { text-align: right; }
  .hangar-lb-row { border-bottom: 1px solid rgba(255,255,255,0.05); transition: background 0.15s; }
  .hangar-lb-row:hover { background: rgba(255,255,255,0.03); }
  .hangar-lb-row.lb-top1 { background: rgba(253,224,71,0.06); }
  .hangar-lb-row.lb-top2 { background: rgba(203,213,225,0.04); }
  .hangar-lb-row.lb-top3 { background: rgba(251,146,60,0.04); }
  .hangar-lb-row td { padding: 10px 12px; font-size: 13px; vertical-align: middle; }
  .lb-rank { font-family: 'Orbitron', monospace; font-size: 11px; font-weight: 700; width: 28px; }
  .lb-rank-gold   { color: #fde047; }
  .lb-rank-silver { color: #cbd5e1; }
  .lb-rank-bronze { color: #fb923c; }
  .lb-rank-plain  { color: rgba(255,255,255,0.3); }
  .lb-pilot { font-weight: 600; color: rgba(255,255,255,0.85); max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .lb-score { font-family: 'Orbitron', monospace; font-size: 13px; font-weight: 700; color: #e2e8f0; letter-spacing: 0.04em; }
  .lb-meta { font-size: 11px; color: rgba(255,255,255,0.35); }
  .lb-diff-easy   { color: #4ade80; }
  .lb-diff-normal { color: #60a5fa; }
  .lb-diff-hard   { color: #f87171; }
  .lb-date { font-size: 11px; color: rgba(255,255,255,0.25); text-align: right; }
  .hangar-lb-empty { text-align: center; padding: 48px 20px; }
  .hangar-lb-empty-icon { font-size: 36px; margin-bottom: 12px; opacity: 0.4; }
  .hangar-lb-empty-msg { font-size: 13px; color: rgba(255,255,255,0.35); }
  .hangar-lb-empty-hint { font-size: 11px; color: rgba(255,255,255,0.2); margin-top: 6px; }

  /* ── Armory tab ─────────────────────────────────────────────── */
  .armory-container {
    padding: 16px 20px 24px;
    display: flex;
    flex-direction: column;
    gap: 24px;
    overflow-y: auto;
    max-height: 100%;
    box-sizing: border-box;
  }
  .armory-section-title {
    font-family: 'Orbitron', monospace;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: rgba(255,255,255,0.5);
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .armory-section-title::after {
    content: '';
    flex: 1;
    height: 1px;
    background: rgba(255,255,255,0.1);
  }
  .armory-row {
    display: flex;
    gap: 12px;
    overflow-x: auto;
    padding-bottom: 8px;
    scrollbar-width: thin;
    scrollbar-color: rgba(255,255,255,0.2) transparent;
  }
  .armory-row::-webkit-scrollbar { height: 4px; }
  .armory-row::-webkit-scrollbar-track { background: transparent; }
  .armory-row::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 2px; }
  .armory-card {
    flex: 0 0 190px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.1);
    border-left: 3px solid var(--weapon-color, #888);
    border-radius: 8px;
    padding: 14px 14px 12px;
    display: flex;
    flex-direction: column;
    gap: 5px;
    transition: background 0.15s, border-color 0.15s;
    min-width: 0;
    box-sizing: border-box;
  }
  .armory-card.is-equipped {
    background: rgba(255,255,255,0.08);
    border-color: var(--weapon-color, #888);
    box-shadow: 0 0 12px rgba(0,0,0,0.4), inset 0 0 24px rgba(255,255,255,0.02);
  }
  .armory-card-icon { font-size: 20px; line-height: 1; }
  .armory-card-name {
    font-family: 'Orbitron', monospace;
    font-size: 12px;
    font-weight: 700;
    color: #fff;
    line-height: 1.2;
  }
  .armory-card-desc {
    font-size: 11px;
    color: rgba(255,255,255,0.45);
    line-height: 1.4;
    flex: 1;
  }
  .armory-card-stats {
    font-size: 10px;
    color: rgba(255,255,255,0.32);
    font-family: 'Courier New', monospace;
    margin-top: 2px;
    line-height: 1.5;
  }
  .armory-card-btn {
    margin-top: 6px;
    padding: 7px 8px;
    border: 1px solid rgba(255,255,255,0.2);
    border-radius: 5px;
    background: rgba(255,255,255,0.07);
    color: #fff;
    font-family: 'Orbitron', monospace;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.5px;
    cursor: pointer;
    text-transform: uppercase;
    transition: background 0.15s, border-color 0.15s, color 0.15s;
    width: 100%;
    text-align: center;
    line-height: 1.3;
  }
  .armory-card-btn:hover:not(:disabled) {
    background: rgba(255,255,255,0.14);
    border-color: rgba(255,255,255,0.4);
  }
  .armory-card-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .armory-card-btn.equipped-btn {
    background: rgba(255,255,255,0.05);
    border-color: var(--weapon-color, #888);
    color: var(--weapon-color, #888);
    cursor: default;
  }
  .armory-card-btn.equip-btn:hover:not(:disabled) {
    border-color: var(--weapon-color, #888);
    color: var(--weapon-color, #888);
  }
  .armory-card-btn.unlock-btn {
    border-color: rgba(253,224,71,0.4);
    color: #fde047;
  }
  .armory-card-btn.unlock-btn:hover:not(:disabled) {
    background: rgba(253,224,71,0.12);
    border-color: #fde047;
  }
  .armory-card-btn.cant-afford {
    border-color: rgba(255,255,255,0.1) !important;
    color: rgba(255,255,255,0.3) !important;
    background: transparent !important;
  }
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
let _activeTab = 'upgrades'; // 'upgrades' | 'achievements' | 'skins' | 'armory' | 'settings' | 'fragments' | 'stats' | 'missions' | 'leaderboard'
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
 * XP required to reach the next level from a given level.
 * Mirrors the formula in script.js: Math.floor(160 + Math.pow(lvl, 1.65) * 55)
 */
function xpForLevel(lvl) {
  return Math.floor(160 + Math.pow(lvl, 1.65) * 55);
}

/**
 * Map a pilot level to a named rank tier.
 * Returns { label, dataRank } for display and CSS theming.
 *
 *  1–4    RECRUIT   — grey/blue starter
 *  5–9    PILOT     — purple (default badge color)
 *  10–19  ACE       — cyan
 *  20–34  VETERAN   — green
 *  35–49  ELITE     — gold
 *  50+    LEGEND    — crimson
 */
function getPilotRank(level) {
  if (level >= 50) return { label: 'LEGEND',  dataRank: 'legend'  };
  if (level >= 35) return { label: 'ELITE',   dataRank: 'elite'   };
  if (level >= 20) return { label: 'VETERAN', dataRank: 'veteran' };
  if (level >= 10) return { label: 'ACE',     dataRank: 'ace'     };
  if (level >= 5)  return { label: 'PILOT',   dataRank: 'pilot'   };
  return             { label: 'RECRUIT', dataRank: 'recruit' };
}

/**
 * Map a prestige level (1–10) to a cosmetic pilot callsign title.
 * Returns null for prestige 0 (no title shown).
 */
function getPrestigeTitle(prestige) {
  const TITLES = [
    null,              // 0 — no prestige
    'VOID KNIGHT',     // P1
    'VOID HUNTER',     // P2
    'VOID STALKER',    // P3
    'VOID WARDEN',     // P4
    'VOID BREAKER',    // P5
    'VOID REAPER',     // P6
    'VOID SOVEREIGN',  // P7
    'VOID PHANTOM',    // P8
    'VOID IMMORTAL',   // P9
    'VOID ASCENDANT',  // P10 (max)
  ];
  return TITLES[Math.min(prestige, 10)] ?? null;
}

/**
 * Retrieve the pilot's current level.
 * Reads from Save.data if available, else falls back to getPilotLevel option.
 */
function getLivePilotLevel() {
  if (typeof window !== 'undefined' && window.Save && window.Save.data) {
    return Math.max(1, Math.floor(window.Save.data.pilotLevel || 1));
  }
  if (typeof _options.getPilotLevel === 'function') {
    const val = _options.getPilotLevel();
    if (typeof val === 'number' && !isNaN(val)) return Math.max(1, val);
  }
  return 1;
}

/**
 * Retrieve the pilot's current XP within the current level.
 */
function getLivePilotXP() {
  if (typeof window !== 'undefined' && window.Save && window.Save.data) {
    return Math.max(0, Math.floor(window.Save.data.pilotXp || 0));
  }
  if (typeof _options.getPilotXP === 'function') {
    const val = _options.getPilotXP();
    if (typeof val === 'number' && !isNaN(val)) return Math.max(0, val);
  }
  return 0;
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
/**
 * Update the pilot level badge and XP progress bar in the header.
 * Safe to call at any time — no-ops if the elements aren't in the DOM.
 */
function refreshPilotBadge() {
  const lvlEl  = document.getElementById('hangar-pilot-level');
  const fillEl = document.getElementById('hangar-pilot-xp-fill');
  if (!lvlEl || !fillEl) return;

  const lvl    = getLivePilotLevel();
  const xp     = getLivePilotXP();
  const needed = xpForLevel(lvl);
  const pct    = Math.min(100, Math.round((xp / needed) * 100));

  lvlEl.textContent = lvl;
  fillEl.style.width = `${pct}%`;

  // Update rank label and badge color tier
  const rank    = getPilotRank(lvl);
  const rankEl  = document.getElementById('hangar-pilot-rank');
  const badgeEl = document.getElementById('hangar-pilot-badge');
  if (rankEl)  rankEl.textContent = rank.label;
  if (badgeEl) badgeEl.dataset.rank = rank.dataRank;

  // Update prestige badge + title
  const prestigeLevel = _hangarState ? (_hangarState.prestige || 0) : 0;
  const prestigeBadgeEl = document.getElementById('hangarPrestigeBadge');
  if (prestigeBadgeEl) {
    if (prestigeLevel > 0) {
      prestigeBadgeEl.textContent = `★ P${prestigeLevel}`;
      prestigeBadgeEl.style.display = '';
    } else {
      prestigeBadgeEl.style.display = 'none';
    }
  }

  // Update prestige title callsign
  const prestigeTitleEl = document.getElementById('hangarPrestigeTitle');
  if (prestigeTitleEl) {
    const title = getPrestigeTitle(prestigeLevel);
    if (title) {
      prestigeTitleEl.textContent = title;
      prestigeTitleEl.style.display = '';
    } else {
      prestigeTitleEl.style.display = 'none';
    }
  }

  // Show/hide prestige button based on current level and prestige count
  const prestigeBtnEl = document.getElementById('hangarPrestigeBtn');
  if (prestigeBtnEl) {
    const canPrestige = lvl >= 50 && prestigeLevel < 10;
    prestigeBtnEl.style.display = canPrestige ? 'block' : 'none';
  }
}

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
  refreshPilotBadge();
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
  const shakeStored = parseInt(localStorage.getItem('voidrift_screen_shake'), 10);
  const shakeVal  = Number.isFinite(shakeStored) ? shakeStored : 100;

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

      <div class="hangar-settings-section hangar-daily-section">
        <div class="hangar-settings-label">🎯 Daily Challenge</div>
        <div class="hangar-daily-desc">
          Every pilot faces the same run today — seeded so the map, enemies,
          and drops are identical for everyone. One score counts per day.
        </div>
        <div class="hangar-daily-meta" id="hangar-daily-meta"></div>
        <button class="hangar-daily-btn" id="hangar-daily-start-btn">Start Today's Challenge</button>
      </div>
      <div class="hangar-settings-section">
        <div class="hangar-settings-label">🎬 Gameplay</div>

        <div class="hangar-settings-row">
          <span>Screen Shake</span>
          <input type="range" class="hangar-settings-slider" id="settings-shake-intensity"
                 min="0" max="150" value="${shakeVal}">
          <span class="hangar-settings-vol" id="settings-shake-intensity-label">${shakeVal}%</span>
        </div>
      </div>

      <div class="hangar-settings-section hangar-theme-section">
        <div class="hangar-settings-label">🎨 HUD Theme</div>
        <div class="hangar-theme-swatches" id="hangar-theme-swatches">
          ${[
            { id: 'cyan',   color: '#38bdf8', label: 'Cyan (Default)' },
            { id: 'green',  color: '#4ade80', label: 'Neon Green'     },
            { id: 'red',    color: '#f87171', label: 'Blood Red'      },
            { id: 'purple', color: '#a855f7', label: 'Royal Purple'   },
            { id: 'gold',   color: '#fbbf24', label: 'Gold'           },
          ].map(t => {
            const saved = localStorage.getItem('voidrift_hud_theme') || 'cyan';
            return `<button class="hangar-theme-swatch${saved === t.id ? ' active' : ''}"
                      data-theme="${t.id}"
                      style="background:${t.color}"
                      title="${t.label}"
                      aria-label="${t.label}"></button>`;
          }).join('')}
        </div>
        <div class="hangar-theme-hint">Applies to mission HUD and status overlays.</div>
      </div>
      <div class="hangar-settings-section hangar-accessibility-section">
        <div class="hangar-settings-label">👁️ Accessibility</div>
        <div class="hangar-settings-row">
          <span>High Contrast Mode</span>
          <label class="hangar-toggle-switch">
            <input type="checkbox" id="settings-high-contrast" ${localStorage.getItem('voidrift_high_contrast') === '1' ? 'checked' : ''}>
            <span class="hangar-toggle-slider"></span>
          </label>
        </div>
        <div class="hangar-theme-hint">Boosts contrast and saturation to make enemies, bullets, and pickups easier to distinguish.</div>
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

  // Wire up screen shake intensity slider
  const shakeSlider = document.getElementById('settings-shake-intensity');
  const shakeLabel  = document.getElementById('settings-shake-intensity-label');
  if (shakeSlider) {
    shakeSlider.addEventListener('input', () => {
      const val = parseInt(shakeSlider.value, 10);
      if (shakeLabel) shakeLabel.textContent = `${val}%`;
      localStorage.setItem('voidrift_screen_shake', String(val));
    });
  }

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

  // ── Daily Challenge wiring ─────────────────────────────────────────────────
  const dailyMeta = document.getElementById('hangar-daily-meta');
  const dailyBtn  = document.getElementById('hangar-daily-start-btn');

  import('./daily-challenge.js').then(({ getTodayBest, todayStr }) => {
    const today = todayStr();
    const best  = getTodayBest();
    if (dailyMeta) {
      dailyMeta.innerHTML = best > 0
        ? `<span class="hangar-daily-date">${today}</span>
           <span class="hangar-daily-best">Best today: <strong>${best.toLocaleString()}</strong></span>`
        : `<span class="hangar-daily-date">${today}</span>
           <span class="hangar-daily-best">No run yet today</span>`;
    }
  }).catch(() => {
    if (dailyMeta) dailyMeta.textContent = 'Challenge unavailable';
  });

  if (dailyBtn) {
    dailyBtn.addEventListener('click', () => {
      dailyBtn.disabled = true;
      dailyBtn.textContent = 'Launching…';
      import('./daily-challenge.js').then(({ activateDailyChallenge }) => {
        activateDailyChallenge();
        // Close the Hangar overlay, then trigger game start
        closeHangar();
        setTimeout(() => {
          if (window.__VOID_RIFT__ && typeof window.__VOID_RIFT__.startGame === 'function') {
            window.__VOID_RIFT__.startGame();
          }
        }, 250); // wait for hangar fade-out
      }).catch(err => {
        console.warn('[DailyChallenge] Failed to activate:', err);
        dailyBtn.disabled = false;
        dailyBtn.textContent = "Start Today's Challenge";
      });
    });
  }

  // Wire up High Contrast Mode toggle
  const highContrastToggle = document.getElementById('settings-high-contrast');
  if (highContrastToggle) {
    highContrastToggle.addEventListener('change', () => {
      localStorage.setItem('voidrift_high_contrast', highContrastToggle.checked ? '1' : '0');
      if (typeof window.applyHighContrast === 'function') window.applyHighContrast();
    });
  }

  // Wire up HUD theme swatches
  const swatchContainer = document.getElementById('hangar-theme-swatches');
  if (swatchContainer) {
    swatchContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.hangar-theme-swatch');
      if (!btn) return;
      const themeId = btn.dataset.theme;
      localStorage.setItem('voidrift_hud_theme', themeId);
      // Update active state
      swatchContainer.querySelectorAll('.hangar-theme-swatch').forEach(s => {
        s.classList.toggle('active', s.dataset.theme === themeId);
      });
    });
  }
}

/** Persists the selected leaderboard mode across tab re-renders */
let _lbMode = 'local'; // 'local' | 'global'

/**
 * Build a leaderboard table from an array of entries and append to container.
 * Used by both local and global views.
 */
function _buildLeaderboardTable(container, entries, emptyMsg = 'No runs recorded yet', emptyHint = 'Finish a game to appear on the board') {
  const header = document.createElement('div');
  header.className = 'hangar-lb-header';
  header.innerHTML = `
    <span class="hangar-lb-title">⭐ Best Runs</span>
    <span class="hangar-lb-count">${entries.length} entr${entries.length === 1 ? 'y' : 'ies'}</span>
  `;
  container.appendChild(header);

  if (entries.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'hangar-lb-empty';
    empty.innerHTML = `
      <div class="hangar-lb-empty-icon">🚀</div>
      <p class="hangar-lb-empty-msg">${emptyMsg}</p>
      <p class="hangar-lb-empty-hint">${emptyHint}</p>
    `;
    container.appendChild(empty);
    return;
  }

  const table = document.createElement('table');
  table.className = 'hangar-lb-table';
  table.innerHTML = `
    <thead>
      <tr>
        <th>#</th>
        <th>Pilot</th>
        <th>Score</th>
        <th>Wave</th>
        <th>Diff</th>
        <th>Date</th>
      </tr>
    </thead>
  `;

  const tbody = document.createElement('tbody');
  entries.forEach((entry, i) => {
    const rank = i + 1;
    const rankClass = rank === 1 ? 'lb-rank-gold' : rank === 2 ? 'lb-rank-silver' : rank === 3 ? 'lb-rank-bronze' : 'lb-rank-plain';
    const rankSymbol = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank;
    const rowClass = rank === 1 ? 'lb-top1' : rank === 2 ? 'lb-top2' : rank === 3 ? 'lb-top3' : '';
    const diffClass = entry.difficulty === 'easy' ? 'lb-diff-easy' : entry.difficulty === 'hard' ? 'lb-diff-hard' : 'lb-diff-normal';
    const score = typeof entry.score === 'number' ? entry.score.toLocaleString() : '—';
    const wave = entry.level != null ? entry.level : '—';
    const diff = entry.difficulty ? entry.difficulty.charAt(0).toUpperCase() + entry.difficulty.slice(1) : '—';
    const date = entry.timestamp
      ? new Date(entry.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : (entry.date || '—'); // local entries store a pre-formatted date string, not a timestamp
    const pilot = entry.username || entry.userId || 'Pilot';
    const tr = document.createElement('tr');
    tr.className = `hangar-lb-row ${rowClass}`;
    tr.innerHTML = `
      <td><span class="lb-rank ${rankClass}">${rankSymbol}</span></td>
      <td><span class="lb-pilot" title="${pilot}">${pilot}</span></td>
      <td><span class="lb-score">${score}</span></td>
      <td><span class="lb-meta">${wave}</span></td>
      <td><span class="lb-meta ${diffClass}">${diff}</span></td>
      <td><span class="lb-date">${date}</span></td>
    `;
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  container.appendChild(table);
}

/**
 * Render the leaderboard tab — Local tab reads localStorage; Global tab
 * fetches from LeaderboardSystem (backend API).
 */
function renderLeaderboardView() {
  const content = document.getElementById('hangarContent');
  if (!content) return;
  content.innerHTML = '';

  // ── Tab bar ──────────────────────────────────────────────────────────────
  const tabBar = document.createElement('div');
  tabBar.className = 'hangar-lb-tabs';
  tabBar.innerHTML = `
    <button class="hangar-lb-tab ${_lbMode === 'local' ? 'active' : ''}" data-lb-tab="local">Local</button>
    <button class="hangar-lb-tab ${_lbMode === 'global' ? 'active' : ''}" data-lb-tab="global">Global</button>
  `;
  content.appendChild(tabBar);

  tabBar.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-lb-tab]');
    if (!btn) return;
    const tab = btn.dataset.lbTab;
    if (tab === _lbMode) return;
    _lbMode = tab;
    renderLeaderboardView();
  });

  // ── Local view ───────────────────────────────────────────────────────────
  if (_lbMode === 'local') {
    let entries = [];
    try {
      // Read from the same key script.js's LocalLeaderboard actually writes to
      // (voidrift_local_scores) — this used to read 'void_rift_leaderboard',
      // a key nothing ever populates, so the tab was always empty. Local
      // entries are stored as {score, date} with no username field.
      const raw = localStorage.getItem('voidrift_local_scores');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          entries = parsed
            .filter(e => e && typeof e.score === 'number')
            .sort((a, b) => b.score - a.score)
            .slice(0, 20);
        }
      }
    } catch { /* ignore */ }
    _buildLeaderboardTable(content, entries, 'No runs recorded yet', 'Finish a game to appear on the board');
    return;
  }

  // ── Global view ──────────────────────────────────────────────────────────
  if (typeof LeaderboardSystem === 'undefined') {
    const err = document.createElement('div');
    err.className = 'hangar-lb-error';
    err.textContent = 'Leaderboard unavailable — backend not connected.';
    content.appendChild(err);
    return;
  }

  // Show loading state while fetching
  const loading = document.createElement('div');
  loading.className = 'hangar-lb-loading';
  loading.textContent = 'LOADING GLOBAL SCORES…';
  content.appendChild(loading);

  LeaderboardSystem.fetchScores('all', 20)
    .then(scores => {
      // Guard: user may have navigated away
      const current = document.getElementById('hangarContent');
      if (!current || !current.contains(loading)) return;
      loading.remove();

      const entries = (scores || [])
        .filter(e => e && typeof e.score === 'number')
        .sort((a, b) => b.score - a.score)
        .slice(0, 20);

      _buildLeaderboardTable(current, entries, 'No global scores yet', 'Be the first to submit a score!');
    })
    .catch(err => {
      console.warn('[Hangar] Global leaderboard fetch failed:', err);
      const current = document.getElementById('hangarContent');
      if (!current || !current.contains(loading)) return;
      loading.remove();
      const errEl = document.createElement('div');
      errEl.className = 'hangar-lb-error';
      errEl.textContent = 'Could not load global scores. Check your connection.';
      current.appendChild(errEl);
    });
}

/**
 * Switch the active tab ('upgrades', 'achievements', 'skins', 'settings', or 'leaderboard'),
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
  } else if (tab === 'armory') {
    renderArmoryView();
  } else if (tab === 'settings') {
    renderSettingsView();
  } else if (tab === 'leaderboard') {
    renderLeaderboardView();
  } else if (tab === 'fragments') {
    renderFragmentsView();
  } else if (tab === 'stats') {
    renderStatsView();
  } else if (tab === 'missions') {
    renderMissionsView();
  } else if (tab === 'loadout') {
    renderLoadoutView();
  } else {
    renderUpgradesView();
  }

  updateMissionsNavBadge();
  refreshPilotBadge();
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

  // Track achievement stat when an upgrade reaches max level
  const newLevel = _hangarState.upgrades[upgradeId];
  if (newLevel >= item.maxLevel) {
    const maxedCount = HANGAR_CATALOG.filter(
      u => (_hangarState.upgrades[u.id] || 0) >= u.maxLevel
    ).length;
    const newlyUnlocked = updateStats({ maxedHangarUpgrades: maxedCount });
    newlyUnlocked.forEach(a => showAchievementToast(a));
  }

  // Fire optional callback
  if (typeof _options.onPurchase === 'function') {
    _options.onPurchase(upgradeId, _hangarState.upgrades[upgradeId], _hangarState);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Missions tab
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Count completed-but-unclaimed daily missions, for the nav tab badge.
 */
function getUnclaimedMissionCount() {
  const ms = window.missionSystem;
  if (!ms || typeof ms.getDailyMissions !== 'function') return 0;
  try {
    return ms.getDailyMissions().filter(m => m.completed && !m.claimed).length;
  } catch (e) {
    return 0;
  }
}

/**
 * Show/hide a small count badge on the Missions nav tab when a reward is
 * waiting to be claimed, so players don't have to open the tab to know.
 */
function updateMissionsNavBadge() {
  const btn = document.querySelector('.hangar-tab-btn[data-tab="missions"]');
  if (!btn) return;
  const count = getUnclaimedMissionCount();
  let badge = btn.querySelector('.hangar-nav-badge');
  if (count > 0) {
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'hangar-nav-badge';
      btn.appendChild(badge);
    }
    badge.textContent = String(count);
  } else if (badge) {
    badge.remove();
  }
}

/**
 * Render the Missions tab — shows today's 3 daily missions with progress bars,
 * reward badges, and a Claim button for completed-but-unclaimed missions.
 */
function renderMissionsView() {
  const content = document.getElementById('hangarContent');
  if (!content) return;
  content.innerHTML = '';

  const ms = window.missionSystem;
  const missions = ms ? ms.getDailyMissions() : [];

  const wrapper = document.createElement('div');
  wrapper.className = 'hangar-missions';

  // Compute reset countdown (missions refresh at midnight local time)
  function resetCountdown() {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const diff = midnight - now;
    const h = Math.floor(diff / 3_600_000);
    const m = Math.floor((diff % 3_600_000) / 60_000);
    return `Resets in ${h}h ${m}m`;
  }

  const completedCount = missions.filter(m => m.completed).length;

  // Header
  const hdr = document.createElement('div');
  hdr.className = 'hangar-missions-header';
  hdr.innerHTML = `
    DAILY MISSIONS &nbsp;
    <span>${completedCount} / ${missions.length} complete</span>
    <span class="hm-resets">${resetCountdown()}</span>
  `;
  wrapper.appendChild(hdr);

  // Active named Bounty Targets — preview today's WANTED enemies before running into one.
  // Rendered regardless of daily-mission state, appended after the mission list below.
  const bounties = ms ? ms.getActiveBounties() : [];
  const appendBounties = () => {
    if (bounties.length === 0) return;
    const bountiesHdr = document.createElement('div');
    bountiesHdr.className = 'hangar-bounties-header';
    bountiesHdr.textContent = 'Active Bounties';
    wrapper.appendChild(bountiesHdr);

    bounties.forEach(bounty => {
      const card = document.createElement('div');
      card.className = 'hangar-bounty-card';
      card.style.setProperty('--bounty-color', bounty.color || '#fbbf24');
      card.innerHTML = `
        <div>
          <div class="hangar-bounty-name">⚠ ${bounty.name}</div>
          <div class="hangar-bounty-desc">${bounty.desc}</div>
          <div class="hangar-bounty-difficulty">${(bounty.difficulty || '').replace('_', ' ')}</div>
        </div>
        <div class="hangar-bounty-reward">
          ⚡ ${bounty.reward} CR
          ${bounty.techFragment ? '<span class="frag-tag">+ Fragment</span>' : ''}
        </div>
      `;
      wrapper.appendChild(card);
    });
  };

  if (!ms || missions.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'hangar-missions-empty';
    empty.innerHTML = `<div style="font-size:28px;margin-bottom:8px">📋</div>No missions loaded yet.<br>Start a game to generate daily missions.`;
    wrapper.appendChild(empty);
    appendBounties();
    content.appendChild(wrapper);
    return;
  }

  missions.forEach(mission => {
    const progress = Math.min(mission.progress || 0, mission.target);
    const pct = Math.round((progress / mission.target) * 100);
    const isDone    = mission.completed;
    const isClaimed = mission.claimed;

    const card = document.createElement('div');
    card.className = `hangar-mission-card${isDone ? ' completed' : ''}${isClaimed ? ' claimed' : ''}`;

    // Badges row
    const badges = [];
    if (mission.techFragment) badges.push(`<span class="hangar-mission-badge frag">+ Fragment</span>`);
    if (mission.xpBoost && mission.xpBoost > 1)
      badges.push(`<span class="hangar-mission-badge xp">×${mission.xpBoost.toFixed(1)} XP</span>`);
    const badgesHtml = badges.length ? `<div class="hangar-mission-badges">${badges.join('')}</div>` : '';

    // Claim button
    let claimHtml = '';
    if (isDone && !isClaimed) {
      claimHtml = `<button class="hangar-mission-claim-btn" data-mission-id="${mission.id}">Claim ⚡ ${mission.reward}</button>`;
    } else if (isClaimed) {
      claimHtml = `<button class="hangar-mission-claim-btn claimed-label" disabled>✓ Claimed</button>`;
    }

    card.innerHTML = `
      <div class="hangar-mission-top">
        <div>
          <div class="hangar-mission-name">${mission.name}</div>
          <div class="hangar-mission-desc">${mission.desc.replace('{target}', mission.target)}</div>
        </div>
        <div class="hangar-mission-reward">⚡ ${mission.reward} CR</div>
      </div>
      <div class="hangar-mission-bar-wrap hangar-mission-bar${isDone ? ' done' : ''}">
        <div class="hangar-mission-bar-track">
          <div class="hangar-mission-bar-fill" style="width:${pct}%"></div>
        </div>
        <span class="hangar-mission-progress-txt">${progress.toLocaleString()} / ${mission.target.toLocaleString()}</span>
      </div>
      ${badgesHtml}
      ${claimHtml}
    `;

    wrapper.appendChild(card);
  });

  appendBounties();
  content.appendChild(wrapper);

  // Wire claim buttons
  wrapper.querySelectorAll('.hangar-mission-claim-btn[data-mission-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      const missionId = btn.dataset.missionId;
      const reward = ms.claimMissionReward(missionId);
      if (!reward) return;

      // Attempt to add credits via the external handler (bridges into the main
      // game's Save balance) or fall back to the hangar's own internal pool.
      if (typeof _options.addCredits === 'function') {
        _options.addCredits(reward.credits);
      } else {
        _hangarState.credits = (_hangarState.credits || 0) + reward.credits;
        saveHangar(_hangarState);
      }
      // Update credit badge — needed for both paths above
      const badge = document.getElementById('hangar-credits-amount');
      if (badge) badge.textContent = getLiveCredits().toLocaleString();

      // Grant the mission's promised XP boost for the player's next run — previously
      // reward.xpBoost was computed but never stored or applied anywhere.
      if (reward.xpBoost && reward.xpBoost > 1) {
        try {
          localStorage.setItem('voidrift_pending_xp_boost', String(reward.xpBoost));
        } catch (e) { /* storage unavailable — boost skipped */ }
      }

      // Grant the mission's promised bonus tech fragment, if any — previously
      // reward.techFragment was computed but never actually collected.
      if (reward.techFragment && window.techFragmentSystem) {
        const tfs = window.techFragmentSystem;
        const fragment = tfs.rollDrop(true, false) || (window.TECH_FRAGMENTS || [])[0];
        if (fragment) {
          tfs.collect(fragment.id);
          if (window.missionSystem) window.missionSystem.trackFragments(1);
          const style = RARITY_STYLES[fragment.rarity] || {};
          showAchievementToast({ icon: style.emoji || '💎', name: fragment.name, desc: 'Mission reward fragment collected!' });
        }
      }

      // Award direct XP for mission completion
      const xpAmount = Math.floor((reward.credits || 0) * 0.5);
      if (xpAmount > 0) {
        if (typeof _options.addXP === 'function') {
          _options.addXP(xpAmount);
        } else {
          // Update save data directly when game isn't running
          try {
            const raw = localStorage.getItem('void_rift_v11');
            const data = raw ? JSON.parse(raw) : {};
            // Simple XP add — level-up will be recalculated on next game start
            data.pilotXp = (data.pilotXp || 0) + xpAmount;
            localStorage.setItem('void_rift_v11', JSON.stringify(data));
          } catch (e) { /* storage unavailable */ }
        }
        showAchievementToast({ icon: '⭐', name: `+${xpAmount} XP`, desc: 'Mission complete bonus!' });
        // Refresh the header pilot badge so the XP bar updates immediately
        refreshPilotBadge();
      }

      // Re-render to show claimed state
      renderMissionsView();
      updateMissionsNavBadge();
    });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Fragments tab
// ─────────────────────────────────────────────────────────────────────────────

const RARITY_STYLES = {
  legendary: {
    color: '#c084fc',
    bg: 'rgba(168,85,247,0.15)',
    border: 'rgba(168,85,247,0.35)',
    glow: 'rgba(168,85,247,0.08)',
    emoji: '💎',
  },
  epic: {
    color: '#fb923c',
    bg: 'rgba(249,115,22,0.15)',
    border: 'rgba(249,115,22,0.35)',
    glow: 'rgba(249,115,22,0.08)',
    emoji: '🔮',
  },
  rare: {
    color: '#38bdf8',
    bg: 'rgba(56,189,248,0.15)',
    border: 'rgba(56,189,248,0.35)',
    glow: 'rgba(56,189,248,0.08)',
    emoji: '⚡',
  },
};

/**
 * Render the Loadout tab — configure the 4 equipment slots without needing
 * to pause a run first. Reads/writes via _options.getLoadout/setLoadout so
 * the change lands on the same save the in-game pause menu uses; falls back
 * to a read-only notice if the caller didn't wire those callbacks.
 */
const LOADOUT_SLOT_OPTIONS = [
  {
    key: 'slot1', label: 'Slot 1 — Primary Weapon (always active)',
    options: [
      ['primary:pulse', 'Pulse Blaster'],
      ['primary:scatter', 'Scatter Coil'],
      ['primary:rail', 'Rail Lance'],
      ['primary:ionburst', 'Ion Burst'],
      ['primary:plasma', 'Plasma Cutter'],
      ['primary:photon', 'Photon Repeater'],
    ],
  },
  {
    key: 'slot2', label: 'Slot 2 — Secondary Equipment',
    options: [
      ['defense:aegis', 'Aegis Shield'],
      ['defense:reflector', 'Reflector Veil'],
      ['defense:phaseshift', 'Phase Shift'],
      ['defense:overcharge', 'Overcharge Matrix'],
      ['secondary:nova', 'Nova Bomb'],
      ['secondary:cluster', 'Cluster Barrage'],
      ['secondary:seeker', 'Seeker Swarm'],
      ['secondary:gravity', 'Gravity Well'],
      ['secondary:charge', 'Ramming Charge'],
      ['secondary:reinforcement', 'Orbital Strike'],
      ['boost:boost', 'Boost'],
    ],
  },
  {
    key: 'slot3', label: 'Slot 3 — Secondary Equipment',
    options: [
      ['secondary:nova', 'Nova Bomb'],
      ['secondary:cluster', 'Cluster Barrage'],
      ['secondary:seeker', 'Seeker Swarm'],
      ['secondary:gravity', 'Gravity Well'],
      ['secondary:charge', 'Ramming Charge'],
      ['secondary:reinforcement', 'Orbital Strike'],
      ['defense:aegis', 'Aegis Shield'],
      ['defense:reflector', 'Reflector Veil'],
      ['defense:phaseshift', 'Phase Shift'],
      ['defense:overcharge', 'Overcharge Matrix'],
      ['boost:boost', 'Boost'],
    ],
  },
  {
    key: 'slot4', label: 'Slot 4 — Ultimate / Boost',
    options: [
      ['boost:boost', 'Boost'],
      ['ultimate:voidstorm', 'Voidstorm'],
      ['ultimate:solarbeam', 'Solar Beam'],
      ['ultimate:timewarp', 'Temporal Rift'],
      ['ultimate:supernova', 'Supernova Burst'],
      ['defense:aegis', 'Aegis Shield'],
      ['secondary:nova', 'Nova Bomb'],
      ['secondary:cluster', 'Cluster Barrage'],
      ['secondary:seeker', 'Seeker Swarm'],
      ['secondary:gravity', 'Gravity Well'],
    ],
  },
];

function renderLoadoutView() {
  const content = document.getElementById('hangarContent');
  if (!content) return;
  content.innerHTML = '';

  const equipClass = typeof _options.getLoadout === 'function' ? _options.getLoadout() : null;
  const canEdit = !!equipClass && typeof _options.setLoadout === 'function';

  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'padding:16px 16px 24px; overflow-y:auto; height:100%; box-sizing:border-box;';

  const hdr = document.createElement('div');
  hdr.style.cssText = [
    'font-family:"Orbitron",monospace',
    'font-size:11px',
    'font-weight:700',
    'letter-spacing:0.14em',
    'color:rgba(255,255,255,0.3)',
    'text-transform:uppercase',
    'margin-bottom:14px',
    'padding-bottom:10px',
    'border-bottom:1px solid rgba(255,255,255,0.07)',
  ].join(';');
  hdr.textContent = 'EQUIPMENT LOADOUT';
  wrapper.appendChild(hdr);

  if (!canEdit) {
    const notice = document.createElement('div');
    notice.style.cssText = 'color:rgba(255,255,255,0.4); font-size:13px; padding:20px 0;';
    notice.textContent = 'Loadout editing is unavailable right now — configure equipment from the in-game pause menu instead.';
    wrapper.appendChild(notice);
    content.appendChild(wrapper);
    return;
  }

  const desc = document.createElement('p');
  desc.style.cssText = 'color:rgba(255,255,255,0.45); font-size:12px; line-height:1.5; margin:0 0 18px;';
  desc.textContent = 'Configure your 4 equipment slots before launch. Changes apply to your next run.';
  wrapper.appendChild(desc);

  const form = document.createElement('div');
  form.style.cssText = 'display:flex; flex-direction:column; gap:14px;';

  LOADOUT_SLOT_OPTIONS.forEach(({ key, label, options }) => {
    const slotData = equipClass[key] || {};
    const currentValue = `${slotData.type}:${slotData.id}`;

    const row = document.createElement('label');
    row.style.cssText = 'display:flex; flex-direction:column; gap:6px;';

    const rowLabel = document.createElement('span');
    rowLabel.style.cssText = 'font-size:12px; color:rgba(255,255,255,0.6); letter-spacing:0.02em;';
    rowLabel.textContent = label;
    row.appendChild(rowLabel);

    const select = document.createElement('select');
    select.className = 'hangar-loadout-select';
    select.dataset.slot = key;
    select.style.cssText = [
      'background:rgba(255,255,255,0.05)',
      'border:1px solid rgba(255,255,255,0.12)',
      'border-radius:8px',
      'color:#fff',
      'padding:9px 12px',
      'font-size:13px',
      'font-family:inherit',
    ].join(';');
    options.forEach(([value, optLabel]) => {
      const opt = document.createElement('option');
      opt.value = value;
      opt.textContent = optLabel;
      if (value === currentValue) opt.selected = true;
      select.appendChild(opt);
    });
    row.appendChild(select);
    form.appendChild(row);
  });

  wrapper.appendChild(form);
  content.appendChild(wrapper);

  form.addEventListener('change', (e) => {
    const select = e.target.closest('.hangar-loadout-select');
    if (!select) return;
    const [type, id] = select.value.split(':');
    const updated = { ...equipClass, [select.dataset.slot]: { type, id } };
    _options.setLoadout(updated);
  });
}

/**
 * Render the Fragments tab — shows all 6 tech fragments with collection status,
 * rarity, description, count, and what they unlock.
 */
function renderFragmentsView() {
  const content = document.getElementById('hangarContent');
  if (!content) return;
  content.innerHTML = '';

  const sys = window.techFragmentSystem;
  const allFragments = (window.TECH_FRAGMENTS || []);
  const allUnlocks  = (window.TECH_UNLOCKS || {});

  // Count collected per fragment id
  const getCount = (id) => {
    if (!sys) return 0;
    return sys.inventory ? (sys.inventory[id] || 0) : 0;
  };

  const totalCollected = allFragments.filter(f => getCount(f.id) > 0).length;
  const isComplete = !!(sys && typeof sys.isCollectionComplete === 'function' && sys.isCollectionComplete());

  const wrapper = document.createElement('div');
  wrapper.className = 'hangar-fragments';

  // Header
  const hdr = document.createElement('div');
  hdr.className = 'hangar-fragments-header';
  hdr.innerHTML = `
    TECH FRAGMENTS &nbsp;
    <span>${totalCollected} / ${allFragments.length} discovered</span>
    <span style="flex:1"></span>
    ${isComplete
      ? `<span style="font-size:10px;color:#c084fc;font-weight:700;letter-spacing:0.05em;">&#9733; COLLECTION COMPLETE</span>`
      : `<span style="font-size:10px;color:rgba(255,255,255,0.28);font-style:italic">Drop from Elites &amp; Bosses</span>`}
  `;
  wrapper.appendChild(hdr);

  // Grid
  const grid = document.createElement('div');
  grid.className = 'hangar-fragments-grid';

  allFragments.forEach(frag => {
    const count   = getCount(frag.id);
    const rs      = RARITY_STYLES[frag.rarity] || RARITY_STYLES.rare;
    const unlock  = allUnlocks[frag.unlocks];
    const isOwned = count > 0;

    const card = document.createElement('div');
    card.className = `hangar-frag-card ${isOwned ? 'collected' : 'locked'}`;
    card.style.setProperty('--frag-color',      rs.color);
    card.style.setProperty('--frag-bg',         rs.bg);
    card.style.setProperty('--frag-border',     rs.border);
    card.style.setProperty('--frag-rarity-bg',  rs.bg);
    card.style.setProperty('--frag-glow',       rs.glow);

    card.innerHTML = `
      ${!isOwned ? '<span class="hangar-frag-lock">🔒</span>' : ''}
      <div class="hangar-frag-card-top">
        <div class="hangar-frag-gem">${rs.emoji}</div>
        <div>
          <div class="hangar-frag-name">${frag.name}</div>
          <span class="hangar-frag-rarity">${frag.rarity}</span>
        </div>
      </div>
      <div class="hangar-frag-desc">${isOwned ? frag.desc : '??? Collect to reveal'}</div>
      <div class="hangar-frag-footer">
        <span class="hangar-frag-count">${isOwned ? `×${count} collected` : 'Not found'}</span>
        ${unlock && isOwned
          ? `<span class="hangar-frag-unlock">Unlocks: ${unlock.name}</span>`
          : unlock
          ? `<span class="hangar-frag-unlock" style="color:rgba(255,255,255,0.15)">??? unlock</span>`
          : ''}
      </div>
    `;
    grid.appendChild(card);
  });

  wrapper.appendChild(grid);
  content.appendChild(wrapper);
}

// ─────────────────────────────────────────────────────────────────────────────
// Armory tab

/**
 * Render the Armory tab — browse, unlock, and equip weapons for each slot
 * (primary, secondary, defense, ultimate) using the game's credit system.
 */
function renderArmoryView() {
  const content = document.getElementById('hangarContent');
  if (!content) return;
  content.innerHTML = '';

  const armory = window.ARMORY;
  const GameSave = window.Save;

  if (!armory || !GameSave) {
    content.innerHTML = `<div style="padding:48px;text-align:center;color:rgba(255,255,255,0.35);font-size:13px;font-family:'Orbitron',monospace;">ARMORY DATA UNAVAILABLE</div>`;
    return;
  }

  const armoryData = GameSave.data.armory;
  const credits = getLiveCredits();

  const SLOT_META = [
    { key: 'primary',   label: 'Primary Weapon',   icon: '⚡' },
    { key: 'secondary', label: 'Secondary System',  icon: '💥' },
    { key: 'defense',   label: 'Defense System',    icon: '🛡' },
    { key: 'ultimate',  label: 'Ultimate System',   icon: '☄' }
  ];

  function buildStats(weapon, type) {
    const s = weapon.stats;
    if (!s) return '';
    const parts = [];
    if (type === 'primary') {
      if (s.damage !== undefined) parts.push(`DMG ×${s.damage}`);
      if (s.cd    !== undefined) parts.push(`CD ×${s.cd}`);
      if (s.pierce)              parts.push(`Pierce ${s.pierce}`);
      if (s.shots)               parts.push(`Shots ${s.shots}`);
    } else if (type === 'secondary') {
      if (s.ammo   !== undefined) parts.push(`Ammo ${s.ammo}`);
      if (s.damage !== undefined) parts.push(`DMG ${s.damage}`);
      if (s.radius !== undefined) parts.push(`Radius ${s.radius}`);
    } else if (type === 'defense') {
      if (s.duration !== undefined) parts.push(`Dur ${(s.duration / 1000).toFixed(1)}s`);
      if (s.absorb   !== undefined) parts.push(`Absorb ${Math.round(s.absorb * 100)}%`);
      if (s.reflect  !== undefined) parts.push(`Reflect ${Math.round(s.reflect * 100)}%`);
    } else if (type === 'ultimate') {
      if (s.charge  !== undefined) parts.push(`Charge ${s.charge}`);
      if (s.damage)                parts.push(`DMG ${s.damage}`);
      if (s.radius)                parts.push(`Radius ${s.radius}`);
    }
    return parts.join(' · ');
  }

  const wrapper = document.createElement('div');
  wrapper.className = 'armory-container';

  SLOT_META.forEach(({ key, label, icon }) => {
    const weapons  = armory[key] || [];
    const unlocked = (armoryData.unlocked[key] || []);
    const equipped = armoryData.loadout[key];

    const sectionEl = document.createElement('div');

    const titleEl = document.createElement('div');
    titleEl.className = 'armory-section-title';
    titleEl.innerHTML = `<span>${icon}</span> ${label}`;
    sectionEl.appendChild(titleEl);

    const rowEl = document.createElement('div');
    rowEl.className = 'armory-row';

    weapons.forEach(weapon => {
      const isUnlocked = unlocked.includes(weapon.id);
      const isEquipped = weapon.id === equipped;
      const isFree     = weapon.unlock === 0;
      const canAfford  = credits >= weapon.unlock;
      const stats      = buildStats(weapon, key);

      const card = document.createElement('div');
      card.className = `armory-card${isEquipped ? ' is-equipped' : ''}`;
      card.style.setProperty('--weapon-color', weapon.color || '#888');

      let btnHtml;
      if (isEquipped) {
        btnHtml = `<button class="armory-card-btn equipped-btn" disabled>✦ EQUIPPED</button>`;
      } else if (isUnlocked || isFree) {
        btnHtml = `<button class="armory-card-btn equip-btn" data-action="equip" data-type="${key}" data-id="${weapon.id}">EQUIP${isFree && !isUnlocked ? ' FREE' : ''}</button>`;
      } else {
        const affordClass = canAfford ? '' : ' cant-afford';
        btnHtml = `<button class="armory-card-btn unlock-btn${affordClass}" ${canAfford ? '' : 'disabled'} data-action="unlock" data-type="${key}" data-id="${weapon.id}" data-cost="${weapon.unlock}">⚡ ${weapon.unlock.toLocaleString()} CR — UNLOCK</button>`;
      }

      card.innerHTML = `
        <div class="armory-card-icon">${icon}</div>
        <div class="armory-card-name">${weapon.name}</div>
        <div class="armory-card-desc">${weapon.desc}</div>
        ${stats ? `<div class="armory-card-stats">${stats}</div>` : ''}
        ${btnHtml}
      `;

      rowEl.appendChild(card);
    });

    sectionEl.appendChild(rowEl);
    wrapper.appendChild(sectionEl);
  });

  content.appendChild(wrapper);

  // ── Event delegation ──────────────────────────────────────────

  content.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      const type   = btn.dataset.type;
      const id     = btn.dataset.id;
      const cost   = parseInt(btn.dataset.cost || '0', 10);

      if (action === 'unlock') {
        if (!trySpendCredits(cost)) return;
        GameSave.setLoadout(type, id); // setLoadout also calls unlockArmory + save
        renderArmoryView();
      } else if (action === 'equip') {
        GameSave.setLoadout(type, id);
        renderArmoryView();
      }
    });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Stats tab

/**
 * Render the Stats tab — lifetime game statistics pulled from localStorage.
 */
function renderStatsView() {
  const content = document.getElementById('hangarContent');
  if (!content) return;
  content.innerHTML = '';

  // Read achievement stats
  const achStats = (() => {
    try {
      const raw = localStorage.getItem('voidrift_achievements');
      if (raw) return JSON.parse(raw)?.stats || {};
    } catch {}
    return {};
  })();

  // Read save data
  const saveData = (() => {
    try {
      const raw = localStorage.getItem('void_rift_v11');
      if (raw) return JSON.parse(raw);
    } catch {}
    return {};
  })();

  const stats = [
    { label: 'BEST SCORE',     value: (saveData.bestScore || 0).toLocaleString(),             icon: '🏆', highlight: true },
    { label: 'HIGHEST WAVE',   value: achStats.maxWave || 0,                                  icon: '🌊', highlight: true },
    { label: 'TOTAL KILLS',    value: (achStats.totalKills || 0).toLocaleString(),             icon: '💥' },
    { label: 'BOSS KILLS',     value: achStats.bossKills || 0,                                icon: '👑' },
    { label: 'PILOT LEVEL',    value: saveData.pilotLevel || 1,                               icon: '🚀' },
    { label: 'MAX COMBO',      value: achStats.maxCombo || 0,                                 icon: '⚡' },
    { label: 'DAILY STREAK',   value: achStats.dailyStreak || 0,                              icon: '🔥' },
    { label: 'DAILIES DONE',   value: achStats.dailyChallengesCompleted || 0,                 icon: '📅' },
    { label: 'UPGRADES MAXED', value: `${achStats.maxedHangarUpgrades || 0}`,                icon: '🔧' },
    { label: 'CREDITS BANKED', value: (saveData.credits || 0).toLocaleString(),               icon: '💰' },
    { label: 'MISSIONS DONE',  value: window.missionSystem ? window.missionSystem.getTotalMissionsCompleted() : 0, icon: '📋' },
    { label: 'BOUNTIES CLAIMED', value: window.missionSystem ? window.missionSystem.getTotalBountiesCompleted() : 0, icon: '⚠️' },
  ];

  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'padding:16px 16px 24px; overflow-y:auto; height:100%; box-sizing:border-box;';

  const hdr = document.createElement('div');
  hdr.style.cssText = [
    'font-family:"Orbitron",monospace',
    'font-size:11px',
    'font-weight:700',
    'letter-spacing:0.14em',
    'color:rgba(255,255,255,0.3)',
    'text-transform:uppercase',
    'margin-bottom:14px',
    'padding-bottom:10px',
    'border-bottom:1px solid rgba(255,255,255,0.07)',
  ].join(';');
  hdr.textContent = 'LIFETIME STATS';
  wrapper.appendChild(hdr);

  const grid = document.createElement('div');
  grid.style.cssText = 'display:grid; grid-template-columns:1fr 1fr; gap:10px;';

  stats.forEach(({ label, value, icon, highlight }) => {
    const card = document.createElement('div');
    card.style.cssText = [
      'background:rgba(255,255,255,0.03)',
      `border:1px solid ${highlight ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.07)'}`,
      'border-radius:8px',
      'padding:14px 16px',
    ].join(';');
    card.innerHTML = `
      <div style="font-size:10px;color:rgba(255,255,255,0.28);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:7px;">${icon} ${label}</div>
      <div style="font-family:'Orbitron',monospace;font-size:22px;font-weight:700;color:${highlight ? '#4ade80' : '#fff'};letter-spacing:-0.02em;${highlight ? 'text-shadow:0 0 10px rgba(74,222,128,0.4)' : ''}">${value}</div>
    `;
    grid.appendChild(card);
  });

  wrapper.appendChild(grid);

  // ── Prestige ─────────────────────────────────────────────────────────────
  // Auth.doPrestige() resets Pilot Level to 1 in exchange for a permanent
  // title (and, at select tiers, a rare weapon or ship unlock). It had no
  // caller anywhere in the UI, so it — and the prestige_1/5/10 achievements
  // that key off it — could never be reached through normal play.
  const auth = window.Auth;
  if (auth && typeof auth.canPrestige === 'function') {
    const profile = auth.playerProfile || {};
    const prestigeBox = document.createElement('div');
    prestigeBox.style.cssText = 'margin-top:16px; background:rgba(192,132,252,0.06); border:1px solid rgba(192,132,252,0.25); border-radius:10px; padding:14px 16px;';

    if (auth.canPrestige()) {
      prestigeBox.innerHTML = `
        <div style="font-size:11px;color:#c084fc;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:8px;">&#11088; Prestige Available</div>
        <div style="font-size:12px;color:rgba(255,255,255,0.6);margin-bottom:10px;">Reset your Pilot Level to 1 for a permanent title and reward. Credits and upgrades are kept.</div>
        <button id="hangar-prestige-btn" style="padding:8px 16px; border-radius:8px; border:1px solid rgba(192,132,252,0.4); background:rgba(192,132,252,0.15); color:#e9d5ff; font-weight:700; cursor:pointer;">Prestige Now (${(profile.prestige || 0) + 1}/10)</button>
      `;
    } else {
      const current = profile.prestige || 0;
      prestigeBox.innerHTML = `
        <div style="font-size:11px;color:rgba(255,255,255,0.3);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:6px;">&#11088; Prestige ${current}/10${profile.title ? ` — ${profile.title}` : ''}</div>
        <div style="font-size:11px;color:rgba(255,255,255,0.28);">Reach Pilot Level 50 to prestige again.</div>
      `;
    }
    wrapper.appendChild(prestigeBox);

    const prestigeBtn = prestigeBox.querySelector('#hangar-prestige-btn');
    if (prestigeBtn) {
      prestigeBtn.addEventListener('click', () => {
        if (window.confirm('Prestige now? Your Pilot Level will reset to 1. Credits and upgrades are kept.')) {
          if (auth.doPrestige()) {
            renderStatsView();
          }
        }
      });
    }
  }

  content.appendChild(wrapper);
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Handle a prestige request — confirm, reset pilot level/XP, increment prestige,
 * then re-open the hangar so the UI reflects the new state.
 */
function handlePrestige() {
  if (!_hangarState) return;
  const currentPrestige = _hangarState.prestige || 0;
  const nextPrestige = currentPrestige + 1;
  if (nextPrestige > 10) return;

  const confirmed = window.confirm(
    `PRESTIGE ${nextPrestige}?\n\nYour pilot level resets to 1. You keep all Hangar upgrades.\n\nReward: +${nextPrestige * 10}% permanent credit bonus\n\nThis cannot be undone.`
  );
  if (!confirmed) return;

  // Reset pilot XP/level in the main save
  try {
    const PRESTIGE_SAVE_KEY = 'void_rift_v11';
    const saveData = JSON.parse(localStorage.getItem(PRESTIGE_SAVE_KEY) || '{}');
    saveData.pilotLevel = 1;
    saveData.pilotXp = 0;
    localStorage.setItem(PRESTIGE_SAVE_KEY, JSON.stringify(saveData));
    // Sync the live window.Save object if the game is running
    if (typeof window !== 'undefined' && window.Save && window.Save.data) {
      window.Save.data.pilotLevel = 1;
      window.Save.data.pilotXp = 0;
    }
  } catch (e) {
    console.warn('[Prestige] Could not reset pilot save:', e);
  }

  // Increment prestige (also saves hangar)
  prestigePilot(_hangarState);

  // Also advance the Auth-based prestige counter so the prestige_1/5/10
  // achievements and Game Center reporting (which key off
  // Auth.playerProfile.prestige, not this hangar's own counter) actually
  // unlock — this button previously left that counter untouched entirely.
  if (typeof window !== 'undefined' && window.Auth && window.Auth.playerProfile) {
    window.Auth.playerProfile.prestige = (window.Auth.playerProfile.prestige || 0) + 1;
    window.Auth.saveProfile();
    window.Auth.checkAchievements();
  }

  // Re-open with same options so the updated badge is visible
  const savedOptions = Object.assign({}, _options);
  closeHangar();
  setTimeout(() => openHangar(savedOptions), 300);
}

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
          ${(() => {
            const lvl = getLivePilotLevel();
            const xp  = getLivePilotXP();
            const needed = xpForLevel(lvl);
            const pct = Math.min(100, Math.round((xp / needed) * 100));
            const prestigeLevel = _hangarState.prestige || 0;
            const canPrestige = lvl >= 50 && prestigeLevel < 10;
            return `
          <div class="hangar-pilot-badge" id="hangar-pilot-badge" data-rank="${getPilotRank(lvl).dataRank}">
            <div class="hangar-pilot-badge__top">
              <span class="hangar-pilot-badge__icon">✦</span>
              <span class="hangar-pilot-badge__lvl" id="hangar-pilot-rank">${getPilotRank(lvl).label}</span>
              <span class="hangar-pilot-badge__num" id="hangar-pilot-level">${lvl}</span>
              <span id="hangarPrestigeBadge" style="${prestigeLevel > 0 ? '' : 'display:none;'}background:linear-gradient(135deg,#78350f,#92400e);border:1px solid #ca8a04;color:#fef08a;border-radius:4px;padding:2px 8px;font-size:10px;font-weight:700;letter-spacing:0.08em;margin-left:6px;">★ P${prestigeLevel}</span>
              <span id="hangarPrestigeTitle" style="${prestigeLevel > 0 ? '' : 'display:none;'}font-size:9px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#c084fc;margin-left:6px;opacity:0.85;">${getPrestigeTitle(prestigeLevel) || ''}</span>
            </div>
            <div class="hangar-pilot-xp-bar">
              <div class="hangar-pilot-xp-fill" id="hangar-pilot-xp-fill" style="width:${pct}%"></div>
            </div>
            <button id="hangarPrestigeBtn" style="${canPrestige ? '' : 'display:none;'}border:2px solid #ca8a04;color:#fef08a;background:rgba(120,53,15,0.3);padding:4px 12px;border-radius:4px;font-size:11px;font-weight:700;cursor:pointer;letter-spacing:0.06em;margin-top:8px;width:100%;">⬆ PRESTIGE</button>
          </div>`;
          })()}
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
        <button class="hangar-tab-btn" data-tab="armory">Armory</button>
        <button class="hangar-tab-btn" data-tab="missions">Missions</button>
        <button class="hangar-tab-btn" data-tab="loadout">Loadout</button>
        <button class="hangar-tab-btn" data-tab="achievements">Achievements</button>
        <button class="hangar-tab-btn" data-tab="leaderboard">Leaderboard</button>
        <button class="hangar-tab-btn" data-tab="fragments">Fragments</button>
        <button class="hangar-tab-btn" data-tab="stats">Stats</button>
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
  updateMissionsNavBadge();

  // ── Event listeners ──────────────────────────────────────────

  document.getElementById('hangarCloseBtn').addEventListener('click', closeHangar);

  // Prestige button
  const _prestigeBtn = document.getElementById('hangarPrestigeBtn');
  if (_prestigeBtn) {
    _prestigeBtn.addEventListener('click', handlePrestige);
    _prestigeBtn.addEventListener('mouseenter', () => { _prestigeBtn.style.background = 'rgba(120,53,15,0.5)'; });
    _prestigeBtn.addEventListener('mouseleave', () => { _prestigeBtn.style.background = 'rgba(120,53,15,0.3)'; });
  }

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
