import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { getRegistrationId } from "@/lib/attendance";

export const dynamic = "force-dynamic";

const ATTENDANCE_FILE = path.join(process.cwd(), "data", "attendance.json");
const SUBMISSIONS_FILE = path.join(process.cwd(), "data", "submissions.json");
const ASSIGNMENTS_FILE = path.join(process.cwd(), "data", "assignments.json");

function readJson(file: string) {
  if (!fs.existsSync(file)) return [];
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return [];
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const enrollment = searchParams.get("enrollment_number");

    if (!enrollment) {
      return NextResponse.json({ success: false, error: "enrollment_number is required." }, { status: 400 });
    }

    let regId: string | null = null;
    let attendanceLogs: any[] = [];
    let submissionLogs: any[] = [];
    let totalAssignments = 0;

    if (supabaseAdmin) {
      regId = await getRegistrationId(enrollment);
      if (regId) {
        // Query attendance
        const { data: attData } = await supabaseAdmin
          .from("attendance")
          .select("session_day")
          .eq("student_id", regId);
        if (attData) attendanceLogs = attData;

        // Query submissions
        const { data: subData } = await supabaseAdmin
          .from("submissions")
          .select("repo_url, marks_obtained")
          .eq("student_id", regId);
        if (subData) submissionLogs = subData;

        // Query assignments
        const { count: assCount } = await supabaseAdmin
          .from("assignments")
          .select("id", { count: "exact", head: true });
        totalAssignments = assCount || 0;
      }
    }

    // Local JSON Fallback if Supabase is offline or registration not found there
    if (!regId) {
      const localAttendance = readJson(ATTENDANCE_FILE);
      const localSubmissions = readJson(SUBMISSIONS_FILE);
      const localAssignments = readJson(ASSIGNMENTS_FILE);

      // Try matching by enrollment or regId (which might be enrollment in fallback)
      attendanceLogs = localAttendance.filter(
        (a: any) => a.student_id === enrollment || a.student_id === regId
      );
      submissionLogs = localSubmissions.filter(
        (s: any) => s.student_id === enrollment || s.student_id === regId
      );
      totalAssignments = localAssignments.length;
    }

    // Determine unique days attended
    const attendedDays = Array.from(new Set(attendanceLogs.map((a: any) => a.session_day)));
    const uniqueAttendedCount = attendedDays.length;

    // Badge Evaluation Rules:
    const unlockedBadges: string[] = [];

    // 1. First Check-In (first_attendance)
    if (uniqueAttendedCount >= 1) {
      unlockedBadges.push("first_attendance");
    }

    // 2. First Repo Submit (first_github_repo)
    const hasRepoSubmit = submissionLogs.some(
      (sub: any) => sub.repo_url && String(sub.repo_url).toLowerCase().includes("github.com")
    );
    if (hasRepoSubmit) {
      unlockedBadges.push("first_github_repo");
    }

    // 3. First HW Done (first_assignment)
    const hasGradedHomework = submissionLogs.some(
      (sub: any) => sub.marks_obtained !== null && sub.marks_obtained !== undefined
    );
    if (hasGradedHomework) {
      unlockedBadges.push("first_assignment");
    }

    // 4. Perfect Attendance (perfect_attendance_badge)
    if (uniqueAttendedCount >= 7) {
      unlockedBadges.push("perfect_attendance_badge");
    }

    // 5. Assignment Master (assignment_master_badge)
    const gradedCount = submissionLogs.filter(
      (sub: any) => sub.marks_obtained !== null && sub.marks_obtained !== undefined
    ).length;
    if (totalAssignments > 0 && gradedCount >= totalAssignments) {
      unlockedBadges.push("assignment_master_badge");
    }

    // 6. Workshop Warrior (workshop_warrior_badge)
    if (uniqueAttendedCount >= 5) {
      unlockedBadges.push("workshop_warrior_badge");
    }

    // 7. Git & GitHub Master (git_github_master_badge)
    if (uniqueAttendedCount >= 7 && totalAssignments > 0 && gradedCount >= totalAssignments) {
      unlockedBadges.push("git_github_master_badge");
    }

    return NextResponse.json({
      success: true,
      unlockedBadges,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
