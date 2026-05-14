const { execSync } = require('child_process');
const path = require('path');

const repoPath = 'D:\\st-application\\frontend';
process.chdir(repoPath);

try {
  console.log('📁 Working directory:', process.cwd());
  
  console.log('\n📋 1. Checking git status...');
  const status = execSync('git status --short', { encoding: 'utf-8' });
  console.log(status);
  
  console.log('\n📌 2. Staging all changes...');
  execSync('git add -A', { encoding: 'utf-8' });
  console.log('✅ Changes staged');
  
  console.log('\n💬 3. Creating commit...');
  const commitMessage = `feat: Add audio toggle feature for tests

- Admin can now enable/disable audio playback per test via toggle button
- When audio is disabled, test-takers see 'Audio Uploaded Soon' message
- When audio is pending, test-takers see 'Audio Coming Soon' message
- Updated user-friendly messages to guide users to contact admin
- Added audioEnabled badge in test list (green when ON, red when OFF)
- Test-takers can always proceed to typing practice regardless of audio state

Files modified:
- AdminDashboard.jsx: Added toggleAudio() function and UI
- TestPage.jsx: Updated audio phase rendering to respect audioEnabled flag

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>`;
  
  execSync(`git commit -m "${commitMessage.replace(/"/g, '\\"')}"`, { encoding: 'utf-8' });
  console.log('✅ Commit created');
  
  console.log('\n🚀 4. Pushing to production (main branch)...');
  const pushOutput = execSync('git push origin main', { encoding: 'utf-8' });
  console.log(pushOutput);
  
  console.log('\n✨ All done! Changes pushed to production successfully! 🎉');
  
} catch (err) {
  console.error('❌ Error:', err.message);
  process.exit(1);
}
