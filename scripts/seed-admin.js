const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Parse environment variables manually
const envPath = path.join(__dirname, '..', '.env.local');
const env = {};
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim();
      env[key] = val;
    }
  });
}

const email = 'admin@githubpages.in';
const plainPassword = 'Mohit@123';

async function seed() {
  const hash = await bcrypt.hash(plainPassword, 10);
  
  // 1. Save to local fallback JSON
  const dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const adminsFilePath = path.join(dataDir, 'admins.json');
  const adminData = [
    {
      email: email,
      password_hash: hash,
      name: 'Mohit Raj'
    }
  ];
  fs.writeFileSync(adminsFilePath, JSON.stringify(adminData, null, 2), 'utf8');
  console.log('Successfully seeded local admins database fallback:', adminsFilePath);

  // 2. Save to Supabase if connected
  const supabaseUrl = env.SUPABASE_URL || '';
  const supabaseServiceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (supabaseUrl && supabaseServiceRoleKey) {
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    try {
      const { data, error } = await supabase
        .from('admins')
        .upsert({
          email: email,
          password_hash: hash,
          name: 'Mohit Raj'
        }, { onConflict: 'email' })
        .select();

      if (error) {
        console.warn('Could not insert admin into Supabase admins table (expected if SQL script not run in Supabase dashboard yet):', error.message);
      } else {
        console.log('Successfully seeded admin into Supabase admins table:', data);
      }
    } catch (err) {
      console.warn('Supabase query failed:', err.message);
    }
  } else {
    console.log('Supabase env vars missing. Skipping Supabase seeding.');
  }
}

seed();
