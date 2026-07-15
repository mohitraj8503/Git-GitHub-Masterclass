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

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

async function main() {
  console.log("Testing anonymous access to attendance_windows...");
  const { data: win, error: winErr } = await supabase.from('attendance_windows').select('*');
  console.log("attendance_windows error:", winErr);
  console.log("attendance_windows data:", win);

  console.log("\nTesting anonymous access to attendance...");
  const { data: att, error: attErr } = await supabase.from('attendance').select('*');
  console.log("attendance error:", attErr);
  console.log("attendance data:", att);
}

main();
