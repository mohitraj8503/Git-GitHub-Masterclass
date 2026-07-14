import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { z } from "zod";
import fs from "fs";
import path from "path";

const POLLS_FILE = path.join(process.cwd(), "data", "polls.json");
const OPTIONS_FILE = path.join(process.cwd(), "data", "poll_options.json");
const VOTES_FILE = path.join(process.cwd(), "data", "poll_votes.json");

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

const UpdatePollSchema = z.object({
  question: z.string().min(1).max(500).optional(),
  type: z.enum(["single", "multiple"]).optional(),
  duration: z.enum(["30s", "1m", "2m", "5m", "manual"]).optional(),
  status: z.enum(["draft", "live", "closed", "archived"]).optional(),
  targetAudience: z.enum(["all", "batch", "course", "department", "internship"]).optional(),
  targetValue: z.string().optional().nullable(),
  allowAnonymous: z.boolean().optional(),
  allowVoteChange: z.boolean().optional()
});

/**
 * PUT /api/admin/polls/[id]
 * Update a poll (status, question, audience, settings, publish, close, etc.)
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: "Poll ID is required" }, { status: 400 });
    }

    const body = await request.json();
    const result = UpdatePollSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error.issues[0].message }, { status: 400 });
    }

    const val = result.data;
    const now = new Date().toISOString();

    const updates: any = {};
    if (val.question !== undefined) updates.question = val.question;
    if (val.type !== undefined) updates.type = val.type;
    if (val.duration !== undefined) updates.duration = val.duration;
    if (val.status !== undefined) {
      updates.status = val.status;
      if (val.status === "live") {
        updates.published_at = now;
      } else if (val.status === "closed") {
        updates.closed_at = now;
      }
    }
    if (val.targetAudience !== undefined) updates.target_audience = val.targetAudience;
    if (val.targetValue !== undefined) updates.target_value = val.targetValue;
    if (val.allowAnonymous !== undefined) updates.allow_anonymous = val.allowAnonymous;
    if (val.allowVoteChange !== undefined) updates.allow_vote_change = val.allowVoteChange;

    if (supabaseAdmin) {
      const { data: dbPoll, error: pErr } = await supabaseAdmin
        .from("polls")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (!pErr && dbPoll) {
        return NextResponse.json({ success: true, poll: dbPoll });
      }
      console.warn("Supabase poll update failed, fallback to local.");
    }

    // Local Fallback
    const localPolls = readJson(POLLS_FILE);
    const index = localPolls.findIndex((p: any) => p.id === id);
    if (index === -1) {
      return NextResponse.json({ success: false, error: "Poll not found" }, { status: 404 });
    }

    const updatedPoll = { ...localPolls[index], ...updates };
    localPolls[index] = updatedPoll;
    writeJson(POLLS_FILE, localPolls);

    return NextResponse.json({ success: true, poll: updatedPoll });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/polls/[id]
 * Delete a poll
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: "Poll ID is required" }, { status: 400 });
    }

    if (supabaseAdmin) {
      const { error: pErr } = await supabaseAdmin
        .from("polls")
        .delete()
        .eq("id", id);

      if (!pErr) {
        return NextResponse.json({ success: true, message: "Poll deleted successfully" });
      }
      console.warn("Supabase poll delete failed, fallback to local.");
    }

    // Local Fallback
    let localPolls = readJson(POLLS_FILE);
    const initialLen = localPolls.length;
    localPolls = localPolls.filter((p: any) => p.id !== id);

    if (localPolls.length === initialLen) {
      return NextResponse.json({ success: false, error: "Poll not found" }, { status: 404 });
    }

    writeJson(POLLS_FILE, localPolls);

    // Delete associated options and votes locally too
    let localOptions = readJson(OPTIONS_FILE);
    localOptions = localOptions.filter((o: any) => o.poll_id !== id);
    writeJson(OPTIONS_FILE, localOptions);

    let localVotes = readJson(VOTES_FILE);
    localVotes = localVotes.filter((v: any) => v.poll_id !== id);
    writeJson(VOTES_FILE, localVotes);

    return NextResponse.json({ success: true, message: "Poll deleted successfully" });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
