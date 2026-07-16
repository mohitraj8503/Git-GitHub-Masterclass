const fs = require('fs');
const path = require('path');

const adminDir = path.join(__dirname, '..', 'app', 'api', 'admin');

function getFiles(dir, files = []) {
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const name = path.join(dir, file);
    if (fs.statSync(name).isDirectory()) {
      getFiles(name, files);
    } else {
      files.push(name);
    }
  }
  return files;
}

const files = getFiles(adminDir);
console.log("Auditing admin files for authorization checks...");

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const relativePath = path.relative(path.join(__dirname, '..'), file);
  
  const hasGetSession = content.includes('getSession(');
  const hasAdminCheck = content.includes('role !== "admin"') || content.includes('role !== \'admin\'');
  
  if (!hasGetSession || !hasAdminCheck) {
    console.log(`[VULNERABLE] ${relativePath} - Missing session/admin check! (getSession: ${hasGetSession}, hasAdminCheck: ${hasAdminCheck})`);
  } else {
    console.log(`[SECURE] ${relativePath}`);
  }
}
