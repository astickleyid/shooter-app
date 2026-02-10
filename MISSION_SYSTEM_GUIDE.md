# Mission & Bounty System Feature Guide

## Overview

The Mission & Bounty System adds meaningful objectives, rare collectibles, and long-term progression goals to VOID RIFT. This feature transforms the game from a pure survival arcade shooter into a goal-oriented experience with clear milestones and rewards.

## Core Components

### 1. Tech Fragments (Rare Collectibles)

Tech Fragments are rare drops from Elite and Boss enemies that unlock special upgrades and legendary gear.

#### Fragment Types

| Fragment | Rarity | Boss Drop | Elite Drop | Unlocks |
|----------|--------|-----------|------------|---------|
| **Quantum Core** | Legendary | 8% | 4% | Quantum Drive (+35% boost) |
| **Void Shard** | Legendary | 8% | 4% | Void Cannon (pierce-all weapon) |
| **Plasma Cell** | Rare | 12% | 6% | Plasma Overcharge (+40% damage) |
| **Neural Chip** | Rare | 12% | 6% | AI Targeting (+25% crit) |
| **Antimatter Vial** | Epic | 10% | 5% | Antimatter Reactor (+60% ult charge) |
| **Chrono Crystal** | Legendary | 8% | 4% | Time Dilation (slow enemies 15%) |

#### Features
- **Visual Effects**: Each fragment has unique colors and glow effects
- **Pickup Animation**: Fragments orbit and pulse with particle effects
- **Lifetime**: 15 seconds before despawning
- **Collection Tracking**: Track unique fragments and duplicates
- **Unlockable Rewards**: Special upgrades when fragments are collected

### 2. Daily Missions

Three rotating missions refresh every 24 hours, giving players short-term goals.

#### Mission Types

| Type | Description | Example Targets | Reward Type |
|------|-------------|-----------------|-------------|
| **Kill Enemies** | Eliminate X enemies | 50, 100, 200 | Credits + XP Boost |
| **Reach Level** | Reach level X in single run | 5, 10, 15 | Credits + XP Boost |
| **Collect Credits** | Collect X credits during runs | 200, 500 | Credits + XP Boost |
| **Kill Bosses** | Defeat X boss enemies | 3 | Credits + Tech Fragment |
| **Kill Elites** | Defeat X elite enemies | 10 | Credits + XP Boost |
| **Flawless Level** | Complete level without damage | 1 | Credits + Tech Fragment |
| **Survive Time** | Survive for X seconds | 300 | Credits + XP Boost |
| **Earn Score** | Earn X points in runs | 5000, 10000 | Credits + XP Boost |

#### Rewards
- **Credits**: 100-600 CR depending on difficulty
- **XP Boost**: 1.1x to 1.5x multiplier for pilot XP
- **Tech Fragments**: Guaranteed drop for special missions

### 3. Bounty Targets

Special enemy variants with unique behaviors and high rewards.

#### Active Bounties

| Bounty | Difficulty | Behavior | Stats | Reward |
|--------|------------|----------|-------|--------|
| **Crimson Ace** | Hard | Aggressive dodge | Fast, 300 HP, 25 DMG | 500 CR + Fragment |
| **Void Phantom** | Hard | Phase blink | Medium, 400 HP, 20 DMG | 450 CR + Fragment |
| **Iron Warlord** | Very Hard | Tank barrage | Slow, 800 HP, 40 DMG | 600 CR + Fragment |
| **Swarm Queen** | Hard | Spawn minions | Medium, 500 HP, 15 DMG | 550 CR + Fragment |
| **Quantum Hunter** | Very Hard | Time distortion | Fast, 600 HP, 30 DMG | 700 CR + Fragment |

#### Features
- **2 Active Bounties**: Rotated daily with missions
- **Visual Markers**: Special indicators for bounty targets
- **Guaranteed Fragments**: Always drop tech fragments
- **One-Time Rewards**: Can only be completed once per rotation

### 4. Mission Tracking

#### Run Statistics
The system tracks comprehensive statistics during each run:
- Enemies killed (total, bosses, elites)
- Credits collected
- Tech fragments collected
- Score earned
- Highest level reached
- Time survived
- Damage taken per level (for flawless tracking)

#### Progress Types
- **Cumulative**: Adds up across missions (kills, credits, fragments)
- **Milestone**: Takes maximum value reached (level, score, time)
- **Special**: Tracks specific conditions (flawless levels)

## Technical Implementation

### Module: TechFragmentSystem

Located at: `src/systems/TechFragmentSystem.js`

#### Key Methods

```javascript
// Initialize system
const techFragments = new TechFragmentSystem();
techFragments.load(saveData);

// Check for drops
const fragment = techFragments.rollDrop(isBoss, isElite);
if (fragment) {
  techFragments.spawnPickup(fragment, x, y);
}

// Update pickups (in game loop)
techFragments.update(deltaTime);

// Check collection
const collected = techFragments.checkCollection(playerX, playerY, magnetRange);
if (collected) {
  // Handle collection event
}

// Get save data
const saveData = techFragments.getSaveData();
```

