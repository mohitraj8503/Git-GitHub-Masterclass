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
  console.log("=== DRY RUN START ===");
  const testEnroll = 'AJU/250609'; // Mohit Raj
  const day = 1;

  // 1. Create a live window
  console.log("\n1. Creating test active window...");
  const expires = new Date(Date.now() + 5 * 60 * 1000).toISOString();
  const token = "DRY_RUN_TOKEN_" + Date.now();
  const { data: win, error: winErr } = await supabase
    .from('attendance_windows')
    .insert({ day, expires_at: expires, is_active: true, session_token: token })
    .select()
    .single();

  if (winErr) {
    console.error("Failed to create test window:", winErr);
    return;
  }
  console.log("✅ Created test window ID:", win.id);

  // 2. Perform check-in
  console.log("\n2. Simulating check-in for", testEnroll);
  // Get registration ID
  const { data: reg } = await supabase
    .from('registrations')
    .select('id, total_xp')
    .ilike('enrollment_number', testEnroll)
    .single();
    
  if (!reg) {
    console.error("Test student registration not found.");
    return;
  }
  console.log("Student ID:", reg.id, "Current XP:", reg.total_xp);

  // Insert attendance
  const { data: att, error: attErr } = await supabase
    .from('attendance')
    .insert({
      student_id: reg.id,
      session_day: day,
      window_id: win.id,
      session_token: win.session_token
    })
    .select()
    .single();

  if (attErr) {
    console.error("Failed to check in:", attErr);
    return;
  }
  console.log("✅ Checked in successfully! Attendance row:", att);

  // 3. Confirm it appears in attendance-report query
  console.log("\n3. Querying attendance window...");
  const { data: checkins } = await supabase
    .from('attendance')
    .select('verified_at, registrations(name, enrollment_number)')
    .eq('window_id', win.id);
  console.log("Checkins list:", JSON.stringify(checkins, null, 2));

  // 4. Clean up dry run data
  console.log("\n4. Cleaning up dry run data...");
  await supabase.from('attendance').delete().eq('id', att.id);
  await supabase.from('attendance_windows').delete().eq('id', win.id);
  console.log("✅ Deleted dry run attendance log and window.");

  // Verify DB is clean
  const { data: atts } = await supabase.from('attendance').select('id');
  const { data: wins } = await supabase.from('attendance_windows').select('id');
  console.log(`Active attendance rows remaining: ${atts.length}`);
  console.log(`Active window rows remaining: ${wins.length}`);
  
  console.log("\n=== DRY RUN SUCCESSFUL & CLEANED UP ===");
}

main();
