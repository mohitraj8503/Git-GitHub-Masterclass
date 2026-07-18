import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { getRegistrationId, performCheckIn } from "@/lib/attendance";

export const dynamic = "force-dynamic";

// GET: a student's attendance history (resolved from enrollment number).
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const enrollment = searchParams.get("enrollment_number")?.trim();
    const studentId = searchParams.get("student_id")?.trim();

    if (!supabaseAdmin) {
      return NextResponse.json({ success: true, attendance: [] });
    }

    if (!enrollment && !studentId) {
      return NextResponse.json({ success: true, attendance: [] });
    }

    let query = supabaseAdmin
      .from("attendance")
      .select("*")
      .order("verified_at", { ascending: true });

    if (enrollment) {
      const regId = await getRegistrationId(enrollment);
      if (!regId) return NextResponse.json({ success: true, attendance: [] });
      query = query.eq("student_id", regId);
    } else if (studentId) {
      query = query.eq("student_id", studentId);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, attendance: data ?? [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST: check-in. Requires an active window — no window, no check-in.
// (Kept for backward compatibility; the student UI uses /api/attendance/check-in.)
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { enrollment_number, window_id } = body;
    if (!enrollment_number || !window_id) {
      return NextResponse.json(
        { success: false, error: "enrollment_number and window_id are required." },
        { status: 400 }
      );
    }
    const result = await performCheckIn(enrollment_number, window_id);
    return NextResponse.json(
      result.ok
        ? { success: true, log: result.log, day: result.day }
        : { success: false, error: result.message },
      { status: result.status }
    );
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
