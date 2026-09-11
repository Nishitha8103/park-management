const xlsx = require('xlsx');

const workbook = xlsx.readFile('./BBMP_Parks_List.xlsx');
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const rows = xlsx.utils.sheet_to_json(sheet);

console.log('Row 1 Zone:', rows[0]['Zone']);
console.log('Row 1 Ward:', rows[0]['Ward']);
console.log('Row 1 Name:', rows[0]['Park Name']);
