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
      .select("*, registrations(id, enrollment_number, total_xp), assignments(title, due_date, max_marks)")
      .eq("id", submission_id)
      .single();

    if (subErr || !sub) {
      return NextResponse.json({ success: false, error: "Submission not found in database." }, { status: 404 });
    }

    const studentId = (sub.registrations as any)?.id;
    const studentEnroll = (sub.registrations as any)?.enrollment_number;
    const dueDate = (sub.assignments as any)?.due_date;
    const assignmentTitle = (sub.assignments as any)?.title || "Assignment";
    const maxMarks = Number((sub.assignments as any)?.max_marks || 10);

    if (!studentEnroll || !studentId) {
      return NextResponse.json({ success: false, error: "Student registration details not found for submission." }, { status: 404 });
    }

    // 2. Calculate Proportional XP: XP = (marks / max_marks) * 100
    const calculatedXp = Math.round((marksNum / maxMarks) * 100) + bonusXp;

    const reasonStr = `Assignment: ${assignmentTitle} (Sub ID: ${submission_id}) — Grade: ${marksNum}/${maxMarks}`;

    // 3. Check for previous evaluation in xp_awards to handle re-grading
    const { data: existingAward } = await supabaseAdmin
      .from("xp_awards")
      .select("*")
      .eq("student_id", studentId)
      .like("reason", `%Sub ID: ${submission_id}%`)
      .maybeSingle();

    const oldAwardedXp = existingAward ? existingAward.amount : 0;
    const xpDiff = calculatedXp - oldAwardedXp;

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

    // 5. Execute XP Awards updates/inserts atomically
    if (xpDiff !== 0) {
      if (existingAward) {
        // Update the existing award
        const { error: updAwardErr } = await supabaseAdmin
          .from("xp_awards")
          .update({
            amount: calculatedXp,
            reason: reasonStr,
            awarded_by: "Admin"
          })
          .eq("id", existingAward.id);
        if (updAwardErr) throw updAwardErr;
      } else {
        // Create new award
        const { error: insAwardErr } = await supabaseAdmin
          .from("xp_awards")
          .insert({
            student_id: studentId,
            amount: calculatedXp,
            reason: reasonStr,
            awarded_by: "Admin"
          });
        if (insAwardErr) throw insAwardErr;
      }

      // Update total_xp in registrations table
      const currentXp = Number((sub.registrations as any)?.total_xp || 0);
      const newTotalXp = currentXp + xpDiff;

      const { error: updRegErr } = await supabaseAdmin
        .from("registrations")
        .update({ total_xp: newTotalXp })
        .eq("id", studentId);
      if (updRegErr) throw updRegErr;
    }

    // 6. Check and award First Assignment Badge if this is the first graded assignment
    const { data: allAwards } = await supabaseAdmin
      .from("xp_awards")
      .select("id")
      .eq("student_id", studentId)
      .like("reason", "Assignment:%");

    const gradedCount = allAwards ? allAwards.length : 0;

    if (gradedCount <= 1) {
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
        await supabaseAdmin.from("xp_awards").insert({
          student_id: studentId,
          amount: badgeBonusXp,
          reason: "Badge Unlock: First Assignment",
          awarded_by: "System"
        });

        // Update registrations total_xp
        const { data: reg } = await supabaseAdmin
          .from("registrations")
          .select("total_xp")
          .eq("id", studentId)
          .single();

        if (reg) {
          const finalXp = Number(reg.total_xp || 0) + badgeBonusXp;
          await supabaseAdmin
            .from("registrations")
            .update({ total_xp: finalXp })
            .eq("id", studentId);
        }
      }
    }

    return NextResponse.json({
      success: true,
      submission: updatedSub,
      xpEarned: calculatedXp,
      xpDiff,
      message: `Submission graded successfully! Total XP awarded: ${calculatedXp} XP.`,
    });
  } catch (err: any) {
    console.error("Evaluation handler error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
