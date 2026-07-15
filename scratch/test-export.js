const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

const WORKSHOP_DAYS = 7;
const SCHEDULE_DAYS = [
  { day: 1, date: "2026-07-15" },
  { day: 2, date: "2026-07-16" },
  { day: 3, date: "2026-07-17" },
  { day: 4, date: "2026-07-18" },
  { day: 5, date: "2026-07-19" },
  { day: 6, date: "2026-07-20" },
  { day: 7, date: "2026-07-21" },
];

async function main() {
  console.log("Mocking report data...");
  const report = {
    totalRegistered: 3,
    overallRate: 33,
    perDay: [
      { day: 1, checkedIn: 1, pct: 33 },
      { day: 2, checkedIn: 0, pct: 0 },
      { day: 3, checkedIn: 0, pct: 0 },
      { day: 4, checkedIn: 0, pct: 0 },
      { day: 5, checkedIn: 0, pct: 0 },
      { day: 6, checkedIn: 0, pct: 0 },
      { day: 7, checkedIn: 0, pct: 0 },
    ],
    students: [
      { name: "Ranjan Singh", enrollmentNumber: "AJU/251630", branch: "BCA", yearOfStudy: "2nd Year", presentDays: [] },
      { name: "Mohit Raj", enrollmentNumber: "AJU/250609", branch: "B Tech", yearOfStudy: "1st Year", presentDays: [] },
      { name: "Ayush Kumar Singh", enrollmentNumber: "AJU/252009", branch: "BCA", yearOfStudy: "2nd Year", presentDays: [1] },
    ]
  };

  const workbook = new ExcelJS.Workbook();
  const sheet1 = workbook.addWorksheet("Summary");
  sheet1.views = [{ showGridLines: true }];
  
  sheet1.mergeCells("A1:E1");
  const titleCell = sheet1.getCell("A1");
  titleCell.value = "Git & GitHub Masterclass — Executive Attendance Report";
  titleCell.font = { name: "Segoe UI", size: 14, bold: true, color: { argb: "FFFFFF" } };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "1E3A8A" } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  sheet1.getRow(1).height = 40;
  
  sheet1.addRow([]);
  sheet1.addRow(["Report Date & Time:", new Date().toLocaleString()]);
  sheet1.addRow([]);
  
  sheet1.mergeCells("A5:A6");
  const card1 = sheet1.getCell("A5");
  card1.value = `Total Enrolled\n${report.totalRegistered}`;
  card1.font = { name: "Segoe UI", size: 11, bold: true, color: { argb: "1E293B" } };
  card1.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  card1.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "F1F5F9" } };
  
  sheet1.mergeCells("B5:C6");
  const card2 = sheet1.getCell("B5");
  card2.value = `Overall Attendance\n${report.overallRate}%`;
  card2.font = { name: "Segoe UI", size: 11, bold: true, color: { argb: "B91C1C" } };
  card2.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  card2.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FEE2E2" } };

  sheet1.mergeCells("D5:E6");
  const card3 = sheet1.getCell("D5");
  card3.value = `Sessions Held\n1 / ${WORKSHOP_DAYS}`;
  card3.font = { name: "Segoe UI", size: 11, bold: true, color: { argb: "0F172A" } };
  card3.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  card3.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "F1F5F9" } };

  sheet1.addRow([]);
  sheet1.addRow([]);
  
  const dayHeaderRow = ["Day", "Session Date", "Checked In", "Total Registered", "Attendance %"];
  const headerRowNum = 9;
  const headerRowObj = sheet1.getRow(headerRowNum);
  dayHeaderRow.forEach((val, idx) => {
    headerRowObj.getCell(idx + 1).value = val;
  });
  
  report.perDay.forEach((dayData) => {
    const scheduleDay = SCHEDULE_DAYS.find((sd) => sd.day === dayData.day);
    const dateStr = scheduleDay ? scheduleDay.date : "N/A";
    sheet1.addRow([
      `Day ${dayData.day}`,
      dateStr,
      dayData.checkedIn,
      report.totalRegistered,
      `${dayData.pct}%`
    ]);
  });
  
  const sheet2 = workbook.addWorksheet("Detailed Attendance");
  sheet2.views = [{ state: "frozen", ySplit: 1, showGridLines: true }];
  
  const headers2 = [
    "Name", "Enrollment Number", "Branch", "Year of Study",
    "Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6", "Day 7",
    "Total Attendance %"
  ];
  sheet2.addRow(headers2);
  
  report.students.forEach((student) => {
    const rowValues = [
      student.name,
      student.enrollmentNumber,
      student.branch,
      student.yearOfStudy
    ];
    
    let presentCount = 0;
    let heldCount = 1; // day 1 held
    
    for (let d = 1; d <= 7; d++) {
      const isPresent = student.presentDays.includes(d);
      const isHeld = d === 1;
      
      if (isPresent) {
        rowValues.push("Present");
        presentCount++;
      } else if (isHeld) {
        rowValues.push("Absent");
      } else {
        rowValues.push("N/A");
      }
    }
    const ratePct = heldCount > 0 ? Math.round((presentCount / heldCount) * 100) : 0;
    rowValues.push(`${ratePct}%`);
    sheet2.addRow(rowValues);
  });

  const outputPath = path.join(__dirname, 'test_export_output.xlsx');
  await workbook.xlsx.writeFile(outputPath);
  console.log(`Excel file written to ${outputPath}`);
}

main();
