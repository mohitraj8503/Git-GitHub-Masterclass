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

const supabaseUrl = env['SUPABASE_URL'] || process.env.SUPABASE_URL;
const supabaseKey = env['SUPABASE_ANON_KEY'] || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function listAssignments() {
  const { data, error } = await supabase
    .from('assignments')
    .select('*');

  if (error) {
    console.error("Error listing assignments:", error);
  } else {
    console.log("Assignments in Supabase database:", data);
  }
}

listAssignments();
