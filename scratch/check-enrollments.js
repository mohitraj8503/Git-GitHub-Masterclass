const ExcelJS = require('exceljs');
const path = require('path');

async function main() {
  const filePath = 'C:\\Users\\mohit\\Desktop\\Git & GitHub Master Workshop — Registration Form (Responses).xlsx';
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const worksheet = workbook.getWorksheet(1);
  
  console.log("Samples of Enrollment Numbers in Excel file:");
  const enrollments = [];
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      const enroll = row.getCell(3).value;
      if (enroll) enrollments.push(String(enroll).trim());
    }
  });

  console.log("Total rows:", enrollments.length);
  console.log("First 20 enrollments:");
  console.log(enrollments.slice(0, 20));
  
  console.log("\nUnique formats:");
  const formats = new Set();
  enrollments.forEach(e => {
    // replace digits with X
    formats.add(e.toUpperCase().replace(/\d/g, 'X'));
  });
  console.log(Array.from(formats));
}

main();
