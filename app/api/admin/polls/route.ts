import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { z } from "zod";
import fs from "fs";
import path from "path";

const POLLS_FILE = path.join(process.cwd(), "data", "polls.json");
const OPTIONS_FILE = path.join(process.cwd(), "data", "poll_options.json");
const VOTES_FILE = path.join(process.cwd(), "data", "poll_votes.json");

// Helper to write JSON files safely
function writeJson(filePath: string, data: any) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
}

function readJson(filePath: string): any[] {
  if (!fs.existsSync(filePath)) return [];
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return [];
  }
}

// Zod Schema for poll creation
const CreatePollSchema = z.object({
  question: z.string().min(1, "Question is required").max(500),
  type: z.enum(["single", "multiple"]),
  duration: z.enum(["30s", "1m", "2m", "5m", "manual"]),
  targetAudience: z.enum(["all", "batch", "course", "department", "internship"]),
  targetValue: z.string().optional().nullable(),
  allowAnonymous: z.boolean().default(false),
  allowVoteChange: z.boolean().default(false),
  options: z.array(z.string().min(1, "Option text cannot be empty")).min(2).max(6),
  status: z.enum(["draft", "live"]).default("draft")
});

/**
 * GET /api/admin/polls
 * Fetch all polls with options and vote counts for admin dashboard
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    if (supabaseAdmin) {
      // 1. Fetch polls
      const { data: dbPolls, error: pErr } = await supabaseAdmin
        .from("polls")
        .select("*")
        .order("created_at", { ascending: false });

      if (!pErr && dbPolls) {
        // 2. Fetch options
        const { data: dbOptions } = await supabaseAdmin
          .from("poll_options")
          .select("*");

        // 3. Fetch votes
        const { data: dbVotes } = await supabaseAdmin
          .from("poll_votes")
          .select("poll_id, option_id, student_id");

        const optionsMap = (dbOptions || []).reduce((acc: any, opt: any) => {
          if (!acc[opt.poll_id]) acc[opt.poll_id] = [];
          acc[opt.poll_id].push(opt);
          return acc;
        }, {});

        const votesMap = (dbVotes || []).reduce((acc: any, v: any) => {
          if (!acc[v.poll_id]) acc[v.poll_id] = [];
          acc[v.poll_id].push(v);
          return acc;
        }, {});

        const polls = dbPolls.map((poll: any) => {
          const opts = optionsMap[poll.id] || [];
          const vts = votesMap[poll.id] || [];
          return {
            ...poll,
            options: opts,
            votes: vts
          };
        });

        return NextResponse.json({ success: true, polls });
      }
    }

    // Local Fallback
    const localPolls = readJson(POLLS_FILE);
    const localOptions = readJson(OPTIONS_FILE);
    const localVotes = readJson(VOTES_FILE);

    const polls = localPolls.map((poll: any) => {
      const opts = localOptions.filter((o: any) => o.poll_id === poll.id);
      const vts = localVotes.filter((v: any) => v.poll_id === poll.id);
      return {
        ...poll,
        options: opts,
        votes: vts
      };
    });

    return NextResponse.json({ success: true, polls });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * POST /api/admin/polls
 * Create a new poll
 */
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    const body = await request.json();
    const result = CreatePollSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error.issues[0].message }, { status: 400 });
    }

    const val = result.data;
    const pollId = crypto.randomUUID();
    const now = new Date().toISOString();

    const newPoll: any = {
      id: pollId,
      question: val.question,
      type: val.type,
      duration: val.duration,
      status: val.status,
      target_audience: val.targetAudience,
      target_value: val.targetValue || null,
      allow_anonymous: val.allowAnonymous,
      allow_vote_change: val.allowVoteChange,
      created_at: now,
      published_at: val.status === "live" ? now : null,
      closed_at: null,
      creator_email: session.email
    };

    if (supabaseAdmin) {
      const { data: dbPoll, error: pErr } = await supabaseAdmin
        .from("polls")
        .insert(newPoll)
        .select()
        .single();

      if (!pErr && dbPoll) {
        // Insert options
        const optionRows = val.options.map((opt: string) => ({
          poll_id: pollId,
          option_text: opt
        }));

        const { data: dbOpts, error: oErr } = await supabaseAdmin
          .from("poll_options")
          .insert(optionRows)
          .select();

        if (!oErr && dbOpts) {
          return NextResponse.json({
            success: true,
            poll: { ...dbPoll, options: dbOpts, votes: [] }
          });
        }
      }
      console.warn("Supabase poll insert failed, fallback to local.");
    }

    // Local Fallback
    const localPolls = readJson(POLLS_FILE);
    localPolls.unshift(newPoll);
    writeJson(POLLS_FILE, localPolls);

    const localOptions = readJson(OPTIONS_FILE);
    const optionRows = val.options.map((opt: string) => ({
      id: crypto.randomUUID(),
      poll_id: pollId,
      option_text: opt
    }));
    localOptions.push(...optionRows);
    writeJson(OPTIONS_FILE, localOptions);

    return NextResponse.json({
      success: true,
      poll: { ...newPoll, options: optionRows, votes: [] }
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
