import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { getActiveWindow } from "@/lib/attendance";

export const dynamic = "force-dynamic";

const DEFAULT_AUTH_SECRET = "githubpages-masterclass-admin-secret-key-default-32-chars";

export async function GET() {
  const start = Date.now();
  const supabaseConfigured = !!supabaseAdmin;
  const authSecret = process.env.ADMIN_SESSION_SECRET || "";
  const authConfigured = authSecret.length > 0 && authSecret !== DEFAULT_AUTH_SECRET;

  // --- Supabase DB connection health + latency ---
  let dbStatus: "connected" | "disconnected" = "disconnected";
  let dbLatency = 0;
  if (supabaseAdmin) {
    try {
      const t0 = Date.now();
      const { error } = await supabaseAdmin
        .from("registrations")
        .select("id")
        .limit(1);
      dbLatency = Date.now() - t0;
      if (!error) dbStatus = "connected";
    } catch {
      dbStatus = "disconnected";
    }
  }

  // --- Attendance window status (persisted in DB) ---
  let windowStatus: "open" | "closed" = "closed";
  let windowDay: number | null = null;
  if (supabaseAdmin) {
    try {
      const win = await getActiveWindow();
      if (win) {
        windowStatus = "open";
        windowDay = win.day ?? null;
      }
    } catch {
      windowStatus = "closed";
    }
  }

  // Total round-trip time for the health probe.
  const totalLatency = Date.now() - start;

  return NextResponse.json({
    success: true,
    health: {
      db: {
        status: dbStatus,
        latencyMs: dbLatency,
      },
      syncMode: supabaseConfigured ? "live" : "local_fallback",
      supabaseConfigured,
      window: {
        status: windowStatus,
        day: windowDay,
      },
      auth: {
        configured: authConfigured,
        mode: authConfigured ? "secure" : "default",
      },
      checkedAt: new Date().toISOString(),
      latencyMs: totalLatency,
    },
  });
}
