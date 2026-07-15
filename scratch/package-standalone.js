const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function copyFolderRecursiveSync(source, target) {
  let files = [];
  const targetFolder = path.join(target, path.basename(source));
  if (!fs.existsSync(targetFolder)) {
    fs.mkdirSync(targetFolder, { recursive: true });
  }

  if (fs.lstatSync(source).isDirectory()) {
    files = fs.readdirSync(source);
    files.forEach(function (file) {
      const curSource = path.join(source, file);
      if (fs.lstatSync(curSource).isDirectory()) {
        copyFolderRecursiveSync(curSource, targetFolder);
      } else {
        fs.copyFileSync(curSource, path.join(targetFolder, file));
      }
    });
  }
}

console.log('Preparing standalone folder contents...');
const root = path.join(__dirname, '..');
const standaloneDir = path.join(root, '.next', 'standalone');

if (!fs.existsSync(standaloneDir)) {
  console.log('Standalone directory not found. Running npm run build...');
  execSync('npm run build', { cwd: root, stdio: 'inherit' });
}

// 2. Copy public directory to .next/standalone/public
const publicSrc = path.join(root, 'public');
const publicDest = path.join(standaloneDir);
if (fs.existsSync(publicSrc)) {
  console.log('Copying public folder to standalone...');
  copyFolderRecursiveSync(publicSrc, publicDest);
}

// 3. Copy .next/static to .next/standalone/.next/static
const staticSrc = path.join(root, '.next', 'static');
const staticDest = path.join(standaloneDir, '.next');
if (fs.existsSync(staticSrc)) {
  console.log('Copying .next/static folder to standalone...');
  copyFolderRecursiveSync(staticSrc, staticDest);
}

console.log('Packaging standalone folder into standalone.zip...');
try {
  const zipPath = path.join(root, 'standalone.zip');
  if (fs.existsSync(zipPath)) {
    fs.unlinkSync(zipPath);
  }
  // Run PowerShell command to zip standalone folder, using single quotes for paths with spaces
  const psCmd = `Compress-Archive -Path '${standaloneDir}\\*' -DestinationPath '${zipPath}' -Force`;
  execSync(`powershell -Command "${psCmd}"`, { stdio: 'inherit' });
  console.log('Successfully created standalone.zip in root directory!');
} catch (err) {
  console.error('Failed to zip standalone directory:', err);
}
