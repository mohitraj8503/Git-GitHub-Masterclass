import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { completeTaskForEnrollment } from "@/lib/tasks";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { enrollmentNumber, name, email, message } = body || {};

    if (!enrollmentNumber || !name || !email || !message) {
      return NextResponse.json({ success: false, error: "Name, email, and message are required." }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ success: false, error: "Server storage is unavailable." }, { status: 500 });
    }

    const { error: insertErr } = await supabaseAdmin.from("feedback").insert({
      enrollment_number: enrollmentNumber,
      name,
      email,
      message,
      submitted_at: new Date().toISOString(),
    });

    if (insertErr) {
      console.error("Feedback insert failed:", insertErr);
      return NextResponse.json({ success: false, error: insertErr.message }, { status: 500 });
    }

    const taskResult = await completeTaskForEnrollment(enrollmentNumber, "fill_feedback", {
      source: "feedback-form",
      metadata: { email },
    });

    return NextResponse.json({
      success: true,
      feedbackSaved: true,
      task: taskResult,
    });
  } catch (error: any) {
    console.error("Feedback submission failed:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
