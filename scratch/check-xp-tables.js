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
  const tables = ['xp_logs', 'xp_transactions', 'xp_awards', 'student_achievements'];
  for (const table of tables) {
    console.log(`\n--- Fetching from ${table} ---`);
    const { data, error } = await supabase.from(table).select('*');
    if (error) {
      console.log(`Error on table ${table}:`, error.message);
    } else {
      console.log(`Found ${data.length} rows:`);
      console.log(JSON.stringify(data, null, 2));
    }
  }
}

main();
