import * as XLSX from "xlsx";
import * as path from "path";
import * as fs from "fs";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const RESULT_EXCEL_PATH = path.resolve(
  __dirname,
  "../Certificate-Eligibility-Result.xlsx"
);
const RAW_EXCEL_PATH = path.resolve(
  __dirname,
  "../Git & Github Masterclass Attendance.xlsx"
);

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const supabase =
  supabaseUrl && supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : null;

// Manual exemptions list (students explicitly granted eligibility)
const MANUAL_EXEMPTIONS_MAP: Record<string, string> = {
  AJU240153: "Ayush Singh",
  AJU250609: "Mohit Raj",
  "250609": "Mohit Raj",
};

const MANUAL_ELIGIBLE_EXEMPTIONS = new Set(Object.keys(MANUAL_EXEMPTIONS_MAP));

function normalizeId(raw: any): string {
  if (!raw) return "";
  return String(raw).trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function formatEnrollmentId(id: string): string {
  if (id.startsWith("AJU") && !id.includes("/")) {
    return "AJU/" + id.slice(3);
  }
  return id;
}

interface StudentAttendanceRecord {
  name: string;
  enrollmentId: string;
  rawEnrollmentId: string;
  day1Present: boolean;
  otherDaysPresentCount: number;
  totalDaysPresent: number;
  eligible: boolean;
}

async function main() {
  // Fetch top 70 leaderboard participants to ensure their eligibility
  if (supabase) {
    try {
      const { data: topStudents } = await supabase
        .from("registrations")
        .select("*")
        .order("total_xp", { ascending: false })
        .limit(70);

      if (topStudents && topStudents.length > 0) {
        console.log(`🏆 Automatically adding Top ${topStudents.length} leaderboard students to certificate exemptions...`);
        topStudents.forEach((s: any) => {
          const rawId = s.enrollment_number || s.enrollmentNumber || s.enrollment_id || "";
          const norm = normalizeId(rawId);
          if (norm) {
            MANUAL_ELIGIBLE_EXEMPTIONS.add(norm);
            if (s.name) {
              MANUAL_EXEMPTIONS_MAP[norm] = s.name;
            }
          }
        });
      }
    } catch (e) {
      console.warn("Could not query top leaderboard students for auto-exemption:", e);
    }
  }

  const eligible: StudentAttendanceRecord[] = [];
  const notEligible: StudentAttendanceRecord[] = [];
  const summaryRecords: Record<string, StudentAttendanceRecord> = {};
  const certificatesList: any[] = [];

  if (fs.existsSync(RESULT_EXCEL_PATH)) {
    console.log(`Reading processed results from: ${RESULT_EXCEL_PATH}`);
    const wb = XLSX.readFile(RESULT_EXCEL_PATH);
    const sheetName = wb.SheetNames.includes("Certificate Eligibility")
      ? "Certificate Eligibility"
      : wb.SheetNames[0];
    const rows: any[] = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], {
      defval: "",
    });

    rows.forEach((r) => {
      const name = String(r.Name || "").trim();
      const rawEnrollment = String(r["Enrollment No."] || "").trim();
      const normId = normalizeId(rawEnrollment);
      if (!normId) return;

      const day1Present =
        String(r["Day 1 Present"]).trim().toLowerCase() === "yes" ||
        String(r["Day 1 Present"]).trim().toLowerCase() === "true" ||
        String(r["Day 1 Present"]).trim() === "1";

      const otherDaysPresentCount =
        Number(r["Days Present (Day2-6)"] || r["Days Present"]) || 0;
      const totalDaysPresent =
        Number(r["Total Days Present (of 6)"] || r["Total Days Present"]) ||
        (day1Present ? 1 : 0) + otherDaysPresentCount;

      const resultText = String(r.Result || "").trim().toUpperCase();
      const isEligible =
        MANUAL_ELIGIBLE_EXEMPTIONS.has(normId) || resultText === "ELIGIBLE";

      const formattedEnrollment = formatEnrollmentId(normId);

      const record: StudentAttendanceRecord = {
        name: MANUAL_EXEMPTIONS_MAP[normId] || name,
        enrollmentId: formattedEnrollment,
        rawEnrollmentId: normId,
        day1Present,
        otherDaysPresentCount,
        totalDaysPresent,
        eligible: isEligible,
      };

      summaryRecords[normId] = record;
      summaryRecords[formattedEnrollment] = record;

      if (isEligible) {
        eligible.push(record);
        certificatesList.push({
          certificate_id: `GT/${normId}`,
          certificateId: `GT/${normId}`,
          recipient_name: record.name,
          recipientName: record.name,
          enrollment_id: formattedEnrollment,
          enrollmentId: formattedEnrollment,
          rawEnrollmentId: normId,
          workshop_name: "Git & GitHub Masterclass",
          workshopName: "Git & GitHub Masterclass",
          organized_by: "Arka Jain University",
          organizedBy: "Arka Jain University",
          collaborators: ["Microsoft Learn Student Ambassadors", "GitHub"],
          completion_date: "2026-07-23T00:00:00Z",
          completionDate: "2026-07-23T00:00:00Z",
          status: "VALID",
        });
      } else {
        notEligible.push(record);
      }
    });

    // Ensure manual exemptions are present even if not in Excel
    Object.entries(MANUAL_EXEMPTIONS_MAP).forEach(([exId, studentName]) => {
      if (!summaryRecords[exId]) {
        const record: StudentAttendanceRecord = {
          name: studentName,
          enrollmentId: formatEnrollmentId(exId),
          rawEnrollmentId: exId,
          day1Present: true,
          otherDaysPresentCount: 5,
          totalDaysPresent: 6,
          eligible: true,
        };
        summaryRecords[exId] = record;
        summaryRecords[record.enrollmentId] = record;
        eligible.push(record);
        certificatesList.push({
          certificate_id: `GT/${exId}`,
          certificateId: `GT/${exId}`,
          recipient_name: studentName,
          recipientName: studentName,
          enrollment_id: record.enrollmentId,
          enrollmentId: record.enrollmentId,
          rawEnrollmentId: exId,
          workshop_name: "Git & GitHub Masterclass",
          workshopName: "Git & GitHub Masterclass",
          organized_by: "Arka Jain University",
          organizedBy: "Arka Jain University",
          collaborators: ["Microsoft Learn Student Ambassadors", "GitHub"],
          completion_date: "2026-07-23T00:00:00Z",
          completionDate: "2026-07-23T00:00:00Z",
          status: "VALID",
        });
      }
    });
  }

  console.log(`\n===================================`);
  console.log(
    `Total Unique Students Evaluated: ${
      eligible.length + notEligible.length
    }`
  );
  console.log(`✅ Eligible for Certificate: ${eligible.length}`);
  console.log(`❌ Not Eligible for Certificate: ${notEligible.length}`);
  console.log(`===================================\n`);

  const dataDir = path.resolve(__dirname, "../data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const reportPath = path.resolve(__dirname, "../eligibility-report.json");
  fs.writeFileSync(
    reportPath,
    JSON.stringify({ eligible, notEligible }, null, 2),
    "utf-8"
  );
  console.log(`💾 Saved report to ${reportPath}`);

  const summaryJsonPath = path.resolve(dataDir, "attendance_summary.json");
  fs.writeFileSync(
    summaryJsonPath,
    JSON.stringify(summaryRecords, null, 2),
    "utf-8"
  );
  console.log(`💾 Saved attendance summary JSON to ${summaryJsonPath}`);

  const certsJsonPath = path.resolve(dataDir, "certificates.json");
  fs.writeFileSync(
    certsJsonPath,
    JSON.stringify(certificatesList, null, 2),
    "utf-8"
  );
  console.log(`💾 Saved certificates JSON to ${certsJsonPath}`);

  if (supabase) {
    console.log(`\nAttempting Supabase sync...`);
    for (const cert of certificatesList) {
      try {
        await supabase.from("certificates").upsert(cert, {
          onConflict: "certificate_id",
        });
      } catch (e) {}
    }
  }
}

main().catch(console.error);
