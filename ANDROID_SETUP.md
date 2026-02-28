# Android Setup Guide — VOID RIFT

This guide walks you through building and publishing the VOID RIFT Android app to the Google Play Store.

The Android app is a WebView wrapper: it bundles the same HTML/CSS/JS game files used by the iOS app and loads them locally, giving full offline support and native app-store presence.

---

## Prerequisites

| Tool | Version | Download |
|------|---------|----------|
| Android Studio | Hedgehog 2023.1+ | https://developer.android.com/studio |
| JDK | 17 | bundled with Android Studio |
| Google Play Developer account | — | https://play.google.com/console |

---

## Project Structure

```
android/
├── app/
│   ├── build.gradle              # App-level Gradle config
│   ├── proguard-rules.pro
│   └── src/
│       └── main/
│           ├── AndroidManifest.xml
│           ├── assets/
│           │   └── WebContent/   # ← game files go here (synced at build time)
│           ├── java/com/voidrift/game/
│           │   └── MainActivity.kt
│           └── res/
├── build.gradle                  # Project-level Gradle config
├── settings.gradle
└── gradle.properties
```

---

## Local Development

### 1. Sync web game files

The `WebContent/` folder inside `assets/` must be populated before building:

```bash
# From the repo root:
./sync-android-content.sh
```

This copies `index.html`, `script.js`, `style.css`, and all supporting JS/CSS files into
`android/app/src/main/assets/WebContent/`.

### 2. Open in Android Studio

```
File → Open → select the android/ directory
```

Android Studio will import the Gradle project automatically and generate the Gradle Wrapper files on first sync.

> **First-time setup note**: If opening outside Android Studio, you need to bootstrap the Gradle Wrapper once (requires Gradle 8.6+ installed):
> ```bash
> cd android
> gradle wrapper --gradle-version 8.6 --distribution-type bin
> ```
> The CI workflow handles this automatically.

### 3. Build and run

- Select a device or emulator (API 26 / Android 8.0 minimum)
- Press **▶ Run** (or `Shift + F10`)

The game loads from local assets — no internet connection required for gameplay.

---

## Release Build & Signing

### Create a keystore (one-time)

```bash
keytool -genkey -v \
  -keystore voidrift-release-key.jks \
  -alias voidrift \
  -keyalg RSA -keysize 2048 \
  -validity 10000
```

Keep this file and its passwords safe — you cannot re-upload to Google Play with a different keystore once your app is published.

### Build a signed AAB locally

In Android Studio:
1. **Build → Generate Signed Bundle / APK**
2. Choose **Android App Bundle**
3. Select your keystore, alias, and passwords
4. Choose **release** build variant
5. Click **Finish** — the `.aab` is saved to `android/app/build/outputs/bundle/release/`

---

## Publish to Google Play

### First submission

1. Go to [Google Play Console](https://play.google.com/console)
2. Create a new application → enter app details
3. Fill in **Store listing** (description, screenshots, icon)
4. Complete **Content rating** questionnaire
5. Upload the `.aab` to the **Internal testing** track
6. Roll out to internal testers, then promote to production

### App metadata checklist

- [ ] App name: **VOID RIFT**
- [ ] Short description (80 chars max)
- [ ] Full description
- [ ] At least 2 screenshots per form factor (phone + tablet)
- [ ] Feature graphic (1024 × 500 px)
- [ ] App icon (512 × 512 px, PNG)
- [ ] Privacy policy URL
- [ ] Content rating answers completed
- [ ] Target audience: 16+ (twin-stick shooter with combat)

---

## CI/CD — Automated Builds

The workflow at `.github/workflows/android-build.yml` automatically:

1. Syncs the latest web game files into the Android assets
2. Builds a debug APK and a release AAB
3. Uploads both as workflow artifacts (30-day retention)
4. **Optionally uploads to Google Play Internal track** when the following secrets are set

### Required GitHub Secrets

Configure these in **Settings → Secrets and variables → Actions**:

| Secret | Description |
|--------|-------------|
| `ANDROID_KEYSTORE_BASE64` | Base64-encoded `.jks` keystore file (`base64 -i voidrift-release-key.jks`) |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore password |
| `ANDROID_KEY_ALIAS` | Key alias (e.g. `voidrift`) |
| `ANDROID_KEY_PASSWORD` | Key password |
| `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` | Google Play service account JSON (see below) |

### Create a Google Play service account

1. Open [Google Play Console](https://play.google.com/console) → **Setup → API access**
2. Link to a Google Cloud project (or create one)
3. Click **Create new service account** → follow the wizard
4. Grant the service account **Release manager** permissions in Play Console
5. Download the JSON key file
6. Paste the entire JSON content as the `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` secret

### Base64-encode the keystore

```bash
base64 -i voidrift-release-key.jks | pbcopy   # macOS (copies to clipboard)
base64 -w 0 voidrift-release-key.jks           # Linux
```

Paste the output as the `ANDROID_KEYSTORE_BASE64` secret.

---

## iOS App Store Reference

The iOS workflow (`.github/workflows/ios-build.yml`) already handles iOS archiving and TestFlight upload.

Required iOS secrets:

| Secret | Description |
|--------|-------------|
| `IOS_CERTIFICATE_BASE64` | Base64-encoded `.p12` distribution certificate |
| `P12_PASSWORD` | Certificate password |
| `KEYCHAIN_PASSWORD` | Temporary keychain password (any strong string) |
| `IOS_PROVISIONING_PROFILE_BASE64` | Base64-encoded App Store provisioning profile |
| `EXPORT_OPTIONS_PLIST_BASE64` | Base64-encoded `ExportOptions.plist` |
| `ASC_API_KEY_ID` | App Store Connect API key ID |
| `ASC_API_ISSUER_ID` | App Store Connect API issuer ID |
| `ASC_API_KEY_P8_BASE64` | Base64-encoded `.p8` private key |

When all iOS secrets are present, the workflow builds the archive, exports an IPA, and automatically uploads it to TestFlight.

---

## Troubleshooting

### `WebContent/` is empty after checkout

The assets directory is populated at build time. Run `./sync-android-content.sh` locally,
or trigger the CI workflow which does this automatically.

### Build fails with "SDK location not found"

Run `./gradlew` for the first time inside Android Studio, or set the `ANDROID_HOME`
environment variable:

```bash
export ANDROID_HOME=~/Library/Android/sdk  # macOS
export ANDROID_HOME=~/Android/Sdk          # Linux
```

### Google Play upload fails: "The APK or Android App Bundle does not comply"

Make sure the `versionCode` in `android/app/build.gradle` is incremented with each upload.
Google Play rejects uploads with a `versionCode` that already exists.
