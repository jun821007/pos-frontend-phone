const fs = require('fs');
const path = 'index.html';
let html = fs.readFileSync(path, 'utf8');
html = html.replace(
  `            position: absolute !important; top: 3.5rem !important; left: 0 !important; right: 0 !important; bottom: 0 !important;
            width: 100% !important; height: calc(100dvh - 3.5rem) !important;`,
  `            position: fixed !important; top: 3.5rem !important; left: 0 !important; right: 0 !important; bottom: 0 !important;
            width: 100vw !important; height: calc(100dvh - 3.5rem) !important; z-index: 5;`
);
fs.writeFileSync(path, html);
console.log('done');
