const fs = require('fs');
const path = 'c:/Users/rsz97/pos/index.html';
let html = fs.readFileSync(path, 'utf8');

// 1. Fix switchView console.log
html = html.replace(/console\.log\('[\s\S]*?View:', v\);/g, "console.log('🟢 切換至 View:', v);");

// 2. renderReport - add log and (DB.sales||[])
html = html.replace(/(function renderReport\(\) \{\s*)(let stats = \{ cash:0)/g, 
  "$1console.log('🔵 開始渲染元件:', 'renderReport');\n            $2");
html = html.replace(/const div = document\.getElementById\('today-list'\); div\.innerHTML='';/g,
  "const div = document.getElementById('today-list'); if(!div) return; div.innerHTML='';");
html = html.replace(/DB\.sales\.slice\(\)\.reverse\(\)/g, "(DB.sales||[]).slice().reverse()");

// 3. renderPendingList - add log
html = html.replace(/(function renderPendingList\(\) \{\s*)(const d = document)/g,
  "$1console.log('🔵 開始渲染元件:', 'renderPendingList');\n            $2");

// 4. renderHistoryList - add log
html = html.replace(/(function renderHistoryList\(\) \{\s*)(const div = document)/g,
  "$1console.log('🔵 開始渲染元件:', 'renderHistoryList');\n            $2");

// 5. setRestockMode - add log at start
html = html.replace(/(function setRestockMode\(m\) \{ try \{ )(UI\.rsMode)/g,
  "$1console.log('🔵 開始渲染元件:', 'setRestockMode'); $2");

// 6. renderRestockGrid - add log
html = html.replace(/(function renderRestockGrid\(\) \{ try \{ )(if\(UI\.rsMode)/g,
  "$1console.log('🔵 開始渲染元件:', 'renderRestockGrid'); $2");

// 7. renderCompanyTemplateList - add log
html = html.replace(/(function renderCompanyTemplateList\(\)\{)(const el=document)/g,
  "$1console.log('🔵 開始渲染元件:', 'renderCompanyTemplateList'); $2");

// 8. Data null-safety: filterItems DB.inv
html = html.replace(/let list = DB\.inv\.filter\(i => \{ if \(i\.isHidden/g,
  "let list = (DB.inv||[]).filter(i => { if (i&&i.isHidden");

// 9. getOrderedCategories DB.inv
html = html.replace(/const allCats = new Set\(DB\.inv\.filter\(i=>i\.type==='accessory'/g,
  "const allCats = new Set((DB.inv||[]).filter(i=>i&&i.type==='accessory'");

// 10. renderCompanyAccessoryGrid DB.companyTemplates
html = html.replace(/if\(DB\.companyTemplates\.length === 0\)/g,
  "if(!(DB.companyTemplates||[]).length)");

// 11. renderFavAccessoryGrid DB.inv
html = html.replace(/const list=DB\.inv\.filter\(i=>i\.type==='accessory'/g,
  "const list=(DB.inv||[]).filter(i=>i&&i.type==='accessory'");

// 12. modalRepair batteries DB.inv
html = html.replace(/const batteries = DB\.inv\.filter\(i => i\.type === 'accessory'/g,
  "const batteries = (DB.inv||[]).filter(i => i&&i.type === 'accessory'");

// Remove BOM if present
if (html.charCodeAt(0) === 0xFEFF) html = html.slice(1);

fs.writeFileSync(path, '\uFEFF' + html, 'utf8');
console.log('Done - fixes applied');
