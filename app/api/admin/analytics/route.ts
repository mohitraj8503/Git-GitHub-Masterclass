import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { WORKSHOP_DAYS } from "@/lib/config";

const TASK_XP_REWARDS: Record<string, number> = {
  mark_attendance: 20,
  download_slides: 10,
  complete_assignment: 40,
  push_github: 20,
  fill_feedback: 10,
};

export async function GET() {
  try {
    let totalStudents = 0;
    let avgAttendancePct = 0;
    let resourcesPublished = 0;
    let assignmentsPendingReview = 0;
    let topPerformer: { name: string; xp: number } | null = null;
    let sessionsCompleted = 0;
    let totalAssignments = 0;
    let gradedSubmissions = 0;
    let totalAnnouncements = 0;

    // Per-day attendance breakdown: { day: 1..7, attendeeCount, percentage }
    const perDayAttendance: { day: number; attendeeCount: number; percentage: number }[] = [];

    // Recent check-ins (last 5) for "Today's Check-ins" enrichment
    let recentCheckins: { name: string; time: string; day: number }[] = [];

    // Resources per session day for Workshop Journey
    const resourcesPerDay: Record<number, number> = {};

    if (supabaseAdmin) {
      // Total students
      const { count: regCount } = await supabaseAdmin
        .from("registrations")
        .select("*", { count: "exact", head: true });
      totalStudents = regCount || 0;

      // Attendance: get all attendance records
      const { data: attData } = await supabaseAdmin
        .from("attendance")
        .select("student_id, session_day, verified_at");
      const attCount = attData?.length || 0;
      
      // Calculate sessions completed dynamically based on unique attendance days
      const uniqueDays = new Set(attData?.map(r => r.session_day) || []);
      sessionsCompleted = uniqueDays.size;

      // Calculate attendance rate dynamically relative to conducted days
      if (totalStudents > 0) {
        avgAttendancePct = sessionsCompleted > 0
          ? Math.min(100, Math.round((attCount / (totalStudents * sessionsCompleted)) * 100))
          : 0;
      }

      // Per-day attendance breakdown
      for (let day = 1; day <= WORKSHOP_DAYS; day++) {
        const dayRecords = attData?.filter(r => r.session_day === day) || [];
        const count = dayRecords.length;
        perDayAttendance.push({
          day,
          attendeeCount: count,
          percentage: totalStudents > 0 ? Math.min(100, Math.round((count / totalStudents) * 100)) : 0,
        });
      }

      // Recent check-ins (last 5 across all days)
      if (attData && attData.length > 0) {
        const sorted = [...attData].sort((a, b) =>
          new Date(b.verified_at || 0).getTime() - new Date(a.verified_at || 0).getTime()
        ).slice(0, 5);

        // Fetch student names for these check-ins
        const studentIds = sorted.map(c => c.student_id).filter((v, i, self) => self.indexOf(v) === i);
        const { data: studentNames } = await supabaseAdmin
          .from("registrations")
          .select("id, name")
          .in("id", studentIds);

        const nameMap = new Map((studentNames || []).map(s => [s.id, s.name]));
        recentCheckins = sorted.map(c => ({
          name: nameMap.get(c.student_id) || "Unknown",
          time: c.verified_at || "",
          day: c.session_day,
        }));
      }

      // Resources published + per-day breakdown
      const { data: resData } = await supabaseAdmin
        .from("resources")
        .select("id, session_number");
      resourcesPublished = resData?.length || 0;
      (resData || []).forEach((r: any) => {
        if (r.session_number) {
          resourcesPerDay[r.session_number] = (resourcesPerDay[r.session_number] || 0) + 1;
        }
      });

      // Assignments: total count
      const { count: assCount } = await supabaseAdmin
        .from("assignments")
        .select("*", { count: "exact", head: true });
      totalAssignments = assCount || 0;

      // Submissions: pending + graded
      const { data: subData } = await supabaseAdmin
        .from("submissions")
        .select("id, marks_obtained");
      const allSubs = subData || [];
      assignmentsPendingReview = allSubs.filter(s => s.marks_obtained === null || s.marks_obtained === undefined).length;
      gradedSubmissions = allSubs.filter(s => s.marks_obtained !== null && s.marks_obtained !== undefined).length;

      // Announcements count
      const { count: annCount } = await supabaseAdmin
        .from("announcements")
        .select("*", { count: "exact", head: true });
      totalAnnouncements = annCount || 0;

      // Top performer: student with most XP calculated dynamically
      const { data: regsData } = await supabaseAdmin.from("registrations").select("id, name, enrollment_number");
      const { data: completions } = await supabaseAdmin.from("task_completions").select("enrollment_number, task_id");
      const { data: awards } = await supabaseAdmin.from("xp_awards").select("student_id, amount");

      const completionsMap: Record<string, number> = {};
      (completions || []).forEach((c: any) => {
        const key = (c.enrollment_number || "").trim().toUpperCase();
        const reward = TASK_XP_REWARDS[c.task_id] || 0;
        completionsMap[key] = (completionsMap[key] || 0) + reward;
      });

      const awardsMap: Record<string, number> = {};
      (awards || []).forEach((a: any) => {
        const key = a.student_id;
        awardsMap[key] = (awardsMap[key] || 0) + (a.amount || 0);
      });

      let topName = "Unknown";
      let topXp = 0;
      (regsData || []).forEach((r: any) => {
        const keyComp = (r.enrollment_number || "").trim().toUpperCase();
        const keyAward = r.id;
        const total = (completionsMap[keyComp] || 0) + (awardsMap[keyAward] || 0);
        if (total > topXp) {
          topXp = total;
          topName = r.name;
        }
      });
      if (regsData && regsData.length > 0) {
        topPerformer = { name: topName, xp: topXp };
      }

      return NextResponse.json({
        success: true,
        stats: {
          totalStudents,
          avgAttendancePct,
          resourcesPublished,
          assignmentsPendingReview,
          topPerformer,
          sessionsCompleted,
          totalAssignments,
          gradedSubmissions,
          totalAnnouncements,
          perDayAttendance,
          recentCheckins,
          resourcesPerDay,
          totalRegistrations: totalStudents,
          activeStudents: totalStudents,
          attendanceRate: avgAttendancePct,
          assignmentCompletionRate: totalStudents ? Math.round(((attCount) / totalStudents) * 100) : 0,
        }
      });
    }

    // === Local JSON Fallback ===
    const dataDir = path.join(process.cwd(), "data");
    const regPath = path.join(dataDir, "registrations.json");
    const attPath = path.join(dataDir, "attendance.json");
    const subPath = path.join(dataDir, "submissions.json");
    const resPath = path.join(dataDir, "resources.json");
    const assPath = path.join(dataDir, "assignments.json");
    const annPath = path.join(dataDir, "announcements.json");

    let registrations: any[] = [];
    let attendance: any[] = [];
    let submissions: any[] = [];
    let resources: any[] = [];
    let assignmentsLocal: any[] = [];
    let announcementsLocal: any[] = [];

    if (fs.existsSync(regPath)) registrations = JSON.parse(fs.readFileSync(regPath, "utf8"));
    if (fs.existsSync(attPath)) attendance = JSON.parse(fs.readFileSync(attPath, "utf8"));
    if (fs.existsSync(subPath)) submissions = JSON.parse(fs.readFileSync(subPath, "utf8"));
    if (fs.existsSync(resPath)) resources = JSON.parse(fs.readFileSync(resPath, "utf8"));
    if (fs.existsSync(assPath)) assignmentsLocal = JSON.parse(fs.readFileSync(assPath, "utf8"));
    if (fs.existsSync(annPath)) announcementsLocal = JSON.parse(fs.readFileSync(annPath, "utf8"));

    totalStudents = registrations.length;
    resourcesPublished = resources.length;
    totalAssignments = assignmentsLocal.length;
    totalAnnouncements = announcementsLocal.length;
    assignmentsPendingReview = submissions.filter((s: any) => s.marks_obtained === null || s.marks_obtained === undefined).length;
    gradedSubmissions = submissions.filter((s: any) => s.marks_obtained !== null && s.marks_obtained !== undefined).length;

    // Calculate sessions completed dynamically locally
    const uniqueDaysLocal = new Set(attendance.map((r: any) => r.session_day || r.sessionDay));
    sessionsCompleted = uniqueDaysLocal.size;

    if (totalStudents > 0) {
      avgAttendancePct = sessionsCompleted > 0
        ? Math.min(100, Math.round((attendance.length / (totalStudents * sessionsCompleted)) * 100))
        : 0;
    }

    // Per-day attendance breakdown (local)
    for (let day = 1; day <= WORKSHOP_DAYS; day++) {
      const dayRecords = attendance.filter((r: any) => (r.session_day || r.sessionDay) === day);
      perDayAttendance.push({
        day,
        attendeeCount: dayRecords.length,
        percentage: totalStudents > 0 ? Math.min(100, Math.round((dayRecords.length / totalStudents) * 100)) : 0,
      });
    }

    // Resources per day (local)
    resources.forEach((r: any) => {
      const sn = r.session_number || r.sessionNumber;
      if (sn) {
        resourcesPerDay[sn] = (resourcesPerDay[sn] || 0) + 1;
      }
    });

    // Top performer from local data dynamically calculated
    const completionsPath = path.join(dataDir, "task_completions.json");
    let completionsLocal: any[] = [];
    if (fs.existsSync(completionsPath)) {
      completionsLocal = JSON.parse(fs.readFileSync(completionsPath, "utf8"));
    }

    const awardsPath = path.join(dataDir, "xp_awards.json");
    let awardsLocal: any[] = [];
    if (fs.existsSync(awardsPath)) {
      awardsLocal = JSON.parse(fs.readFileSync(awardsPath, "utf8"));
    }

    const completionsMapLocal: Record<string, number> = {};
    completionsLocal.forEach((c: any) => {
      const key = (c.enrollmentNumber || c.enrollment_number || "").trim().toUpperCase();
      const reward = TASK_XP_REWARDS[c.taskId || c.task_id] || 0;
      completionsMapLocal[key] = (completionsMapLocal[key] || 0) + reward;
    });

    const awardsMapLocal: Record<string, number> = {};
    awardsLocal.forEach((a: any) => {
      const key = a.student_id || a.studentId;
      awardsMapLocal[key] = (awardsMapLocal[key] || 0) + (a.amount || 0);
    });

    let topNameLocal = "Unknown";
    let topXpLocal = 0;
    registrations.forEach((r: any) => {
      const keyComp = (r.enrollmentNumber || r.enrollment_number || "").trim().toUpperCase();
      const keyAward = r.id || r.enrollmentNumber;
      const total = (completionsMapLocal[keyComp] || 0) + (awardsMapLocal[keyAward] || 0);
      if (total > topXpLocal) {
        topXpLocal = total;
        topNameLocal = r.name;
      }
    });
    if (registrations.length > 0) {
      topPerformer = { name: topNameLocal, xp: topXpLocal };
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalStudents,
        avgAttendancePct,
        resourcesPublished,
        assignmentsPendingReview,
        topPerformer,
        sessionsCompleted,
        totalAssignments,
        gradedSubmissions,
        totalAnnouncements,
        perDayAttendance,
        recentCheckins,
        resourcesPerDay,
        totalRegistrations: totalStudents,
        activeStudents: totalStudents,
        attendanceRate: avgAttendancePct,
        assignmentCompletionRate: totalStudents ? Math.round((submissions.length / totalStudents) * 100) : 0,
      }
    });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
