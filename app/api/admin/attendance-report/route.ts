import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { WORKSHOP_DAYS } from "@/lib/config";

export const dynamic = "force-dynamic";

const WORKING_DIR = process.cwd();

async function getLocalData() {
  const fs = await import("fs").then((mod) => mod.default ?? mod);
  const path = await import("path").then((mod) => mod.default ?? mod);
  const registrationsPath = path.join(WORKING_DIR, "data", "registrations.json");
  const attendancePath = path.join(WORKING_DIR, "data", "attendance.json");
  let registrations: any[] = [];
  let attendance: any[] = [];
  if (fs.existsSync(registrationsPath)) {
    registrations = JSON.parse(fs.readFileSync(registrationsPath, "utf8"));
  }
  if (fs.existsSync(attendancePath)) {
    attendance = JSON.parse(fs.readFileSync(attendancePath, "utf8"));
  }
  return { registrations, attendance };
}

export async function GET() {
  try {
    let registrations: any[] = [];
    let attendance: any[] = [];
    let totalRegistered = 0;

    if (supabaseAdmin) {
      // Fetch registrations
      const { data: regData } = await supabaseAdmin
        .from("registrations")
        .select("id, enrollment_number, name, branch, year_of_study");
      registrations = regData || [];
      totalRegistered = registrations.length;

      // Fetch all attendance records
      const { data: attData } = await supabaseAdmin
        .from("attendance")
        .select("student_id, session_day, verified_at");
      attendance = attData || [];

      // Build student map for quick lookup
      const studentMap = new Map(
        registrations.map((r) => [r.id, { ...r, attendedDays: new Set<number>() }])
      );

      // Populate attendedDays per student
      attendance.forEach((a) => {
        const student = studentMap.get(a.student_id);
        if (student) {
          student.attendedDays.add(a.session_day);
        }
      });

      // Per-day attendance counts
      const perDayCounts: { [day: number]: number } = {};
      attendance.forEach((a) => {
        perDayCounts[a.session_day] = (perDayCounts[a.session_day] ?? 0) + 1;
      });

      // Build perDay array for all days 1..WORKSHOP_DAYS
      const perDay = [];
      for (let day = 1; day <= WORKSHOP_DAYS; day++) {
        const checkedIn = perDayCounts[day] ?? 0;
        const pct = totalRegistered > 0 ? Math.round((checkedIn / totalRegistered) * 100) : 0;
        perDay.push({ day, checkedIn, pct });
      }

      // Days with at least one attendance (for overall rate denominator)
      const daysWithAttendance = new Set(attendance.map((a) => a.session_day));
      const daysHeld = daysWithAttendance.size;
      const totalCheckins = attendance.length;
      const overallRate =
        totalRegistered > 0 && daysHeld > 0
          ? Math.round((totalCheckins / (totalRegistered * daysHeld)) * 100)
          : 0;

      // Build students array with presentDays
      const students = Array.from(studentMap.values()).map((s) => {
        const presentDays = Array.from(s.attendedDays.values()).sort((a: any, b: any) => Number(a) - Number(b));
        return {
          enrollmentNumber: s.enrollment_number,
          name: s.name,
          branch: s.branch || "",
          yearOfStudy: s.year_of_study || "",
          presentDays,
        };
      });

      return NextResponse.json({
        success: true,
        totalRegistered,
        overallRate,
        perDay,
        students,
      });
    } else {
      // Local fallback
      const { registrations: localRegs, attendance: localAtt } = await getLocalData();
      registrations = localRegs;
      attendance = localAtt;
      totalRegistered = registrations.length;

      // Build student map
      const studentMap = new Map(
        registrations.map((r) => [r.id, { ...r, attendedDays: new Set<number>() }])
      );

      // Normalize field names: local data may use sessionDay or session_day
      attendance.forEach((a) => {
        const day = a.session_day ?? a.sessionDay;
        const studentId = a.student_id ?? a.studentId;
        const student = studentMap.get(studentId);
        if (student) {
          student.attendedDays.add(day);
        }
      });

      // Per-day counts
      const perDayCounts: { [day: number]: number } = {};
      attendance.forEach((a) => {
        const day = a.session_day ?? a.sessionDay;
        perDayCounts[day] = (perDayCounts[day] ?? 0) + 1;
      });

      // Build perDay array for all days
      const perDay = [];
      for (let day = 1; day <= WORKSHOP_DAYS; day++) {
        const checkedIn = perDayCounts[day] ?? 0;
        const pct = totalRegistered > 0 ? Math.round((checkedIn / totalRegistered) * 100) : 0;
        perDay.push({ day, checkedIn, pct });
      }

      // Days with at least one attendance
      const daysWithAttendance = new Set(
        attendance.map((a) => a.session_day ?? a.sessionDay)
      );
      const daysHeld = daysWithAttendance.size;
      const totalCheckins = attendance.length;
      const overallRate =
        totalRegistered > 0 && daysHeld > 0
          ? Math.round((totalCheckins / (totalRegistered * daysHeld)) * 100)
          : 0;

      // Build students array
      const students = Array.from(studentMap.values()).map((s) => {
        const presentDays = Array.from(s.attendedDays.values()).sort((a: any, b: any) => Number(a) - Number(b));
        return {
          enrollmentNumber: s.enrollment_number,
          name: s.name,
          branch: s.branch || "",
          yearOfStudy: s.year_of_study || "",
          presentDays,
        };
      });

      return NextResponse.json({
        success: true,
        totalRegistered,
        overallRate,
        perDay,
        students,
      });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
