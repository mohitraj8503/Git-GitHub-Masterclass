import { awardXp, XP_RULES } from "./xp";
import { supabaseAdmin } from "./supabaseServer";

export const TASK_XP_REWARDS: Record<string, number> = {
  ...XP_RULES,
};

function normalizeEnrollmentNumber(value: string) {
  return value.trim().toUpperCase();
}

function getTodayKey() {
  return new Date().toISOString().split("T")[0];
}

export async function completeTaskForEnrollment(
  enrollmentNumber: string,
  taskId: string,
  options?: { source?: string; metadata?: Record<string, unknown> }
) {
  const normalizedEnrollment = normalizeEnrollmentNumber(enrollmentNumber);
  const xpToAward = TASK_XP_REWARDS[taskId];

  if (!normalizedEnrollment || !taskId || xpToAward === undefined) {
    return {
      ok: false,
      success: false,
      alreadyCompleted: false,
      xpAwarded: 0,
      totalXp: 0,
      message: "Invalid task or enrollment number.",
      error: "Invalid task or enrollment number.",
    };
  }

  if (!supabaseAdmin) {
    return {
      ok: false,
      success: false,
      alreadyCompleted: false,
      xpAwarded: 0,
      totalXp: 0,
      message: "Server storage is unavailable.",
      error: "Supabase client is not configured.",
    };
  }

  const completedDate = getTodayKey();

  try {
    const { data: existing, error: lookupErr } = await supabaseAdmin
      .from("task_completions")
      .select("id")
      .ilike("enrollment_number", normalizedEnrollment)
      .eq("task_id", taskId)
      .eq("completed_date", completedDate)
      .maybeSingle();

    if (lookupErr) {
      console.error("Task completion lookup failed:", lookupErr);
      return {
        ok: false,
        success: false,
        alreadyCompleted: false,
        xpAwarded: 0,
        totalXp: 0,
        message: "Unable to verify whether this task was already completed.",
        error: lookupErr.message,
      };
    }

    if (existing) {
      return {
        ok: true,
        success: true,
        alreadyCompleted: true,
        xpAwarded: 0,
        totalXp: 0,
        message: "Task already completed today.",
      };
    }

    const { error: insertErr } = await supabaseAdmin.from("task_completions").insert({
      enrollment_number: normalizedEnrollment,
      task_id: taskId,
      completed_date: completedDate,
      source: options?.source || "event",
      metadata: options?.metadata ? JSON.stringify(options.metadata) : null,
    });

    if (insertErr) {
      console.error("Task completion insert failed:", insertErr);
      return {
        ok: false,
        success: false,
        alreadyCompleted: false,
        xpAwarded: 0,
        totalXp: 0,
        message: "Failed to save the task completion record.",
        error: insertErr.message,
      };
    }

    const xpResult = await awardXp(enrollmentNumber, taskId, options?.metadata ? JSON.stringify(options.metadata) : undefined);

    if (!xpResult.success) {
      console.error("XP update failed:", xpResult.error);
      await supabaseAdmin
        .from("task_completions")
        .delete()
        .ilike("enrollment_number", normalizedEnrollment)
        .eq("task_id", taskId)
        .eq("completed_date", completedDate);
      return {
        ok: false,
        success: false,
        alreadyCompleted: false,
        xpAwarded: 0,
        totalXp: 0,
        message: "Task completion could not be persisted because XP update failed.",
        error: xpResult.error,
      };
    }

    return {
      ok: true,
      success: true,
      alreadyCompleted: false,
      xpAwarded: xpResult.xpEarned || 0,
      totalXp: 0, // Frontend handles live queries
      message: `Task completed! Awarded ${xpResult.xpEarned || 0} XP.`,
    };
  } catch (error: any) {
    console.error("Unexpected task completion failure:", error);
    return {
      ok: false,
      success: false,
      alreadyCompleted: false,
      xpAwarded: 0,
      totalXp: 0,
      message: "Unexpected task completion failure.",
      error: error?.message || "Unknown error",
    };
  }
}

export async function getTaskCompletionsForEnrollment(enrollmentNumber: string) {
  const normalizedEnrollment = normalizeEnrollmentNumber(enrollmentNumber);
  if (!normalizedEnrollment || !supabaseAdmin) {
    return [];
  }

  const completedDate = getTodayKey();
  const { data, error } = await supabaseAdmin
    .from("task_completions")
    .select("task_id")
    .ilike("enrollment_number", normalizedEnrollment)
    .eq("completed_date", completedDate);

  if (error) {
    console.error("Failed to load task completions:", error);
    return [];
  }

  return (data || []).map((entry: any) => entry.task_id);
}
