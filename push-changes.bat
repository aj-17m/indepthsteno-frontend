@echo off
REM Push audio toggle feature changes to production

cd /d D:\st-application\frontend

echo ========================================
echo Checking git status...
echo ========================================
git status

echo.
echo ========================================
echo Staging changes...
echo ========================================
git add -A

echo.
echo ========================================
echo Creating commit...
echo ========================================
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

echo.
echo ========================================
echo Pushing to production...
echo ========================================
git push origin main

echo.
echo ========================================
echo Completed!
echo ========================================
