import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Server-only client using the service role key. It BYPASSES Row Level Security,
// so it MUST never be imported into a client component or shipped to the browser.
// Use it for privileged server-side reads/writes (e.g. admin data) instead of the
// anon key, which would otherwise be blocked by RLS and silently fall back to local data.
export const supabaseAdmin =
  supabaseUrl && supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : null;
