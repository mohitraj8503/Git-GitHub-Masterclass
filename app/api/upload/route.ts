import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

const BUCKET = "assignment-attachments";
const MAX_BYTES = 10 * 1024 * 1024; // 10MB limit

async function ensureBucket() {
  if (!supabaseAdmin) return;
  const { data: buckets } = await supabaseAdmin.storage.listBuckets();
  if (buckets?.some((b: any) => b.name === BUCKET)) return;
  const { error } = await supabaseAdmin.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: MAX_BYTES,
  });
  if (error && !error.message.toLowerCase().includes("already exists")) {
    console.error("Failed to create assignment-attachments bucket:", error.message);
  }
}

export async function POST(request: Request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ success: false, error: "Server storage is unavailable." }, { status: 500 });
    }

    const form = await request.formData();
    const file = form.get("file") as File | null;
    if (!file || typeof file === "string") {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
    }

    await ensureBucket();

    // Generate unique safe filename
    const ext = file.name.split('.').pop() || 'bin';
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

    const { error: upErr } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(filename, file, { contentType: file.type, upsert: true });

    if (upErr) {
      return NextResponse.json({ success: false, error: upErr.message }, { status: 500 });
    }

    const publicUrl = supabaseAdmin.storage.from(BUCKET).getPublicUrl(filename).data.publicUrl;
    return NextResponse.json({ success: true, fileUrl: publicUrl });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
