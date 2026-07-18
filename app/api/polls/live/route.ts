import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import fs from "fs";
import path from "path";

const POLLS_FILE = path.join(process.cwd(), "data", "polls.json");
const OPTIONS_FILE = path.join(process.cwd(), "data", "poll_options.json");
const VOTES_FILE = path.join(process.cwd(), "data", "poll_votes.json");
const REGS_FILE = path.join(process.cwd(), "data", "registrations.json");

function readJson(filePath: string): any[] {
  if (!fs.existsSync(filePath)) return [];
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return [];
  }
}

const normalizeEnrollmentNumber = (enrollment: string) => {
  const clean = enrollment.trim().toUpperCase();
  const digits = clean.replace(/\D/g, "");
  if (digits) {
    return `AJU/${digits}`;
  }
  return clean;
};

/**
 * GET /api/polls/live
 * Fetch all active live polls that target the current student.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const enrollmentNumber = searchParams.get("enrollmentNumber");
 
    if (!enrollmentNumber) {
      return NextResponse.json({ success: false, error: "Enrollment number is required" }, { status: 400 });
    }

    const targetEnrollment = normalizeEnrollmentNumber(enrollmentNumber);
 
    // 1. Fetch student info to verify targeting
    let student: any = null;
    if (supabaseAdmin) {
      const { data } = await supabaseAdmin
        .from("registrations")
        .select("*")
        .eq("enrollment_number", targetEnrollment)
        .maybeSingle();
      if (data) student = data;
    }
 
    if (!student) {
      const regs = readJson(REGS_FILE);
      student = regs.find(
        (r: any) => normalizeEnrollmentNumber(r.enrollmentNumber || r.enrollment_number || "") === targetEnrollment
      );
    }
 
    if (!student) {
      return NextResponse.json({ success: false, error: "Registration not found" }, { status: 404 });
    }

    const sBranch = (student.branch || "").toLowerCase().trim();
    const sYear = (student.year_of_study || student.yearOfStudy || "").toLowerCase().trim();
    const sSection = (student.section_class || student.sectionClass || "").toLowerCase().trim();

    // 2. Fetch live polls
    let livePolls: any[] = [];
    let options: any[] = [];
    let votes: any[] = [];

    if (supabaseAdmin) {
      const { data: dbPolls } = await supabaseAdmin
        .from("polls")
        .select("*")
        .eq("status", "live");
      
      if (dbPolls && dbPolls.length > 0) {
        const pollIds = dbPolls.map((p: any) => p.id);
        const { data: dbOpts } = await supabaseAdmin
          .from("poll_options")
          .select("*")
          .in("poll_id", pollIds);
        
        const { data: dbVotes } = await supabaseAdmin
          .from("poll_votes")
          .select("*")
          .in("poll_id", pollIds);

        livePolls = dbPolls;
        options = dbOpts || [];
        votes = dbVotes || [];
      }
    }

    if (livePolls.length === 0) {
      const localPolls = readJson(POLLS_FILE);
      livePolls = localPolls.filter((p: any) => p.status === "live");

      const localOptions = readJson(OPTIONS_FILE);
      options = localOptions.filter((o: any) => livePolls.some(p => p.id === o.poll_id));

      const localVotes = readJson(VOTES_FILE);
      votes = localVotes.filter((v: any) => livePolls.some(p => p.id === v.poll_id));
    }

    // 3. Filter live polls based on targeting rules
    const filteredPolls = livePolls.filter((poll: any) => {
      if (poll.target_audience === "all") return true;
      if (!poll.target_value) return true;

      const val = poll.target_value.toLowerCase().trim();
      if (poll.target_audience === "batch") return sYear.includes(val);
      if (poll.target_audience === "course") return sSection.includes(val);
      if (poll.target_audience === "department") return sBranch.includes(val);
      if (poll.target_audience === "internship") return sBranch.includes(val); // or custom tag
      return true;
    });

    // 4. Map options and student's vote state
    const result = filteredPolls.map((poll: any) => {
      const pollOpts = options.filter((o: any) => o.poll_id === poll.id);
      const pollVotes = votes.filter((v: any) => v.poll_id === poll.id);

      // Check if current student already voted
      const studentVotes = pollVotes.filter((v: any) => v.student_id === student.id || v.student_id === targetEnrollment);
      const hasVoted = studentVotes.length > 0;

      // Group votes by option to show live counts / percentages
      const totalVotesCount = Array.from(new Set(pollVotes.map((v: any) => v.student_id))).length;

      const mappedOptions = pollOpts.map((opt: any) => {
        const optVotesCount = pollVotes.filter((v: any) => v.option_id === opt.id).length;
        const pct = totalVotesCount > 0 ? Math.round((optVotesCount / pollVotes.length) * 100) : 0;
        return {
          id: opt.id,
          text: opt.option_text,
          votes: optVotesCount,
          percentage: pct,
          isVotedByMe: studentVotes.some((sv: any) => sv.option_id === opt.id)
        };
      });

      return {
        id: poll.id,
        question: poll.question,
        type: poll.type,
        duration: poll.duration,
        publishedAt: poll.published_at,
        allowAnonymous: poll.allow_anonymous,
        allowVoteChange: poll.allow_vote_change,
        options: mappedOptions,
        totalVotes: totalVotesCount,
        hasVoted
      };
    });

    return NextResponse.json({ success: true, polls: result });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
