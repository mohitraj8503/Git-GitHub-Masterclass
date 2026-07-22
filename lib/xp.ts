import { supabaseAdmin } from "./supabaseServer";

export const XP_RULES: Record<string, number> = {
   daily_login: 5,
   mark_attendance: 20,
   download_resources: 10,
   download_slides: 10, // alias
   open_notes: 5,
   submit_github_repo: 30,
   push_github: 20, // alias
   submit_assignment: 50,
   complete_assignment: 50, // alias
   early_submission_bonus: 20,
   excellence_bonus: 20,
   complete_daily_quiz: 25,
   quiz_100_percent_bonus: 10,
   workshop_feedback: 15,
   fill_feedback: 10, // alias
   daily_completion_bonus: 50,
   profile_email: 10,
   profile_photo: 10,
   profile_bio: 10,
   profile_github: 20,
   profile_linkedin: 20,
};

export const STREAK_BONUSES: Record<number, number> = {
  2: 10,
  3: 15,
  5: 25,
  7: 100,
};

export const ACHIEVEMENTS: Record<string, { title: string; xp: number; badgeId: string }> = {
  first_attendance: { title: "First Attendance", xp: 20, badgeId: "first_attendance" },
  first_github_repo: { title: "First GitHub Repository Submitted", xp: 30, badgeId: "first_github_repo" },
  first_assignment: { title: "First Assignment Completed", xp: 40, badgeId: "first_assignment" },
  attend_all_7_days: { title: "Attend All 7 Days", xp: 100, badgeId: "perfect_attendance_badge" },
  submit_all_assignments: { title: "Submit All Assignments", xp: 100, badgeId: "assignment_master_badge" },
  complete_all_daily_tasks: { title: "Workshop Warrior", xp: 150, badgeId: "workshop_warrior_badge" },
  complete_workshop: { title: "Complete Entire Workshop", xp: 250, badgeId: "git_github_master_badge" },
};

function normalizeEnroll(enroll: string) {
  return enroll.trim().toUpperCase();
}

/**
 * Core XP engine to award points, record transactions, and evaluate achievements.
 */
export async function awardXp(
  enrollmentNumber: string,
  actionType: string,
  referenceId?: string
) {
  const enroll = normalizeEnroll(enrollmentNumber);
  const baseReward = XP_RULES[actionType];

  if (!enroll || !actionType || baseReward === undefined) {
    return { success: false, error: "Invalid action or enrollment number." };
  }

  if (!supabaseAdmin) {
    return { success: false, error: "Supabase client is not initialized." };
  }

  try {
    // 1. Check if this exact action/reference is already rewarded
    let query = supabaseAdmin
      .from("xp_transactions")
      .select("id")
      .eq("enrollment_number", enroll)
      .eq("action_type", actionType);

    if (referenceId) {
      query.eq("reference_id", referenceId);
    }

    const { data: existingTx, error: duplicateError } = await query.maybeSingle();
    if (duplicateError) throw duplicateError;
    if (existingTx) {
      return { success: true, alreadyCompleted: true, xpEarned: 0, message: "Action already rewarded." };
    }

    let totalAwarded = baseReward;
    const newlyUnlockedBadges: string[] = [];
    const transactionsToInsert: any[] = [
      {
        enrollment_number: enroll,
        action_type: actionType,
        xp_amount: baseReward,
        reference_id: referenceId ?? null,
      },
    ];

    // 2. Specialized Check-in Streaks and Achievements
    if (actionType === "mark_attendance") {
      const studentId = await resolveRegId(enroll);
      // Get all attendance logs for this student to determine streak
      const {
        data: attendance,
        error: attendanceError,
      } = await supabaseAdmin
        .from("attendance")
        .select("session_day")
        .eq("student_id", studentId);

if (attendanceError) throw attendanceError;

      const uniqueDays = [...new Set((attendance || []).map((x) => Number(x.session_day))),];
      const attendanceCount = uniqueDays.length;

      // First attendance achievement
      if (attendanceCount === 1) {
        const badge = ACHIEVEMENTS.first_attendance;
        const unlocked = await unlockBadge(enroll, badge.badgeId);
        if (unlocked) {
          totalAwarded += badge.xp;
          newlyUnlockedBadges.push(badge.badgeId);
          transactionsToInsert.push({
            enrollment_number: enroll,
            action_type: "achievement_unlock",
            xp_amount: badge.xp,
            reference_id: badge.badgeId,
          });
        }
      }

      // Check attendance streak bonuses
      const streakBonus = STREAK_BONUSES[attendanceCount];
      if (streakBonus) {
       const { data: streakExists } = await supabaseAdmin
           .from("xp_transactions")
           .select("id")
           .eq("enrollment_number", enroll)
           .eq("action_type", `attendance_streak_${attendanceCount}`)
           .maybeSingle();

   if (!streakExists) {
     totalAwarded += streakBonus;

     transactionsToInsert.push({
       enrollment_number: enroll,
       action_type: `attendance_streak_${attendanceCount}`,
       xp_amount: streakBonus,
       reference_id: `streak_${attendanceCount}`,
     });
   }
}

        // Perfect attendance badge
        if (attendanceCount === 7) {
          const badge = ACHIEVEMENTS.attend_all_7_days;
          const unlocked = await unlockBadge(enroll, badge.badgeId);
          if (unlocked) {
            totalAwarded += badge.xp;
            newlyUnlockedBadges.push(badge.badgeId);
            transactionsToInsert.push({
              enrollment_number: enroll,
              action_type: "achievement_unlock",
              xp_amount: badge.xp,
              reference_id: badge.badgeId,
            });
          }
        }
      }

    // 3. First GitHub submission check
    if (actionType === "submit_github_repo") {
    const badge = ACHIEVEMENTS.first_github_repo;

    const unlocked = await unlockBadge(
       enroll,
       badge.badgeId
    );

   if (unlocked) {
     totalAwarded += badge.xp;

     newlyUnlockedBadges.push(badge.badgeId);

     transactionsToInsert.push({
       enrollment_number: enroll,
       action_type: "achievement_unlock",
       xp_amount: badge.xp,
       reference_id: badge.badgeId,
      });
     }
  }


    // 4. First Assignment submission check
   if (actionType === "submit_assignment") {
   const badge = ACHIEVEMENTS.first_assignment;

   const unlocked = await unlockBadge(
     enroll,
     badge.badgeId
   );

  if (unlocked) {
    totalAwarded += badge.xp;

    newlyUnlockedBadges.push(badge.badgeId);

    transactionsToInsert.push({
       enrollment_number: enroll,
       action_type: "achievement_unlock",
       xp_amount: badge.xp,
       reference_id: badge.badgeId,
    });
  }
}

    // 5. Insert transactions
    const { error: insertError  } = await supabaseAdmin.from("xp_transactions").insert(transactionsToInsert);
    if (insertError) throw insertError;

    // 6. Update student's total_xp
    const { data: xpRows  } = await supabaseAdmin
      .from("xp_transactions")
      .select("xp_amount")
      .eq("enrollment_number", enroll)

    const totalXp = (xpRows || []).reduce(
  (sum, row) => sum + Number(row.xp_amount || 0),
  0
);

   await supabaseAdmin
     .from("registrations")
     .update({
       total_xp: totalXp,
      })
     .eq("enrollment_number", enroll);


    return {
      success: true,
      xpEarned: totalAwarded,
      totalXp,
      newlyUnlockedBadges,
      message: `Earned +${totalAwarded} XP`,
    };
  } catch (err: any) {
    console.error("XP Error", err);
    return { success: false, error: err.message };
  }
}

