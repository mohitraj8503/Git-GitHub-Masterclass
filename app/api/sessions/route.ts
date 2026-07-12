import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { SCHEDULE_DAYS } from "@/lib/sessions";

export const dynamic = "force-dynamic";

function getSessionDayFromAssignment(assignment: { title: string }): number | null {
  const match = assignment.title.match(/Day\s*(\d+)/i);
  return match ? parseInt(match[1]) : null;
}

export async function GET() {
  try {
    // Counts mapping
    const resourceCounts: Record<number, number> = {};
    const assignmentCounts: Record<number, number> = {};

    // Initialize counts for days 1 to 7
    for (let day = 1; day <= 7; day++) {
      resourceCounts[day] = 0;
      assignmentCounts[day] = 0;
    }

    if (supabaseAdmin) {
      // 1. Fetch resources and count by session_number (day)
      const { data: resData, error: resError } = await supabaseAdmin
        .from("resources")
        .select("session_number");

      if (!resError && resData) {
        resData.forEach((res: any) => {
          const day = Number(res.session_number);
          if (day >= 1 && day <= 7) {
            resourceCounts[day] = (resourceCounts[day] || 0) + 1;
          }
        });
      }

      // 2. Fetch assignments and parse title to count by session day
      const { data: assData, error: assError } = await supabaseAdmin
        .from("assignments")
        .select("title");

      if (!assError && assData) {
        assData.forEach((ass: any) => {
          const day = getSessionDayFromAssignment(ass);
          if (day && day >= 1 && day <= 7) {
            assignmentCounts[day] = (assignmentCounts[day] || 0) + 1;
          }
        });
      }

      const sessions = SCHEDULE_DAYS.map((sd) => ({
        ...sd,
        resource_count: resourceCounts[sd.day] || 0,
        assignment_count: assignmentCounts[sd.day] || 0,
      }));

      return NextResponse.json({ success: true, sessions });
    }

    // Local Fallback counts
    const dataDir = path.join(process.cwd(), "data");
    const resPath = path.join(dataDir, "resources.json");
    const assPath = path.join(dataDir, "assignments.json");

    if (fs.existsSync(resPath)) {
      const resources = JSON.parse(fs.readFileSync(resPath, "utf8"));
      resources.forEach((res: any) => {
        const day = Number(res.session_number);
        if (day >= 1 && day <= 7) {
          resourceCounts[day] = (resourceCounts[day] || 0) + 1;
        }
      });
    }

    if (fs.existsSync(assPath)) {
      const assignments = JSON.parse(fs.readFileSync(assPath, "utf8"));
      assignments.forEach((ass: any) => {
        const day = getSessionDayFromAssignment(ass);
        if (day && day >= 1 && day <= 7) {
          assignmentCounts[day] = (assignmentCounts[day] || 0) + 1;
        }
      });
    }

    const sessions = SCHEDULE_DAYS.map((sd) => ({
      ...sd,
      resource_count: resourceCounts[sd.day] || 0,
      assignment_count: assignmentCounts[sd.day] || 0,
    }));

    return NextResponse.json({ success: true, sessions });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
