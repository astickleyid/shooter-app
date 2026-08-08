# VOID RIFT — Weekly Improvement Roadmap

**Generated:** 2026-07-27
**Method:** Full-codebase audit across four tracks — Gameplay, Visual/Audio, Social/Competitive, Monetization/Backend — run as independent research passes, then synthesized and prioritized into a 7-day plan of 5 tasks/day (35 total).

This roadmap reflects the current state of the game as of this audit. It supersedes nothing in `LAUNCH_PLAN.md` — several items below are gaps *between* that plan and the shipped code, not new strategy.

## How this is organized

Each day mixes categories rather than batching by track, and is sequenced so that:
1. **Day 1–2** fix things that are actively costing revenue, locking out players, or breaking a core mechanic.
2. **Day 3** addresses fairness/balance bugs that affect long-session players.
3. **Day 4–5** add engagement features and polish once the foundation is stable.
4. **Day 6–7** round out accessibility, new content hooks, and codebase cleanup.

Legend: **[G]** Gameplay · **[V]** Visual/Audio · **[S]** Social/Competitive · **[M]** Monetization/Backend

---

## Day 1 — Stop the bleeding: revenue and core-loop blockers

| # | Task | Why it matters |
|---|------|-----------------|
| 1 | **[M]** Wire a real `GADRewardedAd` implementation into `AdMobManager.swift` (`ios/VoidRift/Native/AdMobManager.swift:17-37`). `showRewarded()` currently always calls `completion(false)` — it's an explicit stub. Every "Watch Ad to Continue" / bonus-credit prompt silently fails on real iOS devices. | This is the #1 revenue leak in the repo: the entire ad-revenue model in `LAUNCH_PLAN.md` §1 is currently earning **$0** on iOS. |
| 2 | **[S]** Fix web login: `unified-social.js`'s `DOMContentLoaded` handler overwrites the working `#loginButton` handler from `social-ui.js` and calls `SocialHub.showAuthModal` — but `SocialHub` (`social-hub.js`) is never `<script>`-included in `index.html`, so it's `undefined`. Point `UnifiedSocial`'s identity/login logic at the real `AuthSystem` session instead. | Clicking "Login" currently does nothing for every non-iOS player. This blocks accounts, cross-device saves, and the entire social feature set below it. |
| 3 | **[G]** Fix the Void Surge skip bug: `checkWaveCompletion()` only gates wave-advance on boss death when `currentWaveType === 'boss'` (`script.js:11363-11380`), but Void Surge waves are tagged `'elite'` (`script.js:11079`). Players can grind trash mobs to the kill quota and `advanceLevel()` deletes the still-alive **HERALD OF VOID** boss with zero warning, denying its rewards and achievement. | A named, hyped boss (wave 15/40/65...) can be trivially and invisibly skipped — a broken centerpiece encounter. |
| 4 | **[V]** Wire `AudioManager.stopMusic()` into `togglePause()` (`script.js:12897-12911`), the tab-visibility handler (`script.js:14010-14016`), and `exitToMainMenu()`/`returnToMainMenu()` (`script.js:12921-12947`, `13728-13769`). None of these currently stop music. | Background music keeps looping under the pause menu, with the tab backgrounded, and after quitting to the main menu — a glaring, easy-to-notice polish bug for every session. |
| 5 | **[M]** Implement native StoreKit purchase + restore for the "Remove Ads" IAP. `GameBridge.swift` never registers `iapPurchase`/`iapRestore` handlers, so `IAPManager.platform` (`hangar-ui.js:1940`) always resolves to `'web'` in the native app and shows the disabled "Available on iOS & Android" button. | The entire IAP revenue line in `LAUNCH_PLAN.md` (~$3,750/mo projected) is currently unreachable — there is no way to actually buy Remove Ads on iOS. |

---

## Day 2 — Stabilize backend, security, and identity

