const fs = require("fs");
let html = fs.readFileSync("index.html.before-751-merge", "utf8");
// 1. item-grid: add min-h-0
html = html.replace('id="item-grid" class="flex-1 overflow-y-auto p-3 grid', 'id="item-grid" class="flex-1 overflow-y-auto min-h-0 p-3 grid');
// 2. today-list
html = html.replace('id="today-list" class="flex-1 overflow-y-auto pb-20"', 'id="today-list" class="flex-1 overflow-y-auto min-h-0 pb-20"');
// 3. pending-list
html = html.replace('id="pending-list" class="flex-1 overflow-y-auto pb-20"', 'id="pending-list" class="flex-1 overflow-y-auto min-h-0 pb-20"');
// 4. history-list
html = html.replace('id="history-list" class="flex-1 overflow-y-auto pb-20"', 'id="history-list" class="flex-1 overflow-y-auto min-h-0 pb-20"');
// 5. rs-grid
html = html.replace('id="rs-grid" class="flex-1 overflow-y-auto p-3 grid', 'id="rs-grid" class="flex-1 overflow-y-auto min-h-0 p-3 grid');
// 6. view-setting wrapper
html = html.replace('<div id="view-setting" class="hidden view-section flex-1 p-6 flex flex-col gap-4 overflow-y-auto pb-20">', '<div id="view-setting" class="hidden view-section flex-1 flex flex-col overflow-hidden"><div class="flex-1 flex flex-col gap-4 min-h-0 overflow-y-auto p-6 pb-20">');
html = html.replace(/(\s+)<\/div>\s*\n(\s+)<\/div>\s*\n\s+\n\s+<!-- 配件分類排序/,
  '$1</div>\n$1</div>\n$2</div>\n$2\n$2<!-- 配件分類排序');
fs.writeFileSync("index.html", html);
console.log("Done");
