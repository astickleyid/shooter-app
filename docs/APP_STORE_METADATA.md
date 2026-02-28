# App Store Metadata — VOID RIFT

This document contains the App Store Connect metadata and privacy disclosures checklist for VOID RIFT.

---

## 1. App Information

| Field | Value |
|-------|-------|
| **App Name** | VOID RIFT |
| **Subtitle** | Twin-Stick Space Shooter |
| **Bundle ID** | com.voidrift.game |
| **Primary Category** | Games |
| **Secondary Category** | Games › Action |
| **Age Rating** | 4+ |
| **Price** | Free |

---

## 2. App Description

> Copy this into App Store Connect › App Information › Description.

```
VOID RIFT is a fast-paced twin-stick space shooter built for mobile.
Navigate the void, destroy waves of enemies, and climb the global leaderboard.

GAMEPLAY
• Infinite wave-survival shooter set in deep space
• Twin-stick touch controls with smooth, responsive aiming
• Upgrade your ship hull, primary weapon, secondary ordnance, defense system, and ultimate ability
• Supply crates drop from enemies — replenish ammo and accelerate shield cooldowns
• Ultimate charge meter: deal damage, collect drops, then unleash devastating attacks

SHIPS & WEAPONS
• Choose from 4 starter hulls: Vanguard Mk.I, Phantom-X, Bulwark-7, Emberwing
• Each hull has unique stats: speed, armor, magazine capacity, and fire cadence
• Unlock rail lances, scatter coils, ion arrays, and more from the Armory

MISSIONS & PROGRESSION
• Daily missions and bounty targets keep every session fresh
• Rare Tech Fragment collectibles add strategic depth
• Credits system: earn and spend in the Ship Hangar and Armory

SOCIAL & LEADERBOARDS
• Global leaderboard — compete with players worldwide
• Optional account system: track progress across devices
• Friends system, activity feed, and achievement showcase
• iOS Game Center integration: native leaderboards and achievements

PERFORMANCE
• Designed for iPhone 8 and newer — targets 60 FPS
• Portrait and landscape support
• Interactive first-launch tutorial
• Offline play fully supported; leaderboards sync when online

No ads. No in-app purchases. Pure arcade action.
```

---

## 3. Keywords

> Maximum 100 characters per keyword field in App Store Connect. Use comma-separated values.

```
shooter,space,arcade,twin-stick,action,sci-fi,leaderboard,survival,retro,dogfight
```

---

## 4. Support and Privacy URLs

| Field | URL |
|-------|-----|
| **Privacy Policy URL** | `https://github.com/astickleyid/shooter-app/blob/main/PRIVACY_POLICY.md` |
| **Support URL** | `https://github.com/astickleyid/shooter-app/issues` |
| **Marketing URL** (optional) | `https://github.com/astickleyid/shooter-app` |

---

## 5. App Privacy — Nutrition Label (App Store Connect)

Fill out the **App Privacy** section in App Store Connect using the answers below.

### 5.1 Data Types Collected

| Data Type | Collected? | Linked to Identity | Used for Tracking |
|-----------|-----------|-------------------|------------------|
| Name | ❌ No | — | — |
| Email Address | ✅ Yes (optional) | ✅ Yes | ❌ No |
| Username | ✅ Yes | ✅ Yes | ❌ No |
| Password (hashed) | ✅ Yes | ✅ Yes | ❌ No |
| Gameplay Data (score, stats) | ✅ Yes | ✅ Yes (if account) | ❌ No |
| Device Identifiers | ❌ No | — | — |
| Location | ❌ No | — | — |
| Contacts | ❌ No | — | — |
| Advertising Data | ❌ No | — | — |
| Browsing History | ❌ No | — | — |
| Purchases | ❌ No | — | — |

### 5.2 Data Use Purposes

| Data | Purpose |
|------|---------|
| Email address | Account management (recovery) |
| Username, gameplay stats | App functionality (leaderboard, profile) |
| Session token | Authentication / security |

### 5.3 Tracking
- **Does this app track users?** ❌ No
- **Advertising identifier (IDFA) used?** ❌ No
- **Third-party ad networks used?** ❌ No

---

## 6. Age Rating Questionnaire

