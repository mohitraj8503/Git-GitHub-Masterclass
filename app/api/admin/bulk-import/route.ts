import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import ExcelJS from "exceljs";

import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

// Simple email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized: Admins only." }, { status: 401 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ success: false, error: "Database client not initialized." }, { status: 500 });
    }

    const contentType = request.headers.get("content-type") || "";

    // -------------------------------------------------------------
    // ACTION 1: PARSE EXCEL FILE
    // -------------------------------------------------------------
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      if (!file || typeof file === "string") {
        return NextResponse.json({ success: false, error: "No file uploaded." }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(Buffer.from(bytes) as any);
      const worksheet = workbook.getWorksheet(1);
      
      if (!worksheet) {
        return NextResponse.json({ success: false, error: "Empty or invalid Excel worksheet." }, { status: 400 });
      }

      const headers: string[] = [];
      const rows: any[] = [];
      
      worksheet.eachRow((row, rowNumber) => {
        const rowData: Record<string, any> = {};
        if (rowNumber === 1) {
          row.eachCell((cell) => {
            headers.push(String(cell.value || "").trim());
          });
        } else {
          row.eachCell((cell, colNumber) => {
            const header = headers[colNumber - 1];
            if (header) {
              rowData[header] = cell.value;
            }
          });
          // Only add row if it has values
          if (Object.keys(rowData).length > 0) {
            rows.push(rowData);
          }
        }
      });

      return NextResponse.json({
        success: true,
        headers,
        previewRows: rows.slice(0, 15),
        totalRows: rows.length,
        allRows: rows // Return all rows to let client pass them back on import step
      });
    }

    // -------------------------------------------------------------
    // ACTION 2: BULK IMPORT FROM PARSED DATA
    // -------------------------------------------------------------
    const { action, data, mapping } = await request.json();
    if (action !== "import" || !Array.isArray(data) || !mapping) {
      return NextResponse.json({ success: false, error: "Invalid payload for import action." }, { status: 400 });
    }

    // Fetch existing registrations to prevent duplicate entries
    const { data: existingRegs, error: fetchErr } = await supabaseAdmin
      .from("registrations")
      .select("email, enrollment_number");

    if (fetchErr) {
      throw fetchErr;
    }

    const existingEmails = new Set((existingRegs || []).map(r => String(r.email).toLowerCase().trim()));
    const existingEnrollments = new Set((existingRegs || []).map(r => String(r.enrollment_number).toUpperCase().trim()));

    let importedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;
    const failures: Array<{ row: number; name?: string; reason: string }> = [];

    // Map and validate rows
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const name = String(row[mapping.name] || "").trim();
      const email = String(row[mapping.email] || "").trim().toLowerCase();
      const enrollment = String(row[mapping.enrollment_number] || "").trim().toUpperCase();
      const phoneRaw = String(row[mapping.phone_number] || "").trim();
      
      // Additional optional fields with safe database default fallbacks
      const branch = String(row[mapping.branch] || "").trim() || "CS";
      const year = String(row[mapping.year_of_study] || "").trim() || "1st Year";
      const sectionClass = mapping.section_class && row[mapping.section_class] ? String(row[mapping.section_class]).trim() : "N/A";
      const gitExperience = mapping.git_experience && row[mapping.git_experience] ? String(row[mapping.git_experience]).trim() : "No";
      const hasLaptop = mapping.has_laptop && row[mapping.has_laptop] ? String(row[mapping.has_laptop]).trim() : "Yes";
      const hasGithubAccount = mapping.has_github_account && row[mapping.has_github_account] ? String(row[mapping.has_github_account]).trim() : "No";
      const availableAllDays = mapping.available_all_days && row[mapping.available_all_days] ? String(row[mapping.available_all_days]).trim() : "Yes";
      const joiningReason = mapping.joining_reason && row[mapping.joining_reason] ? String(row[mapping.joining_reason]).trim() : "To learn Git/GitHub";

      // Validation
      if (!name || !email || !enrollment || !phoneRaw) {
        failedCount++;
        failures.push({
          row: i + 2,
          name: name || "Unknown",
          reason: "Required fields (Name, Email, Enrollment Number, Phone) are missing."
        });
        continue;
      }

      if (!EMAIL_REGEX.test(email)) {
        failedCount++;
        failures.push({
          row: i + 2,
          name,
          reason: `Invalid email format: "${email}"`
        });
        continue;
      }

      // Duplicate Check
      if (existingEmails.has(email) || existingEnrollments.has(enrollment)) {
        skippedCount++;
        continue;
      }

      // Format phone number (remove +91, spaces)
      const phoneFormatted = phoneRaw.replace(/^(\+91|0)/, "").replace(/\s+/g, "");

      // Generate a unique ID matching the schema format
      const uniqueId = (Date.now() + i).toString();

      // Insert Student
      const { error: insErr } = await supabaseAdmin.from("registrations").insert({
        id: uniqueId,
        name,
        email,
        enrollment_number: enrollment,
        phone_number: phoneFormatted,
        branch,
        year_of_study: year,
        section_class: sectionClass,
        git_experience: gitExperience,
        has_laptop: hasLaptop,
        has_github_account: hasGithubAccount,
        available_all_days: availableAllDays,
        joining_reason: joiningReason,
        total_xp: 0
      });

      if (insErr) {
        failedCount++;
        failures.push({
          row: i + 2,
          name,
          reason: insErr.message
        });
      } else {
        importedCount++;
        // Add to sets to prevent duplicate inside the sheet itself
        existingEmails.add(email);
        existingEnrollments.add(enrollment);
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        imported: importedCount,
        skipped: skippedCount,
        failed: failedCount,
      },
      failures
    });

  } catch (err: any) {
    console.error("Bulk Import error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
