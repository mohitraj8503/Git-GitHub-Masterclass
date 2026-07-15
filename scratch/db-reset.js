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
  console.log("🚀 Starting FINAL DATABASE RESET to clean zero-state...");

  // 1. Delete all attendance logs
  console.log("Wiping 'attendance'...");
  const { error: attErr } = await supabase.from('attendance').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (attErr) console.error("Error wiping attendance:", attErr);
  else console.log("✅ Wiped attendance.");

  // 2. Delete all attendance windows
  console.log("Wiping 'attendance_windows'...");
  const { error: winErr } = await supabase.from('attendance_windows').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (winErr) console.error("Error wiping attendance windows:", winErr);
  else console.log("✅ Wiped attendance windows.");

  // 3. Delete all submissions (test submissions)
  console.log("Wiping 'submissions'...");
  const { error: subErr } = await supabase.from('submissions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (subErr) console.error("Error wiping submissions:", subErr);
  else console.log("✅ Wiped submissions.");

  // 4. Delete all XP awards
  console.log("Wiping 'xp_awards'...");
  const { error: awdErr } = await supabase.from('xp_awards').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (awdErr) console.error("Error wiping xp_awards:", awdErr);
  else console.log("✅ Wiped xp_awards.");

  // 5. Delete all XP transactions
  console.log("Wiping 'xp_transactions'...");
  const { error: txErr } = await supabase.from('xp_transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (txErr) console.error("Error wiping xp_transactions:", txErr);
  else console.log("✅ Wiped xp_transactions.");

  // 6. Delete all student achievements
  console.log("Wiping 'student_achievements'...");
  const { error: achErr } = await supabase.from('student_achievements').delete().neq('unlocked_at', '1970-01-01T00:00:00.000Z');
  if (achErr) console.error("Error wiping student_achievements:", achErr);
  else console.log("✅ Wiped student_achievements.");

  // 7. Reset total_xp in registrations to 0
  console.log("Resetting student total_xp to 0...");
  const { data: regs, error: regsErr } = await supabase.from('registrations').select('id, name, enrollment_number');
  if (regsErr) {
    console.error("Error fetching registrations:", regsErr);
    return;
  }

  for (const r of regs) {
    const { error: updErr } = await supabase
      .from('registrations')
      .update({ total_xp: 0 })
      .eq('id', r.id);
      
    if (updErr) {
      console.error(`Failed to reset XP for ${r.name}:`, updErr.message);
    } else {
      console.log(`- ${r.name} (${r.enrollment_number}): reset to 0 XP`);
    }
  }

  console.log("\n🎉 FINAL DATABASE RESET COMPLETE! Genuine Zero-State Established.");
}

main();
