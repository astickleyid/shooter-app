# VOID RIFT — Launch Plan

**Game:** Twin-stick browser-based space shooter  
**Web:** https://shooter-app-one.vercel.app  
**iOS:** WKWebView native app (Xcode project at `ios/VoidRift.xcodeproj`)  
**Android:** Capacitor (`capacitor.config.ts` — `appId: com.voidrift.game`)  
**Status as of 2026-05-15:** iOS ready to build; Android Capacitor setup in progress; AdMob unit IDs are placeholder values  

---

## 1. Monetization Strategy

### Primary: Rewarded Ads (AdMob)

Rewarded ads are the right primary monetization for VOID RIFT because the action is **player-initiated** — the player opts in to watch in exchange for something tangible. This eliminates the hostility of forced interstitials and banner blindness, while keeping the game completely free to start.

#### Ad Placements

| Trigger | Prompt Copy | Reward | Notes |
|---------|-------------|--------|-------|
| **Death screen** | "Watch a short video to continue from Wave X" | 1 continue (full health, same wave) | Highest conversion placement — player is already emotionally invested |
| **Shop / between waves** | "Watch a video for 100 bonus credits" | +100 in-game currency | Lower pressure, good for players who didn't die |
| **Wave skip** | "Watch a video to skip to the next wave" | Advance to next wave | Optional; best for replay players who grind early waves |

**Key rules:**
- Max 2 rewarded ads per session (prevents ad fatigue, protects eCPM)
- If "Remove Ads" IAP is purchased, continue-after-death still shows the ad offer but fulfills it instantly (no ad shown, reward still granted)
- Pre-load the next ad immediately after each ad closes — `admob-manager.js` already does this via `_postAdCleanup()`

#### eCPM Benchmarks (2025–2026)

| Platform | Low | Mid | High |
|----------|-----|-----|------|
| iOS (US/CA/AU/UK) | $8 | $14 | $25 |
| iOS (Tier 2 markets) | $4 | $7 | $12 |
| Android (US/CA/AU/UK) | $5 | $10 | $15 |
| Android (Tier 2 markets) | $2 | $5 | $8 |

Use **$12 iOS / $8 Android** as planning figures. Both are conservative mids.

#### Revenue Projections

Assumptions: 3 sessions/user/day, 1.5 rewarded ads watched per session, 30-day month.

| DAU | Ads/day | eCPM | Gross/month | AdMob's cut (32%) | **Net/month** |
|-----|---------|------|-------------|---------------------|---------------|
| 500 | 2,250 | $12 | $810 | $259 | **~$551** |
| 2,000 | 9,000 | $12 | $3,240 | $1,037 | **~$2,203** |
| 10,000 | 45,000 | $12 | $16,200 | $5,184 | **~$11,016** |
| 50,000 | 225,000 | $12 | $81,000 | $25,920 | **~$55,080** |

> Note: AdMob retains ~32% as its revenue share. There is no additional App Store cut on ad revenue — Apple and Google only take their 30% on IAP transactions, not on AdMob payouts.

#### Why Rewarded Beats Banners and Interstitials for This Genre

- **Banners** earn $0.50–2 eCPM and obscure gameplay — unacceptable for a twin-stick shooter where screen space is the entire game
- **Interstitials** force-interrupt flow, spike uninstall rates by 10–15% in action games (IAB data), and Apple App Review has rejected games with interstitials mid-session
- **Rewarded** converts at 60–80% of players who see the prompt and earns 10–20x the eCPM of banners

---

### Secondary: Remove Ads IAP ($2.99)

**What it does:** Removes ad prompts. Continue-after-death still works — it just triggers instantly without showing an ad.

**What it does NOT do:** It is not a "pro upgrade" — all gameplay content stays free. This keeps the funnel clean.

#### Implementation

- **iOS:** StoreKit 2 (Swift). Product ID: `com.voidrift.game.removeads`
- **Android:** Google Play Billing Library 6+. Product ID: `com.voidrift.game.removeads`
- Store the purchase state in `UserDefaults` (iOS) / `SharedPreferences` (Android) AND validate server-side receipt if you add a backend
- On launch, call `SKPaymentQueue.canMakePayments()` (iOS) before showing the IAP UI

#### Revenue Expectations

- Conversion rate: **3–8% of players who see an ad** within their first 3 sessions
- At 2,000 DAU with 3% conversion and $2.09 net per sale (after 30% store cut):
  - ~60 new buyers/day = **~$125/day → ~$3,750/month**
