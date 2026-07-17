const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'app/dashboard/page.tsx');
if (fs.existsSync(filePath)) {
  const buffer = fs.readFileSync(filePath);
  let content;
  if (buffer[0] === 0xff && buffer[1] === 0xfe) {
    content = buffer.toString('utf16le');
    console.log(`Converting UTF-16 LE to UTF-8...`);
  } else if (buffer[0] === 0xfe && buffer[1] === 0xff) {
    content = buffer.toString('utf16be');
    console.log(`Converting UTF-16 BE to UTF-8...`);
  } else {
    content = buffer.toString('utf8');
    console.log(`Already UTF-8 or other.`);
  }
  fs.writeFileSync(filePath, content, 'utf8');
} else {
  console.log(`File not found`);
}
