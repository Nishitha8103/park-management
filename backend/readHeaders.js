const xlsx = require('xlsx');

const workbook = xlsx.readFile('./BBMP_Parks_List.xlsx');
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

console.log('Headers:', rows[0]);
