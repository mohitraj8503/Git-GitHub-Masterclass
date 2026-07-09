import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

// POST: admin closes the active window early (or a specific window by id).
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { window_id } = body;

    if (!supabaseAdmin) {
      return NextResponse.json({ success: false, error: "Server storage is unavailable." }, { status: 500 });
    }

    let query = supabaseAdmin.from("attendance_windows").update({ is_active: false });
    if (window_id) query = query.eq("id", window_id);
    else query = query.eq("is_active", true);

    const { error } = await query;
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
