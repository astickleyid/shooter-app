# Game Center Setup Guide

This guide walks you through setting up Game Center for VOID RIFT in App Store Connect.

## Prerequisites

- Apple Developer Account (paid membership required)
- Xcode project with Game Center capability enabled
- Bundle ID: `com.voidrift.game`

## Step 1: Enable Game Center in Xcode

1. Open `VoidRift.xcodeproj` in Xcode
2. Select the `VoidRift` project in the navigator
3. Select the `VoidRift` target
4. Click on the "Signing & Capabilities" tab
5. Click the "+ Capability" button
6. Search for and add "Game Center"
7. Build the project to ensure no errors

## Step 2: Configure App in App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Sign in with your Apple Developer account
3. Click "My Apps"
4. Create a new app or select existing VOID RIFT app
   - If creating new:
     - Click "+" button → "New App"
     - Platform: iOS
     - Name: VOID RIFT
     - Primary Language: English
     - Bundle ID: com.voidrift.game
     - SKU: voidrift-ios-001 (or similar unique identifier)

## Step 3: Configure Leaderboards

1. In your app's page, click "Services" tab
2. Click "Game Center" section
3. Click the "+" button next to "Leaderboards"
4. Configure each leaderboard:

### Leaderboard 1: High Score
- **Type**: Classic
- **Leaderboard ID**: `com.voidrift.highscore`
- **Leaderboard Reference Name**: High Score
- **Score Format Type**: Integer
- **Score Submission Type**: Best Score
- **Sort Order**: High to Low
- **Score Range**: 0 to 99999999
- **Localization**:
  - Language: English (U.S.)
  - Name: High Score
  - Score Format Suffix: points
  - Image: Upload 1024x1024 leaderboard icon (space theme)

### Leaderboard 2: Survival Mode
- **Type**: Classic
- **Leaderboard ID**: `com.voidrift.survival`
- **Leaderboard Reference Name**: Survival Mode
- **Score Format Type**: Integer
- **Score Submission Type**: Best Score
- **Sort Order**: High to Low
- **Score Range**: 0 to 99999999
- **Localization**:
  - Language: English (U.S.)
  - Name: Survival Mode
  - Score Format Suffix: points
  - Image: Upload 1024x1024 leaderboard icon

### Leaderboard 3: Weekly Challenge
- **Type**: Recurring
- **Leaderboard ID**: `com.voidrift.weekly`
- **Leaderboard Reference Name**: Weekly Challenge
- **Duration**: 1 week
- **Start Date**: Choose next Monday
- **Score Format Type**: Integer
- **Score Submission Type**: Best Score
- **Sort Order**: High to Low
- **Score Range**: 0 to 99999999
- **Localization**:
  - Language: English (U.S.)
  - Name: Weekly Challenge
  - Score Format Suffix: points
  - Image: Upload 1024x1024 leaderboard icon

## Step 4: Configure Achievements

Click the "+" button next to "Achievements" and create each achievement:

### Achievement 1: First Blood
- **Achievement ID**: `com.voidrift.achievement.firstblood`
- **Reference Name**: First Blood
- **Points**: 5
- **Hidden**: No
- **Achievable More Than Once**: No
- **Localization**:
  - Language: English (U.S.)
  - Title: First Blood
  - Pre-earned Description: Get your first kill
  - Earned Description: You got your first kill!
  - Image: Upload 1024x1024 achievement icon (🎯 themed)

### Achievement 2: Centurion
- **Achievement ID**: `com.voidrift.achievement.centurion`
- **Reference Name**: Centurion
- **Points**: 10
- **Hidden**: No
- **Achievable More Than Once**: No
- **Localization**:
  - Title: Centurion
  - Pre-earned Description: Destroy 100 enemies
  - Earned Description: You destroyed 100 enemies!
  - Image: ⚔️ themed

### Achievement 3: Slayer
- **Achievement ID**: `com.voidrift.achievement.slayer`
- **Reference Name**: Slayer
- **Points**: 25
- **Hidden**: No
- **Achievable More Than Once**: No
- **Localization**:
  - Title: Slayer
  - Pre-earned Description: Destroy 1000 enemies
  - Earned Description: You destroyed 1000 enemies!
  - Image: 💀 themed

### Achievement 4: Boss Hunter
- **Achievement ID**: `com.voidrift.achievement.bosshunter`
- **Reference Name**: Boss Hunter
- **Points**: 15
- **Hidden**: No
- **Achievable More Than Once**: No
- **Localization**:
  - Title: Boss Hunter
  - Pre-earned Description: Defeat a boss enemy
  - Earned Description: You defeated a boss!
  - Image: 👹 themed