/** Helper to resolve registration UUID from enrollment */
async function resolveRegId(enroll: string): Promise<string | null> {
  if (!supabaseAdmin) return null;
  const { data } = await supabaseAdmin
    .from("registrations")
    .select("id")
    .eq("enrollment_number", enroll)
    .maybeSingle();
  return data?.id ?? null;
}

/** Helper to unlock badge and return if it was newly unlocked */
async function unlockBadge(enroll: string, badgeId: string): Promise<boolean> {
  if (!supabaseAdmin) return false;
  const { data: existing } = await supabaseAdmin
      .from("student_achievements")
      .select("id")
      .eq("enrollment_number", enroll)
      .eq("badge_id", badgeId)
      .maybeSingle();

    if (existing) return false;

    const { error } = await supabaseAdmin.from("student_achievements").insert({
      enrollment_number: enroll,
      badge_id: badgeId,
    });

    return !error;
  } 

export async function syncProfileCompletionXp(enrollmentNumber: string) {
  if (!supabaseAdmin) return;
  const enroll = enrollmentNumber.trim().toUpperCase();

  try {
    const regId = await resolveRegId(enroll);
    if (!regId) return;

    const { data: reg } = await supabaseAdmin
      .from("registrations")
      .select("email")
      .eq("id", regId)
      .maybeSingle();

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select(`
        avatar_url,
        bio,
        github_username,
        linkedin_url
      `)
      .eq("id", regId)
      .maybeSingle();

    // 1. Email present (+10 XP)
    if (reg?.email?.trim()) {
      await awardXp(enroll, "profile_email", "profile_email");
    }

    // 2. Photo present (+10 XP)
    if (profile?.avatar_url?.trim()) {
      await awardXp(enroll, "profile_photo", "profile_photo");
    }

    // 3. Bio present (+10 XP)
    if (profile?.bio?.trim()) {
      await awardXp(enroll, "profile_bio", "profile_bio");
    }

    // 4. GitHub Username present (+20 XP)
    if (profile?.github_username?.trim()) {
      await awardXp(enroll, "profile_github", "profile_github");
    }

    // 5. LinkedIn present (+20 XP)
    if (profile?.linkedin_url?.trim()) {
      await awardXp(enroll, "profile_linkedin", "profile_linkedin");
    }
  } catch (error) {
    console.error("Failed to sync profile completion XP:", error);
  }
}
