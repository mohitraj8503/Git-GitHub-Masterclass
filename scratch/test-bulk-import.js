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

async function main() {
  console.log("=== BULK IMPORT API TEST START ===");

  const testPayload = {
    action: "import",
    data: [
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
    ],
    mapping: {
      name: "Full Name",
      email: "Email Address",
      enrollment_number: "Enrollment Number",
      phone_number: "Phone Number (WhatsApp)",
      branch: "Branch / Department",
      year_of_study: "Year of Study"
    }
  };

  const res = await fetch("http://localhost:3000/api/admin/bulk-import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(testPayload)
  });

  const data = await res.json();
  console.log("Bulk Import API Response:", JSON.stringify(data, null, 2));

  // Verify DB state
  const { data: testRows } = await supabase.from('registrations').select('*').eq('enrollment_number', 'TEST/9999');
  console.log(`\nVerified rows in DB for TEST/9999:`, testRows.length, `(Expected: 1)`);
  if (testRows.length > 0) {
    console.log(`- Name: ${testRows[0].name}, Phone: ${testRows[0].phone_number}`);
  }

  // Cleanup
  console.log("\nCleaning up test rows...");
  await supabase.from('registrations').delete().eq('enrollment_number', 'TEST/9999');
  console.log("Cleanup complete!");
  console.log("=== BULK IMPORT API TEST COMPLETE ===");
}

main();
