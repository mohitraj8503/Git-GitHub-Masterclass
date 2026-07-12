import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { completeTaskForEnrollment, getTaskCompletionsForEnrollment } from "@/lib/tasks";
import { awardXp } from "@/lib/xp";
import { getRegistrationId } from "@/lib/attendance";

export const dynamic = "force-dynamic";

// GET: load daily tasks checklist for the student
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const enrollment = searchParams.get("enrollment_number");

    if (!enrollment) {
      return NextResponse.json({ success: false, error: "enrollment_number is required." }, { status: 400 });
    }

    // --- XP & Completion Sync Block ---
    // If attendance or assignments exist but don't have XP transactions (or completions for today),
    // we award the XP retroactively and register the completions today!
    const regId = await getRegistrationId(enrollment);
    if (regId && supabaseAdmin) {
      // 1. Sync Attendance
      const { data: attLogs } = await supabaseAdmin
        .from("attendance")
        .select("session_day, created_at")
        .eq("student_id", regId);

      if (attLogs) {
        for (const log of attLogs) {
          const day = log.session_day;
          // Award XP (if not already awarded) for this day
          await awardXp(enrollment, "mark_attendance", `day_${day}`);
          
          // If the attendance was created today, make sure it is logged in task_completions today
          const logDate = new Date(log.created_at).toISOString().split("T")[0];
          const today = new Date().toISOString().split("T")[0];
          if (logDate === today) {
            const { data: existingComp } = await supabaseAdmin
              .from("task_completions")
              .select("id")
              .eq("enrollment_number", enrollment.trim().toUpperCase())
              .eq("task_id", "mark_attendance")
              .eq("completed_date", today)
              .maybeSingle();

            if (!existingComp) {
              await supabaseAdmin.from("task_completions").insert({
                enrollment_number: enrollment.trim().toUpperCase(),
                task_id: "mark_attendance",
                completed_date: today,
                source: "attendance-sync"
              });
            }
          }
        }
      }

      // 2. Sync Submissions (Assignments)
      const { data: subs } = await supabaseAdmin
        .from("submissions")
        .select("assignment_id, created_at")
        .eq("student_id", regId);

      if (subs) {
        for (const sub of subs) {
          await awardXp(enrollment, "submit_assignment", sub.assignment_id);
          
          const logDate = new Date(sub.created_at).toISOString().split("T")[0];
          const today = new Date().toISOString().split("T")[0];
          if (logDate === today) {
            const { data: existingComp } = await supabaseAdmin
              .from("task_completions")
              .select("id")
              .eq("enrollment_number", enrollment.trim().toUpperCase())
              .eq("task_id", "complete_assignment")
              .eq("completed_date", today)
              .maybeSingle();

            if (!existingComp) {
              await supabaseAdmin.from("task_completions").insert({
                enrollment_number: enrollment.trim().toUpperCase(),
                task_id: "complete_assignment",
                completed_date: today,
                source: "submissions-sync"
              });
            }
          }
        }
      }
    }

    const completedTasksToday = await getTaskCompletionsForEnrollment(enrollment);

    // Get unlocked achievements
    let unlockedBadges: string[] = [];
    if (supabaseAdmin) {
      const { data: achData } = await supabaseAdmin
        .from("student_achievements")
        .select("badge_id")
        .eq("enrollment_number", enrollment.trim().toUpperCase());
      if (achData) {
        unlockedBadges = achData.map((a: any) => a.badge_id);
      }
    }

    // List of daily tasks
    const dailyQuests = [
      { id: "daily_login", title: "Daily Login", xp: 5 },
      { id: "mark_attendance", title: "Mark Attendance", xp: 20 },
      { id: "download_resources", title: "Download Today's Resources", xp: 10 },
      { id: "open_notes", title: "Open Today's Notes", xp: 5 },
      { id: "submit_github_repo", title: "Submit Today's GitHub Repository", xp: 30 },
      { id: "complete_assignment", title: "Complete Today's Assignment", xp: 50 },
    ];

    const checklist = dailyQuests.map((quest) => ({
      ...quest,
      completed: completedTasksToday.includes(quest.id),
    }));

    const allCompleted = checklist.every(q => q.completed);
    let perfectDayClaimed = false;

    if (allCompleted && supabaseAdmin) {
      const today = new Date().toISOString().split("T")[0];
      const { data: existing } = await supabaseAdmin
        .from("xp_transactions")
        .select("id")
        .eq("enrollment_number", enrollment.trim().toUpperCase())
        .eq("action_type", "daily_completion_bonus")
        .eq("reference_id", today)
        .maybeSingle();

      perfectDayClaimed = !!existing;
    }

    return NextResponse.json({
      success: true,
      checklist,
      perfectDayClaimed,
      allCompleted,
      unlockedBadges,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST: complete a daily task (like daily_login, download_resources, open_notes)
export async function POST(request: Request) {
  try {
    const { enrollment_number, task_id } = await request.json();

    if (!enrollment_number || !task_id) {
      return NextResponse.json({ success: false, error: "enrollment_number and task_id are required." }, { status: 400 });
    }

    const result = await completeTaskForEnrollment(enrollment_number, task_id, {
      source: "daily-checklist",
    });

    // Check if this action triggers the perfect day bonus
    let perfectDayBonusResult = null;
    if (result.success) {
      // Re-evaluate if all daily tasks are now complete
      const completedTasksToday = await getTaskCompletionsForEnrollment(enrollment_number);
      const dailyTasksList = ["daily_login", "mark_attendance", "download_resources", "open_notes", "submit_github_repo", "complete_assignment"];
      const allDone = dailyTasksList.every(t => completedTasksToday.includes(t));

      if (allDone) {
        const today = new Date().toISOString().split("T")[0];
        // Trigger Daily Completion Bonus (+50 XP)
        perfectDayBonusResult = await completeTaskForEnrollment(enrollment_number, "daily_completion_bonus", {
          source: "daily-checklist-bonus",
          metadata: { date: today }
        });
      }
    }

    return NextResponse.json({
      success: result.success,
      xpAwarded: result.xpAwarded,
      alreadyCompleted: result.alreadyCompleted,
      perfectDayBonus: perfectDayBonusResult?.success ? perfectDayBonusResult.xpAwarded : 0,
      message: result.message,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
