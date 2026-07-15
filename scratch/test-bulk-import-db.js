const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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
  console.log("=== BULK IMPORT DB LOGIC TEST START ===");

  const testRows = [
    {
      "Full Name": "Test Student A",
      "Email Address": "test-a@test.com",
      "Enrollment Number": "TEST/9999",
      "Phone Number (WhatsApp)": "+91 9999999999",
      "Branch / Department": "CS",
      "Year of Study": "3rd Year"
    },
    {
      "Full Name": "Test Student B (Duplicate)",
      "Email Address": "test-a@test.com", // Duplicate Email
      "Enrollment Number": "TEST/9999", // Duplicate Enrollment
      "Phone Number (WhatsApp)": "9999999998",
      "Branch / Department": "EC",
      "Year of Study": "2nd Year"
    },
    {
      "Full Name": "Test Student C (Invalid Email)",
      "Email Address": "invalid-email-format",
      "Enrollment Number": "TEST/8888",
      "Phone Number (WhatsApp)": "9999999997",
      "Branch / Department": "ME",
      "Year of Study": "1st Year"
    }
  ];

  const mapping = {
    name: "Full Name",
    email: "Email Address",
    enrollment_number: "Enrollment Number",
    phone_number: "Phone Number (WhatsApp)",
    branch: "Branch / Department",
    year_of_study: "Year of Study"
  };

  // Fetch existing registrations
  const { data: existingRegs, error: fetchErr } = await supabase
    .from("registrations")
    .select("email, enrollment_number");

  if (fetchErr) {
    console.error("Fetch existing registrations error:", fetchErr);
    return;
  }

  const existingEmails = new Set((existingRegs || []).map(r => String(r.email).toLowerCase().trim()));
  const existingEnrollments = new Set((existingRegs || []).map(r => String(r.enrollment_number).toUpperCase().trim()));

  let importedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;
  const failures = [];

  for (let i = 0; i < testRows.length; i++) {
    const row = testRows[i];
    const name = String(row[mapping.name] || "").trim();
    const email = String(row[mapping.email] || "").trim().toLowerCase();
    const enrollment = String(row[mapping.enrollment_number] || "").trim().toUpperCase();
    const phoneRaw = String(row[mapping.phone_number] || "").trim();
    const branch = String(row[mapping.branch] || "").trim() || "CS";
    const year = String(row[mapping.year_of_study] || "").trim() || "1st Year";

    if (!name || !email || !enrollment || !phoneRaw) {
      failedCount++;
      failures.push({ row: i + 2, name: name || "Unknown", reason: "Required fields missing." });
      continue;
    }

    if (!EMAIL_REGEX.test(email)) {
      failedCount++;
      failures.push({ row: i + 2, name, reason: `Invalid email format: "${email}"` });
      continue;
    }

    if (existingEmails.has(email) || existingEnrollments.has(enrollment)) {
      skippedCount++;
      console.log(`Skipping duplicate row ${i + 2}: Email/Enrollment already registered.`);
      continue;
    }

    const phoneFormatted = phoneRaw.replace(/^(\+91|0)/, "").replace(/\s+/g, "");
    const uniqueId = (Date.now() + i).toString();

    const { error: insErr } = await supabase.from("registrations").insert({
      id: uniqueId,
      name,
      email,
      enrollment_number: enrollment,
      phone_number: phoneFormatted,
      branch,
      year_of_study: year,
      section_class: "N/A",
      git_experience: "No",
      has_laptop: "Yes",
      has_github_account: "No",
      available_all_days: "Yes",
      joining_reason: "To learn Git/GitHub",
      total_xp: 0
    });

    if (insErr) {
      failedCount++;
      failures.push({ row: i + 2, name, reason: insErr.message });
    } else {
      importedCount++;
      existingEmails.add(email);
      existingEnrollments.add(enrollment);
      console.log(`Successfully imported row ${i + 2}: ${name}`);
    }
  }

  console.log(`\n--- Import Summary ---`);
  console.log(`Imported: ${importedCount}`);
  console.log(`Skipped (Duplicates): ${skippedCount}`);
  console.log(`Failed: ${failedCount}`);
  console.log(`Failures details:`, JSON.stringify(failures, null, 2));

  // Verify rows in DB
  const { data: verifiedRows } = await supabase.from('registrations').select('*').eq('enrollment_number', 'TEST/9999');
  console.log(`\nVerified rows in DB for TEST/9999:`, verifiedRows.length, `(Expected: 1)`);

  // Cleanup
  console.log("\nCleaning up test rows...");
  await supabase.from('registrations').delete().eq('enrollment_number', 'TEST/9999');
  console.log("Cleanup complete!");
  console.log("=== BULK IMPORT DB LOGIC TEST COMPLETE ===");
}

main();
