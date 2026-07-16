const { Client } = require('pg');

const host = 'aws-0-ap-southeast-2.pooler.supabase.com';
const password = 'Github@2026';
const user = 'postgres.avaopnovlvhkxoskcxiu';
const port = 6543; // Transaction mode pooler

async function main() {
  console.log(`Connecting to ${host}:${port} as ${user}...`);
  const client = new Client({
    host: host,
    port: port,
    database: 'postgres',
    user: user,
    password: password,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("🎉 Connected to Supabase via Pooler successfully!");
    
    // Create feedback table if it doesn't exist
    const query = `
      CREATE TABLE IF NOT EXISTS public.feedback (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        enrollment_number TEXT NOT NULL,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        message TEXT NOT NULL,
        rating INTEGER NOT NULL DEFAULT 5, -- rating from 1 to 10
        submitted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );

      ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

      DROP POLICY IF EXISTS "Allow select for admin on feedback" ON public.feedback;
      CREATE POLICY "Allow select for admin on feedback" ON public.feedback FOR SELECT TO anon, authenticated USING (true);
      
      DROP POLICY IF EXISTS "Allow insert for all on feedback" ON public.feedback;
      CREATE POLICY "Allow insert for all on feedback" ON public.feedback FOR INSERT TO anon, authenticated WITH CHECK (true);
    `;
    
    console.log("Executing table creation queries...");
    await client.query(query);
    console.log("✅ feedback table created and schema updated successfully on Supabase!");
    
    await client.end();
  } catch (err) {
    console.error("❌ DB connection failed:", err.message);
  }
}

main();
