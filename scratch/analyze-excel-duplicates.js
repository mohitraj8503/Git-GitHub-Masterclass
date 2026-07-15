const ExcelJS = require('exceljs');
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
  const filePath = 'C:\\Users\\mohit\\Desktop\\Git & GitHub Master Workshop — Registration Form (Responses).xlsx';
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const worksheet = workbook.getWorksheet(1);

  const { data: dbRegs } = await supabase.from('registrations').select('email, enrollment_number');
  const dbEmails = new Set(dbRegs.map(r => r.email.toLowerCase().trim()));
  const dbEnrollments = new Set(dbRegs.map(r => r.enrollment_number.toUpperCase().trim()));

  const sheetEmails = [];
  const sheetEnrollments = [];
  const rowDataList = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const name = String(row.getCell(2).value || "").trim();
    const enrollRaw = String(row.getCell(3).value || "").trim();
    const email = String(row.getCell(4).value || "").trim().toLowerCase();
    
    sheetEmails.push(email);
    sheetEnrollments.push(enrollRaw);
    rowDataList.push({ rowNumber, name, enrollRaw, email });
  });

  console.log("=== EXCEL SHEET DUPLICATES ANALYSIS ===");
  console.log("Total rows in sheet (excluding header):", rowDataList.length);

  // Check internal duplicates within the Excel sheet
  const seenEmails = new Set();
  const seenEnrollments = new Set();
  const internalDuplicateEmails = [];
  const internalDuplicateEnrollments = [];

  rowDataList.forEach(r => {
    if (seenEmails.has(r.email)) {
      internalDuplicateEmails.push(r);
    } else {
      seenEmails.add(r.email);
    }

    const cleanNumbers = r.enrollRaw.replace(/\D/g, "");
    const norm = `AJU/${cleanNumbers}`;
    if (seenEnrollments.has(norm)) {
      internalDuplicateEnrollments.push(r);
    } else {
      seenEnrollments.add(norm);
    }
  });

  console.log("\nInternal Duplicate Emails in Excel sheet:", internalDuplicateEmails.length);
  internalDuplicateEmails.forEach(d => {
    console.log(`- Row ${d.rowNumber}: ${d.name} (${d.email})`);
  });

  console.log("\nInternal Duplicate Enrollments in Excel sheet:", internalDuplicateEnrollments.length);
  internalDuplicateEnrollments.forEach(d => {
    console.log(`- Row ${d.rowNumber}: ${d.name} (${d.enrollRaw})`);
  });
}

main();