- This stacks on top of ad revenue from the other 97% who don't buy

#### Word-of-Mouth Value

"Remove Ads" buyers are your most engaged players. They're the ones who post on Reddit, leave 5-star reviews, and tell friends. At $2.99 they feel they got a deal. Don't price it higher than $3.99.

---

### Future: Cosmetic IAP

Ship these in v1.1 once you have retention data. Do not delay launch for them.

**Ship skins** (visual reskins of the player ship):
- Tier 1: $0.99 each (4–6 variants at launch)
- Tier 2: $1.99 each (animated/glowing variants)

**Trail effects** (particle trail behind ship):
- $0.99 each — low effort, high perceived value

**HUD color themes** (cyan default → red, purple, gold, etc.):
- $0.49 each or bundle at $1.99 for all

**Season Pass — $4.99:**
- 1 exclusive ship not available for individual purchase
- 3 trail effects
- 2 HUD themes
- "Void Veteran" badge on leaderboard
- Best launched around a content update (new wave type, new boss)

**Pricing psychology:** The $0.99 cosmetics lower the "first purchase" psychological barrier. Once someone has paid once, they're 3–5x more likely to buy again.

---

## 2. AdMob Setup Checklist

### Step 1: Create AdMob Account
1. Go to https://admob.google.com
2. Sign in with a Google account (use your primary business Google account — this is where payouts land)
3. Complete the account setup wizard — you will need a payment profile (bank account or wire details)

### Step 2: Add Your iOS App to AdMob
1. In AdMob console: Apps → Add App → iOS → "My app is not published yet"
2. App name: **VOID RIFT**
3. Copy the **App ID** (format: `ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX`)
4. Open `ios/VoidRift/Supporting/Info.plist` — add these keys:

```xml
<!-- AdMob App ID -->
<key>GADApplicationIdentifier</key>
<string>ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX</string>

<!-- Required: User tracking usage description for ATT prompt -->
<key>NSUserTrackingUsageDescription</key>
<string>This allows us to show you relevant ads and supports free gameplay.</string>

<!-- SKAdNetwork entries (AdMob requires these) -->
<key>SKAdNetworkItems</key>
<array>
    <dict>
        <key>SKAdNetworkIdentifier</key>
        <string>cstr6suwn9.skadnetwork</string>
    </dict>
    <dict>
        <key>SKAdNetworkIdentifier</key>
        <string>4fzdc2evr5.skadnetwork</string>
    </dict>
    <dict>
        <key>SKAdNetworkIdentifier</key>
        <string>2fnua5tdw4.skadnetwork</string>
    </dict>
    <dict>
        <key>SKAdNetworkIdentifier</key>
        <string>ydx93a7ass.skadnetwork</string>
    </dict>
    <dict>
        <key>SKAdNetworkIdentifier</key>
        <string>5a6flpkh64.skadnetwork</string>
    </dict>
    <dict>
        <key>SKAdNetworkIdentifier</key>
        <string>p78axxw29g.skadnetwork</string>
    </dict>
    <dict>
        <key>SKAdNetworkIdentifier</key>
        <string>v72qych5uu.skadnetwork</string>
    </dict>
    <dict>
        <key>SKAdNetworkIdentifier</key>
        <string>ludvb6z4gh.skadnetwork</string>
    </dict>
    <dict>
        <key>SKAdNetworkIdentifier</key>
        <string>6g9af3uyq4.skadnetwork</string>
    </dict>
    <dict>
        <key>SKAdNetworkIdentifier</key>
        <string>t38b2kh725.skadnetwork</string>
    </dict>
</array>
```

> The full list of required SKAdNetwork IDs for AdMob is at: https://developers.google.com/admob/ios/3p-skadnetworks — update this list whenever AdMob publishes new entries.

### Step 3: Add Your Android App to AdMob
1. In AdMob console: Apps → Add App → Android → "My app is not published yet"
2. App name: **VOID RIFT**
3. Copy the **Android App ID**
4. Open `capacitor.config.ts` — replace the test IDs:

```typescript
plugins: {
  AdMob: {
    appIdIos: 'ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX',     // from Step 2
    appIdAndroid: 'ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX', // from Step 3
  },
},
```

