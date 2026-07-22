import { randomBytes } from "crypto";
import { supabaseAdmin } from "./supabaseServer";
import { ATTENDANCE_WINDOW_MINUTES } from "./config";

import { awardXp } from "./xp";

export const WINDOW_MS = ATTENDANCE_WINDOW_MINUTES * 60 * 1000;

/** Resolve a student's registration id from their enrollment number. */
export async function getRegistrationId(enrollmentNumber: string): Promise<string | null> {
  if (!supabaseAdmin) return null;
  const { data } = await supabaseAdmin
    .from("registrations")
    .select("id")
    .ilike("enrollment_number", enrollmentNumber.trim())
    .maybeSingle();
  return (data as any)?.id ?? null;
}

/** Return the single currently-active, non-expired attendance window (if any). */
export async function getActiveWindow(): Promise<any | null> {
  if (!supabaseAdmin) return null;
  const now = new Date().toISOString();
  const { data } = await supabaseAdmin
    .from("attendance_windows")
    .select("*")
    .eq("is_active", true)
    .gt("expires_at", now)
    .order("opened_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

export function generateSessionToken(): string {
  return randomBytes(24).toString("base64url");
}

/**
 * Perform a real, server-validated attendance check-in.
 * All integrity checks happen here — the client only supplies the enrollment
 * number and the window id it observed. Never trusts a client-sent timestamp.
 */
export async function performCheckIn(enrollmentNumber: string, windowId: string) {
  if (!supabaseAdmin) {
    return { ok: false, status: 500, message: "Server storage is unavailable." };
  }

  const regId = await getRegistrationId(enrollmentNumber);
  if (!regId) {
    return { ok: false, status: 404, message: "Student registration not found." };
  }

  const { data: win, error: wErr } = await supabaseAdmin
    .from("attendance_windows")
    .select("id, day, is_active, expires_at, session_token")
    .eq("id", windowId)
    .maybeSingle();

  if (wErr) return { ok: false, status: 500, message: wErr.message };
  if (!win || !win.is_active || new Date(win.expires_at).getTime() <= Date.now()) {
    return { ok: false, status: 410, message: "This check-in window has closed." };
  }

  // Prevent duplicate check-ins for the same day (also enforced by a unique constraint).
  const { data: existing } = await supabaseAdmin
    .from("attendance")
    .select("id")
    .eq("student_id", regId)
    .eq("session_day", win.day)
    .maybeSingle();
  if (existing) {
    return { ok: false, status: 409, message: "You have already checked in for this day." };
  }

  const { data: log, error: insErr } = await supabaseAdmin
    .from("attendance")
    .insert({
      student_id: regId,
      session_day: win.day,
      window_id: win.id,
      session_token: win.session_token,
    })
    .select()
    .single();

  if (insErr) return { ok: false, status: 500, message: insErr.message };

  const xpResult = await awardXp(enrollmentNumber, "mark_attendance", `day_${win.day}`);

  return { ok: true, status: 200, message: "Checked in.", log, day: win.day, xpResult };
}
