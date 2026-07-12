import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { completeTaskForEnrollment } from "@/lib/tasks";

const FILE_PATH = path.join(process.cwd(), "data", "submissions.json");

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("student_id");

    if (supabaseAdmin) {
      let query = supabaseAdmin.from("submissions").select("*");
      if (studentId) {
        query = query.eq("student_id", studentId);
      }
      const { data, error } = await query;
      if (!error && data) {
        return NextResponse.json({ success: true, submissions: data });
      }
      console.warn("Supabase submissions query failed, falling back to local file. Error:", error);
    }

    // Local JSON Fallback
    if (!fs.existsSync(path.dirname(FILE_PATH))) {
      fs.mkdirSync(path.dirname(FILE_PATH), { recursive: true });
    }
    if (!fs.existsSync(FILE_PATH)) {
      fs.writeFileSync(FILE_PATH, JSON.stringify([], null, 2), "utf8");
    }

    const content = fs.readFileSync(FILE_PATH, "utf8");
    let submissions = JSON.parse(content);
    if (studentId) {
      submissions = submissions.filter((sub: any) => sub.student_id === studentId);
    }
    return NextResponse.json({ success: true, submissions });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { assignment_id, student_id, repo_url, live_url, attachment_url } = await request.json();
    if (!assignment_id || !student_id) {
      return NextResponse.json({ success: false, error: "Assignment ID and Student ID are required." }, { status: 400 });
    }

    const submissionData = {
      assignment_id,
      student_id,
      repo_url: repo_url || null,
      live_url: live_url || null,
      attachment_url: attachment_url || null,
      submitted_at: new Date().toISOString(),
    };

    if (supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from("submissions")
        .upsert(submissionData, { onConflict: "assignment_id,student_id" })
        .select()
        .single();

      if (!error && data) {
        const taskResult = await completeTaskForEnrollment(student_id, "complete_assignment", {
          source: "assignment-submission",
          metadata: { assignment_id },
        });
        return NextResponse.json({ success: true, submission: data, task: taskResult });
      }
      console.warn("Supabase submission upsert failed, falling back to local file. Error:", error);
    }

    // Local JSON Fallback
    if (!fs.existsSync(path.dirname(FILE_PATH))) {
      fs.mkdirSync(path.dirname(FILE_PATH), { recursive: true });
    }

    let submissions = [];
    if (fs.existsSync(FILE_PATH)) {
      submissions = JSON.parse(fs.readFileSync(FILE_PATH, "utf8"));
    }

    // Remove existing if any (upsert simulation)
    submissions = submissions.filter(
      (sub: any) => !(sub.assignment_id === assignment_id && sub.student_id === student_id)
    );

    const entry = { id: "s-" + Date.now().toString(), ...submissionData, marks_obtained: null, mentor_feedback: null };
    submissions.push(entry);
    fs.writeFileSync(FILE_PATH, JSON.stringify(submissions, null, 2), "utf8");

    const taskResult = await completeTaskForEnrollment(student_id, "complete_assignment", {
      source: "assignment-submission",
      metadata: { assignment_id },
    });
    return NextResponse.json({ success: true, submission: entry, task: taskResult });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
