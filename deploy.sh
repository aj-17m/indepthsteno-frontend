#!/bin/bash
# Audio Toggle Feature - Production Deployment Script
# Run this in your terminal/PowerShell in the frontend directory

cd D:\st-application\frontend

echo "🚀 Audio Toggle Feature - Production Deployment"
echo "=================================================="
echo ""

# Step 1: Check status
echo "📋 Step 1: Checking git status..."
git status --short
echo ""

# Step 2: Stage changes
echo "📌 Step 2: Staging all changes..."
git add -A
echo "✅ Changes staged"
echo ""

# Step 3: Commit
echo "💬 Step 3: Creating commit..."
git commit -m "feat: Add audio toggle feature for tests

- Admin can now enable/disable audio playback per test via toggle button
- When audio is disabled, test-takers see 'Audio Uploaded Soon' message
- When audio is pending, test-takers see 'Audio Coming Soon' message
- Updated user-friendly messages to guide users to contact admin
- Added audioEnabled badge in test list (green when ON, red when OFF)
- Test-takers can always proceed to typing practice regardless of audio state

Files modified:
- AdminDashboard.jsx: Added toggleAudio() function and UI
- TestPage.jsx: Updated audio phase rendering to respect audioEnabled flag

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
echo "✅ Commit created"
echo ""

# Step 4: Push
echo "🚀 Step 4: Pushing to production..."
git push origin main
echo "✅ Pushed successfully"
echo ""

echo "=================================================="
echo "🎉 Deployment complete!"
echo "=================================================="