#### Data Structure

```javascript
{
  collected: Set(['quantum_core', 'void_shard']),
  inventory: { 'quantum_core': 2, 'void_shard': 1 },
  active: [ /* active pickup objects */ ]
}
```

### Module: MissionSystem

Located at: `src/systems/MissionSystem.js`

#### Key Methods

```javascript
// Initialize system
const missions = new MissionSystem();
missions.load(saveData);

// Check daily refresh
missions.checkDailyRefresh(); // Auto-refreshes if new day

// Start new run
missions.startRun();

// Track events
missions.trackKill(isBoss, isElite, bountyId);
missions.trackCredits(amount);
missions.trackFragments(count);
missions.trackScore(score);
missions.trackLevel(level);
missions.trackDamage(damage);
missions.trackLevelComplete(flawless);
missions.trackTime(seconds);

// Claim rewards
const reward = missions.claimMissionReward(missionId);
// Returns: { credits, xpBoost, techFragment }

// Get data
const dailyMissions = missions.getDailyMissions();
const bounties = missions.getActiveBounties();
const stats = missions.getRunStats();
const counts = missions.getMissionCounts();

// Get save data
const saveData = missions.getSaveData();
```

#### Data Structure

```javascript
{
  daily: [ /* 3 mission objects */ ],
  progress: { /* mission progress tracking */ },
  completed: ['mission_id_1', 'mission_id_2'],
  lastRefresh: '2026-02-10',
  bounties: [ /* 2 bounty objects */ ],
  bountiesCompleted: ['bounty_id_1'],
  bountyProgress: { /* bounty tracking */ }
}
```

## Integration Guide

### Step 1: Initialize Systems

```javascript
// In main game initialization
const techFragments = new TechFragmentSystem();
const missions = new MissionSystem();

// Load from save
techFragments.load(Save.data);
missions.load(Save.data);
```

### Step 2: Track Events

```javascript
// When enemy dies
function onEnemyDeath(enemy) {
  const isBoss = enemy.type === 'boss';
  const isElite = enemy.type === 'elite';
  const bountyId = enemy.bountyId || null;
  
  // Track kill
  missions.trackKill(isBoss, isElite, bountyId);
  
  // Roll for tech fragment
  const fragment = techFragments.rollDrop(isBoss, isElite);
  if (fragment) {
    techFragments.spawnPickup(fragment, enemy.x, enemy.y);
  }
}

// When credits collected
function onCreditPickup(amount) {
  missions.trackCredits(amount);
}

// When level completes
function onLevelComplete(damageTaken) {
  const flawless = damageTaken === 0;
  missions.trackLevelComplete(flawless);
  missions.trackLevel(currentLevel);
}
```

### Step 3: Update and Render

```javascript
// In game update loop
function gameUpdate(deltaTime) {
  techFragments.update(deltaTime);
  
  // Check fragment collection
  const collected = techFragments.checkCollection(
    player.x,
    player.y,
    player.magnetRange
  );
  
  if (collected) {
    // Show collection notification
    showNotification(`Tech Fragment Collected: ${collected.fragment.name}`);
    missions.trackFragments(1);
  }
}

// In render loop
function renderFragments(ctx) {
  const pickups = techFragments.getActivePickups();
  
  pickups.forEach(pickup => {
    // Draw fragment with glow effect
    ctx.save();
    ctx.globalAlpha = 0.8 + Math.sin(pickup.pulsePhase) * 0.2;
    
    // Draw glow
    const gradient = ctx.createRadialGradient(
      pickup.x, pickup.y, 0,
      pickup.x, pickup.y, pickup.size * 2
    );
    gradient.addColorStop(0, pickup.fragment.glowColor);
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.fillRect(
      pickup.x - pickup.size * 2,
      pickup.y - pickup.size * 2,
      pickup.size * 4,
      pickup.size * 4
    );
    
    // Draw fragment
    ctx.fillStyle = pickup.fragment.color;
    ctx.beginPath();
    ctx.arc(pickup.x, pickup.y, pickup.size, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  });
}
```

### Step 4: Display Mission UI

```javascript
// Create mission HUD
function renderMissionHUD(ctx) {
  const dailyMissions = missions.getDailyMissions();
  const counts = missions.getMissionCounts();
  
  // Draw mission panel
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(10, 10, 300, 100);
  
  ctx.fillStyle = '#fff';
  ctx.font = '14px monospace';
  ctx.fillText(`Daily Missions: ${counts.completed}/${counts.total}`, 20, 30);
  
  // Draw active missions
  dailyMissions.forEach((mission, i) => {
    const y = 50 + i * 20;
    const status = mission.completed ? '✓' : `${mission.progress}/${mission.target}`;
    ctx.fillText(`${mission.name}: ${status}`, 20, y);
  });
}

// Create bounty indicator
function renderBountyIndicator(enemy) {
  if (!enemy.isBounty) return;
  
  // Draw crown icon or special marker above enemy
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('👑', enemy.x - 8, enemy.y - enemy.size - 10);
}
```

### Step 5: Save/Load Integration

