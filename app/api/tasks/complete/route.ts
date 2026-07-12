import { NextResponse } from "next/server";
import { completeTaskForEnrollment, getTaskCompletionsForEnrollment } from "@/lib/tasks";

export async function POST(request: Request) {
  try {
    const { enrollmentNumber, taskId, source, metadata } = await request.json();

    if (!enrollmentNumber || !taskId) {
      return NextResponse.json({ success: false, error: "Missing enrollment number or task ID." }, { status: 400 });
    }

    const result = await completeTaskForEnrollment(enrollmentNumber, taskId, { source, metadata });

    return NextResponse.json(result, { status: result.ok ? 200 : 500 });
  } catch (error: any) {
    console.error("Error completing task:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const enrollmentNumber = searchParams.get("enrollmentNumber");
    if (!enrollmentNumber) {
      return NextResponse.json({ success: false, error: "Missing enrollment number." }, { status: 400 });
    }

    const completions = await getTaskCompletionsForEnrollment(enrollmentNumber);
    return NextResponse.json({ success: true, completions });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
