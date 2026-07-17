import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { syncProfileCompletionXp } from "@/lib/xp";

export const dynamic = "force-dynamic";

const BUCKET = "profile-photos";
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

async function getRegistrationId(enrollmentNumber: string): Promise<string | null> {
  if (!supabaseAdmin) return null;
  const { data } = await supabaseAdmin
    .from("registrations")
    .select("id")
    .eq("enrollment_number", enrollmentNumber.trim())
    .maybeSingle();
  return (data as any)?.id ?? null;
}

async function ensureBucket() {
  if (!supabaseAdmin) return;
  const { data: buckets } = await supabaseAdmin.storage.listBuckets();
  if (buckets?.some((b: any) => b.name === BUCKET)) return;
  const { error } = await supabaseAdmin.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: MAX_BYTES,
    allowedMimeTypes: ALLOWED_TYPES,
  });
  if (error && !error.message.toLowerCase().includes("already exists")) {
    console.error("Failed to create profile-photos bucket:", error.message);
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const enrollmentNumber = searchParams.get("enrollment_number");
    if (!enrollmentNumber) {
      return NextResponse.json({ success: false, error: "enrollment_number is required" }, { status: 400 });
    }
    if (!supabaseAdmin) {
      return NextResponse.json({ success: true, profile: null });
    }

    const regId = await getRegistrationId(enrollmentNumber);
    if (!regId) {
      return NextResponse.json({ success: true, profile: null });
    }

    const { data } = await supabaseAdmin
      .from("profiles")
      .select("bio, github_username, linkedin_url, avatar_url")
      .eq("id", regId)
      .maybeSingle();

    return NextResponse.json({ success: true, profile: data ?? null });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const role = (form.get("role") as string) || "";
    const email = (form.get("email") as string) || "";

    // --- Admin avatar upload (keyed by email; no registration record needed) ---
    if (role === "admin") {
      if (!supabaseAdmin) {
        return NextResponse.json({ success: false, error: "Server storage is unavailable." }, { status: 500 });
      }
      await ensureBucket();

      let avatarUrl: string | null = null;
      const file = form.get("photo");
      if (file && typeof file !== "string") {
        if (!ALLOWED_TYPES.includes((file as File).type)) {
          return NextResponse.json(
            { success: false, error: "Only JPG, PNG, or WEBP images are allowed." },
            { status: 400 }
          );
        }
        if ((file as File).size > MAX_BYTES) {
          return NextResponse.json(
            { success: false, error: "Image is too large. Maximum size is 5MB." },
            { status: 400 }
          );
        }

        const ext =
          (file as File).type === "image/png" ? "png" : (file as File).type === "image/webp" ? "webp" : "jpg";
        const safeEmail = (email || "admin").replace(/[^a-zA-Z0-9]/g, "_");
        const path = `admin-${safeEmail}.${ext}`;

        // Remove any previous admin photo variants before uploading the new one.
        const { data: existing } = await supabaseAdmin.storage.from(BUCKET).list("");
        const stale = (existing || []).filter((f: any) => f.name.startsWith(`admin-${safeEmail}.`));
        if (stale.length) {
          await supabaseAdmin.storage.from(BUCKET).remove(stale.map((f: any) => f.name));
        }

        const { error: upErr } = await supabaseAdmin.storage
          .from(BUCKET)
          .upload(path, file, { contentType: (file as File).type, upsert: true });
        if (upErr) {
          return NextResponse.json({ success: false, error: upErr.message }, { status: 500 });
        }
        avatarUrl = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
      }

      return NextResponse.json({ success: true, avatar_url: avatarUrl });
    }

    const enrollmentNumber = (form.get("enrollment_number") as string) || "";
    if (!enrollmentNumber) {
      return NextResponse.json({ success: false, error: "enrollment_number is required" }, { status: 400 });
    }
    if (!supabaseAdmin) {
      return NextResponse.json({ success: false, error: "Server storage is unavailable." }, { status: 500 });
    }

    const regId = await getRegistrationId(enrollmentNumber);
    if (!regId) {
      return NextResponse.json({ success: false, error: "Student registration not found." }, { status: 404 });
    }

    await ensureBucket();

    let avatarUrl: string | null = null;
    const file = form.get("photo");
    if (file && typeof file !== "string") {
      if (!ALLOWED_TYPES.includes((file as File).type)) {
        return NextResponse.json(
          { success: false, error: "Only JPG, PNG, or WEBP images are allowed." },
          { status: 400 }
        );
      }
      if ((file as File).size > MAX_BYTES) {
        return NextResponse.json(
          { success: false, error: "Image is too large. Maximum size is 5MB." },
          { status: 400 }
        );
      }

      const ext =
        (file as File).type === "image/png" ? "png" : (file as File).type === "image/webp" ? "webp" : "jpg";
      const path = `${regId}.${ext}`;

      // Remove any previous photo variants for this student before uploading the new one.
      const { data: existing } = await supabaseAdmin.storage.from(BUCKET).list("");
      const stale = (existing || []).filter((f: any) => f.name.startsWith(`${regId}.`));
      if (stale.length) {
        await supabaseAdmin.storage.from(BUCKET).remove(stale.map((f: any) => f.name));
      }

      const { error: upErr } = await supabaseAdmin.storage
        .from(BUCKET)
        .upload(path, file, { contentType: (file as File).type, upsert: true });
      if (upErr) {
        return NextResponse.json({ success: false, error: upErr.message }, { status: 500 });
      }
      avatarUrl = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
    }

    const bio = ((form.get("bio") as string) ?? null);
    const github_username = ((form.get("github_username") as string) ?? null);
    const linkedin_url = ((form.get("linkedin_url") as string) ?? null);

    const { error: dbErr } = await supabaseAdmin.from("profiles").upsert(
      {
        id: regId,
        bio,
        github_username,
        linkedin_url,
        ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );
    if (dbErr) {
      return NextResponse.json({ success: false, error: dbErr.message }, { status: 500 });
    }

    await syncProfileCompletionXp(enrollmentNumber);

    return NextResponse.json({ success: true, avatar_url: avatarUrl });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
