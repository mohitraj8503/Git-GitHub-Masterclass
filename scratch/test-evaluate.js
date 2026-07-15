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
  console.log("=== EVALUATE API TEST START ===");
  const testEnroll = 'AJU/250609'; // Mohit Raj
  
  // 1. Fetch test student and assignment
  const { data: reg } = await supabase.from('registrations').select('id, total_xp').eq('enrollment_number', testEnroll).single();
  const { data: ass } = await supabase.from('assignments').select('id, title, max_marks').limit(1).single();

  if (!reg || !ass) {
    console.error("Test student or assignment not found.");
    return;
  }
  console.log("Student ID:", reg.id, "Assignment ID:", ass.id, "Title:", ass.title, "Max Marks:", ass.max_marks);

  // Create test submission
  console.log("\nCreating test submission...");
  const { data: sub, error: subErr } = await supabase
    .from('submissions')
    .insert({
      assignment_id: ass.id,
      student_id: reg.id,
      repo_url: 'https://github.com/mohit/test-repo',
      live_url: 'https://mohit.github.io/test-repo',
      submitted_at: new Date().toISOString()
    })
    .select()
    .single();

  if (subErr) {
    console.error("Failed to create test submission:", subErr);
    return;
  }
  console.log("✅ Created test submission ID:", sub.id);

  // 2. Call evaluate endpoint locally
  console.log("\nEvaluating test submission with 8/10 marks...");
  const evalRes = await fetch("http://localhost:3000/api/admin/evaluate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      submission_id: sub.id,
      marks_obtained: 8,
      mentor_feedback: "Great work!",
      manual_bonus_xp: 0
    })
  });
  
  const evalData = await evalRes.json();
  console.log("Evaluate API Response:", evalData);

  // Fetch student total_xp and xp_awards
  const { data: regAfter } = await supabase.from('registrations').select('total_xp').eq('id', reg.id).single();
  const { data: awards } = await supabase.from('xp_awards').select('*').eq('student_id', reg.id);
  console.log(`Student total XP after evaluation: ${regAfter.total_xp} (Expected: 80 base + 40 badge unlock = 120 XP)`);
  console.log("XP Awards list:", JSON.stringify(awards, null, 2));

  // 3. Re-evaluate with 10/10 marks (idempotency check)
  console.log("\nRe-evaluating submission with 10/10 marks...");
  const reEvalRes = await fetch("http://localhost:3000/api/admin/evaluate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      submission_id: sub.id,
      marks_obtained: 10,
      mentor_feedback: "Excellent!",
      manual_bonus_xp: 0
    })
  });
  
  const reEvalData = await reEvalRes.json();
  console.log("Re-evaluate API Response:", reEvalData);

  const { data: regAfter2 } = await supabase.from('registrations').select('total_xp').eq('id', reg.id).single();
  const { data: awards2 } = await supabase.from('xp_awards').select('*').eq('student_id', reg.id);
  console.log(`Student total XP after re-evaluation: ${regAfter2.total_xp} (Expected: 100 base + 40 badge unlock = 140 XP)`);
  console.log("XP Awards list (should not duplicate, just update existing):", JSON.stringify(awards2, null, 2));

  // 4. Cleanup
  console.log("\nCleaning up test submission, achievements, and awards...");
  await supabase.from('submissions').delete().eq('id', sub.id);
  await supabase.from('xp_awards').delete().eq('student_id', reg.id);
  await supabase.from('student_achievements').delete().eq('enrollment_number', testEnroll);
  await supabase.from('registrations').update({ total_xp: 0 }).eq('id', reg.id);

  console.log("✅ Cleanup complete!");
  console.log("=== EVALUATE API TEST COMPLETE ===");
}

main();
