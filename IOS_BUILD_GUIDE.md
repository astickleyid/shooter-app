# iOS Build and Deployment Guide

## Overview

This guide explains how to build the VOID RIFT iOS app using GitHub Actions and manually sync the latest web content with the Vercel deployment.

## Automated iOS Builds with GitHub Actions

The repository includes a GitHub Actions workflow that automatically builds the iOS app whenever:
- Code is pushed to `main` or `develop` branches
- A pull request is opened targeting `main` or `develop`
- Manually triggered via workflow dispatch

### Workflow Features

The iOS build workflow (`.github/workflows/ios-build.yml`) performs three main jobs:

#### 1. Sync Web Content
- Copies the latest game files from the root directory to `ios/VoidRift/WebContent/`
- Syncs: `index.html`, `script.js`, `style.css`, API files, social features, and assets
- Verifies the Vercel API URL is configured correctly
- Creates an artifact with the synced content

#### 2. Build iOS App (Debug)
- Runs on macOS 14 with Xcode 15.2
- Downloads the synced web content
- Builds the iOS app for iPhone Simulator
- No code signing required for simulator builds

#### 3. Build iOS Archive (Release)
- Only runs on `main` branch or manual trigger
- Creates a release archive that can be submitted to the App Store
- Supports code signing if certificates are configured
- Uploads the archive as a build artifact (retained for 30 days)

### Triggering the Workflow

#### Automatic Triggers
The workflow automatically runs when you push changes to files in:
- `ios/**` - Any iOS project files
- `index.html`, `script.js`, `style.css` - Main game files
- `backend-api.js` - API configuration
- `assets/**` - Game assets
- `.github/workflows/ios-build.yml` - The workflow itself

#### Manual Trigger
You can manually trigger the workflow from GitHub:
1. Go to **Actions** tab in the repository
2. Select **iOS Build** workflow
3. Click **Run workflow**
4. Select the branch to build
5. Click **Run workflow**

### Viewing Build Results

After the workflow runs:
1. Go to the **Actions** tab
2. Click on the workflow run
3. View the build logs for each job
4. Download build artifacts (if available)

### Build Artifacts

The workflow produces:
- **synced-web-content**: Latest game files synced to iOS bundle
- **VoidRift-Archive** (main branch only): iOS app archive ready for App Store submission

## Manual Web Content Sync

To manually sync the latest web content to the iOS app:

### Using the Sync Script

```bash
# From the repository root
./sync-ios-content.sh
```

This script will:
1. Copy all game files from root to `ios/VoidRift/WebContent/`
2. Copy API and supporting files
3. Sync the assets directory
4. Verify the Vercel URL is configured

### Manual Sync (if needed)

```bash
# Copy main game files
cp index.html ios/VoidRift/WebContent/
cp script.js ios/VoidRift/WebContent/
cp style.css ios/VoidRift/WebContent/

# Copy API files
cp backend-api.js ios/VoidRift/WebContent/
cp audio-manager.js ios/VoidRift/WebContent/
cp game-utils.js ios/VoidRift/WebContent/

# Copy social features
cp social-*.js ios/VoidRift/WebContent/

# Copy assets
rsync -av --delete assets/ ios/VoidRift/WebContent/assets/
```

## Vercel Integration

The iOS app uses the same backend API as the web version:
- **API URL**: `https://shooter-app-one.vercel.app/api/leaderboard`
- Configured in: `backend-api.js` (line 10)

### Verifying the API URL

Check that the iOS app has the correct Vercel URL:

```bash
grep "API_URL" ios/VoidRift/WebContent/backend-api.js
```

Should output:
```
API_URL: 'https://shooter-app-one.vercel.app/api/leaderboard',
```

## Building Locally with Xcode

### Prerequisites
- macOS with Xcode 15.2 or later
- Apple Developer account (for device testing and App Store submission)

### Steps

1. **Sync Web Content** (if not already done):
   ```bash
   ./sync-ios-content.sh
   ```

2. **Open Project**:
   ```bash
   cd ios
   open VoidRift.xcodeproj
   ```

