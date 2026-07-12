const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local manually
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

const supabaseUrl = env.SUPABASE_URL;
const supabaseServiceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Missing Supabase credentials in .env.local", env);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function main() {
  console.log("Fetching registrations...");
  const { data, error } = await supabase.from('registrations').select('*');
  if (error) {
    console.error("Error fetching registrations:", error);
    return;
  }
  console.log(`Found ${data.length} registrations.`);
  const mohits = data.filter(r => 
    (r.name && r.name.toLowerCase().includes('mohit')) || 
    (r.enrollment_number && r.enrollment_number.includes('25060')) || 
    (r.branch && r.branch.toLowerCase().includes('bca'))
  );
  console.log("Matching registrations:", JSON.stringify(mohits, null, 2));
}

main();
