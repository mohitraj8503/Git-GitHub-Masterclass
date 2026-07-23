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
 * GET /api/certificates/my-status?enrollment_number=AJU/250609
 *
 * Returns student certificate eligibility status and details (or exact reason why ineligible).
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawEnrollment = searchParams.get("enrollment_number");

  if (!rawEnrollment || !rawEnrollment.trim()) {
    return NextResponse.json(
      { error: "enrollment_number parameter is required." },
      { status: 400 }
    );
  }

  const normId = normalizeEnrollmentId(rawEnrollment);
  const certId = `GT/${normId}`;

  let certificate: any = null;

  // 1. Try Supabase certificates table (matches GT/250609, GT/AJU250609, or enrollment containing 250609)
  if (supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from("certificates")
        .select("*")
        .or(`certificate_id.eq.${certId},certificate_id.eq.GT/AJU${normId},enrollment_id.ilike.%${normId}%`)
        .maybeSingle();

      if (!error && data) {
        certificate = data;
      }
    } catch (e) {
      console.warn("[my-status] Supabase query notice:", e);
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
          c.rawEnrollmentId === normId ||
          normalizeEnrollmentId(c.enrollmentId || c.enrollment_id || "") ===
            normId ||
          c.certificateId === certId ||
          c.certificate_id === certId
      );
    } catch (e) {
      console.error("[my-status] Error reading local certificates for description:", e);
    }
  }

  // 2. Fallback to local data/certificates.json
  if (!certificate) {
    certificate = localRecord;
  }

  // If student IS eligible and has a certificate
  if (certificate && certificate.status !== "REVOKED") {
    let winnerRank: number | undefined = undefined;
    if (certificate.winnerRank) {
      winnerRank = Number(certificate.winnerRank);
    } else if (
      certificate.pdf_url &&
      typeof certificate.pdf_url === "string" &&
      certificate.pdf_url.startsWith("winner:")
    ) {
      winnerRank = parseInt(certificate.pdf_url.split(":")[1]);
    } else if (
      certificate.pdfUrl &&
      typeof certificate.pdfUrl === "string" &&
      certificate.pdfUrl.startsWith("winner:")
    ) {
      winnerRank = parseInt(certificate.pdfUrl.split(":")[1]);
    }

    return NextResponse.json({
      eligible: true,
      certificate: {
        certificateId: certificate.certificate_id || certificate.certificateId || certId,
        recipientName: certificate.recipient_name || certificate.recipientName,
        enrollmentId: certificate.enrollment_id || certificate.enrollmentId || rawEnrollment,
        workshopName: certificate.workshop_name || certificate.workshopName || "Git & GitHub Masterclass",
        organizedBy: certificate.organized_by || certificate.organizedBy || "Arka Jain University",
        completionDate: certificate.completion_date || certificate.completionDate || "2026-07-23T00:00:00Z",
        issuedAt: certificate.issued_at || certificate.issuedAt || "2026-07-23T00:00:00Z",
        status: certificate.status || "VALID",
        winnerRank: winnerRank || undefined,
        description: certificate.description || localRecord?.description || undefined,
      },
    });
  }

  // If NOT eligible — look up detailed attendance explanation
  let attendanceRecord: any = null;

  const summaryJsonPath = path.join(
    process.cwd(),
    "data",
    "attendance_summary.json"
  );
  if (fs.existsSync(summaryJsonPath)) {
    try {
      const summaryMap: Record<string, any> = JSON.parse(
        fs.readFileSync(summaryJsonPath, "utf8")
      );
      attendanceRecord = summaryMap[normId] || summaryMap[rawEnrollment];
    } catch (e) {
      console.error("[my-status] Error reading attendance_summary.json:", e);
    }
  }

  if (!attendanceRecord) {
    return NextResponse.json({
      eligible: false,
      reason:
        "We couldn't find your attendance record. Please contact the Microsoft Club team.",
      day1Present: false,
      otherDaysPresentCount: 0,
      totalDaysPresent: 0,
    });
  }

  const { day1Present, otherDaysPresentCount, totalDaysPresent } =
    attendanceRecord;

  let reason = "";
  if (!day1Present) {
    reason =
      "Day 1 attendance is mandatory for certificate eligibility. Unfortunately your attendance record shows you missed Day 1.";
  } else if (otherDaysPresentCount < 4) {
    reason = `You attended Day 1 ✅ but attended only ${otherDaysPresentCount} out of 5 remaining sessions. Minimum 4 out of 5 required.`;
  } else {
    reason =
      "Your certificate status is currently pending review. Please contact support.";
  }

  return NextResponse.json({
    eligible: false,
    reason,
    day1Present: Boolean(day1Present),
    otherDaysPresentCount: Number(otherDaysPresentCount || 0),
    totalDaysPresent: Number(totalDaysPresent || 0),
  });
}
