import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { supabaseAdmin } from "@/lib/supabaseServer";

const FILE_PATH = path.join(process.cwd(), "data", "resources.json");

/**
 * DELETE /api/resources/[id]
 *
 * Delete a resource by ID. Handles both Supabase database delete and local JSON fallback.
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: "Resource ID is required." }, { status: 400 });
    }

    if (supabaseAdmin) {
      const { error } = await supabaseAdmin
        .from("resources")
        .delete()
        .eq("id", id);

      if (!error) {
        return NextResponse.json({ success: true, message: "Resource deleted from Supabase." });
      }
      console.warn("Supabase resource delete failed, falling back to local file. Error:", error);
    }

    // Local JSON Fallback delete
    if (fs.existsSync(FILE_PATH)) {
      const content = fs.readFileSync(FILE_PATH, "utf8");
      let resources = JSON.parse(content);
      const initialLength = resources.length;
      resources = resources.filter((res: any) => res.id !== id);

      if (resources.length < initialLength) {
        fs.writeFileSync(FILE_PATH, JSON.stringify(resources, null, 2), "utf8");
        return NextResponse.json({ success: true, message: "Resource deleted from local file." });
      }
    }

    return NextResponse.json({ success: false, error: "Resource not found." }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: "Resource ID is required." }, { status: 400 });
    }

    const { title, type, url, session_number } = await request.json();
    if (!title || !type || !url) {
      return NextResponse.json({ success: false, error: "Title, type, and URL are required." }, { status: 400 });
    }

    try {
      new URL(url);
    } catch (e) {
      return NextResponse.json({ success: false, error: "Please enter a valid URL (starting with http:// or https://)." }, { status: 400 });
    }

    if (supabaseAdmin) {
      const dbPayload = {
        title,
        type,
        file_url: url,
        session_number: session_number ? Number(session_number) : null,
      };

      const { data, error } = await supabaseAdmin
        .from("resources")
        .update(dbPayload)
        .eq("id", id)
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
      console.warn("Supabase resource update failed, falling back to local file. Error:", error);
    }

    // Local JSON Fallback update
    if (fs.existsSync(FILE_PATH)) {
      const content = fs.readFileSync(FILE_PATH, "utf8");
      let resources = JSON.parse(content);
      const idx = resources.findIndex((res: any) => res.id === id);

      if (idx !== -1) {
        resources[idx] = {
          ...resources[idx],
          title,
          type,
          url,
          session_number: session_number ? Number(session_number) : null,
        };
        fs.writeFileSync(FILE_PATH, JSON.stringify(resources, null, 2), "utf8");
        return NextResponse.json({ success: true, resource: resources[idx] });
      }
    }

    return NextResponse.json({ success: false, error: "Resource not found." }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
