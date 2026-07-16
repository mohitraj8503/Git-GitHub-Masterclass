const http = require('http');

const postData = JSON.stringify({
  enrollment_number: 'AJU/250609',
  task_id: 'daily_login'
});

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/daily-tasks',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
}, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log("POST response status:", res.statusCode);
    console.log("POST response body:", JSON.parse(data));
  });
});

req.on('error', (e) => {
  console.error("POST request failed:", e);
});

req.write(postData);
req.end();
