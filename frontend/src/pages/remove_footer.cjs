const fs = require('fs');
const path = require('path');
const dir = 'c:/Users/nishi/park_monitoring_system08/frontend/src/pages';
const files = fs.readdirSync(dir).filter(f => f.startsWith('Contractor') && f.endsWith('.jsx'));
let changedFiles = 0;
for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;
  content = content.replace(/import\s+Footer\s+from\s+['"].*?Footer.*?['"];?\n?/g, '');
  content = content.replace(/<Footer\s*\/>\n?/g, '');
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    changedFiles++;
    console.log('Removed Footer from', file);
  }
}
console.log('Total files changed:', changedFiles);
