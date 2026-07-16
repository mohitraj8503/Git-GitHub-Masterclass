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

async function main() {
  const { data: reg, error: rErr } = await supabase
    .from('registrations')
    .select('*')
    .ilike('name', '%Mohit%');
    
  if (rErr) {
    console.error("Error finding Mohit:", rErr);
    return;
  }
  
  console.log("Mohit registrations found:", reg);
  if (!reg.length) return;
  
  for (const r of reg) {
    const { data: att, error: aErr } = await supabase
      .from('attendance')
      .select('*')
      .eq('student_id', r.id);
    if (aErr) {
      console.error(`Error for ${r.name}:`, aErr);
    } else {
      console.log(`Attendance for ${r.name} (${r.id}, enroll: ${r.enrollment_number}):`);
      console.log(att);
    }
  }
}

main();
