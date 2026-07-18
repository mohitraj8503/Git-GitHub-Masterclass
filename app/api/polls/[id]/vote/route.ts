import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { z } from "zod";
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

function writeJson(filePath: string, data: any) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
}

const normalizeEnrollmentNumber = (enrollment: string) => {
  const clean = enrollment.trim().toUpperCase();
  const digits = clean.replace(/\D/g, "");
  if (digits) {
    return `AJU/${digits}`;
  }
  return clean;
};

const VoteSchema = z.object({
  enrollmentNumber: z.string().min(1),
  optionIds: z.array(z.string())
});

/**
 * POST /api/polls/[id]/vote
 * Submit a vote or change a vote
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pollId } = await params;
    if (!pollId) {
      return NextResponse.json({ success: false, error: "Poll ID is required" }, { status: 400 });
    }

    const body = await request.json();
    const result = VoteSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error.issues[0].message }, { status: 400 });
    }

    const { enrollmentNumber, optionIds } = result.data;
    const targetEnrollment = normalizeEnrollmentNumber(enrollmentNumber);

    // 1. Fetch student registration info
    let student: any = null;
    if (supabaseAdmin) {
      const { data } = await supabaseAdmin
        .from("registrations")
        .select("id")
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
      return NextResponse.json({ success: false, error: "Student registration not found" }, { status: 404 });
    }

    const studentId = student.id || targetEnrollment;

    // 2. Fetch the poll details
    let poll: any = null;
    if (supabaseAdmin) {
      const { data } = await supabaseAdmin.from("polls").select("*").eq("id", pollId).maybeSingle();
      if (data) poll = data;
    }
    if (!poll) {
      const localPolls = readJson(POLLS_FILE);
      poll = localPolls.find((p: any) => p.id === pollId);
    }

    if (!poll) {
      return NextResponse.json({ success: false, error: "Poll not found" }, { status: 404 });
    }

    if (poll.status !== "live") {
      return NextResponse.json({ success: false, error: "This poll is closed or not published yet" }, { status: 400 });
    }

    // Check timer expiration
    if (poll.duration !== "manual" && poll.published_at) {
      let durationMs = 0;
      if (poll.duration === "30s") durationMs = 30 * 1000;
      else if (poll.duration === "1m") durationMs = 60 * 1000;
      else if (poll.duration === "2m") durationMs = 120 * 1000;
      else if (poll.duration === "5m") durationMs = 300 * 1000;

      const expiry = new Date(poll.published_at).getTime() + durationMs;
      if (Date.now() > expiry) {
        // Automatically close the poll if duration expired
        if (supabaseAdmin) {
          await supabaseAdmin.from("polls").update({ status: "closed", closed_at: new Date(expiry).toISOString() }).eq("id", pollId);
        } else {
          const localPolls = readJson(POLLS_FILE);
          const pIdx = localPolls.findIndex((p: any) => p.id === pollId);
          if (pIdx !== -1) {
            localPolls[pIdx].status = "closed";
            localPolls[pIdx].closed_at = new Date(expiry).toISOString();
            writeJson(POLLS_FILE, localPolls);
          }
        }
        return NextResponse.json({ success: false, error: "This poll has expired" }, { status: 410 });
      }
    }

    // 3. Verify single vs multiple choice
    if (poll.type === "single" && optionIds.length > 1) {
      return NextResponse.json({ success: false, error: "Only one option allowed for single choice polls" }, { status: 400 });
    }

    // 4. Check if student already voted
    let existingVotes: any[] = [];
    if (supabaseAdmin) {
      const { data } = await supabaseAdmin
        .from("poll_votes")
        .select("*")
        .eq("poll_id", pollId)
        .eq("student_id", studentId);
      if (data) existingVotes = data;
    } else {
      const localVotes = readJson(VOTES_FILE);
      existingVotes = localVotes.filter((v: any) => v.poll_id === pollId && v.student_id === studentId);
    }

    const hasVoted = existingVotes.length > 0;
    if (hasVoted && !poll.allow_vote_change) {
      return NextResponse.json({ success: false, error: "Vote change is not allowed for this poll" }, { status: 403 });
    }

    // 5. Save the vote
    const now = new Date().toISOString();
    if (supabaseAdmin) {
      // If vote change, delete existing votes first
      if (hasVoted) {
        await supabaseAdmin.from("poll_votes").delete().eq("poll_id", pollId).eq("student_id", studentId);
      }

      const voteRows = optionIds.map((optId: string) => ({
        poll_id: pollId,
        option_id: optId,
        student_id: studentId,
        voted_at: now
      }));

      const { error: insErr } = await supabaseAdmin.from("poll_votes").insert(voteRows);
      if (insErr) {
        return NextResponse.json({ success: false, error: insErr.message }, { status: 500 });
      }
    } else {
      // Local fallback
      let localVotes = readJson(VOTES_FILE);
      if (hasVoted) {
        localVotes = localVotes.filter((v: any) => !(v.poll_id === pollId && v.student_id === studentId));
      }

      optionIds.forEach((optId: string) => {
        localVotes.push({
          id: crypto.randomUUID(),
          poll_id: pollId,
          option_id: optId,
          student_id: studentId,
          voted_at: now
        });
      });
      writeJson(VOTES_FILE, localVotes);
    }

    // 6. Return the updated results instantly
    let allPollVotes: any[] = [];
    let pollOptions: any[] = [];
    if (supabaseAdmin) {
      const { data: vData } = await supabaseAdmin.from("poll_votes").select("*").eq("poll_id", pollId);
      const { data: oData } = await supabaseAdmin.from("poll_options").select("*").eq("poll_id", pollId);
      if (vData) allPollVotes = vData;
      if (oData) pollOptions = oData;
    } else {
      allPollVotes = readJson(VOTES_FILE).filter((v: any) => v.poll_id === pollId);
      pollOptions = readJson(OPTIONS_FILE).filter((o: any) => o.poll_id === pollId);
    }

    const totalVoters = Array.from(new Set(allPollVotes.map((v: any) => v.student_id))).length;

    const results = pollOptions.map((opt: any) => {
      const count = allPollVotes.filter((v: any) => v.option_id === opt.id).length;
      const percentage = totalVoters > 0 ? Math.round((count / allPollVotes.length) * 100) : 0;
      return {
        id: opt.id,
        text: opt.option_text,
        votes: count,
        percentage
      };
    });

    return NextResponse.json({
      success: true,
      message: "Vote submitted successfully",
      results,
      totalVotes: totalVoters
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
