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
const supabaseServiceKey = env['SUPABASE_SERVICE_ROLE_KEY'] || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function deleteAssignment() {
  console.log("Deleting assignment using SERVICE ROLE KEY...");
  const { data, error } = await supabase
    .from('assignments')
    .delete()
    .eq('id', '7f4338fb-a7fb-446a-9d3b-90fe3747bd7b')
    .select();

  if (error) {
    console.error("Error deleting assignment:", error);
  } else {
    console.log("Successfully deleted the assignment:", data);
  }
}

deleteAssignment();
