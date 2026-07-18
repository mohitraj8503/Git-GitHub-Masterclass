import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { supabaseAdmin } from "@/lib/supabaseServer";

const FILE_PATH = path.join(process.cwd(), "data", "announcements.json");

export async function GET() {
  try {
    if (supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        return NextResponse.json({ success: true, announcements: data });
      }
      console.warn("Supabase announcements query failed, falling back to local file. Error:", error);
    }

    // Local JSON Fallback (no seeding — return real data, even if empty)
    if (!fs.existsSync(path.dirname(FILE_PATH))) {
      fs.mkdirSync(path.dirname(FILE_PATH), { recursive: true });
    }
    if (!fs.existsSync(FILE_PATH)) {
      return NextResponse.json({ success: true, announcements: [] });
    }

    const content = fs.readFileSync(FILE_PATH, "utf8");
    const announcements = JSON.parse(content);
    return NextResponse.json({ success: true, announcements });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { title, content, type } = await request.json();
    if (!title || !content) {
      return NextResponse.json({ success: false, error: "Title and content are required." }, { status: 400 });
    }

    const newAnnouncement = {
      title,
      content,
      type: type || "general",
      created_at: new Date().toISOString(),
    };

    if (supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from("announcements")
        .insert(newAnnouncement)
        .select()
        .single();

      if (!error && data) {
        return NextResponse.json({ success: true, announcement: data });
      }
      console.warn("Supabase announcement insert failed, falling back to local file. Error:", error);
    }

    // Local JSON Fallback
    if (!fs.existsSync(path.dirname(FILE_PATH))) {
      fs.mkdirSync(path.dirname(FILE_PATH), { recursive: true });
    }

    let announcements = [];
    if (fs.existsSync(FILE_PATH)) {
      announcements = JSON.parse(fs.readFileSync(FILE_PATH, "utf8"));
    }

    const entry = { id: Date.now().toString(), ...newAnnouncement };
    announcements.unshift(entry);
    fs.writeFileSync(FILE_PATH, JSON.stringify(announcements, null, 2), "utf8");

    return NextResponse.json({ success: true, announcement: entry });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
