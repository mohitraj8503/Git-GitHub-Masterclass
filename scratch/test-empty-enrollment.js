const http = require('http');

http.get('http://localhost:3000/api/attendance?enrollment_number=', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    const parsed = JSON.parse(data);
    console.log("Success:", parsed.success);
    console.log("Attendance count:", parsed.attendance ? parsed.attendance.length : 0);
  });
}).on('error', (err) => {
  console.error("Error calling API:", err);
});
