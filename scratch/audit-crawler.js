const fs = require('fs');
const path = require('path');

const apiDir = path.join(__dirname, '..', 'app', 'api');

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

const files = getFiles(apiDir);
console.log(`Auditing ${files.length} API files...`);

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const relativePath = path.relative(path.join(__dirname, '..'), file);
  console.log(`\n--- ${relativePath} ---`);
  
  // 1. Check for fallback
  const hasFallback = content.includes('registrations.json') || content.includes('data/') || content.includes('fs.readFileSync') || content.includes('local fallback');
  console.log(`Fallback detected: ${hasFallback}`);
  
  // 2. Check for missing error check
  // Look for .select(), .insert(), .update(), .delete()
  const queries = (content.match(/\.(select|insert|update|delete|eq|ilike|maybeSingle|single)\(/g) || []).length;
  const checksError = content.includes('error') || content.includes('Err');
  console.log(`Queries found: ${queries}, Checks error: ${checksError}`);

  // 3. Check for TODO, temporary, etc.
  const todoMatch = content.match(/\b(TODO|temporary|FIXME|placeholder)\b/i);
  console.log(`Has TODO/temp: ${!!todoMatch} (${todoMatch ? todoMatch[0] : ''})`);

  // 4. Check for admin authorization
  const isAdminRoute = relativePath.includes('/admin/');
  const checksAdminAuth = content.includes('admin') || content.includes('role') || content.includes('session');
  console.log(`Is Admin route: ${isAdminRoute}, Checks auth: ${checksAdminAuth}`);
}
