const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.join(__dirname, '..');
const tempDir = path.join(root, 'scratch', 'source-package');
const desktopZipPath = 'C:\\Users\\mohit\\Desktop\\github-masterclass-v2.zip';

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
    try {
      fs.chmodSync(dest, 0o755); // Explicitly set Unix directory permissions (rwxr-xr-x)
    } catch (e) {
      // Ignore Windows permission warning if any
    }
    fs.readdirSync(src).forEach(childItemName => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
    try {
      fs.chmodSync(dest, 0o644); // Explicitly set Unix file permissions (rw-r--r--)
    } catch (e) {
      // Ignore Windows permission warning if any
    }
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

console.log('Copying source files with explicit permission formatting...');
itemsToCopy.forEach(item => {
  const srcPath = path.join(root, item);
  const destPath = path.join(tempDir, item);
  if (fs.existsSync(srcPath)) {
    copyRecursiveSync(srcPath, destPath);
  }
});

console.log('Packaging source files into zip using tar * to preserve correct directory permissions...');
try {
  if (fs.existsSync(desktopZipPath)) {
    fs.unlinkSync(desktopZipPath);
  }
  // Run tar command to create a zip file preserving Unix file permissions
  const psCmd = `cd '${tempDir}'; tar -a -cf "${desktopZipPath}" *`;
  execSync(`powershell -Command "${psCmd}"`, { stdio: 'inherit' });
  console.log(`Successfully created source zip at: ${desktopZipPath}`);
} catch (err) {
  console.error('Failed to create source zip:', err);
}

// Clean up temp directory
fs.rmSync(tempDir, { recursive: true, force: true });
console.log('Done!');
