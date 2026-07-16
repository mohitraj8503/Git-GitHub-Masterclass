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
  const offset = 5.5 * 60 * 60 * 1000;
  const kolkataDate = new Date(Date.now() + offset);
  return kolkataDate.toISOString().split("T")[0];
}

async function main() {
  const today = getTodayKey();
  console.log(`=== DB AUDIT AND REPAIR RUNNING FOR ${today} ===\n`);

  // 1. Fetch registrations
  console.log("Fetching registrations...");
  const { data: regs, error: rErr } = await supabase
    .from('registrations')
    .select('*');
  if (rErr) {
    console.error("Failed to fetch registrations:", rErr);
    return;
  }
  console.log(`Loaded ${regs.length} registrations.\n`);

  // 2. Fetch all attendance
  console.log("Fetching attendance...");
  const { data: atts, error: aErr } = await supabase.from('attendance').select('*');
  if (aErr) {
    console.error("Failed to fetch attendance:", aErr);
    return;
  }
  console.log(`Loaded ${atts.length} attendance rows.\n`);

  // 3. Fetch all submissions
  console.log("Fetching submissions...");
  const { data: subs, error: sErr } = await supabase.from('submissions').select('*');
  if (sErr) {
    console.error("Failed to fetch submissions:", sErr);
    return;
  }
  console.log(`Loaded ${subs.length} submissions.\n`);

  // 4. Fetch all XP transactions
  console.log("Fetching XP transactions...");
  const { data: txs, error: tErr } = await supabase.from('xp_transactions').select('*');
  if (tErr) {
    console.error("Failed to fetch XP transactions:", tErr);
    return;
  }
  console.log(`Loaded ${txs.length} transactions.\n`);

  // 5. Fetch all task completions
  console.log("Fetching task completions...");
  const { data: comps, error: cErr } = await supabase.from('task_completions').select('*');
  if (cErr) {
    console.error("Failed to fetch task completions:", cErr);
    return;
  }
  console.log(`Loaded ${comps.length} completions.\n`);

  let xpUpdates = 0;
  let txInserts = 0;
  let compInserts = 0;

  for (const r of regs) {
    if (!r.enrollment_number) continue;
    const enroll = r.enrollment_number; // MUST use exact case stored in registrations to respect foreign key constraint
    const enrollUpper = enroll.toUpperCase();
    
    // Filter transactions and completions for this specific user
    const userTxs = txs.filter(t => t.enrollment_number.trim().toUpperCase() === enrollUpper);
    const userComps = comps.filter(c => c.enrollment_number.trim().toUpperCase() === enrollUpper);

    // Track computed XP
    let calculatedXp = 0;

    // A. Daily Login XP
    const hasLoginComp = userComps.some(c => c.task_id === 'daily_login' && c.completed_date === today);
    const hasLoginTx = userTxs.some(t => t.action_type === 'daily_login' && t.reference_id === today);
    
    if (!hasLoginComp) {
      const { error } = await supabase.from('task_completions').insert({
        enrollment_number: enroll,
        task_id: 'daily_login',
        completed_date: today,
        source: 'audit-fix'
      });
      if (error) {
        console.error(`[FAIL] Login completion for ${r.name} (${enroll}):`, error.message);
      } else {
        compInserts++;
      }
    }
    
    if (!hasLoginTx) {
      const { error } = await supabase.from('xp_transactions').insert({
        enrollment_number: enroll,
        action_type: 'daily_login',
        xp_amount: 5,
        reference_id: today
      });
      if (error) {
        console.error(`[FAIL] Login XP transaction for ${r.name} (${enroll}):`, error.message);
      } else {
        txInserts++;
        calculatedXp += 5;
      }
    } else {
      calculatedXp += 5; // already has it
    }

    // B. Attendance XP
    const userAtts = atts.filter(a => a.student_id === r.id);
    for (const att of userAtts) {
      const day = att.session_day;
      const hasAttComp = userComps.some(c => c.task_id === 'mark_attendance' && c.completed_date === today);
      const hasAttTx = userTxs.some(t => t.action_type === 'mark_attendance' && t.reference_id === `day_${day}`);

      if (day === 1 && !hasAttComp) {
        // Log completion for today
        await supabase.from('task_completions').insert({
          enrollment_number: enroll,
          task_id: 'mark_attendance',
          completed_date: today,
          source: 'audit-fix-attendance'
        });
        compInserts++;
      }

      if (!hasAttTx) {
        const { error } = await supabase.from('xp_transactions').insert({
          enrollment_number: enroll,
          action_type: 'mark_attendance',
          xp_amount: 20,
          reference_id: `day_${day}`
        });
        if (error) {
          console.error(`[FAIL] Attendance XP for ${r.name} Day ${day}:`, error.message);
        } else {
          txInserts++;
          calculatedXp += 20;
        }
      } else {
        calculatedXp += 20;
      }
    }

    // C. Submissions XP
    const userSubs = subs.filter(s => s.student_id === r.id);
    for (const sub of userSubs) {
      const hasSubComp = userComps.some(c => c.task_id === 'complete_assignment' && c.completed_date === today);
      const hasSubTx = userTxs.some(t => t.action_type === 'submit_assignment' && t.reference_id === sub.assignment_id);

      if (!hasSubComp) {
        await supabase.from('task_completions').insert({
          enrollment_number: enroll,
          task_id: 'complete_assignment',
          completed_date: today,
          source: 'audit-fix-submissions'
        });
        compInserts++;
      }

      if (!hasSubTx) {
        const { error } = await supabase.from('xp_transactions').insert({
          enrollment_number: enroll,
          action_type: 'submit_assignment',
          xp_amount: 50,
          reference_id: sub.assignment_id
        });
        if (error) {
          console.error(`[FAIL] Submission XP for ${r.name} (${sub.assignment_id}):`, error.message);
        } else {
          txInserts++;
          calculatedXp += 50;
        }
      } else {
        calculatedXp += 50;
      }
    }

    // Add other existing transaction points (like achievements or quizzes)
    const otherTxs = userTxs.filter(t => !['daily_login', 'mark_attendance', 'submit_assignment'].includes(t.action_type));
    otherTxs.forEach(t => {
      calculatedXp += Number(t.xp_amount || 0);
    });

    // D. Update registration total_xp if there's a difference
    if (Number(r.total_xp || 0) !== calculatedXp) {
      const { error } = await supabase
        .from('registrations')
        .update({ total_xp: calculatedXp })
        .eq('id', r.id);
      if (error) {
        console.error(`[FAIL] XP update for ${r.name}:`, error.message);
      } else {
        console.log(`[XP FIX] ${r.name} (${enroll}): ${r.total_xp} -> ${calculatedXp} XP`);
        xpUpdates++;
      }
    }
  }

  console.log(`\n=== AUDIT AND REPAIR COMPLETED ===`);
  console.log(`Task Completion Inserts: ${compInserts}`);
  console.log(`XP Transaction Inserts: ${txInserts}`);
  console.log(`Total XP Registrations Corrected: ${xpUpdates}`);
}

main();
