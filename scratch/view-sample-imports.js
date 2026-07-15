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
  console.log("=== SAMPLE IMPORTED RECORDS FROM DATABASE ===");
  const { data, error } = await supabase
    .from("registrations")
    .select("name, enrollment_number, email, phone_number, branch, year_of_study, registered_at")
    .order("registered_at", { ascending: false })
    .limit(4);

  if (error) {
    console.error("Error fetching samples:", error);
    return;
  }

  console.log(JSON.stringify(data, null, 2));
}

main();
