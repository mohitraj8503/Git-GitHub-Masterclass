const fs = require('fs');
const fileContent = fs.readFileSync('app/dashboard/page.tsx', 'utf8');
const lines = fileContent.split('\n');
lines.forEach((line, i) => {
  if (line.includes('setAttendance')) {
    console.log(`${i + 1}: ${line}`);
  }
});