```javascript
// Extend SaveSystem
class SaveSystem {
  load() {
    // ... existing load code ...
    
    this.data.techFragments = parsed.techFragments || {};
    this.data.missions = parsed.missions || {};
  }
  
  save() {
    // ... existing save code ...
    
    this.data.techFragments = techFragments.getSaveData();
    this.data.missions = missions.getSaveData();
    
    localStorage.setItem(SAVE_KEY, JSON.stringify(this.data));
  }
}
```

## UI/UX Recommendations

### In-Game HUD
1. **Mission Progress Panel**: Top-left corner showing daily missions
2. **Fragment Collection Notification**: Center screen with particle burst
3. **Bounty Alert**: Warning when bounty target spawns
4. **Mission Complete Badge**: Flash notification when mission completes

### Menu Screens

#### Tech Lab Screen
- Display collected fragments with 3D model or artwork
- Show collection progress (X/6 fragments)
- Display unlocked abilities and stats
- Lore descriptions for each fragment
- "Craft" or "Activate" buttons for unlocks

#### Mission Board Screen
- Show 3 daily missions with progress bars
- Display time until refresh (countdown)
- Show total missions completed (all-time stat)
- Claim rewards buttons for completed missions
- Mission history/log

#### Bounty Board Screen
- Show 2 active bounty targets
- Display bounty details (difficulty, reward, behavior)
- Show bounty tracking progress
- Gallery of defeated bounties

## Balancing Considerations

### Drop Rates
- **Boss Fragment Drop**: 8-12% (roughly 1 in 10 bosses)
- **Elite Fragment Drop**: 4-6% (roughly 1 in 20 elites)
- Designed for gradual progression over multiple runs

### Mission Difficulty
- **Easy Missions**: 100-200 CR reward (quick completion)
- **Medium Missions**: 250-400 CR reward (moderate effort)
- **Hard Missions**: 450-700 CR reward (significant challenge)
- Special missions reward guaranteed tech fragments

### Bounty Difficulty
- Bounties are significantly harder than normal enemies
- Designed as mini-boss encounters
- High risk, high reward (500-700 CR + guaranteed fragment)

## Future Enhancements

### Potential Additions
1. **Weekly Challenges**: Longer-term objectives (complete 10 missions)
2. **Mission Chains**: Series of related missions with mega rewards
3. **Fragment Crafting**: Combine fragments for ultra-rare items
4. **Bounty Modifiers**: Random modifiers make bounties harder/more rewarding
5. **Achievements**: Meta-achievements for mission/bounty milestones
6. **Leaderboards**: Weekly mission completion leaderboards

### Expansion Ideas
1. **Legendary Bounties**: Monthly super-bosses with unique mechanics
2. **Tech Lab Upgrades**: Spend fragments to unlock permanent bonuses
3. **Contract System**: Choose from multiple missions (pick 3 of 10)
4. **Fragment Sets**: Bonus effects for collecting all fragments of a rarity
5. **Mission Streaks**: Bonus rewards for consecutive daily completions

## Testing

### Unit Tests
- `tech-fragment-system.test.js`: 22 tests covering all TechFragmentSystem functionality
- `mission-system.test.js`: 41 tests covering all MissionSystem functionality

### Manual Testing Checklist
- [ ] Tech fragments drop from bosses/elites at correct rates
- [ ] Fragments can be collected and inventory updates
- [ ] Daily missions refresh at midnight
- [ ] Mission progress tracks correctly for all mission types
- [ ] Rewards can be claimed and applied
- [ ] Bounties spawn and complete correctly
- [ ] Save/load preserves all data
- [ ] UI displays correctly in all game states

## Performance Considerations

### Optimization Tips
1. **Object Pooling**: Reuse fragment pickup objects
2. **Render Culling**: Only render visible fragments
3. **Update Throttling**: Update fragment animations at 30fps if needed
4. **Data Cleanup**: Remove old completed missions from save data

### Memory Management
- Active pickups limited to reasonable count (auto-expire after 15s)
- Mission data lightweight (only 3 active missions)
- Bounty data minimal (only 2 active bounties)
- Fragment inventory stored as object (not array)

## Support & Troubleshooting

### Common Issues

**Missions not refreshing**
- Check system clock/timezone
- Verify lastRefreshDate is stored correctly
- Call `checkDailyRefresh()` on game start

**Fragments not dropping**
- Verify enemy type (must be boss or elite)
- Check RNG is working (`Math.random()`)
- Confirm drop rates in TECH_FRAGMENTS array

**Progress not tracking**
- Ensure events call tracking methods
- Check mission type matches event type
- Verify mission is not already completed

**Save data not persisting**
- Check localStorage is available
- Verify save() is called after updates
- Confirm SAVE_KEY matches

## Conclusion

The Mission & Bounty System transforms VOID RIFT from a simple survival shooter into a progression-driven experience with clear goals and meaningful rewards. By combining short-term objectives (daily missions), rare collectibles (tech fragments), and special challenges (bounties), players have constant motivation to continue playing and improving.

The modular architecture ensures easy maintenance and future expansion, while comprehensive tests guarantee stability and reliability.
