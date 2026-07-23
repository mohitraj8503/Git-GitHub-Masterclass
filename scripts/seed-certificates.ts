/**
 * Seed script: backfills all Git & GitHub Masterclass 23 July 2026 batch
 * certificates into the Supabase `certificates` table.
 *
 * Run once:
 *   npx tsx scripts/seed-certificates.ts
 *
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const COMPLETION_DATE = "2026-07-23T00:00:00Z";

/**
 * Parses students_details.txt and extracts valid (name, enrollmentId) pairs.
 * Skips rows where enrollment number looks invalid (e.g., "Arka Jain University").
 */
function parseStudents(): { recipientName: string; enrollmentId: string }[] {
  const filePath = path.resolve(__dirname, "../students_details.txt");
  const lines = fs.readFileSync(filePath, "utf-8").split("\n");

  const students: { recipientName: string; enrollmentId: string }[] = [];
  const seenIds = new Set<string>();

  for (const line of lines) {
    // Format: SL | Group | Roll No | Enrollment No | Name
    if (!line.trim() || line.startsWith("SL") || line.startsWith("---")) continue;

    const parts = line.split("|").map((p) => p.trim());
    if (parts.length < 5) continue;

    const rawEnrollment = parts[3];
    const name = parts[4];

    if (!rawEnrollment || !name) continue;

    // Skip obviously invalid enrollment numbers (e.g., "Arka Jain University", "N/A", "N/A")
    if (
      rawEnrollment === "N/A" ||
      rawEnrollment.toLowerCase().includes("university") ||
      rawEnrollment.length < 4
    ) {
      console.warn(`⚠️  Skipping invalid enrollment "${rawEnrollment}" for "${name}"`);
      continue;
    }

    // Normalize enrollment ID: uppercase, remove spaces
    const normalizedEnrollment = rawEnrollment.toUpperCase().replace(/\s+/g, "");
    const certificateId = `GT/${normalizedEnrollment}`;

    // Skip duplicates (same enrollmentId appears for different names — keep first)
    if (seenIds.has(certificateId)) {
      console.warn(`⚠️  Duplicate certificate_id "${certificateId}" for "${name}" — skipping`);
      continue;
    }
    seenIds.add(certificateId);

    students.push({
      recipientName: name,
      enrollmentId: normalizedEnrollment,
    });
  }

  return students;
}

async function main() {
  const students = parseStudents();
  console.log(`\n📋 Found ${students.length} valid students to seed\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const student of students) {
    const certificateId = `GT/${student.enrollmentId}`;
    const { error } = await supabase.from("certificates").upsert(
      {
        certificate_id: certificateId,
        recipient_name: student.recipientName,
        enrollment_id: student.enrollmentId,
        workshop_name: "Git & GitHub Masterclass",
        organized_by: "Arka Jain University",
        collaborators: ["Microsoft Learn Student Ambassadors", "GitHub"],
        completion_date: COMPLETION_DATE,
        status: "VALID",
      },
      { onConflict: "certificate_id" }
    );

    if (error) {
      console.error(`❌ Failed to upsert ${certificateId} (${student.recipientName}): ${error.message}`);
      errorCount++;
    } else {
      console.log(`✅ ${certificateId} — ${student.recipientName}`);
      successCount++;
    }
  }

  console.log(`\n🏁 Done! ${successCount} seeded, ${errorCount} errors.`);
}

main().catch(console.error);
