# App Store Readiness Audit & 48-Hour QA Plan (Void Rift)

This is a **ship-focused** checklist to close App Store risk quickly.

## 1) Current project status (based on repo audit)

### Already in place
- Native iOS project and scheme exist (`VoidRift.xcodeproj`, shared scheme).  
- App icon set includes all required icon sizes including 1024x1024 marketing icon.  
- Launch screen storyboard exists.  
- Privacy manifest exists (`PrivacyInfo.xcprivacy`) with tracking disabled and required-reason API declaration for `UserDefaults`.  
- Game Center integration exists in native Swift (`GameCenterManager.swift`).
- Backend calls use HTTPS endpoint (`https://shooter-app-one.vercel.app/...`).

### Gaps and risks to close before submission
- **Export compliance answer must be finalized** in App Store Connect (or set in plist to suppress repetitive prompts).
- **App Store metadata readiness is not tracked in-repo** (subtitle, keywords, support URL, privacy policy URL, age rating answers, review notes).
- **Account deletion compliance risk**: app includes account creation/login UX in web content; if account creation is available to users, in-app account deletion path must exist and be functional.
- **Privacy Nutrition Label verification still needed** against actual network payloads + account features.
- **Release archive validation still needed** on target device + TestFlight sanity pass.

---

## 2) Export compliance decision (from your screenshot)

### What to select in most cases for this app
If the app only relies on Apple-provided encryption (HTTPS/TLS via system frameworks, WebKit, Game Center, etc.) and does **not** ship custom/proprietary crypto implementation, select:
- **“None of the algorithms mentioned above”** in App Store Connect.

### Project hardening added
- `ITSAppUsesNonExemptEncryption = NO` is now added in `Info.plist` to reduce export-compliance friction for standard-exempt use cases.

> Final legal responsibility remains with your Apple Developer account holder. If you add non-Apple crypto SDKs later, reevaluate this answer.

---

## 3) 48-hour execution plan

## T-48h to T-36h: Compliance lock
1. Confirm export compliance answer in App Store Connect matches current build.
2. Confirm App Privacy answers match actual behavior:
   - Game content + user ID handling
   - no tracking / no ad SDK tracking domains
3. Verify account lifecycle requirements:
   - If account creation is exposed, ensure user can delete account in-app.
   - Ensure delete flow removes server-side profile/session data.
4. Fill missing metadata in App Store Connect:
   - privacy policy URL
   - support URL
   - age rating questionnaire
   - review notes + demo account (if needed)

## T-36h to T-24h: Build + functional QA
1. Clean Release archive in Xcode.
2. Validate on at least:
   - latest iPhone simulator (small + large screen)
   - one physical iPhone (performance + input latency + orientation)
3. Run through high-risk flows:
   - first launch/tutorial
   - login/create account
   - gameplay loop (multiple sessions)
   - leaderboard submit/fetch under flaky network
   - Game Center auth/leaderboards/achievements
4. Crash + console pass:
   - no uncaught JS errors
   - no Swift runtime errors

## T-24h to T-12h: Submission polish
1. Capture final screenshots and app preview assets.
2. Verify App Review notes are explicit about:
   - Game Center usage
   - any account requirement
   - how to reach social/leaderboard features
3. Upload build to TestFlight and run external smoke test.

## T-12h to T-0h: Submit
1. Reconfirm metadata/build parity (version, build number, release notes).
2. Submit for review.
3. Keep a hotfix branch ready for fast rejection turnaround.

---

## 4) Go / No-Go gate (must all be YES)
- [ ] Export compliance answer confirmed for this exact binary
- [ ] Privacy manifest + App Privacy form aligned with real data behavior
- [ ] Account deletion path compliant (if account creation exists)
- [ ] Release archive passes validation and runs on device
- [ ] No critical crashes/regressions in core gameplay loop
- [ ] Store metadata complete (URLs, rating, notes, screenshots)

