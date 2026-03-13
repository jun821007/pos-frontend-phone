const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');
h = h.replace('<div id=\"view-report\" class=\"hidden view-section flex-1 flex flex-col overflow-hidden p-4\">','<div id=\"view-report\" class=\"hidden view-section flex-1 flex flex-col overflow-hidden p-4\"><div class=\"flex-1 flex flex-col min-h-0 overflow-hidden\">');
h = h.replace('<div id=\"today-list\" class=\"flex-1 overflow-y-auto pb-20\"></div>','<div id=\"today-list\" class=\"flex-1 overflow-y-auto min-h-0 pb-20\"></div>');
h = h.replace(/(<div id="today-list" class="flex-1 overflow-y-auto min-h-0 pb-20"><\/div>)\s*(\n\s*<\/div>\s*\n\s*\n\s*<div id="view-peer")/, '$1\n            </div>\n        </div>\n\n        <div id="view-peer"');