### Step 4: Create Rewarded Ad Units
1. In AdMob: Apps → VOID RIFT (iOS) → Ad units → Add ad unit → Rewarded
2. Ad unit name: **VoidRift_iOS_Rewarded_ContinueAfterDeath**
3. Copy the Ad Unit ID (format: `ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX`)
4. Repeat for Android

Now update `admob-manager.js` (already exists at project root):

```javascript
AD_UNITS: {
  ios:     { rewarded: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX' },  // real iOS unit ID
  android: { rewarded: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX' },  // real Android unit ID
},
```

### Step 5: Native iOS AdMob Integration
The current iOS app uses WKWebView + `GameBridge.swift`. You need to add native AdMob handling. `admob-manager.js` already sends messages via `webkit.messageHandlers.adShowRewarded` and `webkit.messageHandlers.adPreloadRewarded`.

In `GameBridge.swift`, add handlers for these two message names (parallel to the existing `nativeHaptic`, `nativeSave` pattern). Create `AdMobManager.swift` with `GADRewardedAd` logic. The web JS side is already wired — you just need the native Swift receiver.

Add the Google Mobile Ads SDK via Swift Package Manager:
- Package URL: `https://github.com/googleads/swift-package-manager-google-mobile-ads`
- Version: 11.x or latest

### Step 6: Payment Setup
1. AdMob → Payments → Add payment profile
2. Enter tax information (W-9 for US)
3. Payment threshold: $100 (default) — you'll receive a bank transfer once earnings cross $100
4. AdMob does NOT connect to AdSense for app revenue — AdMob pays out directly

### Step 7: App Tracking Transparency (iOS 14.5+)
Show the ATT prompt **before** initializing AdMob on iOS. Without user consent, AdMob will show non-personalized ads (eCPM drops 40–60%). With consent, you get full personalized ad rates.

In `AppDelegate.swift`, after app launch:
```swift
import AppTrackingTransparency
import AdSupport

func requestTracking() {
    ATTrackingManager.requestTrackingAuthorization { status in
        // Initialize AdMob after this callback regardless of status
        GADMobileAds.sharedInstance().start()
    }
}
```

---

## 3. App Store Submission — iOS

### Prerequisites

