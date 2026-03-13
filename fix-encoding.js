const fs = require('fs');
const backup = fs.readFileSync('index.html.before-751-merge', 'utf8');
const current = fs.readFileSync('index.html', 'utf8');
const backupSplit = backup.indexOf('    <aside');
const currentSplit = current.indexOf('    <aside');
const goodHead = backup.slice(0, backupSplit);
const restFromCurrent = current.slice(currentSplit);
fs.writeFileSync('index.html', goodHead + restFromCurrent, 'utf8');
console.log('Done');