### Achievement 5: Survivor
- **Achievement ID**: `com.voidrift.achievement.survivor`
- **Reference Name**: Survivor
- **Points**: 10
- **Hidden**: No
- **Achievable More Than Once**: No
- **Localization**:
  - Title: Survivor
  - Pre-earned Description: Reach level 10
  - Earned Description: You reached level 10!
  - Image: 🛡️ themed

### Achievement 6: Veteran
- **Achievement ID**: `com.voidrift.achievement.veteran`
- **Reference Name**: Veteran
- **Points**: 20
- **Hidden**: No
- **Achievable More Than Once**: No
- **Localization**:
  - Title: Veteran
  - Pre-earned Description: Reach level 25
  - Earned Description: You reached level 25!
  - Image: ⭐ themed

### Achievement 7: Champion
- **Achievement ID**: `com.voidrift.achievement.champion`
- **Reference Name**: Champion
- **Points**: 50
- **Hidden**: No
- **Achievable More Than Once**: No
- **Localization**:
  - Title: Champion
  - Pre-earned Description: Reach level 50
  - Earned Description: You reached level 50!
  - Image: 🏆 themed

### Achievement 8: Flawless Victory
- **Achievement ID**: `com.voidrift.achievement.flawless`
- **Reference Name**: Flawless Victory
- **Points**: 30
- **Hidden**: No
- **Achievable More Than Once**: Yes
- **Localization**:
  - Title: Flawless Victory
  - Pre-earned Description: Complete a level without taking damage
  - Earned Description: You completed a level without taking damage!
  - Image: ✨ themed

### Achievement 9-11: Prestige Levels
- **Achievement ID**: `com.voidrift.achievement.prestige1`
- **Reference Name**: Prestige I
- **Points**: 100
- **Hidden**: No
- **Achievable More Than Once**: No
- **Localization**:
  - Title: Prestige I
  - Pre-earned Description: Reach Prestige level 1
  - Earned Description: You reached Prestige level 1!
  - Image: 🌟 themed

Repeat for Prestige 5 and Prestige 10 with increasing point values (200, 300).

## Step 5: Testing with Sandbox

1. In App Store Connect, go to "Users and Access"
2. Click "Sandbox Testers"
3. Click "+" to add a new sandbox tester
4. Fill in details:
   - First Name: Test
   - Last Name: Player1
   - Email: unique email (can use + notation: yourmail+gctest1@gmail.com)
   - Password: Strong password
   - Country/Region: Your country
   - Date of Birth: Over 18
5. Create 2-3 test accounts for multiplayer testing

## Step 6: Testing on Device

1. On your iOS device:
   - Settings → Game Center → Sign Out (if signed in)
   - Build and run your app from Xcode
   - When prompted, sign in with sandbox tester account
2. Test features:
   - Leaderboard submission
   - Achievement unlocking
   - Friend requests
   - Profile viewing

## Step 7: Troubleshooting

### "Game Center is not available"
- Check bundle ID matches in Xcode and App Store Connect
- Ensure Game Center capability is added
- Verify sandbox tester credentials

### Leaderboards not showing
- Wait up to 24 hours after creation
- Check leaderboard IDs match in code
- Ensure at least one score is submitted

### Achievements not unlocking
- Check achievement IDs match in code
- Verify percentage is 100.0 for completion
- Check sandbox tester account

### Can't sign in
- Use sandbox tester account, not real Apple ID
- Check password is correct
- Try creating a new sandbox tester

## Step 8: Production Release

1. Build archive in Xcode
2. Upload to App Store Connect
3. Submit for review
4. In review notes, mention:
   - Game Center integration
   - Provide sandbox tester credentials
   - Explain how to unlock achievements/leaderboards

## Resources

- [Game Center Documentation](https://developer.apple.com/game-center/)
- [App Store Connect Help](https://help.apple.com/app-store-connect/)
- [Game Center Programming Guide](https://developer.apple.com/library/archive/documentation/NetworkingInternet/Conceptual/GameKit_Guide/)

## Tips

1. **Icons**: Create 1024x1024 images for leaderboards and achievements
2. **Testing**: Test with multiple accounts to verify multiplayer features
3. **Localization**: Add more languages after English is working
4. **Analytics**: Monitor Game Center engagement in App Store Connect
5. **Updates**: You can modify leaderboards/achievements after release

## Next Steps

After Game Center is configured:
1. Test all features thoroughly
2. Create marketing materials highlighting Game Center
3. Submit app for review
4. Monitor analytics and user feedback
5. Consider adding more achievements/leaderboards based on usage

---

**Status**: Ready to configure in App Store Connect
**Time Required**: 1-2 hours for initial setup
**Maintenance**: Minimal after setup complete
