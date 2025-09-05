#!/bin/bash

echo "🚀 Deploying TypeScript-compatible Emma routing fixes..."

# Add all changes
git add .

# Commit with timestamp
git commit -m "Fix TypeScript compatibility: use forEach instead of for...of for FormData - $(date)"

# Push to trigger deployment
git push origin main

echo "✅ Deployment triggered - fixing TypeScript errors"
echo "⏳ Wait 2-3 minutes for deployment to complete"
echo "📞 Then test: +44 7427 134999"
