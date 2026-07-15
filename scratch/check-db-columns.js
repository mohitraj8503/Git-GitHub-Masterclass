const { createClient } = require('@supabase/supabase-js');
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

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data, error } = await supabase.from('registrations').select('*').limit(1);
  if (error) {
    console.error("Error selecting registrations:", error);
    return;
  }
  console.log("Columns present in registrations table:");
  if (data && data.length > 0) {
    console.log(Object.keys(data[0]));
  } else {
    console.log("No rows present to inspect columns, selecting from information_schema via RPC or other table.");
    // Let's inspect columns using a table query that returns empty but with column names if possible.
    // Or we can just insert a test row and read it.
    // Wait, let's see if we can query some metadata.
  }
}

main();
