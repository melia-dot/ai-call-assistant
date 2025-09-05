#!/bin/bash

# Quick deployment script
echo "🚀 Deploying Emma routing fixes..."

# Add all files
git add .

# Commit with timestamp
git commit -m "CRITICAL: Fix Emma routing with proper dial failure handling - $(date)"

# Push to trigger deployment
git push origin main

echo "✅ Deployment triggered via Git push"
echo "🔍 Check Vercel dashboard for deployment progress"
echo "📞 Test phone: +44 7427 134999"
