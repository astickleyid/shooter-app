# App Store Connect submission blockers — status

## 1. 13-inch iPad screenshots — FIXED (uploaded via API)
- Size: **2064 × 2752** (current 13" primary)
- Files: `app-store-screenshots/ASC-UPLOAD/ipad-13/`
- Also uploaded to ASC version **2.0** screenshot set `APP_IPAD_PRO_3GEN_129`
- If UI still complains, re-open Media Manager → 13" iPad and confirm 5 images show

## 2. Achievement images for all localizations — FIXED (uploaded via API)
- All 12 en-US Game Center achievements have 1024×1024 icons
- Icons also on disk: `app-store-screenshots/achievement-icons/`
- In ASC: Features → Game Center → Achievements → each item should show an image

## 3. Price tier — FIXED (set Free via API)
- Base territory: **USA**
- Price: **$0.00 (Free)**
- Confirm: Monetization → Pricing and Availability → Price Schedule shows Free

## 4. Beta Xcode build — ACTION NEEDED on this Mac
Your uploaded binary was built with:
- Xcode **26.6** (17F113)
- iOS SDK **26.5** (`DTSDKBuild` **23F81a**)

Apple is treating this SDK build (`…a` suffix) as **beta** and rejects submission even if the Xcode app is labeled GM.

### Fix
1. Open **App Store** → search **Xcode** → **Update** if an update is available  
2. Or install the latest **public/GM** Xcode from [Apple Developer Downloads](https://developer.apple.com/download/applications/) (not beta/seed)  
3. After install:
   ```bash
   sudo xcode-select -s /Applications/Xcode.app
   xcodebuild -version
   xcrun --sdk iphoneos --show-sdk-build-version   # should NOT end with letter a if GM
   ```
4. Rebuild & re-upload Void Rift with a **new build number** (e.g. 137)

### Rebuild / upload commands
```bash
cd ~/development/projects/shooter-app
# bump CURRENT_PROJECT_VERSION in ios/VoidRift.xcodeproj/project.pbxproj to 137
./sync-ios-content.sh
cd ios
xcodebuild -project VoidRift.xcodeproj -scheme VoidRift \
  -configuration Release -destination 'generic/platform=iOS' \
  -archivePath ../build/VoidRift.xcarchive \
  DEVELOPMENT_TEAM=NCG387GT8Y CODE_SIGN_STYLE=Automatic \
  -allowProvisioningUpdates archive
xcodebuild -exportArchive \
  -archivePath ../build/VoidRift.xcarchive \
  -exportOptionsPlist ../build/ExportOptions.plist \
  -exportPath ../build/export \
  -allowProvisioningUpdates \
  -authenticationKeyPath "$HOME/.private_keys/AuthKey_GR26DBCD97.p8" \
  -authenticationKeyID GR26DBCD97 \
  -authenticationKeyIssuerID 3e5ac3d7-69e0-4fd9-80cc-b30cf6512dc2
xcrun altool --upload-app -f ../build/export/VoidRift.ipa -t ios \
  --apiKey GR26DBCD97 --apiIssuer 3e5ac3d7-69e0-4fd9-80cc-b30cf6512dc2
```

## Note on version
ASC currently has iOS version **2.0** in PREPARE_FOR_SUBMISSION (not 1.1.0).  
Attach the new build to **2.0**, or create a new version that matches your marketing version string.
