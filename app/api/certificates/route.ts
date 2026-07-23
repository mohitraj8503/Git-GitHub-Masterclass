import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

function normalizeEnrollmentId(id: string): string {
  if (!id) return "";
  let clean = id.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (clean.startsWith("AJU")) {
    clean = clean.substring(3);
  }
  return clean;
}

/**
 * POST /api/certificates
 *
 * Issues / Registers a certificate in DB and local certificates.json.
 * Body:
 * {
 *   recipientName: string;
 *   enrollmentId: string;
 *   completionDate: string;
 *   customCertificateId?: string;
 *   winnerRank?: number;
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { recipientName, enrollmentId, completionDate, customCertificateId, winnerRank, description } = body;

    if (!recipientName || !enrollmentId || !completionDate) {
      return NextResponse.json(
        { success: false, error: "recipientName, enrollmentId, and completionDate are required." },
        { status: 400 }
      );
    }

    const normId = normalizeEnrollmentId(enrollmentId);
    const certificateId = customCertificateId?.trim() || `GT/${normId}`;

    const parsedDate = new Date(completionDate);
    const completionDateISO = isNaN(parsedDate.getTime())
      ? new Date().toISOString()
      : parsedDate.toISOString();

    // Store winnerRank in pdf_url as "winner:X" so we don't need a schema change
    const pdfUrlValue = winnerRank && [1, 2, 3].includes(Number(winnerRank))
      ? `winner:${winnerRank}`
      : null;

    const certRecord = {
      certificate_id: certificateId,
      certificateId: certificateId,
      recipient_name: recipientName,
      recipientName: recipientName,
      enrollment_id: enrollmentId.trim().toUpperCase(),
      enrollmentId: enrollmentId.trim().toUpperCase(),
      rawEnrollmentId: normId,
      workshop_name: "Git & GitHub Masterclass",
      workshopName: "Git & GitHub Masterclass",
      organized_by: "Arka Jain University",
      organizedBy: "Arka Jain University",
      collaborators: ["Microsoft Learn Student Ambassadors", "GitHub"],
      completion_date: completionDateISO,
      completionDate: completionDateISO,
      description: description || undefined,
      status: "VALID",
      pdf_url: pdfUrlValue,
      pdfUrl: pdfUrlValue,
      winnerRank: winnerRank ? Number(winnerRank) : undefined,
      issued_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 1. Try Supabase upsert
    let supabaseResult = null;
    if (supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin
          .from("certificates")
          .upsert(
            {
              certificate_id: certificateId,
              recipient_name: recipientName,
              enrollment_id: enrollmentId.trim().toUpperCase(),
              workshop_name: "Git & GitHub Masterclass",
              organized_by: "Arka Jain University",
              collaborators: ["Microsoft Learn Student Ambassadors", "GitHub"],
              completion_date: completionDateISO,
              status: "VALID",
              pdf_url: pdfUrlValue,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "certificate_id" }
          )
          .select()
          .maybeSingle();

        if (!error && data) {
          supabaseResult = data;
        }
      } catch (e) {
        console.warn("[certificates POST] Supabase upsert notice:", e);
      }
    }

    // 2. Persist in local data/certificates.json
    try {
      const dataDir = path.join(process.cwd(), "data");
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      const certsJsonPath = path.join(dataDir, "certificates.json");
      let certsList: any[] = [];
      if (fs.existsSync(certsJsonPath)) {
        certsList = JSON.parse(fs.readFileSync(certsJsonPath, "utf8"));
      }

      // Check if already exists in list (update or append)
      const existingIdx = certsList.findIndex(
        (c) =>
          c.certificateId === certificateId ||
          c.certificate_id === certificateId ||
          c.rawEnrollmentId === normId ||
          normalizeEnrollmentId(c.enrollmentId || c.enrollment_id || "") === normId
      );

      if (existingIdx >= 0) {
        certsList[existingIdx] = { ...certsList[existingIdx], ...certRecord };
      } else {
        certsList.push(certRecord);
      }

      fs.writeFileSync(certsJsonPath, JSON.stringify(certsList, null, 2), "utf8");
    } catch (e) {
      console.error("[certificates POST] Local JSON write error:", e);
    }

    return NextResponse.json(
      {
        success: true,
        message: `Certificate successfully issued for ${recipientName}!`,
        certificate: supabaseResult || certRecord,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
