const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');

const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] ? match[2].trim() : '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    }
    env[match[1]] = value;
  }
});

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function main() {
  console.log("🚀 Starting REAL bulk student import from Excel sheet...");
  const filePath = 'C:\\Users\\mohit\\Desktop\\Git & GitHub Master Workshop — Registration Form (Responses).xlsx';
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const worksheet = workbook.getWorksheet(1);

  if (!worksheet) {
    console.error("Failed to load worksheet.");
    return;
  }

  // 1. Fetch existing registrations to prevent duplicate entries
  console.log("Fetching existing registrations for duplicate check...");
  const { data: existingRegs, error: fetchErr } = await supabase
    .from("registrations")
    .select("email, enrollment_number");

  if (fetchErr) {
    console.error("Database query failed:", fetchErr);
    return;
  }

  const existingEmails = new Set((existingRegs || []).map(r => String(r.email).toLowerCase().trim()));
  const existingEnrollments = new Set((existingRegs || []).map(r => String(r.enrollment_number).toUpperCase().trim()));

  console.log(`Loaded ${existingEmails.size} existing emails and ${existingEnrollments.size} existing enrollment numbers.`);

  let totalRows = 0;
  let importedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;
  const failures = [];

  // Map of Excel columns (1-indexed)
  // 1: Timestamp
  // 2: Full Name
  // 3: Enrollment Number
  // 4: Email Address
  // 5: Phone Number (WhatsApp)
  // 6: Branch / Department
  // 7: Year of Study
  // 8: Section / Class
  // 9: Have you used Git/GitHub before?
  // 10: Do you have a laptop to bring for hands-on sessions?
  // 11: Do you already have a GitHub account?
  // 12: Are you available for all 7 days at the scheduled time?
  // 13: Why do you want to join this workshop?

  const rowsToProcess = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // Skip headers
    totalRows++;

    const name = String(row.getCell(2).value || "").trim();
    const enrollRaw = String(row.getCell(3).value || "").trim();
    const email = String(row.getCell(4).value || "").trim().toLowerCase();
    const phoneRaw = String(row.getCell(5).value || "").trim();
    const branch = String(row.getCell(6).value || "").trim() || "CS";
    const year = String(row.getCell(7).value || "").trim() || "1st Year";
    const sectionClass = String(row.getCell(8).value || "").trim() || "N/A";
    const gitExp = String(row.getCell(9).value || "").trim() || "No";
    const hasLaptop = String(row.getCell(10).value || "").trim() || "Yes";
    const hasGithub = String(row.getCell(11).value || "").trim() || "No";
    const available = String(row.getCell(12).value || "").trim() || "Yes";
    const reason = String(row.getCell(13).value || "").trim() || "Self growth";

    rowsToProcess.push({
      rowNumber,
      name,
      enrollRaw,
      email,
      phoneRaw,
      branch,
      year,
      sectionClass,
      gitExp,
      hasLaptop,
      hasGithub,
      available,
      reason
    });
  });

  console.log(`Processing ${totalRows} rows from Excel...`);

  for (const item of rowsToProcess) {
    const {
      rowNumber,
      name,
      enrollRaw,
      email,
      phoneRaw,
      branch,
      year,
      sectionClass,
      gitExp,
      hasLaptop,
      hasGithub,
      available,
      reason
    } = item;

    // 1. Basic Required Validation
    if (!name || !enrollRaw || !email || !phoneRaw) {
      failedCount++;
      failures.push({
        row: rowNumber,
        name: name || "Unknown",
        reason: "Missing required fields (Name, Email, Enrollment, or Phone)."
      });
      continue;
    }

    if (!EMAIL_REGEX.test(email)) {
      failedCount++;
      failures.push({
        row: rowNumber,
        name,
        reason: `Invalid email format: "${email}"`
      });
      continue;
    }

    // 2. Normalize Enrollment Number
    // Standardise to "AJU/XXXXXX" format
    // Strip non-alphanumeric, extract the numeric part.
    const cleanNumbers = enrollRaw.replace(/\D/g, "");
    
    if (cleanNumbers.length !== 6) {
      failedCount++;
      failures.push({
        row: rowNumber,
        name,
        reason: `Enrollment number pattern violation: "${enrollRaw}" (Expected 6 digits, got ${cleanNumbers.length}).`
      });
      continue;
    }

    const enrollmentNormalized = `AJU/${cleanNumbers}`;

    // 3. Duplicate Checks
    if (existingEmails.has(email)) {
      skippedCount++;
      continue;
    }

    if (existingEnrollments.has(enrollmentNormalized)) {
      skippedCount++;
      continue;
    }

    // 4. Format Phone
    const phoneFormatted = phoneRaw.replace(/^(\+91|0)/, "").replace(/\s+/g, "");

    // 5. Insert
    const uniqueId = (Date.now() + rowNumber).toString();

    const { error: insErr } = await supabase.from("registrations").insert({
      id: uniqueId,
      name,
      enrollment_number: enrollmentNormalized,
      email,
      phone_number: phoneFormatted,
      branch,
      year_of_study: year,
      section_class: sectionClass,
      git_experience: gitExp,
      has_laptop: hasLaptop,
      has_github_account: hasGithub,
      available_all_days: available,
      joining_reason: reason,
      total_xp: 0
    });

    if (insErr) {
      failedCount++;
      failures.push({
        row: rowNumber,
        name,
        reason: insErr.message
      });
    } else {
      importedCount++;
      existingEmails.add(email);
      existingEnrollments.add(enrollmentNormalized);
    }
  }

  console.log("\n=================================");
  console.log("       IMPORT RUN SUMMARY        ");
  console.log("=================================");
  console.log(`Total Rows processed:  ${totalRows}`);
  console.log(`Successfully imported: ${importedCount}`);
  console.log(`Skipped (Duplicates):  ${skippedCount}`);
  console.log(`Flagged/Rejected:      ${failedCount}`);
  console.log("=================================\n");

  if (failures.length > 0) {
    console.log("❌ REJECTED ROWS DETAILS:");
    failures.forEach(f => {
      console.log(`- Row ${f.row} [${f.name}]: ${f.reason}`);
    });
  }
}

main();
