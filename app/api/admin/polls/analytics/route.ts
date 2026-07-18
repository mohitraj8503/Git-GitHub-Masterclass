import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
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

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const pollId = searchParams.get("pollId");

    // Fetch students list
    let students: any[] = [];
    if (supabaseAdmin) {
      const { data: dbStudents } = await supabaseAdmin
        .from("registrations")
        .select("id, name, enrollment_number, email, branch, year_of_study, section_class");
      if (dbStudents) students = dbStudents;
    }
    if (students.length === 0) {
      students = readJson(REGS_FILE);
    }

    // Map keys to make local/remote structure uniform
    const allStudents = students.map((s: any) => ({
      id: s.id || s.enrollmentNumber || s.enrollment_number,
      name: s.name,
      enrollment_number: s.enrollment_number || s.enrollmentNumber,
      email: s.email,
      branch: s.branch,
      year_of_study: s.year_of_study || s.yearOfStudy,
      section_class: s.section_class || s.sectionClass
    }));

    if (pollId) {
      // Analytics for a specific poll
      let poll: any = null;
      let options: any[] = [];
      let votes: any[] = [];

      if (supabaseAdmin) {
        const { data: dbPoll } = await supabaseAdmin.from("polls").select("*").eq("id", pollId).maybeSingle();
        const { data: dbOpts } = await supabaseAdmin.from("poll_options").select("*").eq("poll_id", pollId);
        const { data: dbVts } = await supabaseAdmin.from("poll_votes").select("*").eq("poll_id", pollId);

        if (dbPoll) {
          poll = dbPoll;
          options = dbOpts || [];
          votes = dbVts || [];
        }
      }

      if (!poll) {
        const localPolls = readJson(POLLS_FILE);
        poll = localPolls.find((p: any) => p.id === pollId);
        if (!poll) {
          return NextResponse.json({ success: false, error: "Poll not found" }, { status: 404 });
        }
        const localOptions = readJson(OPTIONS_FILE);
        options = localOptions.filter((o: any) => o.poll_id === pollId);
        const localVotes = readJson(VOTES_FILE);
        votes = localVotes.filter((v: any) => v.poll_id === pollId);
      }

      // Filter eligible students if target is specified
      let eligibleStudents = allStudents;
      if (poll.target_audience && poll.target_audience !== "all" && poll.target_value) {
        const aud = poll.target_audience;
        const val = poll.target_value.toLowerCase().trim();
        eligibleStudents = allStudents.filter((s: any) => {
          if (aud === "batch") return String(s.year_of_study || "").toLowerCase().includes(val);
          if (aud === "course") return String(s.section_class || "").toLowerCase().includes(val);
          if (aud === "department") return String(s.branch || "").toLowerCase().includes(val);
          if (aud === "internship") return String(s.branch || "").toLowerCase().includes(val); // or custom tag
          return true;
        });
      }

      const totalEligible = eligibleStudents.length || 1; // avoid divide by zero
      // Unique voters
      const uniqueVoters = Array.from(new Set(votes.map((v: any) => v.student_id)));
      const votesCount = uniqueVoters.length;
      const participationPercent = Math.round((votesCount / totalEligible) * 100);

      // Options analysis
      const optionVoteCounts = options.map((opt: any) => {
        const optVotes = votes.filter((v: any) => v.option_id === opt.id).length;
        return {
          id: opt.id,
          text: opt.option_text,
          votes: optVotes,
          percentage: votesCount > 0 ? Math.round((optVotes / votes.length) * 100) : 0
        };
      });

      // Sort options by vote count
      const sortedOptions = [...optionVoteCounts].sort((a, b) => b.votes - a.votes);
      const mostSelected = sortedOptions[0] || null;
      const leastSelected = sortedOptions[sortedOptions.length - 1] || null;

      // Students not responded
      const voterIds = new Set(uniqueVoters);
      const notResponded = eligibleStudents.filter((s: any) => !voterIds.has(s.id));

      // Response timeline (responses by minute / timestamp intervals)
      // Group votes by time
      const timeIntervals: { [key: string]: number } = {};
      votes.forEach((v: any) => {
        const timeStr = new Date(v.voted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        timeIntervals[timeStr] = (timeIntervals[timeStr] || 0) + 1;
      });
      const timeline = Object.keys(timeIntervals).map(time => ({
        time,
        votes: timeIntervals[time]
      }));

      // Average response time
      let avgResponseTimeSec = 0;
      if (votes.length > 0 && poll.published_at) {
        const pubTime = new Date(poll.published_at).getTime();
        const totalDuration = votes.reduce((sum, v) => {
          const voteTime = new Date(v.voted_at).getTime();
          return sum + Math.max(0, (voteTime - pubTime) / 1000);
        }, 0);
        avgResponseTimeSec = Math.round(totalDuration / votes.length);
      }

      return NextResponse.json({
        success: true,
        analytics: {
          poll,
          options: optionVoteCounts,
          totalParticipants: totalEligible,
          votesReceived: votesCount,
          participationPercent,
          mostSelected,
          leastSelected,
          notResponded: notResponded.map(s => ({ name: s.name, enrollment: s.enrollment_number, email: s.email })),
          timeline,
          avgResponseTimeSec
        }
      });
    } else {
      // General analytics (aggregate of all polls)
      const localPolls = readJson(POLLS_FILE);
      const localVotes = readJson(VOTES_FILE);

      let polls = [];
      let allVotes = [];

      if (supabaseAdmin) {
        const { data: dbPolls } = await supabaseAdmin.from("polls").select("*");
        const { data: dbVotes } = await supabaseAdmin.from("poll_votes").select("*");
        if (dbPolls) polls = dbPolls;
        if (dbVotes) allVotes = dbVotes;
      }

      if (polls.length === 0) {
        polls = localPolls;
        allVotes = localVotes;
      }

      const totalPolls = polls.length;
      const livePolls = polls.filter((p: any) => p.status === "live").length;
      const closedPolls = polls.filter((p: any) => p.status === "closed").length;
      const draftPolls = polls.filter((p: any) => p.status === "draft").length;

      return NextResponse.json({
        success: true,
        analytics: {
          totalPolls,
          livePolls,
          closedPolls,
          draftPolls,
          totalVotes: allVotes.length,
          totalStudentsCount: allStudents.length
        }
      });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
