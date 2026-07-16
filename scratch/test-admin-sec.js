const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/admin/evaluate',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log(`BODY: ${data}`);
    if (res.statusCode === 401) {
      console.log("✅ Security Verification Passed! Endpoint returned 401 Unauthorized.");
      process.exit(0);
    } else {
      console.error("❌ Security Verification Failed! Endpoint did not return 401 Unauthorized.");
      process.exit(1);
    }
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
  process.exit(1);
});

req.write(JSON.stringify({ submission_id: 'test', marks_obtained: 10 }));
req.end();
