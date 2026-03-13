const fs = require('fs');
const path = 'index.html';
let c = fs.readFileSync(path, 'utf8');
c = c.replace(/span>\\?\?: \$\{i\.stock/g, 'span>庫: ${i.stock');
c = c.replace(/text-slate-400">\\?\?\? \$\$/g, 'text-slate-400">成本 $$');
fs.writeFileSync(path, c, 'utf8');
console.log('Done');
