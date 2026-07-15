const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

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
  console.log("=== DB AUDIT FOR ATTENDANCE AND WINDOWS ===");
  
  // 1. Fetch from attendance_windows
  console.log("\n--- Fetching attendance_windows ---");
  const { data: windows, error: wError } = await supabase.from('attendance_windows').select('*');
  if (wError) {
    console.error("Error fetching attendance_windows:", wError);
  } else {
    console.log(`Found ${windows.length} windows:`);
    console.log(JSON.stringify(windows, null, 2));
  }

  // 2. Fetch from attendance
  console.log("\n--- Fetching attendance ---");
  const { data: attendance, error: aError } = await supabase.from('attendance').select('*');
  if (aError) {
    console.error("Error fetching attendance:", aError);
  } else {
    console.log(`Found ${attendance.length} attendance rows:`);
    console.log(JSON.stringify(attendance, null, 2));
  }
  
  // 3. Let's inspect active windows
  const now = new Date().toISOString();
  console.log(`\nCurrent time (UTC/ISO): ${now}`);
}

main();