| # | Task | Why it matters |
|---|------|-----------------|
| 6 | **[M]** Replace the placeholder AdMob test unit IDs (`admob-manager.js:17-20`, hardcoded `testMode: true`, duplicated in `ios/VoidRift/WebContent/admob-manager.js`) with real production ad unit IDs. | Even after Day 1's native fix, test IDs mean zero real ad fill/revenue. |
| 7 | **[M]** Reconcile backend docs vs. reality: `BACKEND_STATUS.md` claims ioredis was removed and a 5-minute Vercel Cron keepalive exists; neither is true (`api/redis-client.js:6` still requires `ioredis`, no `crons` block in `vercel.json`). Either finish the migration or rewrite the docs — and decide whether Firebase (`firebase-config.js` still has a placeholder API key) or Vercel/KV is the real backend, since right now **neither is configured in production** and leaderboard/social silently run local-only. | Contributors and future automation (including this daily loop) are working from docs that don't match the code, and players get no real cross-device leaderboard/social right now. |
| 8 | **[S]** Switch password hashing in `api/users.js:93,164` from unsalted SHA-256 to bcrypt. | Unsalted SHA-256 is a rainbow-table risk if the KV store ever leaks — cheap, high-value security fix. |
| 9 | **[S]** Fix personal-best/rank lookup: `LeaderboardSystem.getUserBestScores()` (`leaderboard-system.js:96-111`) calls `fetchScores('all', 100)`, but `api/leaderboard.js:161` hard-caps results at 100 — any player outside the global top 100 gets an empty personal-best/rank. Add a dedicated `?action=rank` endpoint instead of a client-side scan. | Most players are *not* top-100, so most players currently see a broken "your best" stat. |
| 10 | **[G]** Fix the perk double-dip bug: once all 13 perks are owned, `_pickRandomPerks` falls back to the full catalog (`script.js:1182-1183`) and `_applyPerk` never checks `activePerks` before re-applying (`script.js:1220-1224`), letting an already-owned perk silently re-stack its effect. | Breaks the intended one-time-per-perk balance in long runs — direct fairness/balance bug. |

---

## Day 3 — Balance and fairness pass

| # | Task | Why it matters |
|---|------|-----------------|
| 11 | **[G]** Add a soft ceiling to enemy damage scaling: `enemyDamageMultiplier` combines an adaptive factor (capped ~3.5x) with an *uncapped* `progressiveDamageBonus` that keeps growing every level past wave 3 (`script.js:640-666`), compounding to 20–30x base damage by wave 60–80 against player HP that only grows linearly. | Long/endless runs currently hit an unwinnable wall rather than scaling into "hard but fair" — directly affects retention of the game's most engaged players. |
| 12 | **[G]** Wire the two dead perk stats into real content: `perkMultipliers.dashCooldown` (script.js:975, 2436) and `perkMultipliers.bulletSpeed` (consumed at script.js:7678) are both fully inert — no perk, upgrade, or fragment ever sets them. Add 1–2 new perks/upgrades that actually use them (e.g. "Overdrive Thrusters," "Railgun Coils"). | Dead stat hooks are wasted design space; turning them into real perks adds build variety for free. |
| 13 | **[G]** Auto-collect or convert uncollected coins/orbs into credits at wave-clear instead of deleting them: `advanceLevel()` resets `coins=[]; supplies=[]` etc. unconditionally (`script.js:11130-11133`) with no salvage step. | Players lose earned rewards through no fault of their own on swarm/hazard waves — feels punishing rather than challenging. |
| 14 | **[M]** Add a session-wide rewarded-ad cap (`sessionAdCount`, max 2) to `admob-manager.js`, matching `LAUNCH_PLAN.md`'s explicit rule. Today only a per-run "one continue" flag and a "every 3 waves" gate exist — nothing stops unlimited ad prompts in a long session. | Protects eCPM and prevents ad fatigue exactly as the launch plan warns; currently unenforced. |
| 15 | **[M]** Centralize the "ads removed" check into one function (e.g. `AdMobManager.canShow`) instead of two independent readers of `localStorage['vr_ads_removed']` — `script.js:13595` reads it directly, bypassing `IAPManager.isPurchased` (`hangar-ui.js:1945-1947`). | Two independent readers of the same flag are one renamed key away from silently desyncing (e.g. showing ads to a paying customer). |

---

## Day 4 — Social & competitive engagement

