const fs = require('fs');
const path = require('path');

const files = [
  'app/globals.css',
  'css/webflow-style.css',
  'css/student-dashboard-styles.css'
];

files.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    const buffer = fs.readFileSync(filePath);
    // Detect UTF-16
    let content;
    if (buffer[0] === 0xff && buffer[1] === 0xfe) {
      // UTF-16 LE
      content = buffer.toString('utf16le');
      console.log(`${file} is UTF-16 LE. Converting to UTF-8...`);
    } else if (buffer[0] === 0xfe && buffer[1] === 0xff) {
      // UTF-16 BE
      content = buffer.toString('utf16be');
      console.log(`${file} is UTF-16 BE. Converting to UTF-8...`);
    } else {
      content = buffer.toString('utf8');
      console.log(`${file} is already UTF-8 (or other). Re-saving as UTF-8...`);
    }
    fs.writeFileSync(filePath, content, 'utf8');
  } else {
    console.log(`${file} does not exist`);
  }
});
