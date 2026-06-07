/**
 * UpgradeSystem — Roguelite between-wave upgrade card picker.
 *
 * This module defines the canonical upgrade catalog and manages all
 * per-run perk state. It is designed as a standalone ES module so it
 * can be imported by other systems (e.g. unit tests, future tooling).
 *
 * At runtime the game also maintains an equivalent implementation
 * inside the main script.js IIFE for backwards compatibility; changes
 * to the catalog here should be reflected there.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Upgrade catalog — each entry describes one perk card.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Rarity tier definitions.
 * Weights used for probability draws — actual wave-scaled draw logic lives in
 * pickRandomUpgrades() and in the equivalent in-game _pickRandomPerks().
 */
export const UPGRADE_RARITY = {
  common: { label: 'COMMON', baseWeight: 6 },
  rare:   { label: 'RARE',   baseWeight: 3 },
  epic:   { label: 'EPIC',   baseWeight: 1 }
};

export const UPGRADE_CATALOG = [
  // ── COMMON ────────────────────────────────────────────────────────────────
  {
    id: 'void_armor',
    name: 'Void Armor',
    rarity: 'common',
    icon: '🛡️',
    flavor: 'Crystallised void matter bolts extra armour to your hull.',
    stat: '+25 Max HP',
    apply(m) { m.maxHp += 25; }
  },
  {
    id: 'rapid_core',
    name: 'Rapid Core',
    rarity: 'common',
    icon: '🔫',
    flavor: 'Upgraded feed mechanism cycles shells at blistering speed.',
    stat: '+20% Fire Rate',
    apply(m) { m.fireRate = Math.max(0.3, m.fireRate * 0.8); }
  },
  {
    id: 'afterburner',
    name: 'Afterburner',
    rarity: 'common',
    icon: '🚀',
    flavor: 'Secondary thruster array fires up, pushing velocity limits.',
    stat: '+15% Move Speed',
    apply(m) { m.speed *= 1.15; }
  },
  {
    id: 'reinforced_hull',
    name: 'Reinforced Hull',
    rarity: 'common',
    icon: '🔩',
    flavor: 'Layered composite panels spread impact forces across the frame.',
    stat: 'Damage Taken -15%',
    apply(m) { m.damageTakenMult = Math.max(0.3, m.damageTakenMult * 0.85); }
  },
  {
    id: 'scavenger',
    name: 'Scavenger',
    rarity: 'common',
    icon: '💰',
    flavor: 'Strip every wreck for tech, fuel, and every last credit.',
    stat: '+30% Credits from Kills',
    apply(m) { m.coinBonus *= 1.3; }
  },
  {
    id: 'rapid_loader',
    name: 'Rapid Loader',
    rarity: 'common',
    icon: '🔋',
    flavor: 'Ammo cells charge at breakneck speed.',
    stat: 'Ammo Regen +30%',
    apply(m) { m.ammoRegenMult = Math.max(0.3, m.ammoRegenMult * 0.7); }
  },
  {
    id: 'ghost_protocol',
    name: 'Ghost Protocol',
    rarity: 'common',
    icon: '👻',
    flavor: 'Phase shifts buy precious milliseconds.',
    stat: 'Invuln +100ms',
    apply(m) { m.invulnBonus += 100; }
  },
  {
    id: 'fortify',
    name: 'Fortify',
    rarity: 'common',
    icon: '❤️',
    flavor: 'Emergency nanobots patch up the hull.',
    stat: 'Restore 20 HP',
    apply(m) { m.hp += 20; }
  },
  // ── RARE ──────────────────────────────────────────────────────────────────
  {
    id: 'chain_reaction',
    name: 'Chain Reaction',
    rarity: 'rare',
    icon: '💥',
    flavor: 'Bullets pierce through one extra enemy before stopping.',
    stat: 'Pierce +1 enemy',
    apply(m) { m.chainDamage = Math.max(m.chainDamage, 20); m.piercePlus += 1; }
  },
  {
    id: 'overdrive',
    name: 'Overdrive',
    rarity: 'rare',
    icon: '⚡',
    flavor: 'Overclock your reactor — special ability recharges faster.',
    stat: 'Ability Cooldown -30%',
    apply(m) { m.specialCooldownMult = Math.max(0.3, m.specialCooldownMult * 0.7); }
  },
  {
    id: 'lifesteal',
    name: 'Lifesteal',
    rarity: 'rare',
    icon: '🩸',
    flavor: 'Nano-collectors harvest biomass from every defeated enemy.',
    stat: 'Heal 2 HP per kill',
    apply(m) { m.lifestealPerKill += 2; }
  },
  {
    id: 'overcharge',
    name: 'Overcharge',
    rarity: 'rare',
    icon: '🔥',
    flavor: 'Your weapons burn hotter with every shot.',
    stat: '+20% Damage',
    apply(m) { m.damage *= 1.20; }
  },
  {
    id: 'twin_shot',
    name: 'Twin Shot',
    rarity: 'rare',
    icon: '🎯',
    flavor: 'Dual barrels double your threat potential.',
    stat: '25% chance: 2 bullets',
    apply(m) { m.twinShot = Math.min(1, m.twinShot + 0.25); }
  },
  {
    id: 'overclock',
    name: 'Overclock',
    rarity: 'rare',
    icon: '🌀',
    flavor: 'Quantum score-weighting circuits amplify every point earned.',
    stat: '+0.5× Score Multiplier',
    apply(m) { m.scoreMultBonus += 0.5; }
  },
  // ── EPIC ──────────────────────────────────────────────────────────────────
  {
    id: 'fragmentation',
    name: 'Fragmentation',
    rarity: 'epic',
    icon: '💢',
    flavor: 'Impact-fused rounds detonate in a shower of shrapnel.',
    stat: 'Bullets explode on impact',
    apply(m) { m.fragmentOnImpact = true; m.chainDamage = Math.max(m.chainDamage, 15); }
  },
  {
    id: 'void_reaper',
    name: 'Void Reaper',
    rarity: 'epic',
    icon: '☠️',
    flavor: 'A spectral blade trails your hull, shredding anything in your wake.',
    stat: '+50% Damage, +25% Speed',
    apply(m) { m.damage *= 1.5; m.speed *= 1.25; }
  },
  {
    id: 'singularity',
    name: 'Singularity',
    rarity: 'epic',
    icon: '🌑',
    flavor: 'Collapse local space — bullets pierce ALL enemies and arc back.',
    stat: 'Pierce ALL + Twin Shot 50%',
    apply(m) { m.piercePlus += 99; m.twinShot = Math.min(1, m.twinShot + 0.5); }
  }
];

