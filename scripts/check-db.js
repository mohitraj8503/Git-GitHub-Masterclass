const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim();
    env[key] = val;
  }
});

const supabaseUrl = env.SUPABASE_URL || '';
const supabaseServiceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.log('Missing env variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function check() {
  try {
    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .limit(1);

    if (error) {
      console.log('Error querying admins table:', error.message);
    } else {
      console.log('Admins table query success, data:', data);
    }
  } catch (e) {
    console.error('Exception:', e);
  }
}

check();
