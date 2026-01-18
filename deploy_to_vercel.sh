#!/bin/bash

# Deploy Script for Vercel
# Uses local environment for build (if vercel pulls it) or requires ENV vars set in Vercel dashboard.

echo "========================================"
echo "🚀 Starting Frontend Deployment to Vercel"
echo "========================================"

# 1. Check for local build success (optional but recommended)
echo "📦 Verifying local build..."
if [ ! -d ".next" ]; then
    echo "⚠️  .next directory not found. Running build..."
    npm run build
fi

if [ $? -ne 0 ]; then
    echo "❌ Local build failed. Please fix errors before deploying."
    exit 1
fi
echo "✅ Local build verified."

# 2. Deploy using Vercel CLI
# Using 'npx' avoids need for global installation
echo "☁️  Deploying to Vercel (Production)..."
echo "👉 Follow the prompts to log in (if needed) and link your project."

# Use --prod to deploy straight to production
npx vercel deploy --prod

echo "========================================"
echo "✅ Deployment Process Finished"
echo "========================================"
echo "NOTE: Ensure you have added your Environment Variables in the Vercel Dashboard!"
echo "Required Variables:"
echo " - NEXT_PUBLIC_WEIL_REGISTRY_ADDRESS"
echo " - NEXT_PUBLIC_FILEBASE_RPC_KEY"
echo " - FILEBASE_ACCESS_KEY"
echo " - FILEBASE_SECRET_KEY"
echo "========================================"
