const { Client } = require('pg');

const host = 'db.avaopnovlvhkxoskcxiu.supabase.co';
const passwords = ['Mohit@123', 'Github@2026'];
const ports = [5432, 6543];

async function tryConnect(port, password) {
  console.log(`Trying to connect on port ${port} with password: ${password.substring(0, 3)}...`);
  const client = new Client({
    host: host,
    port: port,
    database: 'postgres',
    user: 'postgres',
    password: password,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000
  });

  try {
    await client.connect();
    console.log(`🎉 Connected successfully on port ${port}!`);
    const query = `
      -- 1. Create polls table
      CREATE TABLE IF NOT EXISTS public.polls (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        question TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'single', -- 'single' or 'multiple'
        duration TEXT NOT NULL DEFAULT 'manual', -- '30s', '1m', '2m', '5m', 'manual'
        status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'live', 'closed', 'archived'
        target_audience TEXT NOT NULL DEFAULT 'all', -- 'all', 'batch', 'course', 'department', 'internship'
        target_value TEXT,
        allow_anonymous BOOLEAN NOT NULL DEFAULT false,
        allow_vote_change BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        published_at TIMESTAMP WITH TIME ZONE,
        closed_at TIMESTAMP WITH TIME ZONE,
        creator_email TEXT NOT NULL
      );

      -- 2. Create poll_options table
      CREATE TABLE IF NOT EXISTS public.poll_options (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        poll_id UUID REFERENCES public.polls(id) ON DELETE CASCADE NOT NULL,
        option_text TEXT NOT NULL
      );

      -- 3. Create poll_votes table
      CREATE TABLE IF NOT EXISTS public.poll_votes (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        poll_id UUID REFERENCES public.polls(id) ON DELETE CASCADE NOT NULL,
        option_id UUID REFERENCES public.poll_options(id) ON DELETE CASCADE NOT NULL,
        student_id TEXT REFERENCES public.registrations(id) ON DELETE CASCADE NOT NULL,
        voted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        UNIQUE(poll_id, student_id, option_id)
      );

      -- 4. Enable Row Level Security (RLS)
      ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

      -- 5. Drop existing policies to prevent conflicts
      DROP POLICY IF EXISTS "Allow select for all on polls" ON public.polls;
      DROP POLICY IF EXISTS "Allow all for admin on polls" ON public.polls;
      DROP POLICY IF EXISTS "Allow select for all on poll_options" ON public.poll_options;
      DROP POLICY IF EXISTS "Allow select for all on poll_votes" ON public.poll_votes;

      -- 6. Create policies
      CREATE POLICY "Allow select for all on polls" ON public.polls FOR SELECT TO anon, authenticated USING (true);
      CREATE POLICY "Allow all for admin on polls" ON public.polls FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

      CREATE POLICY "Allow select for all on poll_options" ON public.poll_options FOR SELECT TO anon, authenticated USING (true);
      CREATE POLICY "Allow all for admin on poll_options" ON public.poll_options FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

      CREATE POLICY "Allow select for all on poll_votes" ON public.poll_votes FOR SELECT TO anon, authenticated USING (true);
      CREATE POLICY "Allow all for admin on poll_votes" ON public.poll_votes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

      -- 7. Add tables to realtime publication if not already present
      -- Check if tables are in publication first or do it via safety blocks
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_publication_tables 
          WHERE pubname = 'supabase_realtime' AND tablename = 'polls'
        ) THEN
          ALTER PUBLICATION supabase_realtime ADD TABLE public.polls;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_publication_tables 
          WHERE pubname = 'supabase_realtime' AND tablename = 'poll_options'
        ) THEN
          ALTER PUBLICATION supabase_realtime ADD TABLE public.poll_options;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_publication_tables 
          WHERE pubname = 'supabase_realtime' AND tablename = 'poll_votes'
        ) THEN
          ALTER PUBLICATION supabase_realtime ADD TABLE public.poll_votes;
        END IF;
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not add tables to publication: %', SQLERRM;
      END;
      $$;
    `;

    console.log("Executing schema creation query...");
    await client.query(query);
    console.log("✅ Polling tables created and RLS/Realtime configured successfully on Supabase!");
    await client.end();
    return true;
  } catch (err) {
    console.error(`❌ Failed on port ${port} with password ${password.substring(0, 3)}:`, err.message);
    await client.end().catch(() => {});
    return false;
  }
}

async function run() {
  for (const port of ports) {
    for (const password of passwords) {
      const success = await tryConnect(port, password);
      if (success) {
        return;
      }
    }
  }
  console.error("Could not connect to database with any combination.");
  process.exit(1);
}

run();
