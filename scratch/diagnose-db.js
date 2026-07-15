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
  const { data: dbRegs, error } = await supabase.from('registrations').select('*');
  if (error) {
    console.error("DB Query error:", error);
    return;
  }

  console.log("=== DB DIAGNOSIS ===");
  console.log("Row count in registrations table:", dbRegs.length);
  dbRegs.forEach((r, idx) => {
    console.log(`${idx + 1}. Name="${r.name}", Email="${r.email}", Enrollment="${r.enrollment_number}"`);
  });
}

main();
