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

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

function getTodayKey() {
  // Use Asia/Kolkata (or matching local timezone) date to match the server date key
  const offset = 5.5 * 60 * 60 * 1000;
  const kolkataDate = new Date(Date.now() + offset);
  return kolkataDate.toISOString().split("T")[0];
}

async function main() {
  const today = getTodayKey();
  console.log(`Today's date key for completions: ${today}`);

  console.log("Fetching all registrations...");
  const { data: regs, error: rErr } = await supabase
    .from('registrations')
    .select('id, enrollment_number, name, total_xp');
    
  if (rErr) {
    console.error("Error fetching registrations:", rErr);
    return;
  }
  
  console.log(`Found ${regs.length} registrations. Processing daily login...`);
  
  let successCount = 0;
  let alreadyDoneCount = 0;
  let failCount = 0;
  
  for (const r of regs) {
    if (!r.enrollment_number) continue;
    const enroll = r.enrollment_number.trim().toUpperCase();
    
    try {
      // 1. Check if already completed
      const { data: existingComp, error: compErr } = await supabase
        .from('task_completions')
        .select('id')
        .ilike('enrollment_number', enroll)
        .eq('task_id', 'daily_login')
        .eq('completed_date', today)
        .maybeSingle();
        
      if (compErr) throw compErr;
      
      if (existingComp) {
        // Just verify XP is awarded
        const { data: existingTx } = await supabase
          .from('xp_transactions')
          .select('id')
          .eq('enrollment_number', enroll)
          .eq('action_type', 'daily_login')
          .eq('reference_id', today)
          .maybeSingle();
          
        if (existingTx) {
          alreadyDoneCount++;
          continue;
        }
      }
      
      // 2. Insert into task_completions if missing
      if (!existingComp) {
        const { error: insCompErr } = await supabase
          .from('task_completions')
          .insert({
            enrollment_number: enroll,
            task_id: 'daily_login',
            completed_date: today,
            source: 'daily-checklist-bulk'
          });
        if (insCompErr) throw insCompErr;
      }
      
      // 3. Insert into xp_transactions
      const { error: insTxErr } = await supabase
        .from('xp_transactions')
        .insert({
          enrollment_number: enroll,
          action_type: 'daily_login',
          xp_amount: 5,
          reference_id: today
        });
      if (insTxErr) throw insTxErr;
      
      // 4. Update total_xp
      const newTotal = Number(r.total_xp || 0) + 5;
      const { error: updErr } = await supabase
        .from('registrations')
        .update({ total_xp: newTotal })
        .eq('id', r.id);
      if (updErr) throw updErr;
      
      console.log(`[SUCCESS] Awarded daily login (5 XP) to ${r.name} (${enroll})`);
      successCount++;
    } catch (e) {
      console.error(`[ERROR] Failed for ${r.name} (${enroll}):`, e.message || e);
      failCount++;
    }
  }
  
  console.log(`\n=== BULK AWARD COMPLETED ===`);
  console.log(`Successfully Awarded: ${successCount}`);
  console.log(`Already Completed Today: ${alreadyDoneCount}`);
  console.log(`Failed: ${failCount}`);
}

main();
