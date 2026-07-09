import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { supabaseAdmin } from "@/lib/supabaseServer";

const FILE_PATH = path.join(process.cwd(), "data", "assignments.json");

export async function GET() {
  try {
    if (supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from("assignments")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        return NextResponse.json({ success: true, assignments: data });
      }
      console.warn("Supabase assignments query failed, falling back to local file. Error:", error);
    }

    // Local JSON Fallback (no seeding — return real data, even if empty)
    if (!fs.existsSync(path.dirname(FILE_PATH))) {
      fs.mkdirSync(path.dirname(FILE_PATH), { recursive: true });
    }
    if (!fs.existsSync(FILE_PATH)) {
      return NextResponse.json({ success: true, assignments: [] });
    }

    const content = fs.readFileSync(FILE_PATH, "utf8");
    const assignments = JSON.parse(content);
    return NextResponse.json({ success: true, assignments });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { title, description, due_date, max_marks } = await request.json();
    if (!title || !description || !due_date) {
      return NextResponse.json({ success: false, error: "Title, description, and due date are required." }, { status: 400 });
    }

    const newAssignment = {
      title,
      description,
      due_date,
      max_marks: Number(max_marks) || 10,
      created_at: new Date().toISOString(),
    };

    if (supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from("assignments")
        .insert(newAssignment)
        .select()
        .single();

      if (!error && data) {
        return NextResponse.json({ success: true, assignment: data });
      }
      console.warn("Supabase assignment insert failed, falling back to local file. Error:", error);
    }

    // Local JSON Fallback
    if (!fs.existsSync(path.dirname(FILE_PATH))) {
      fs.mkdirSync(path.dirname(FILE_PATH), { recursive: true });
    }

    let assignments = [];
    if (fs.existsSync(FILE_PATH)) {
      assignments = JSON.parse(fs.readFileSync(FILE_PATH, "utf8"));
    }

    const entry = { id: "a-" + Date.now().toString(), ...newAssignment };
    assignments.unshift(entry);
    fs.writeFileSync(FILE_PATH, JSON.stringify(assignments, null, 2), "utf8");

    return NextResponse.json({ success: true, assignment: entry });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
