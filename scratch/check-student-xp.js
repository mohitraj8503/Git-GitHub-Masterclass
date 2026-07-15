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
  console.log("Checking registrations and XP...");
  const { data: students, error } = await supabase
    .from('registrations')
    .select('id, name, enrollment_number, total_xp');
    
  if (error) {
    console.error("Error fetching registrations:", error);
    return;
  }
  
  console.log("Students with non-zero XP:");
  students.forEach(s => {
    if (s.total_xp > 0) {
      console.log(`- ${s.name} (${s.enrollment_number}): ${s.total_xp} XP`);
    }
  });
}

main();
