const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local manually
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

const supabaseUrl = env.SUPABASE_URL;
const supabaseServiceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Missing Supabase credentials in .env.local", env);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function runCrudTest() {
  const testId = "test-" + Date.now();
  const testEmail = `crudtest_${Date.now()}@aju-masterclass.com`;
  const testEnrollment = `AJU/TEST-${Date.now()}`;

  console.log("🚀 Starting Full Supabase CRUD Capabilities Verification...");

  // 1. CREATE (Insert)
  console.log("\n1. Testing INSERT (Create)...");
  const { data: insertData, error: insertError } = await supabase
    .from('registrations')
    .insert({
      id: testId,
      name: "Temporary CRUD Test Student",
      enrollment_number: testEnrollment,
      email: testEmail,
      phone_number: "9999999999",
      branch: "BCA",
      year_of_study: "1st Year",
      git_experience: "None",
      has_laptop: "No",
      has_github_account: "No",
      available_all_days: "Yes, fully available"
    })
    .select()
    .single();

  if (insertError) {
    console.error("❌ INSERT FAILED:", insertError);
    return;
  }
  console.log("✅ INSERT SUCCESSFUL! Created test student ID:", insertData.id);

  // 2. READ (Query)
  console.log("\n2. Testing SELECT (Read)...");
  const { data: readData, error: readError } = await supabase
    .from('registrations')
    .select('*')
    .eq('id', testId)
    .single();

  if (readError) {
    console.error("❌ SELECT FAILED:", readError);
    return;
  }
  console.log("✅ SELECT SUCCESSFUL! Read student name:", readData.name);

  // 3. UPDATE (Edit)
  console.log("\n3. Testing UPDATE (Edit)...");
  const { data: updateData, error: updateError } = await supabase
    .from('registrations')
    .update({ name: "Updated CRUD Test Student Name" })
    .eq('id', testId)
    .select()
    .single();

  if (updateError) {
    console.error("❌ UPDATE FAILED:", updateError);
    return;
  }
  console.log("✅ UPDATE SUCCESSFUL! Updated student name:", updateData.name);

  // 4. DELETE (Clean up)
  console.log("\n4. Testing DELETE (Remove)...");
  const { data: deleteData, error: deleteError } = await supabase
    .from('registrations')
    .delete()
    .eq('id', testId)
    .select();

  if (deleteError) {
    console.error("❌ DELETE FAILED:", deleteError);
    return;
  }
  console.log("✅ DELETE SUCCESSFUL! Removed test student.");

  console.log("\n🎉 ALL TESTS PASSED! Supabase connection has full read/write/edit/delete potential!");
}

runCrudTest();