Answer the App Store age rating questionnaire as follows:

| Category | Answer |
|----------|--------|
| Cartoon or Fantasy Violence | Infrequent/Mild |
| Realistic Violence | None |
| Sexual Content or Nudity | None |
| Profanity or Crude Humor | None |
| Horror/Fear Themes | None |
| Mature/Suggestive Themes | None |
| Gambling | None |
| Alcohol, Tobacco, or Drug Use | None |
| Simulated Gambling | None |
| Contests | None |
| User-Generated Content | None |

**Expected Rating: 4+** (Infrequent/Mild Cartoon or Fantasy Violence)

---

## 7. Export Compliance

- **Uses non-exempt encryption?** No
- **Info.plist key**: `ITSAppUsesNonExemptEncryption = NO` ✅ (already set)

---

## 8. App Review Notes

> Paste into App Store Connect › App Review Information › Notes.

```
Thank you for reviewing VOID RIFT.

ACCOUNT FEATURES:
- Account creation is optional. Guest play is fully supported.
- If testing the global leaderboard or friends system, create a test account
  using any username and password (minimum 3 characters).

GAME CENTER:
- Game Center integration submits high scores and unlocks achievements.
- Requires a valid Game Center account on the test device.

SOCIAL FEATURES:
- Friends system requires two accounts; friend requests must be mutually accepted.

DEMO ACCOUNT (optional):
- Username: reviewtest
- Password: Review2026!
  (Pre-created for convenience; scores may already exist.
   This account is a dedicated review account and may be reset or removed
   after the review cycle is complete.)

ACCOUNT DELETION:
- Users can delete their account from the in-app Settings screen.
- Server-side data (Vercel KV) is removed immediately upon deletion.

NO SPECIAL HARDWARE REQUIRED.
```

---

## 9. Screenshots Checklist

Capture screenshots at the required resolutions for each device class. All screenshots should show the game in action (not a static title screen).

### Required Device Classes

| Device Class | Required Resolution | Status |
|-------------|--------------------|----|
| iPhone 6.9" (iPhone 15 Pro Max) | 1320 × 2868 px | ☐ |
| iPhone 6.7" (iPhone 14 Plus / 15 Plus) | 1284 × 2778 px | ☐ |
| iPhone 5.5" (iPhone 8 Plus) | 1242 × 2208 px | ☐ |
| iPad Pro 13" (6th gen) | 2064 × 2752 px | ☐ |
| iPad Pro 12.9" (2nd gen) | 2048 × 2732 px | ☐ |

> Apple requires at least iPhone 6.7" or 6.9" screenshots. iPad screenshots are required if the app supports iPad. Provide 3–10 screenshots per device class.

### Recommended Screenshot Scenes

| # | Scene | Notes |
|---|-------|-------|
| 1 | Gameplay — wave in progress, enemies on screen | Landscape or portrait; show twin-stick controls |
| 2 | Ship Hangar — ship selection screen | Shows customisation depth |
| 3 | Armory — weapon loadout | Highlights weapons variety |
| 4 | Global Leaderboard | Highlights social competition |
| 5 | Tutorial step (first-launch onboarding) | Shows onboarding quality |
| 6 | Game Over / Score summary screen | Shows scoring and replay loop |

### Screenshot Tips
- Enable the FPS counter in-game for a polished HUD appearance.
- Use a real device or a simulator at the exact resolution above (do not scale).
- Use Xcode Simulator › File › Take Screenshot for pixel-perfect captures.
- Remove the iOS status bar if possible (simulator › Hardware › Show Device Bezels can help frame).

---

## 10. Localisation

The app is currently **English only**. No additional localisations are planned for the initial release. If you add localisations in future, replicate the metadata (description, keywords) for each locale in App Store Connect.

---

## 11. Version Release Notes (What's New)

> For the initial 1.0 release, App Store Connect accepts a "first release" note:

```
Welcome to VOID RIFT 1.0!

• Twin-stick space shooter with infinite wave survival
• 4 playable ship hulls and a full weapon armory
• Global leaderboard and optional social features
• iOS Game Center integration
• Interactive first-launch tutorial
• Portrait and landscape support

Strap in. The void awaits.
```

---

*Last updated: February 28, 2026*
