#!/bin/bash

# VOID RIFT - Deployment Script
# This script helps deploy the global leaderboard backend

echo "🚀 VOID RIFT - Global Leaderboard Deployment"
echo "============================================"
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found!"
    echo ""
    echo "Install it with: npm install -g vercel"
    echo "Or deploy via web: https://vercel.com"
    exit 1
fi

echo "✓ Vercel CLI found"
echo ""

# Check if logged in
if ! vercel whoami &> /dev/null; then
    echo "🔑 Not logged in to Vercel. Logging in..."
    vercel login
fi

echo "✓ Logged in to Vercel"
echo ""

# Deploy
echo "📦 Deploying to Vercel..."
echo ""
vercel --prod

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deployment successful!"
    echo ""
    echo "📝 Next steps:"
    echo "1. Copy your deployment URL from above"
    echo "2. Update backend-api.js line 14 with your URL"
    echo "3. Example: API_URL: 'https://your-app.vercel.app/api/leaderboard'"
    echo "4. Commit and push: git add . && git commit -m 'Update API URL' && git push"
    echo ""
    echo "🎮 Your global leaderboard is now live!"
else
    echo ""
    echo "❌ Deployment failed. Please check the error messages above."
    exit 1
fi
