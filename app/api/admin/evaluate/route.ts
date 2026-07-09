import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { supabaseAdmin } from "@/lib/supabaseServer";

const FILE_PATH = path.join(process.cwd(), "data", "submissions.json");

export async function POST(request: Request) {
  try {
    const { submission_id, marks_obtained, mentor_feedback } = await request.json();
    if (!submission_id || marks_obtained === undefined) {
      return NextResponse.json({ success: false, error: "Submission ID and marks obtained are required." }, { status: 400 });
    }

    if (supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from("submissions")
        .update({ marks_obtained: Number(marks_obtained), mentor_feedback })
        .eq("id", submission_id)
        .select()
        .single();

      if (!error && data) {
        return NextResponse.json({ success: true, submission: data });
      }
      console.warn("Supabase evaluate update failed, falling back to local file. Error:", error);
    }

    // Local JSON Fallback
    if (!fs.existsSync(FILE_PATH)) {
      return NextResponse.json({ success: false, error: "No submissions file found." }, { status: 404 });
    }

    let submissions = JSON.parse(fs.readFileSync(FILE_PATH, "utf8"));
    const subIdx = submissions.findIndex((sub: any) => sub.id === submission_id);
    if (subIdx === -1) {
      return NextResponse.json({ success: false, error: "Submission not found." }, { status: 404 });
    }

    submissions[subIdx].marks_obtained = Number(marks_obtained);
    submissions[subIdx].mentor_feedback = mentor_feedback || "";
    fs.writeFileSync(FILE_PATH, JSON.stringify(submissions, null, 2), "utf8");

    return NextResponse.json({ success: true, submission: submissions[subIdx] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