| # | Task | Why it matters |
|---|------|-----------------|
| 16 | **[S]** Add a real "Friends" nav button/UI wired to the already-working `api/friends.js` and `SocialAPI` friend methods (`social-api.js:209-311`). Right now there is no Friends element anywhere in `index.html` — the entire friends backend is unreachable. | A fully-built feature is invisible to players; this is pure UI wiring on top of working server code. |
| 17 | **[S]** Unify the two conflicting achievement-tracking systems: `Auth.checkAchievements()` (`script.js:1768-1806`, 26 achievements) and `UnifiedSocial.checkAchievements()` (`unified-social.js:378-406`, a hardcoded subset writing to an orphaned storage key) both fire on every game-over, producing duplicate/stacking "Achievement Unlocked" toasts. | Confusing, duplicated player-facing feedback from a bug that's been silently there for a while. |
| 18 | **[S]** Implement real weekly/seasonal leaderboard rotation. A "weekly" Game Center board ID already exists (`unified-social.js:27`) but is fed the same score as the all-time board — there's no actual reset/rotation logic. | Weekly resets are a proven retention lever (fresh competition every week) and the scaffolding is already half-built. |
| 19 | **[S]** Add friend-vs-friend Daily Challenge comparison. `daily-challenge.js` runs are deterministically same-seeded but the result is local-only today. | Same-seeded runs are a ready-made async-PvP hook — natural, low-effort competitive feature. |
| 20 | **[S]** Add cross-platform "Share Score" via `navigator.share` + clipboard fallback. Score sharing currently only exists on iOS (`gc-only-mode.js:160-174`). | Free organic-growth channel that's currently locked to one platform. |

---

## Day 5 — Visual and audio polish

| # | Task | Why it matters |
|---|------|-----------------|
| 21 | **[V]** Fix the particle fade-alpha bug: both the live renderer (`script.js:2863`) and the unused module copy compute `alpha = life / 320` with a hardcoded divisor, but particle lifespans range 160–500ms depending on kind — short-lived particles never reach full opacity, long-lived ones visibly "pop" in brightness. Store each particle's actual `maxLife` and divide by that. | Affects the visual quality of every hit/kill/level-up effect in the game — small fix, broad visible impact. |
| 22 | **[V]** Resolve the dead HUD Theme picker: `hangar-ui.js:2134-2152` lets players pick from 5 HUD color themes, but the only reader, `getHudAccent()` (`script.js:13408-13416`), is never called anywhere. Either wire it into the mission HUD/status overlays as advertised, or remove the setting. | A settings control that visibly does nothing erodes trust in the rest of the settings menu. |
| 23 | **[V]** Fix the toast re-stack asymmetry: `showAchievementNotification`'s cleanup (`script.js:2080-2089`) only re-stacks `.achievement-toast` elements, while `showTechFragmentNotification`'s cleanup (`script.js:2113-2124`) re-stacks both — an achievement toast expiring above a fragment toast leaves a visible gap instead of a clean slide-up. | Small but noticeable UI-polish bug in a frequently-seen notification system. |
| 24 | **[V]** Add pitch/timing jitter (e.g. `detune: rand(-30,30)`) to `playShoot`/`playHit` (`audio-manager.js:314-500`), which currently fire identical fixed frequencies every time. | Rapid-fire weapons currently sound robotic/repetitive; jitter is a classic, cheap "game feel" win. |
| 25 | **[V]** Add a max-toast cap/dedupe queue for the achievement + tech-fragment notification system, which currently has no limit — a fast burst can stack many toasts off the bottom of small screens. | Protects the mobile UI (the game's primary platform per README) from an unbounded visual pile-up. |

---

## Day 6 — Accessibility and new content hooks

| # | Task | Why it matters |
|---|------|-----------------|
| 26 | **[V]** Add a real colorblind-safe palette (shift red/green enemy-tint hues toward blue/orange) rather than only the existing generic "High Contrast" `contrast(1.35) saturate(1.5)` filter (`script.js:13395-13401`), which does nothing for actual hue-confusion (deuteranopia/protanopia/tritanopia). | Commit history references colorblind support that was never actually implemented — closes a real accessibility gap. |
| 27 | **[V]** Add `prefers-reduced-motion` support in `style.css` so screen shake, pulsing HUD glows, and wave-card animations respect the OS accessibility setting (currently no hits for it anywhere in the stylesheet). | Standard accessibility baseline that's entirely missing today. |
| 28 | **[G]** Give the two generic (non-named) boss "shapes" — currently just a stat-boosted `'heavy'` or `'chaser'` enemy (`script.js:11337-11339`) — one unique attack pattern each, instead of reusing plain trash-mob AI at boss scale. | Only Leviathan and Herald of Void feel like real bosses today; every other boss wave is a reskin. |
| 29 | **[G]** Add a small permanent per-prestige bonus (e.g. +1–2% credits/XP per prestige tier) to `doPrestige()` (`script.js:1956-1994`), which currently resets pilot level for a one-time cosmetic unlock with no ongoing payoff. | A level-50 pilot reset is a big ask for a purely cosmetic reward — this makes the system's core loop worth returning to. |
| 30 | **[M]** Add a reward hook to the existing Daily Challenge streak tracker (`getDailyStreak()`, `daily-challenge.js:81-93`), e.g. a 3-day-streak bonus-credit payout. Currently the streak is tracked but has zero payoff. | Cheap retention lever built entirely on top of tracking that already exists. |

---

## Day 7 — Cleanup and growth foundations

| # | Task | Why it matters |
|---|------|-----------------|
| 31 | **[G]** Delete or clearly mark-as-experimental the dead `src/systems/{SaveSystem,UpgradeSystem,AchievementSystem,GameState,InputManager}.js` files — none are `<script>`-tagged in `index.html` or imported anywhere; they're abandoned modular-refactor scaffolding duplicating logic that actually lives inline in `script.js`. | Reduces the risk of a future change (including this game's own daily-improvement automation) landing in the wrong, dead copy of the logic. |
| 32 | **[S]** Delete or properly re-wire the fully unreachable `social-hub.js` (864 lines) and `social-integration.js` (245 lines) — neither is `<script>`-included, and their functionality (auth/friends/activity/profile UI) is already covered by `social-ui.js` + `script.js`. | Same architecture-debt risk as #31, specifically in the social layer where two systems already fight over `#loginButton`. |
| 33 | **[V]** Sweep and remove dead CSS: unused classes (`.armoryCard`, `.menuButton`, `.menuRow`, `.gameModeDropdown`, `.actionButton`, etc.) and dead keyframes (`@keyframes waveCardPulse`, `@keyframes waveUpgradeFadeIn`) left over from an older UI layout, plus stop building wave-upgrade-card flavor-text HTML that `.wave-card-flavor { display: none; }` permanently hides. | Shrinks `style.css` and removes wasted per-frame DOM work for content nobody can see. |
| 34 | **[M]** Add a low-price starter pack (small credit bundle + a cosmetic) aimed at converting new players before day 3 — currently there is no first-purchase offer of any kind, only the "Remove Ads" IAP and (planned) cosmetics. | Classic, non-predatory F2P conversion lever that's currently completely absent from the monetization surface. |
| 35 | **[G]** Add a lightweight first-run tutorial/onboarding overlay. There is currently zero onboarding anywhere in the game (confirmed zero references to "tutorial"; the most recent commit on this branch explicitly removed the last remnant of one). | New players are dropped into a twin-stick shooter with hangar, missions, fragments, perks, and prestige systems with no guidance at all — a real first-session retention risk. |

