import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { completeTaskForEnrollment } from "@/lib/tasks";
import { getSession } from "@/lib/session";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized: Admins only." }, { status: 401 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ success: false, error: "Server storage is unavailable." }, { status: 500 });
    }

    const { data, error } = await supabaseAdmin
      .from("feedback")
      .select("*")
      .order("submitted_at", { ascending: false });

    if (error) {
      console.error("Failed to query feedback:", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      feedback: data || [],
    });
  } catch (error: any) {
    console.error("GET feedback failed:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { enrollmentNumber, name, email, message, rating } = body || {};

    if (!enrollmentNumber || !name || !email || !message || rating === undefined) {
      return NextResponse.json({ success: false, error: "Name, email, message, and rating are required." }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ success: false, error: "Server storage is unavailable." }, { status: 500 });
    }

    const { error: insertErr } = await supabaseAdmin.from("feedback").insert({
      enrollment_number: enrollmentNumber,
      name,
      email,
      message,
      rating: Number(rating),
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
