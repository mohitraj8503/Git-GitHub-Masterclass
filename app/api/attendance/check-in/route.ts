import { NextResponse } from "next/server";
import { performCheckIn } from "@/lib/attendance";
import { completeTaskForEnrollment } from "@/lib/tasks";

export const dynamic = "force-dynamic";

// POST: student check-in. All validation is server-side in performCheckIn.
export async function POST(request: Request) {
  try {
    const { enrollment_number, window_id } = await request.json();
    if (!enrollment_number || !window_id) {
      return NextResponse.json(
        { success: false, error: "enrollment_number and window_id are required." },
        { status: 400 }
      );
    }

    const result = await performCheckIn(enrollment_number, window_id);
    if (result.ok) {
      const taskResult = await completeTaskForEnrollment(enrollment_number, "mark_attendance", {
        source: "attendance-check-in",
        metadata: { window_id },
      });
      return NextResponse.json(
        {
          success: true,
          log: result.log,
          day: result.day,
          task: taskResult,
        },
        { status: result.status }
      );
    }

    return NextResponse.json(
      { success: false, error: result.message },
      { status: result.status }
    );
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
