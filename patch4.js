const fs = require('fs');
let s = fs.readFileSync('index.html', 'utf8');
s = s.replace("if (v === 'setting') {\n                // 設定頁面打開時，不自動展開任何區塊\n            }",
"if (v === 'setting') {}\n            if (v === 'restock' && typeof setRestockMode === 'function') setRestockMode(UI.rsMode || 'inventory');");
fs.writeFileSync('index.html', s);
console.log('ok');
