# PocketBase Configuration Guide for VOID RIFT v2.0

This guide will help you set up PocketBase to enable cloud features (authentication and leaderboard).

## What is PocketBase?

PocketBase is a self-hosted backend that you run locally or on your own server. Unlike Firebase, it doesn't require a cloud account or complex setup—just download one file and run it!

## Prerequisites

- No account needed!
- Basic command line knowledge
- Your operating system: Windows, macOS, or Linux

## Step 1: Download PocketBase

1. Go to [PocketBase Releases](https://github.com/pocketbase/pocketbase/releases/latest)
2. Download the appropriate version for your system:
   - **Windows**: `pocketbase_VERSION_windows_amd64.zip`
   - **macOS (Intel)**: `pocketbase_VERSION_darwin_amd64.zip`
   - **macOS (M1/M2)**: `pocketbase_VERSION_darwin_arm64.zip`
   - **Linux**: `pocketbase_VERSION_linux_amd64.zip`
3. Extract the zip file to a folder (e.g., `pocketbase/`)

## Step 2: Start PocketBase Server

Open a terminal/command prompt in the folder where you extracted PocketBase and run:

### On macOS/Linux:
```bash
chmod +x pocketbase
./pocketbase serve
```

### On Windows:
```cmd
pocketbase.exe serve
```

You should see output like:
```
> Server started at http://127.0.0.1:8090
```

**Keep this terminal window open!** PocketBase needs to stay running while you play.

## Step 3: Access Admin UI

1. Open your web browser
2. Go to: **http://127.0.0.1:8090/_/**
3. Create your admin account (this is just for managing the database, not for playing)
   - Enter an email and password
   - Click "Create and login"

## Step 4: Create Collections

### A. Create "users" Collection

1. In the admin UI, click "**Collections**" in the sidebar
2. Click "**+ New collection**"
3. Select "**Base collection**"
4. Configure the collection:
   - **Name**: `users`
   - **Type**: Base collection
5. Click "**New field**" and add these fields:

   | Field Name    | Type    | Required | Options                                    |
   |---------------|---------|----------|--------------------------------------------|
   | email         | Email   | Yes      | Check "Auth" options if prompted           |
   | password      | Text    | Yes      | (For auth - will be auto-handled)          |
   | passwordConfirm | Text  | Yes      | (For auth - will be auto-handled)          |
   | name          | Text    | No       |                                            |
   | displayName   | Text    | No       |                                            |
   | credits       | Number  | No       | Min: 0                                     |
   | bestScore     | Number  | No       | Min: 0                                     |
   | highestLevel  | Number  | No       | Min: 1                                     |
   | pilotLevel    | Number  | No       | Min: 1                                     |
   | pilotXp       | Number  | No       | Min: 0                                     |
   | upgrades      | JSON    | No       |                                            |

6. Click "**Create**"

### B. Enable Authentication on "users" Collection

1. In the "users" collection, click the "**Auth**" tab (or look for auth settings)
2. Enable "**Email/Password authentication**"
3. Set the following options:
   - **Allow registration**: Enable
   - **Min password length**: 8
   - **Require email verification**: Disable (optional)
4. Save the settings

### C. Create "leaderboard" Collection

1. Click "**+ New collection**"
2. Select "**Base collection**"
3. Configure the collection:
   - **Name**: `leaderboard`
   - **Type**: Base collection
4. Click "**New field**" and add these fields:

   | Field Name   | Type   | Required | Options                          |
   |--------------|--------|----------|----------------------------------|
   | userId       | Text   | Yes      | Must match user's ID             |
   | displayName  | Text   | No       |                                  |
   | email        | Email  | No       |                                  |
   | score        | Number | Yes      | Min: 0                           |
   | level        | Number | Yes      | Min: 1                           |

5. Click "**Create**"

## Step 5: Set Collection Rules

### Rules for "users" Collection

1. Select the "users" collection
2. Go to the "**API Rules**" tab
3. Set these rules:

   - **List/Search**: `@request.auth.id != ""`
     - Authenticated users can view the list
   
   - **View**: `@request.auth.id = id`
     - Users can only view their own record
   
   - **Create**: Allow (handled by auth)
   
   - **Update**: `@request.auth.id = id`
     - Users can only update their own record
   
   - **Delete**: `@request.auth.id = id`
     - Users can only delete their own record

### Rules for "leaderboard" Collection

1. Select the "leaderboard" collection
2. Go to the "**API Rules**" tab
3. Set these rules:

   - **List/Search**: Allow all
     - Anyone can view the leaderboard (even guests)
   
   - **View**: Allow all
     - Anyone can view individual entries
   
   - **Create**: `@request.auth.id != ""`
     - Only authenticated users can create entries
   
   - **Update**: `@request.auth.id = userId`
     - Users can only update their own leaderboard entry
   
   - **Delete**: `@request.auth.id = userId`
     - Users can only delete their own entry

## Step 6: Configure the Game

1. Open `script.js` in a text editor
2. Find the `POCKETBASE_CONFIG` constant near the top (around line 2)
3. The default configuration should work for local development:

```javascript
const POCKETBASE_CONFIG = {
  url: "http://127.0.0.1:8090"
};
```

4. If you deploy PocketBase to a server later, change the URL:

```javascript
const POCKETBASE_CONFIG = {
  url: "https://your-domain.com"  // Your deployed PocketBase URL
};
```

## Step 7: Test Your Setup

1. Make sure PocketBase is running (`./pocketbase serve`)
2. Open your game in a web browser
3. You should see "**ALL SYSTEMS ONLINE**" in green
4. Click "**Sign In / Create Account**"
5. Create a test account with any email and password (minimum 8 characters)
6. Play a game and check if your score appears on the leaderboard

## Troubleshooting

### "OFFLINE MODE" still showing

- Check that PocketBase is running in the terminal
- Verify the URL in `POCKETBASE_CONFIG` matches where PocketBase is running
- Open browser console (F12) and look for error messages
- Check that collections are created correctly

### Authentication errors

- Make sure Email/Password auth is enabled in the "users" collection
- Password must be at least 8 characters
- Check browser console for detailed error messages

### Leaderboard not updating

- Verify API rules are set correctly for both collections
- Check that the user is signed in (console logs)
- Look for errors in browser console

### CORS errors

- PocketBase should handle CORS automatically for local development
- If deploying, you may need to configure CORS settings in PocketBase

### Port already in use

If port 8090 is already taken, you can use a different port:

```bash
./pocketbase serve --http=127.0.0.1:8091
```

Then update `POCKETBASE_CONFIG.url` in `script.js` to match.

## Production Deployment

When you want to deploy PocketBase to a server:

### Option 1: Simple VPS Deployment

1. Upload PocketBase to your server (e.g., DigitalOcean, Linode, AWS EC2)
2. Run it with: `./pocketbase serve --http=0.0.0.0:8090`
3. Set up a reverse proxy (nginx/Apache) with SSL
4. Update `POCKETBASE_CONFIG.url` in your game to point to your server

### Option 2: PocketHost (Managed Hosting)

1. Go to [PocketHost.io](https://pockethost.io)
2. Create a free account
3. Upload your schema
4. Get your hosted URL and update the config

### Option 3: Docker Deployment

```dockerfile
FROM alpine:latest

RUN apk add --no-cache ca-certificates wget unzip

WORKDIR /app
RUN wget https://github.com/pocketbase/pocketbase/releases/download/VERSION/pocketbase_VERSION_linux_amd64.zip \
    && unzip pocketbase_VERSION_linux_amd64.zip \
    && rm pocketbase_VERSION_linux_amd64.zip

EXPOSE 8090

CMD ["./pocketbase", "serve", "--http=0.0.0.0:8090"]
```

## Data Backup

Your PocketBase data is stored in the `pb_data` folder next to the PocketBase executable. To backup:

```bash
# Stop PocketBase
# Copy the entire pb_data folder
cp -r pb_data pb_data_backup_$(date +%Y%m%d)
```

To restore, just replace the `pb_data` folder with your backup.

## Cost Considerations

**PocketBase is completely FREE!**

- No monthly fees
- No usage limits
- No account required
- Runs on your own hardware/server

Server costs only apply if you choose to deploy it to a VPS (typically $5-10/month for a basic server).

## Advantages Over Firebase

✅ **Self-hosted** - You own your data  
✅ **No accounts needed** - Download and run  
✅ **Free forever** - No usage limits or surprise bills  
✅ **Simple setup** - One executable file  
✅ **Admin UI included** - Easy to manage  
✅ **Realtime out of the box** - Built-in subscriptions  
✅ **File storage included** - If you need it later  

## Support

For PocketBase-specific issues, check:
- [PocketBase Documentation](https://pocketbase.io/docs/)
- [PocketBase GitHub](https://github.com/pocketbase/pocketbase)
- [PocketBase Discord](https://discord.gg/pocketbase)

## Next Steps

Once PocketBase is running:

1. You can close the admin UI—it's only needed for setup
2. Keep the terminal running with `./pocketbase serve`
3. Play the game and enjoy cloud saves and leaderboards!
4. Your game data is stored locally in the `pb_data` folder

**Pro tip**: Add `./pocketbase serve` to your startup scripts to have it run automatically when your computer starts!