| Item | Where to get it | Cost |
|------|----------------|------|
| Apple Developer Program | developer.apple.com/enroll | $99/year |
| App Store Connect account | Created automatically with Developer Program | Included |
| Bundle ID registered | App Store Connect → Identifiers → + | Free |
| App record created | App Store Connect → My Apps → + | Free |
| Screenshots (6.7", 6.5", 5.5") | Xcode Simulator or real devices | Free |
| App Store Connect API Key | App Store Connect → Users → Integrations → Keys | Free |

**Bundle ID:** `com.voidrift.game` (already set in `capacitor.config.ts` — match this exactly in App Store Connect)

**Screenshot sizes required:**
- 6.7" — iPhone 15 Pro Max / 16 Plus (1290×2796)
- 6.5" — iPhone 14 Plus / 15 Plus (1242×2688)
- 5.5" — iPhone 8 Plus (1242×2208)

Minimum: just the 6.7" — Apple will scale for other sizes. Recommended: all three.

### Submission Checklist

**Info.plist items (beyond AdMob — already has the basics):**
- [ ] `GADApplicationIdentifier` — AdMob App ID
- [ ] `NSUserTrackingUsageDescription` — ATT prompt text
- [ ] `SKAdNetworkItems` — full AdMob SKAdNetwork list
- [ ] `ITSAppUsesNonExemptEncryption` — already set to `false` (correct for a game with no custom crypto)

**App Store Connect metadata:**
- [ ] App name: **Void Rift**
- [ ] Subtitle: **Twin-Stick Space Shooter** (30 chars max)
- [ ] Category: Games → Action
- [ ] Age rating: **9+** (Fantasy or Cartoon Violence, no gore)
- [ ] Privacy Nutrition Labels: "Data Not Collected" (no account required, no analytics SDK beyond AdMob)
- [ ] App Privacy URL: create a simple one-page privacy policy (required if using AdMob)
- [ ] Keywords (100 chars): `space shooter,twin stick,arcade,roguelite,bullet hell,void,asteroids,spaceship,survival,action`
- [ ] Description: Lead with the game loop, mention free to play, mention remove ads option

**App Review Information:**
- Login required? No — game is playable without account
- Demo notes: "No login required. Tap Play to start. AdMob rewarded ads will appear on death screen — test Ad Unit IDs are active in this build."

### Automated Build Pipeline

No CI/CD exists in the repo yet (.github/workflows/ is empty). Set this up before your first TestFlight submission.

**Create `.github/workflows/ios.yml`:**

```yaml
name: iOS Build & TestFlight

on:
  push:
    branches: [main]
  workflow_dispatch:
    inputs:
      submit_to_testflight:
        type: boolean
        default: false

jobs:
  build:
    runs-on: macos-14

    steps:
      - uses: actions/checkout@v4

      - name: Install certificates
        env:
          CERTIFICATE_BASE64: ${{ secrets.IOS_CERTIFICATE_BASE64 }}
          CERTIFICATE_PASSWORD: ${{ secrets.IOS_CERTIFICATE_PASSWORD }}
          PROVISIONING_PROFILE_BASE64: ${{ secrets.IOS_PROVISIONING_PROFILE_BASE64 }}
        run: |
          # Decode cert, install to keychain, install provisioning profile

      - name: Build archive
        run: |
          xcodebuild archive \
            -project ios/VoidRift.xcodeproj \
            -scheme VoidRift \
            -archivePath build/VoidRift.xcarchive \
            -configuration Release \
            CODE_SIGN_STYLE=Manual \
            DEVELOPMENT_TEAM=${{ secrets.APPLE_TEAM_ID }}

      - name: Export IPA
        run: |
          xcodebuild -exportArchive \
            -archivePath build/VoidRift.xcarchive \
            -exportPath build/ipa \
            -exportOptionsPlist ios/ExportOptions.plist

      - name: Upload to TestFlight
        if: ${{ github.event.inputs.submit_to_testflight == 'true' || github.ref == 'refs/heads/main' }}
        env:
          APP_STORE_CONNECT_KEY_ID: ${{ secrets.APP_STORE_CONNECT_KEY_ID }}
          APP_STORE_CONNECT_ISSUER_ID: ${{ secrets.APP_STORE_CONNECT_ISSUER_ID }}
          APP_STORE_CONNECT_KEY_CONTENT: ${{ secrets.APP_STORE_CONNECT_KEY_CONTENT }}
        run: |
          xcrun altool --upload-app \
            --type ios \
            --file build/ipa/VoidRift.ipa \
            --apiKey $APP_STORE_CONNECT_KEY_ID \
            --apiIssuer $APP_STORE_CONNECT_ISSUER_ID
```

**Fastlane alternative (one command):**
```bash
# Gemfile: gem 'fastlane'
fastlane ios release
# Fastfile: lane :release { build_ios_app(...); upload_to_testflight(...) }
```

### iOS Launch Timeline

| Week | Action |
|------|--------|
| 1 | AdMob account + iOS App ID + test builds with test ad unit IDs |
| 2 | TestFlight internal (you + 5 friends). Smoke-test ads, IAP sandbox, Game Center |
| 3 | TestFlight external (up to 10,000 testers). Collect crash reports from Xcode Organizer |
| 4 | Replace test ad unit IDs with production IDs → submit for App Store Review |
| 5 | Review complete (typically 2–5 business days) → Release |

---

## 4. Google Play Submission — Android

### Prerequisites

| Item | Where to get it | Cost |
|------|----------------|------|
| Google Play Console account | play.google.com/console | $25 one-time |
| Signing keystore | Generate locally with `keytool` | Free |
| Google Play Service Account JSON | Play Console → Setup → API access | Free |
| Screenshots (Phone 16:9 and Tablet 16:9) | Android emulator | Free |
| Feature graphic | Create in Figma/Canva (1024×500px) | Free |

**Generate signing keystore (run once, keep the output forever):**
```bash
keytool -genkey -v \
  -keystore voidrift-release.keystore \
  -alias voidrift \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000

# CRITICAL: Back up voidrift-release.keystore and your passwords.
# If you lose this keystore, you can never update the app on Play Store.
# Upload a copy to a password manager or encrypted cloud storage.
```

### Android Capacitor Setup

Capacitor config is already in place at `capacitor.config.ts`. Remaining steps:

```bash
# Add Android platform
npx cap add android

# Copy web assets to Android
npx cap copy android

# Open in Android Studio for first build
npx cap open android
```

In Android Studio:
1. `android/app/build.gradle` → set `targetSdkVersion 34` (required by Google Play as of 2024)
2. `android/app/build.gradle` → add signing config pointing to your keystore
3. Build → Generate Signed Bundle/APK → Android App Bundle (AAB required by Play Store)

### Submission Checklist

- [ ] Target API 34+ in `build.gradle`
- [ ] AAB format (not APK) — `npx cap build android` produces AAB
- [ ] `android/app/src/main/AndroidManifest.xml` → add AdMob App ID:
  ```xml
  <meta-data
      android:name="com.google.android.gms.ads.APPLICATION_ID"
      android:value="ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX"/>
  ```
- [ ] Data safety form in Play Console: declare no personal data collected (assuming no Firebase Auth required)
- [ ] Content rating questionnaire: Violence → Mild (cartoon)
- [ ] App signing by Google Play: enabled (Play Console manages the final signing key after you upload)

### Automated Build Pipeline

**Create `.github/workflows/android.yml`:**

```yaml
name: Android Build & Play Store

on:
  push:
    branches: [main]
  workflow_dispatch:
    inputs:
      deploy_to_play:
        type: boolean
        default: false

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'

      - name: Install dependencies
        run: npm ci

      - name: Capacitor sync
        run: npx cap copy android

      - name: Decode keystore
        run: |
          echo "${{ secrets.ANDROID_KEYSTORE_BASE64 }}" | base64 -d > android/app/voidrift.keystore

      - name: Build signed AAB
        working-directory: android
        run: |
          ./gradlew bundleRelease \
            -Pandroid.injected.signing.store.file=app/voidrift.keystore \
            -Pandroid.injected.signing.store.password=${{ secrets.ANDROID_STORE_PASSWORD }} \
            -Pandroid.injected.signing.key.alias=${{ secrets.ANDROID_KEY_ALIAS }} \
            -Pandroid.injected.signing.key.password=${{ secrets.ANDROID_KEY_PASSWORD }}

      - name: Upload to Play Store (Internal Testing)
        if: ${{ github.event.inputs.deploy_to_play == 'true' || github.ref == 'refs/heads/main' }}
        uses: r0adkll/upload-google-play@v1
        with:
          serviceAccountJsonPlainText: ${{ secrets.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON }}
          packageName: com.voidrift.game
          releaseFiles: android/app/build/outputs/bundle/release/*.aab
          track: internal
```

**Fastlane alternative:**
```bash
fastlane android deploy
# Deliverfile: package_name("com.voidrift.game"); track("internal")
```

**Promote through tracks in Play Console:**
Internal Testing → Closed Testing → Open Testing → Production

Each promotion can be done in Play Console with one click. For Production, Google reviews within 1–3 business days.

### Android Launch Timeline

| Week | Action |
|------|--------|
| 1 | `npx cap add android` + first test build + AdMob Android test IDs |
| 2 | Internal Testing track (you + team, up to 100 testers) |
| 3 | Closed Testing (invite 500–2,000 players from Reddit/Discord) |
| 4 | Replace test ad unit IDs with production IDs → promote to Production |
| 5 | Production review complete → Live on Play Store |

### Required GitHub Secrets (All Platforms)

Add these at repo Settings → Secrets → Actions:

| Secret name | Value |
|-------------|-------|
| `ANDROID_KEYSTORE_BASE64` | `base64 -i voidrift-release.keystore` output |
| `ANDROID_KEY_ALIAS` | `voidrift` (or whatever alias you used in keytool) |
| `ANDROID_KEY_PASSWORD` | Key password from keytool |
| `ANDROID_STORE_PASSWORD` | Store password from keytool |
| `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` | Full JSON from Play Console service account |
| `APP_STORE_CONNECT_KEY_ID` | Key ID from App Store Connect → Keys |
| `APP_STORE_CONNECT_ISSUER_ID` | Issuer ID from App Store Connect → Keys |
| `APP_STORE_CONNECT_KEY_CONTENT` | Contents of the `.p8` file (paste as-is, newlines included) |
| `APPLE_TEAM_ID` | 10-char team ID from developer.apple.com |
| `IOS_CERTIFICATE_BASE64` | `base64 -i Certificates.p12` output |
| `IOS_CERTIFICATE_PASSWORD` | Certificate export password |
| `IOS_PROVISIONING_PROFILE_BASE64` | `base64 -i VoidRift_AppStore.mobileprovision` output |

---

## 5. Firebase Setup Checklist

Firebase is optional if you rely on Apple Game Center + Play Games for leaderboards. Use it if you want cross-platform leaderboards, cloud saves, or authentication.

### Step 1: Create Firebase Project
1. Go to console.firebase.google.com
2. Add project → Name: **VoidRift** → Disable Google Analytics (GDPR simplicity) or enable if you want funnel data
3. Keep the project in the Spark (free) tier initially — Blaze plan only needed for Cloud Functions

### Step 2: Add Web App
1. Project settings → Add app → Web
2. App nickname: **VoidRift Web**
3. Copy the config object
4. Update `firebase-config.js` (or wherever the web config lives) with real values — replace any placeholder API keys

### Step 3: Enable Authentication
1. Firebase console → Authentication → Get Started
2. Sign-in providers → Email/Password → Enable
3. (Optional) Anonymous → Enable — lets players start playing without registering, then link an account later (good for conversion)

### Step 4: Enable Realtime Database
1. Firebase console → Realtime Database → Create database
2. Start in **test mode** (open rules) for dev, then lock down before production
3. Production rules to paste:

```json
{
  "rules": {
    "scores": {
      ".read": true,
      "$uid": {
        ".write": "auth !== null && auth.uid === $uid"
      }
    },
    "users": {
      "$uid": {
        ".read": "auth !== null && auth.uid === $uid",
        ".write": "auth !== null && auth.uid === $uid"
      }
    }
  }
}
```

This lets anyone read the leaderboard, but only authenticated users can write their own score.

### Step 5: Add iOS App to Firebase
1. Project settings → Add app → iOS
2. Bundle ID: `com.voidrift.game`
3. Download `GoogleService-Info.plist`
4. Add to Xcode project at: `ios/VoidRift/Supporting/GoogleService-Info.plist`
5. In Xcode, ensure "Add to target: VoidRift" is checked

### Step 6: Add Android App to Firebase
1. Project settings → Add app → Android
2. Package name: `com.voidrift.game`
3. Download `google-services.json`
4. Place at: `android/app/google-services.json`
5. In `android/app/build.gradle`, confirm the plugin is applied:
   ```groovy
   apply plugin: 'com.google.gms.google-services'
   ```

---

## 6. Revenue Projections

### Monthly Revenue by DAU Milestone

The table below models **ad revenue only** (rewarded). IAP revenue is additive.

| DAU | Avg sessions/user/day | Ads watched/session | Total ads/day | eCPM | Gross monthly | AdMob net (after 32%) |
|-----|-----------------------|---------------------|---------------|------|---------------|-----------------------|
| 500 | 3 | 1.5 | 2,250 | $12 | $810 | **$551** |
| 2,000 | 3 | 1.5 | 9,000 | $12 | $3,240 | **$2,203** |
| 10,000 | 3 | 1.5 | 45,000 | $12 | $16,200 | **$11,016** |
| 50,000 | 3 | 1.5 | 225,000 | $12 | $81,000 | **$55,080** |

### IAP Revenue (Remove Ads at $2.99) — Additive

| DAU | New players/month | 3% conversion | Sales/month | Gross | After 30% store cut | **Net/month** |
|-----|------------------|--------------|-------------|-------|---------------------|---------------|
| 500 | 1,500 | 45 | 45 | $134.55 | $94.19 | **~$94** |
| 2,000 | 6,000 | 180 | 180 | $538.20 | $376.74 | **~$377** |
| 10,000 | 30,000 | 900 | 900 | $2,691 | $1,883.70 | **~$1,884** |

### Combined Monthly Revenue Estimate

| DAU | Ad net | IAP net | **Total net/month** |
|-----|--------|---------|---------------------|
| 500 | $551 | $94 | **~$645** |
| 2,000 | $2,203 | $377 | **~$2,580** |
| 10,000 | $11,016 | $1,884 | **~$12,900** |

### Revenue Cut Summary

| Revenue source | Gross % you keep | Who takes what |
|----------------|-----------------|----------------|
| AdMob rewarded ads | **68%** | Google keeps 32% |
| IAP on iOS | **70%** | Apple keeps 30% (drops to 15% after year 1 for subs, not applicable here) |
| IAP on Android | **70%** | Google keeps 30% |
| Web (Stripe / direct) | ~97% | Payment processing fees only |

---

## 7. Marketing Launch Sequence

### Soft Launch (Weeks 1–2 before global release)

Launch in **Canada, Australia, and New Zealand** first. These markets are:
- English-speaking with real spending behavior
- Smaller enough that a ranking boost doesn't require massive scale
- Treated by Apple and Google as "representative" markets for algorithm signals

Watch your Day 1 / Day 3 / Day 7 retention in App Store Connect or Firebase before going wide. If D7 retention is below 10%, fix the game loop before global launch. If it's above 15%, ship immediately.

### ASO — App Store Optimization

**Title:** `Void Rift: Space Shooter`  
**Subtitle (iOS, 30 chars):** `Twin-Stick Arcade Survival`  
**Keywords field (iOS, 100 chars):** `space,shooter,twin stick,roguelite,arcade,bullet hell,asteroids,spaceship,survival,alien`

Rules:
- Do not repeat words from your title/subtitle in the keyword field (Apple ignores duplicates)
- "Free" and "game" are banned keywords on iOS
- Target 2–3 word combos: "twin stick shooter" has lower competition than "space game"

**Google Play:** The description is indexed — put your primary keywords in the first 80 characters of the short description and repeat naturally in the long description. Google Play does not have a separate keyword field.

**A/B test your icon:** App Store Connect and Google Play both support store listing experiments. Test a dark icon (current) vs. a neon-heavy icon. Even a 5% conversion lift on icon click-through compounds significantly.

### Content Marketing

**TikTok / YouTube Shorts (before launch):**
- Record 15–30s clips of satisfying moments: multi-kill combos, near-death continues, wave clears
- Use trending audio — the game's soundtrack likely isn't trending; overlay a popular sound
- Post 3–5 clips per platform the week before launch
- Caption: "This game is free on iOS/Android 👀 [link in bio]"

**Reddit (launch day):**
- Post to r/iosgaming with a GIF (not video — GIFs render inline on Reddit)
- Separate post to r/androidgaming same day (they're different communities)
- r/indiegaming: more forgiving of shameless self-promotion if you lead with "I built this"
- Do NOT post to all three on the same day with identical text — varies wording, emphasize different aspects
- Format: "I made a free twin-stick space shooter for iOS/Android — link in comments" + gameplay GIF

**ProductHunt:**
- Schedule your PH launch for a Tuesday or Wednesday (most traffic)
- Have 15+ upvotes lined up from friends in the first 2 hours — early velocity determines placement
- Write a genuine maker story: "I built this as a browser game, packaged it for mobile" is authentic and relatable
- Link: https://www.producthunt.com/posts/new

### Press Kit (have ready before launch)

Create a `/presskit` folder or a simple presskit.html and host it on the Vercel deployment.

Include:
- **App icon** (1024×1024 PNG, no rounded corners — sites will round them)
- **Screenshots** (5–6 at 1290×2796 showing different game moments)
- **GIF** (15–30 seconds of gameplay, under 5MB)
- **Short description** (100 words): what the game is, platform, price
- **Long description** (300 words): story, mechanics, what makes it different
- **Contact:** your email
- **Download links:** App Store + Play Store URLs (add these once live)

Mobile gaming press contacts worth reaching:
- TouchArcade (toucharcade.com/contact)
- Pocket Gamer (pocketgamer.com)
- 148Apps
- AppAdvice

Most won't respond to a cold pitch, but coverage from even one drives enough downloads to move your ranking. Keep the email under 100 words and attach only one GIF.

---

## 8. Quick Reference — Files to Update Before Submission

| File | What to update |
|------|----------------|
| `admob-manager.js` | Replace `REPLACE_ME` with real ad unit IDs |
| `capacitor.config.ts` | Replace test AdMob App IDs with production App IDs |
| `ios/VoidRift/Supporting/Info.plist` | Add `GADApplicationIdentifier`, `NSUserTrackingUsageDescription`, `SKAdNetworkItems` |
| `android/app/src/main/AndroidManifest.xml` | Add AdMob `APPLICATION_ID` meta-data |
| `ios/VoidRift/Supporting/GoogleService-Info.plist` | Add after Firebase iOS app setup (if using Firebase) |
| `android/app/google-services.json` | Add after Firebase Android app setup (if using Firebase) |
| `.github/workflows/ios.yml` | Create — see Section 3 |
| `.github/workflows/android.yml` | Create — see Section 4 |

---

*Last updated: 2026-05-15*
