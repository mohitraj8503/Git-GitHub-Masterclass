const { Client } = require('pg');
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

// Since the url is https://avaopnovlvhkxoskcxiu.supabase.co
// The DB host is db.avaopnovlvhkxoskcxiu.supabase.co
const host = 'db.avaopnovlvhkxoskcxiu.supabase.co';
const password = 'Mohit@123'; // Seed password or maybe a common password

async function run() {
  console.log(`Connecting to postgres://${host}:5432/postgres with password ${password}...`);
  const client = new Client({
    host: host,
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: password,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("Connected successfully!");
    
    // Create xp_awards table
    const query = `
      CREATE TABLE IF NOT EXISTS public.xp_awards (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        student_id TEXT REFERENCES public.registrations(id) ON DELETE CASCADE,
        amount INTEGER NOT NULL,
        reason TEXT NOT NULL,
        awarded_by TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );
      
      ALTER TABLE public.xp_awards ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Allow xp_awards read for all" ON public.xp_awards;
      CREATE POLICY "Allow xp_awards read for all" ON public.xp_awards FOR SELECT TO anon, authenticated USING (true);
    `;
    
    await client.query(query);
    console.log("xp_awards table created successfully!");
    await client.end();
  } catch (err) {
    console.error("Connection failed:", err.message);
  }
}

run();
