const { Client } = require('pg');

const host = 'db.avaopnovlvhkxoskcxiu.supabase.co';
const password = 'Github@2026';

async function tryConnect(port) {
  console.log(`Trying to connect on port ${port}...`);
  const client = new Client({
    host: host,
    port: port,
    database: 'postgres',
    user: 'postgres',
    password: password,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000 // fail fast
  });

  try {
    await client.connect();
    console.log(`🎉 Connected successfully on port ${port}!`);
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

    console.log("Executing schema creation query...");
    await client.query(query);
    console.log("✅ xp_awards table created and RLS configured successfully on Supabase!");
    await client.end();
    return true;
  } catch (err) {
    console.error(`❌ Failed on port ${port}:`, err.message);
    return false;
  }
}

async function run() {
  const success5432 = await tryConnect(5432);
  if (!success5432) {
    const success6543 = await tryConnect(6543);
    if (!success6543) {
      console.error("Could not connect to database on port 5432 or 6543.");
      process.exit(1);
    }
  }
}

run();
