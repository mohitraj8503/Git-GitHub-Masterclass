import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { awardXp } from "@/lib/xp";

export const dynamic = "force-dynamic";

// Calculate base XP based on marks obtained
function calculateGradeXp(marks: number): number {
  if (marks === 10) return 50;
  if (marks === 9) return 45;
  if (marks === 8) return 40;
  if (marks === 7) return 35;
  if (marks === 6) return 30;
  if (marks === 5) return 25;
  return 15; // Below 5 marks
}

export async function POST(request: Request) {
  try {
    const { submission_id, marks_obtained, mentor_feedback, manual_bonus_xp = 0 } = await request.json();

    if (!submission_id || marks_obtained === undefined) {
      return NextResponse.json({ success: false, error: "Submission ID and marks obtained are required." }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ success: false, error: "Supabase client not initialized." }, { status: 500 });
    }

    const marksNum = Number(marks_obtained);
    const bonusXp = Number(manual_bonus_xp);

    // 1. Fetch submission details and student info
    const { data: sub, error: subErr } = await supabaseAdmin
      .from("submissions")
      .select("*, registrations(enrollment_number, total_xp), assignments(due_date)")
      .eq("id", submission_id)
      .single();

    if (subErr || !sub) {
      return NextResponse.json({ success: false, error: "Submission not found in database." }, { status: 404 });
    }

    const studentEnroll = (sub.registrations as any)?.enrollment_number;
    const dueDate = (sub.assignments as any)?.due_date;
    const oldMarks = sub.marks_obtained;

    if (!studentEnroll) {
      return NextResponse.json({ success: false, error: "Student registration details not found for submission." }, { status: 404 });
    }

    // 2. Calculate New XP Payouts
    const baseGradeXp = calculateGradeXp(marksNum);
    
    // Check if submitted before deadline (+20 XP)
    let earlySubmissionXp = 0;
    if (dueDate && new Date(sub.submitted_at).getTime() < new Date(dueDate).getTime()) {
      earlySubmissionXp = 20;
    }

    const newCalculatedXp = baseGradeXp + earlySubmissionXp + bonusXp;

    // 3. Check for previous evaluations to handle re-grading differentials
    const { data: pastTxs } = await supabaseAdmin
      .from("xp_transactions")
      .select("xp_amount")
      .eq("enrollment_number", studentEnroll)
      .eq("reference_id", submission_id)
      .in("action_type", ["grade_assignment", "grade_assignment_adjust"]);

    const oldAwardedXp = (pastTxs || []).reduce((sum, tx) => sum + (tx.xp_amount || 0), 0);
    const xpDiff = newCalculatedXp - oldAwardedXp;

    // 4. Update submission in database
    const { data: updatedSub, error: updateErr } = await supabaseAdmin
      .from("submissions")
      .update({
        marks_obtained: marksNum,
        mentor_feedback: mentor_feedback || "",
      })
      .eq("id", submission_id)
      .select()
      .single();

    if (updateErr) {
      throw updateErr;
    }

    // 5. Execute XP Transactions atomically if there is any difference
    if (xpDiff !== 0) {
      const actionType = oldAwardedXp > 0 ? "grade_assignment_adjust" : "grade_assignment";
      
      // Log the transaction
      await supabaseAdmin.from("xp_transactions").insert({
        enrollment_number: studentEnroll,
        action_type: actionType,
        xp_amount: xpDiff,
        reference_id: submission_id,
      });

      // Update total_xp in registrations table
      const currentXp = Number((sub.registrations as any)?.total_xp || 0);
      const newTotalXp = currentXp + xpDiff;

      await supabaseAdmin
        .from("registrations")
        .update({ total_xp: newTotalXp })
        .eq("enrollment_number", studentEnroll);
    }

    // 6. Check and award First Assignment Badge if this is the first one graded
    const { count: gradedCount } = await supabaseAdmin
      .from("xp_transactions")
      .select("id", { count: "exact", head: true })
      .eq("enrollment_number", studentEnroll)
      .eq("action_type", "grade_assignment");

    if ((gradedCount || 0) <= 1) {
      // Award the badge if not already unlocked
      const { data: hasBadge } = await supabaseAdmin
        .from("student_achievements")
        .select("badge_id")
        .eq("enrollment_number", studentEnroll)
        .eq("badge_id", "first_assignment")
        .maybeSingle();

      if (!hasBadge) {
        await supabaseAdmin.from("student_achievements").insert({
          enrollment_number: studentEnroll,
          badge_id: "first_assignment",
        });

        // Award badge bonus (+40 XP)
        const badgeBonusXp = 40;
        await supabaseAdmin.from("xp_transactions").insert({
          enrollment_number: studentEnroll,
          action_type: "achievement_unlock",
          xp_amount: badgeBonusXp,
          reference_id: "first_assignment",
        });

        // Update registrations total_xp
        const { data: reg } = await supabaseAdmin
          .from("registrations")
          .select("total_xp")
          .eq("enrollment_number", studentEnroll)
          .single();

        if (reg) {
          const finalXp = Number(reg.total_xp || 0) + badgeBonusXp;
          await supabaseAdmin
            .from("registrations")
            .update({ total_xp: finalXp })
            .eq("enrollment_number", studentEnroll);
        }
      }
    }

    return NextResponse.json({
      success: true,
      submission: updatedSub,
      xpEarned: newCalculatedXp,
      xpDiff,
      message: `Submission graded successfully! Total XP awarded: ${newCalculatedXp} XP.`,
    });
  } catch (err: any) {
    console.error("Evaluation handler error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
