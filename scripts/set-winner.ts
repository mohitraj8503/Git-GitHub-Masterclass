import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be defined in your .env file.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function normalizeEnrollmentId(id: string): string {
  if (!id) return "";
  let clean = id.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (clean.startsWith("AJU")) {
    clean = clean.substring(3);
  }
  return clean;
}

async function run() {
  const args = process.argv.slice(2);
  const enrollmentArgIndex = args.indexOf("--enrollment");
  const rankArgIndex = args.indexOf("--rank");

  if (enrollmentArgIndex === -1 || rankArgIndex === -1) {
    console.log("Usage: npx ts-node scripts/set-winner.ts --enrollment <EnrollmentID> --rank <1|2|3|0>");
    console.log("Use rank 0 or clear to remove winner rank.");
    process.exit(1);
  }

  const enrollmentId = args[enrollmentArgIndex + 1]?.trim().toUpperCase();
  const rankVal = args[rankArgIndex + 1];
  const rank = Number(rankVal);

  if (!enrollmentId) {
    console.error("❌ Error: Missing enrollment value.");
    process.exit(1);
  }

  if (isNaN(rank) || rank < 0 || rank > 3) {
    console.error("❌ Error: Rank must be 1, 2, 3 (for winners) or 0 (standard standard).");
    process.exit(1);
  }

  console.log(`⏳ Searching certificate for enrollment ID: "${enrollmentId}"...`);

  const normId = normalizeEnrollmentId(enrollmentId);
  const certificateId = `GT/${normId}`;

  const pdfUrlValue = rank > 0 ? `winner:${rank}` : null;

  // 1. Update Supabase Database
  let updatedRecordInDb = false;
  try {
    const { data, error } = await supabase
      .from("certificates")
      .update({ pdf_url: pdfUrlValue, updated_at: new Date().toISOString() })
      .eq("enrollment_id", enrollmentId);

    if (error) {
      console.warn("⚠️ Supabase error updating by enrollment_id:", error.message);
    } else {
      // Try checking if it updated or double update via certificate_id
      const { data: data2, error: error2 } = await supabase
        .from("certificates")
        .update({ pdf_url: pdfUrlValue, updated_at: new Date().toISOString() })
        .eq("certificate_id", certificateId);
      
      console.log(`✅ Supabase Database record update completed successfully.`);
      updatedRecordInDb = true;
    }
  } catch (err: any) {
    console.warn("⚠️ Supabase connection warning:", err.message);
  }

  // 2. Update Local fallback JSON file
  try {
    const certsJsonPath = path.join(process.cwd(), "data", "certificates.json");
    if (fs.existsSync(certsJsonPath)) {
      const fileContent = fs.readFileSync(certsJsonPath, "utf8");
      const certsList: any[] = JSON.parse(fileContent);

      const existingIdx = certsList.findIndex(
        (c) =>
          c.certificateId === certificateId ||
          c.certificate_id === certificateId ||
          c.rawEnrollmentId === normId ||
          normalizeEnrollmentId(c.enrollmentId || c.enrollment_id || "") === normId
      );

      if (existingIdx >= 0) {
        certsList[existingIdx].winnerRank = rank > 0 ? rank : undefined;
        certsList[existingIdx].pdf_url = pdfUrlValue;
        certsList[existingIdx].pdfUrl = pdfUrlValue;
        certsList[existingIdx].updated_at = new Date().toISOString();
        
        fs.writeFileSync(certsJsonPath, JSON.stringify(certsList, null, 2), "utf8");
        console.log(`✅ Local data/certificates.json updated successfully.`);
      } else {
        console.log(`⚠️ Warning: Certificate ID ${certificateId} not found in local certificates.json fallback list.`);
      }
    } else {
      console.log("⚠️ data/certificates.json fallback file not found.");
    }
  } catch (err: any) {
    console.error("❌ Error updating local JSON fallback:", err.message);
  }

  console.log(`\n🎉 Process finished! If the certificate exists, it is now set to Rank ${rank > 0 ? rank : "Standard"}.`);
  console.log("No Next.js code changes or deployment needed. The student's dashboard and verify page will reflect this change on the next load!");
}

run();
