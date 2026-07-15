const ExcelJS = require('exceljs');
const path = require('path');

async function main() {
  const filePath = 'C:\\Users\\mohit\\Desktop\\Git & GitHub Master Workshop — Registration Form (Responses).xlsx';
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const worksheet = workbook.getWorksheet(1);
  
  console.log("Irregular enrollment numbers:");
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      const name = row.getCell(2).value;
      const enroll = String(row.getCell(3).value || "").trim();
      const upper = enroll.toUpperCase().replace(/[^A-Z0-9]/g, '');
      
      const has6Digits = upper.match(/\d{6}/);
      if (!has6Digits) {
        console.log(`Row ${rowNumber}: Name="${name}", Original="${enroll}", Cleaned="${upper}"`);
      }
    }
  });
}

main();
