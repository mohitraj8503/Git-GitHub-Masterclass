const ExcelJS = require('exceljs');
const path = require('path');

async function main() {
  const filePath = 'C:\\Users\\mohit\\Desktop\\Git & GitHub Master Workshop — Registration Form (Responses).xlsx';
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const worksheet = workbook.getWorksheet(1);
  const firstRow = worksheet.getRow(1);
  
  console.log("Headers in Excel file:");
  firstRow.eachCell((cell, colNumber) => {
    console.log(`Column ${colNumber}: "${cell.value}"`);
  });
}

main();