3. **Configure Signing**:
   - Select "VoidRift" project in left sidebar
   - Select "VoidRift" target
   - Go to "Signing & Capabilities" tab
   - Select your development team
   - Xcode will handle provisioning

4. **Build and Run**:
   - Select a simulator or device from the scheme dropdown
   - Click Run (⌘R) or Product → Run
   - The app will launch with the tutorial

### Building for Distribution

To create an App Store archive:

```bash
cd ios
xcodebuild \
  -project VoidRift.xcodeproj \
  -scheme VoidRift \
  -configuration Release \
  -archivePath ~/VoidRift.xcarchive \
  archive
```

Or use Xcode:
1. Product → Archive
2. Wait for archive to complete
3. Organizer window opens
4. Click "Distribute App"
5. Follow App Store submission wizard

## Code Signing for CI/CD

To enable code signing in GitHub Actions, you need to add these secrets:

### Required Secrets
- `IOS_CERTIFICATE_BASE64`: Base64-encoded .p12 certificate
- `P12_PASSWORD`: Password for the .p12 certificate
- `KEYCHAIN_PASSWORD`: Password for temporary keychain
 - `EXPORT_OPTIONS_PLIST_BASE64` (optional): Base64-encoded ExportOptions.plist for IPA export

### Creating the Secrets

1. **Export your certificate**:
   - Open Keychain Access
   - Select "My Certificates"
   - Right-click your distribution certificate
   - Export as .p12 file

2. **Convert to base64**:
   ```bash
   base64 -i certificate.p12 | pbcopy
   ```

3. **Add to GitHub**:
   - Go to repository Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Add each secret

### ExportOptions.plist (Optional IPA Export)

If you want the workflow to export an `.ipa` artifact, create an ExportOptions.plist:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>method</key>
  <string>app-store</string>
  <key>signingStyle</key>
  <string>automatic</string>
  <key>teamID</key>
  <string>NCG387GT8Y</string>
  <key>uploadBitcode</key>
  <false/>
  <key>uploadSymbols</key>
  <true/>
</dict>
</plist>
```

Then encode and store as a secret:
```bash
base64 -i ExportOptions.plist | pbcopy
```

## Troubleshooting

### Workflow Fails on Build
- Check the build logs in the Actions tab
- Verify Xcode version matches (15.2)
- Ensure all files are included in the project

### Web Content Not Updated
- Run `./sync-ios-content.sh` manually
- Check that files were copied to `ios/VoidRift/WebContent/`
- Verify timestamps on the files

### API Not Working in iOS App
- Check the API URL in `ios/VoidRift/WebContent/backend-api.js`
- Test the API endpoint directly: `curl https://shooter-app-one.vercel.app/api/leaderboard`
- Check network logs in Safari Web Inspector

### Code Signing Errors
- Verify your Apple Developer account is active
- Check that provisioning profiles are valid
- Try cleaning and rebuilding (Shift+⌘+K, then ⌘B)

## Development Workflow

Recommended workflow for iOS development:

1. **Make changes** to web game files
2. **Test in browser** at https://shooter-app-one.vercel.app
3. **Sync to iOS**: Run `./sync-ios-content.sh`
4. **Test in Xcode**: Build and run on simulator/device
5. **Commit changes**: The workflow will automatically build iOS app
6. **Review build**: Check Actions tab for build status

## Additional Resources

- [iOS Project README](ios/README.md) - iOS-specific documentation
- [Xcode Documentation](https://developer.apple.com/documentation/xcode)
- [App Store Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [GitHub Actions for iOS](https://docs.github.com/en/actions/deployment/deploying-xcode-applications)

## Summary

The iOS build setup provides:
- ✅ Automated builds on every push via GitHub Actions
- ✅ Automatic sync of latest web content to iOS bundle
- ✅ Integration with Vercel backend API
- ✅ Manual sync script for local development
- ✅ Support for code signing and App Store submission
- ✅ Debug and release build configurations

The iOS app stays up-to-date with the web version automatically!