---

## Summary by category

| Category | Count |
|----------|-------|
| Gameplay **[G]** | 9 |
| Visual/Audio **[V]** | 9 |
| Social/Competitive **[S]** | 9 |
| Monetization/Backend **[M]** | 8 |
| **Total** | **35** |

## Notable cross-cutting findings

- **Identity fragmentation** is the root cause behind several separate bugs above (Day 1 #2, Day 2 #9, Day 4 #17): the game has at least four divergent `localStorage` identity schemes (`voidrift_session`, `social_user`, `voidrift_profile_<id>`, `void_rift_auth*`) and three parallel backend/identity systems (Vercel KV, Firebase, Game Center) where only Game Center is actually live on iOS. Days 1–2 fix the acute symptoms; a follow-up week should consider consolidating identity into one system rather than patching each divergence separately.
- **The modular `src/systems/` refactor is abandoned mid-flight.** Only `MissionSystem.js`, `TechFragmentSystem.js`, and `HangarSystem.js` are actually wired in; the rest (`SaveSystem`, `UpgradeSystem`, `AchievementSystem`, `GameState`, `ParticleSystem`, `InputManager`, plus duplicate `AuthSystem`/`LeaderboardSystem`) are dead weight duplicating live logic in `script.js`. This shows up as a recurring theme across all four audits and is addressed piecemeal on Day 7 (#31), but finishing or formally abandoning that refactor is a larger decision worth a dedicated week of its own.
- **`ios/VoidRift/WebContent/` is a manually-synced copy** of the root JS files (via a shell script, not CI-enforced) — a standing drift risk any time a fix lands in one copy and not the other. Worth automating in CI regardless of which specific bugs get fixed this week.
