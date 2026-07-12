const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] ? match[2].trim() : '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    }
    env[match[1]] = value;
  }
});

async function checkRpc() {
  const url = `${env.SUPABASE_URL}/rest/v1/`;
  console.log("Fetching OpenAPI spec from:", url);
  try {
    const res = await fetch(url, {
      headers: {
        'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`
      }
    });
    const data = await res.json();
    console.log("Paths:", Object.keys(data.paths || {}));
  } catch (err) {
    console.error("Failed to fetch OpenAPI spec:", err.message);
  }
}

checkRpc();
