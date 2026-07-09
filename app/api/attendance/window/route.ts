import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { getRegistrationId, getActiveWindow, generateSessionToken, WINDOW_MS } from "@/lib/attendance";

export const dynamic = "force-dynamic";

// GET: the currently active window (if any) plus the live list of students who
// have checked in during it. Optionally reports whether a given student has
// already checked in for that day.
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const enrollment = searchParams.get("enrollment_number");

    if (!supabaseAdmin) {
      return NextResponse.json({ success: true, window: null });
    }

    const window = await getActiveWindow();
    if (!window) {
      return NextResponse.json({ success: true, window: null });
    }

    const { data: checkins } = await supabaseAdmin
      .from("attendance")
      .select("verified_at, registrations(name, enrollment_number)")
      .eq("window_id", window.id)
      .order("verified_at", { ascending: true });

    const list = (checkins || []).map((c: any) => ({
      name: c.registrations?.name || "Unknown",
      enrollment_number: c.registrations?.enrollment_number || "",
      checked_in_at: c.verified_at,
    }));

    let already_checked_in = false;
    if (enrollment) {
      const regId = await getRegistrationId(enrollment);
      if (regId) {
        const { data: existing } = await supabaseAdmin
          .from("attendance")
          .select("id")
          .eq("student_id", regId)
          .eq("session_day", window.day)
          .maybeSingle();
        already_checked_in = !!existing;
      }
    }

    return NextResponse.json({
      success: true,
      window: {
        id: window.id,
        day: window.day,
        opened_at: window.opened_at,
        expires_at: window.expires_at,
        session_token: window.session_token,
      },
      checkins: list,
      already_checked_in,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST: admin opens a fresh, server-tracked window for a given day.
export async function POST(request: Request) {
  try {
    const { day } = await request.json();
    if (!day || day < 1 || day > 7) {
      return NextResponse.json({ success: false, error: "A valid day (1-7) is required." }, { status: 400 });
    }
    if (!supabaseAdmin) {
      return NextResponse.json({ success: false, error: "Server storage is unavailable." }, { status: 500 });
    }

    // Close any currently-open windows, then open a new one with a fresh token.
    await supabaseAdmin.from("attendance_windows").update({ is_active: false }).eq("is_active", true);

    const token = generateSessionToken();
    const expires = new Date(Date.now() + WINDOW_MS).toISOString();

    const { data, error } = await supabaseAdmin
      .from("attendance_windows")
      .insert({ day: Number(day), expires_at: expires, is_active: true, session_token: token })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      window: {
        id: data.id,
        day: data.day,
        opened_at: data.opened_at,
        expires_at: data.expires_at,
        session_token: data.session_token,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
