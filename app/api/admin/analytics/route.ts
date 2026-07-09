import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET() {
  try {
    let registrationsCount = 0;
    let attendanceCount = 0;
    let submissionsCount = 0;

    if (supabaseAdmin) {
      const { count: regCount, error: regErr } = await supabaseAdmin
        .from("registrations")
        .select("*", { count: "exact", head: true });

      const { count: attCount, error: attErr } = await supabaseAdmin
        .from("attendance")
        .select("*", { count: "exact", head: true });

      const { count: subCount, error: subErr } = await supabaseAdmin
        .from("submissions")
        .select("*", { count: "exact", head: true });

      if (!regErr && !attErr && !subErr) {
        return NextResponse.json({
          success: true,
          stats: {
            totalRegistrations: regCount || 0,
            activeStudents: regCount || 0,
            attendanceRate: regCount ? Math.round(((attCount || 0) / (regCount * 7)) * 100) : 0,
            assignmentCompletionRate: regCount ? Math.round(((subCount || 0) / regCount) * 100) : 0,
          }
        });
      }
      console.warn("Supabase head count failed. Falling back to local stats.");
    }

    // Local JSON Fallback (real counts only — no fabricated defaults)
    const regPath = path.join(process.cwd(), "data", "registrations.json");
    const attPath = path.join(process.cwd(), "data", "attendance.json");
    const subPath = path.join(process.cwd(), "data", "submissions.json");

    if (fs.existsSync(regPath)) {
      registrationsCount = JSON.parse(fs.readFileSync(regPath, "utf8")).length;
    }

    if (fs.existsSync(attPath)) {
      attendanceCount = JSON.parse(fs.readFileSync(attPath, "utf8")).length;
    }

    if (fs.existsSync(subPath)) {
      submissionsCount = JSON.parse(fs.readFileSync(subPath, "utf8")).length;
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalRegistrations: registrationsCount,
        activeStudents: registrationsCount,
        attendanceRate: registrationsCount ? Math.round((attendanceCount / (registrationsCount * 7)) * 100) : 0,
        assignmentCompletionRate: registrationsCount ? Math.round((submissionsCount / registrationsCount) * 100) : 0,
      }
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
