import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

/**
 * GET /api/certificates/verify?id=GT/250609
 *
 * Public endpoint — no auth required.
 * Normalizes the ID so all of these work:
 *   GT/250609  |  gt/250609  |  GT-250609  |  250609  |  GT/AJU250609
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawId = searchParams.get("id");

  if (!rawId || !rawId.trim()) {
    return NextResponse.json(
      { valid: false, message: "Certificate ID is required." },
      { status: 400 }
    );
  }

  // Normalize: uppercase, replace hyphens and spaces with "/", strip extra whitespace
  let normalized = rawId.trim().toUpperCase().replace(/[-\s]+/g, "/");
  if (!normalized.startsWith("GT/")) {
    normalized = `GT/${normalized}`;
  }

  // Extract ID portion e.g., AJU250609 or 250609
  const rawIdPart = normalized.replace("GT/", "").replace(/[^A-Z0-9]/g, "");
  let numericIdPart = rawIdPart;
  if (numericIdPart.startsWith("AJU")) {
    numericIdPart = numericIdPart.substring(3);
  }

  let data: any = null;

  if (supabaseAdmin) {
    try {
      const { data: dbData, error } = await supabaseAdmin
        .from("certificates")
        .select("*")
        .or(`certificate_id.eq.GT/${numericIdPart},certificate_id.eq.GT/AJU${numericIdPart},enrollment_id.ilike.%${numericIdPart}%`)
        .maybeSingle();

      if (!error && dbData) {
        data = dbData;
      }
    } catch (e) {
      console.warn("[verify] Supabase query notice:", e);
    }
  }

  // Load local JSON description if present
  let localRecord: any = null;
  const certsJsonPath = path.join(process.cwd(), "data", "certificates.json");
  if (fs.existsSync(certsJsonPath)) {
    try {
      const certsList: any[] = JSON.parse(
        fs.readFileSync(certsJsonPath, "utf8")
      );
      localRecord = certsList.find(
        (c) =>
          c.certificate_id === normalized ||
          c.certificateId === normalized ||
          c.rawEnrollmentId === rawIdPart ||
          (c.enrollment_id &&
            c.enrollment_id.toUpperCase().replace(/[^A-Z0-9]/g, "") ===
              rawIdPart)
      );
    } catch (e) {
      console.error("[verify] Error reading local certificates for description:", e);
    }
  }

  if (!data) {
    data = localRecord;
  }

  if (!data) {
    return NextResponse.json(
      {
        valid: false,
        message:
          "No certificate found with this ID. Please double-check and try again.",
      },
      { status: 404 }
    );
  }

  const certStatus = data.status || "VALID";
  const certId = data.certificate_id || data.certificateId || normalized;
  const recipientName = data.recipient_name || data.recipientName;
  const workshopName = data.workshop_name || data.workshopName || "Git & GitHub Masterclass";
  const organizedBy = data.organized_by || data.organizedBy || "Arka Jain University";
  const collaborators = data.collaborators || ["Microsoft Learn Student Ambassadors", "GitHub"];
  const completionDate = data.completion_date || data.completionDate || "2026-07-23T00:00:00Z";
  const issuedAt = data.issued_at || data.issuedAt || data.created_at || "2026-07-23T00:00:00Z";

  let winnerRank: number | undefined = undefined;
  if (data.winnerRank) {
    winnerRank = Number(data.winnerRank);
  } else if (
    data.pdf_url &&
    typeof data.pdf_url === "string" &&
    data.pdf_url.startsWith("winner:")
  ) {
    winnerRank = parseInt(data.pdf_url.split(":")[1]);
  } else if (
    data.pdfUrl &&
    typeof data.pdfUrl === "string" &&
    data.pdfUrl.startsWith("winner:")
  ) {
    winnerRank = parseInt(data.pdfUrl.split(":")[1]);
  }

  if (certStatus === "REVOKED") {
    return NextResponse.json(
      {
        valid: false,
        status: "REVOKED",
        message: "This certificate has been revoked and is no longer valid.",
        certificate: {
          certificateId: certId,
          recipientName,
          workshopName,
          organizedBy,
          collaborators,
          completionDate,
          issuedAt,
          status: certStatus,
          winnerRank: winnerRank || undefined,
          description: data.description || localRecord?.description || undefined,
        },
      },
      { status: 200 }
    );
  }

  return NextResponse.json({
    valid: true,
    certificate: {
      certificateId: certId,
      recipientName,
      workshopName,
      organizedBy,
      collaborators,
      completionDate,
      issuedAt,
      status: certStatus,
      winnerRank: winnerRank || undefined,
      description: data.description || localRecord?.description || undefined,
    },
  });
}
