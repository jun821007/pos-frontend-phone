// 嘗試移除 overflow-y: auto，保留 display/flex/min-height
const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'index.html');
let html = fs.readFileSync(file, 'utf8');

// 將 .view-section:not(.hidden) 的 overflow-y: auto 移除
const oldRule = `.view-section:not(.hidden) { position: absolute !important; top: 3.5rem !important; left: 0 !important; right: 0 !important; bottom: 0 !important; display: flex !important; flex-direction: column !important; min-height: 0 !important; overflow-y: auto !important; -webkit-overflow-scrolling: touch; }`;
const newRule = `.view-section:not(.hidden) { display: flex !important; flex: 1 1 0 !important; min-height: 0 !important; -webkit-overflow-scrolling: touch; }`;

if (html.includes(oldRule)) {
  html = html.replace(oldRule, newRule);
  console.log('Replaced position:absolute with flex-only rule');
} else {
  // 可能是另一種格式
  const altOld = `.view-section:not(.hidden) { display: flex !important; flex: 1 1 0 !important; min-height: 0 !important; overflow-y: auto !important; -webkit-overflow-scrolling: touch; }`;
  if (html.includes(altOld)) {
    html = html.replace(altOld, newRule);
    console.log('Removed overflow-y:auto from view-section rule');
  } else {
    console.log('Rule not found, checking current content...');
    const idx = html.indexOf('view-section:not');
    if (idx >= 0) console.log(html.substring(idx, idx + 300));
    process.exit(1);
  }
}

fs.writeFileSync(file, html);
console.log('Done');