// ─────────────────────────────────────────────────────────────────────────────
// Default multiplier state (all neutral / zero bonuses)
// ─────────────────────────────────────────────────────────────────────────────

export function createDefaultMultipliers() {
  return {
    bulletSpeed:         1,
    maxHp:               0,   // flat HP bonus
    ammoRegenMult:       1,   // < 1 = faster regen
    invulnBonus:         0,   // ms added to invuln window
    chainDamage:         0,   // area damage on kill
    piercePlus:          0,   // extra pierce count
    damage:              1,
    speed:               1,
    hp:                  0,   // one-time HP heal (consumed on pickup)
    fireRate:            1,   // < 1 = faster fire
    twinShot:            0,   // 0-1 probability of second bullet
    dashCooldown:        1,   // < 1 = shorter dash cooldown
    coinBonus:           1,
    lifestealPerKill:    0,   // HP healed per enemy kill
    damageTakenMult:     1,   // < 1 = less damage received
    scoreMultBonus:      0,   // added to base score multiplier
    specialCooldownMult: 1,   // < 1 = shorter special cooldown
    fragmentOnImpact:    false
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// UpgradeSystem class
// ─────────────────────────────────────────────────────────────────────────────

export class UpgradeSystem {
  constructor() {
    /** IDs of upgrades chosen this run */
    this.activeUpgradeIds = [];
    /** Live multiplier object — read by game systems every frame */
    this.multipliers = createDefaultMultipliers();
  }

  /**
   * Reset all perks — call at the start of a new run.
   */
  reset() {
    this.activeUpgradeIds = [];
    this.multipliers = createDefaultMultipliers();
  }

  /**
   * Return n randomly chosen upgrade entries, excluding already-picked ones.
   * If the pool is exhausted, repeats are allowed.
   * @param {number} count - Number of cards to present (default 3)
   * @returns {Array} Selected upgrade objects from UPGRADE_CATALOG
   */
  /**
   * Wave-scaled rarity weights.
   * wave 1-3: common 60 / rare 30 / epic 10
   * wave 4-6: common 45 / rare 35 / epic 20
   * wave 7+ : common 30 / rare 35 / epic 35
   */
  _rarityWeightsForWave(wave) {
    if (wave >= 7) return { common: 30, rare: 35, epic: 35 };
    if (wave >= 4) return { common: 45, rare: 35, epic: 20 };
    return { common: 60, rare: 30, epic: 10 };
  }

  _drawRarity(weights) {
    const total = weights.common + weights.rare + weights.epic;
    const roll = Math.random() * total;
    if (roll < weights.common) return 'common';
    if (roll < weights.common + weights.rare) return 'rare';
    return 'epic';
  }

  pickRandomUpgrades(count = 3, waveNumber = 1) {
    const weights = this._rarityWeightsForWave(waveNumber);
    const available = UPGRADE_CATALOG.filter(u => !this.activeUpgradeIds.includes(u.id));
    const pool = available.length ? available : UPGRADE_CATALOG;

    const picks = [];
    const usedIds = new Set();
    const rarityOrder = ['epic', 'rare', 'common'];

    for (let i = 0; i < count; i++) {
      const drawnRarity = this._drawRarity(weights);
      const priority = [drawnRarity, ...rarityOrder.filter(r => r !== drawnRarity)];

      let picked = null;
      for (const rarity of priority) {
        const candidates = pool.filter(u => u.rarity === rarity && !usedIds.has(u.id));
        if (candidates.length) {
          picked = candidates[Math.floor(Math.random() * candidates.length)];
          break;
        }
      }
      if (!picked) {
        const remaining = pool.filter(u => !usedIds.has(u.id));
        if (remaining.length) picked = remaining[Math.floor(Math.random() * remaining.length)];
      }
      if (picked) {
        usedIds.add(picked.id);
        picks.push(picked);
      }
    }
    return picks;
  }

  /**
   * Apply an upgrade by ID and record it as active.
   * @param {string} upgradeId - ID from UPGRADE_CATALOG
   * @returns {Object|null} The applied upgrade entry, or null if not found
   */
  applyUpgrade(upgradeId) {
    const upgrade = UPGRADE_CATALOG.find(u => u.id === upgradeId);
    if (!upgrade) return null;
    this.activeUpgradeIds.push(upgradeId);
    upgrade.apply(this.multipliers);
    return upgrade;
  }

  /**
   * Whether the picker is currently in the active / shown state.
   * The game sets this flag; the system exposes it here for state queries.
   */
  get isPickerOpen() {
    return this._pickerOpen === true;
  }

  /**
   * Show the card picker overlay, presenting `count` random upgrades.
   * Accepts an onChosen callback that fires after the player selects.
   *
   * NOTE: this method manipulates the DOM directly so that it can be
   * called from contexts outside the main script.js IIFE.  The element
   * IDs it references match those already in index.html.
   *
   * @param {number}   waveNumber  Wave just completed (for the heading)
   * @param {Function} onChosen    Called with the chosen upgrade object
   * @param {number}   [count=3]   Number of cards to show
   */
  show(waveNumber, onChosen, count = 3) {
    const modal     = document.getElementById('waveUpgradeModal');
    const container = document.getElementById('waveUpgradeCards');
    const titleEl   = document.getElementById('waveUpgradeTitle');

    if (!modal || !container) {
      onChosen && onChosen(null);
      return;
    }

    this._pickerOpen = true;
    if (titleEl) {
      titleEl.textContent = `CHOOSE AN UPGRADE — WAVE ${waveNumber}`;
    }

    const picks = this.pickRandomUpgrades(count);
    container.innerHTML = '';

    picks.forEach(upgrade => {
      const card = document.createElement('div');
      card.className = 'wave-card';
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', `Select upgrade: ${upgrade.name} — ${upgrade.stat}`);
      card.innerHTML = `
        <div class="wave-card-icon">${upgrade.icon}</div>
        <div class="wave-card-name">${upgrade.name}</div>
        <div class="wave-card-flavor">${upgrade.flavor}</div>
        <div class="wave-card-stat">${upgrade.stat}</div>
      `;

      const pick = () => {
        if (!this._pickerOpen) return;
        this._pickerOpen = false;
        this.applyUpgrade(upgrade.id);
        modal.classList.remove('active');
        onChosen && onChosen(upgrade);
      };

      card.addEventListener('click', pick);
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); }
      });
      card.addEventListener('touchstart', (e) => {
        e.preventDefault();
        pick();
      }, { passive: false });

      container.appendChild(card);
    });

    modal.classList.add('active');
  }

  /**
   * Dismiss the picker without applying an upgrade (emergency fallback).
   */
  dismiss() {
    this._pickerOpen = false;
    const modal = document.getElementById('waveUpgradeModal');
    if (modal) modal.classList.remove('active');
  }
}
