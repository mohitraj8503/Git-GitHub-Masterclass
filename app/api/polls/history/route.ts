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

/**
 * GET /api/polls/history
 * Fetch completed and missed polls history for a student
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const enrollmentNumber = searchParams.get("enrollmentNumber")?.trim().toUpperCase();

    if (!enrollmentNumber) {
      return NextResponse.json({ success: false, error: "Enrollment number is required" }, { status: 400 });
    }

    // 1. Fetch student info
    let student: any = null;
    if (supabaseAdmin) {
      const { data } = await supabaseAdmin
        .from("registrations")
        .select("*")
        .eq("enrollment_number", enrollmentNumber)
        .maybeSingle();
      if (data) student = data;
    }

    if (!student) {
      const regs = readJson(REGS_FILE);
      student = regs.find(
        (r: any) => (r.enrollmentNumber || r.enrollment_number || "").toUpperCase() === enrollmentNumber
      );
    }

    if (!student) {
      return NextResponse.json({ success: false, error: "Registration not found" }, { status: 404 });
    }

    const sBranch = (student.branch || "").toLowerCase().trim();
    const sYear = (student.year_of_study || student.yearOfStudy || "").toLowerCase().trim();
    const sSection = (student.section_class || student.sectionClass || "").toLowerCase().trim();

    // 2. Fetch all polls (except drafts)
    let polls: any[] = [];
    let options: any[] = [];
    let votes: any[] = [];

    if (supabaseAdmin) {
      const { data: dbPolls } = await supabaseAdmin
        .from("polls")
        .select("*")
        .neq("status", "draft")
        .order("created_at", { ascending: false });

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

        polls = dbPolls;
        options = dbOpts || [];
        votes = dbVotes || [];
      }
    }

    if (polls.length === 0) {
      const localPolls = readJson(POLLS_FILE);
      polls = localPolls.filter((p: any) => p.status !== "draft");
      polls.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      const localOptions = readJson(OPTIONS_FILE);
      options = localOptions.filter((o: any) => polls.some(p => p.id === o.poll_id));

      const localVotes = readJson(VOTES_FILE);
      votes = localVotes.filter((v: any) => polls.some(p => p.id === v.poll_id));
    }

    // 3. Filter targeted polls
    const targetedPolls = polls.filter((poll: any) => {
      if (poll.target_audience === "all") return true;
      if (!poll.target_value) return true;

      const val = poll.target_value.toLowerCase().trim();
      if (poll.target_audience === "batch") return sYear.includes(val);
      if (poll.target_audience === "course") return sSection.includes(val);
      if (poll.target_audience === "department") return sBranch.includes(val);
      if (poll.target_audience === "internship") return sBranch.includes(val);
      return true;
    });

    const completed: any[] = [];
    const missed: any[] = [];

    targetedPolls.forEach((poll: any) => {
      const pollOpts = options.filter((o: any) => o.poll_id === poll.id);
      const pollVotes = votes.filter((v: any) => v.poll_id === poll.id);

      const studentVotes = pollVotes.filter((v: any) => v.student_id === student.id || v.student_id === enrollmentNumber);
      const hasVoted = studentVotes.length > 0;
      const totalVotesCount = Array.from(new Set(pollVotes.map((v: any) => v.student_id))).length;

      const mappedOptions = pollOpts.map((opt: any) => {
        const optVotesCount = pollVotes.filter((v: any) => v.option_id === opt.id).length;
        return {
          id: opt.id,
          text: opt.option_text,
          votes: optVotesCount,
          percentage: totalVotesCount > 0 ? Math.round((optVotesCount / pollVotes.length) * 100) : 0,
          isVotedByMe: studentVotes.some((sv: any) => sv.option_id === opt.id)
        };
      });

      const pollInfo = {
        id: poll.id,
        question: poll.question,
        type: poll.type,
        status: poll.status,
        duration: poll.duration,
        publishedAt: poll.published_at,
        closedAt: poll.closed_at,
        allowAnonymous: poll.allow_anonymous,
        options: mappedOptions,
        totalVotes: totalVotesCount,
        myVotes: studentVotes.map(v => v.option_id)
      };

      if (hasVoted) {
        completed.push(pollInfo);
      } else if (poll.status === "closed" || poll.status === "archived") {
        missed.push(pollInfo);
      }
    });

    return NextResponse.json({
      success: true,
      completed,
      missed
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
