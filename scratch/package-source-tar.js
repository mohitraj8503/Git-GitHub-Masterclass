const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.join(__dirname, '..');
const tempDir = path.join(root, 'scratch', 'source-package');
const desktopTarPath = 'C:\\Users\\mohit\\Desktop\\github-masterclass-source.tar.gz';

// Clean temp directory if exists
if (fs.existsSync(tempDir)) {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
fs.mkdirSync(tempDir, { recursive: true });

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach(childItemName => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

// Items to copy
const itemsToCopy = [
  'app',
  'components',
  'css',
  'data',
  'images',
  'js',
  'lib',
  'public',
  'scripts',
  'middleware.ts',
  'next-env.d.ts',
  'next.config.mjs',
  'package.json',
  'package-lock.json',
  'tsconfig.json',
];

console.log('Copying source files...');
itemsToCopy.forEach(item => {
  const srcPath = path.join(root, item);
  const destPath = path.join(tempDir, item);
  if (fs.existsSync(srcPath)) {
    copyRecursiveSync(srcPath, destPath);
  }
});

// Write .env file for production
console.log('Writing production .env file...');
const envContent = `SUPABASE_URL=https://avaopnovlvhkxoskcxiu.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2YW9wbm92bHZoa3hvc2tjeGl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1MjQxMjgsImV4cCI6MjA5OTEwMDEyOH0.5kxvMQO_50Sk6qEi-tECZGgH1Y6ecs23do5C5noet9o
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2YW9wbm92bHZoa3hvc2tjeGl1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzUyNDEyOCwiZXhwIjoyMDk5MTAwMTI4fQ.a5lNWr0wtYPTJRn9UumSFJjby8ma9KaCQByY1o4mDis

NEXTAUTH_URL=https://github.techtomorrow.in
NEXTAUTH_SECRET=masterclass-nextauth-secret-key-change-in-prod-2026
ADMIN_SESSION_SECRET=masterclass-admin-session-secret-key-change-in-prod-2026

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
`;

fs.writeFileSync(path.join(tempDir, '.env'), envContent, 'utf8');
fs.writeFileSync(path.join(tempDir, '.env.production'), envContent, 'utf8');

console.log('Packaging source files into tar.gz to preserve Unix file permissions...');
try {
  if (fs.existsSync(desktopTarPath)) {
    fs.unlinkSync(desktopTarPath);
  }
  // Run tar command to compress files and preserve permissions
  execSync(`tar -czf "${desktopTarPath}" -C "${tempDir}" .`, { stdio: 'inherit' });
  console.log(`Successfully created source tar.gz at: ${desktopTarPath}`);
} catch (err) {
  console.error('Failed to create source tar.gz:', err);
}

// Clean up temp directory
fs.rmSync(tempDir, { recursive: true, force: true });
console.log('Done!');
