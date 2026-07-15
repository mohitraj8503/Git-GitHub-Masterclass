import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { supabaseAdmin } from "@/lib/supabaseServer";

const FILE_PATH = path.join(process.cwd(), "data", "resources.json");

export async function GET() {
  try {
    if (supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from("resources")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        const mapped = data.map((r: any) => ({
          id: r.id,
          title: r.title,
          type: r.type,
          url: r.file_url,
          session_number: r.session_number,
          created_at: r.created_at
        }));
        return NextResponse.json({ success: true, resources: mapped });
      }
      console.warn("Supabase resources query failed, falling back to local file. Error:", error);
    }

    // Local JSON Fallback
    if (!fs.existsSync(path.dirname(FILE_PATH))) {
      fs.mkdirSync(path.dirname(FILE_PATH), { recursive: true });
    }
    if (!fs.existsSync(FILE_PATH)) {
      return NextResponse.json({ success: true, resources: [] });
    }

    const content = fs.readFileSync(FILE_PATH, "utf8");
    const resources = JSON.parse(content);
    return NextResponse.json({ success: true, resources });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { title, type, url, session_number } = await request.json();
    if (!title || !type || !url) {
      return NextResponse.json({ success: false, error: "Title, type, and URL are required." }, { status: 400 });
    }

    try {
      new URL(url);
    } catch (e) {
      return NextResponse.json({ success: false, error: "Please enter a valid URL (starting with http:// or https://)." }, { status: 400 });
    }

    const newResourceLocal = {
      title,
      type,
      url,
      session_number: session_number ? Number(session_number) : null,
      created_at: new Date().toISOString(),
    };

    if (supabaseAdmin) {
      const dbPayload = {
        title,
        type,
        file_url: url,
        session_number: session_number ? Number(session_number) : null,
      };

      const { data, error } = await supabaseAdmin
        .from("resources")
        .insert(dbPayload)
        .select()
        .single();

      if (!error && data) {
        const mapped = {
          id: data.id,
          title: data.title,
          type: data.type,
          url: data.file_url,
          session_number: data.session_number,
          created_at: data.created_at
        };
        return NextResponse.json({ success: true, resource: mapped });
      }
      console.warn("Supabase resource insert failed, falling back to local file. Error:", error);
    }

    // Local JSON Fallback
    if (!fs.existsSync(path.dirname(FILE_PATH))) {
      fs.mkdirSync(path.dirname(FILE_PATH), { recursive: true });
    }

    let resources = [];
    if (fs.existsSync(FILE_PATH)) {
      resources = JSON.parse(fs.readFileSync(FILE_PATH, "utf8"));
    }

    const entry = { id: "res-" + Date.now().toString(), ...newResourceLocal };
    resources.unshift(entry);
    fs.writeFileSync(FILE_PATH, JSON.stringify(resources, null, 2), "utf8");

    return NextResponse.json({ success: true, resource: entry });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
