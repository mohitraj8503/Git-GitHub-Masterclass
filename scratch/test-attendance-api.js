const http = require('http');

http.get('http://localhost:3000/api/attendance?enrollment_number=AJU/250609', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log("API response:", JSON.parse(data));
  });
}).on('error', (err) => {
  console.error("Error calling API:", err);
});
