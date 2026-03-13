const fs = require('fs');
const path = 'index.html';
let c = fs.readFileSync(path, 'utf8');
c = c.replace('flex-1\">明細</div></div>','flex-1 min-w-0\">備註</div></div>');
c = c.replace('w-16\">類型</div><div class=\"w-20','w-14\">類型</div><div class=\"w-16\">品項</div><div class=\"w-20');
c = c.replace("return '<div class=\"flex items-center gap-4 py-2 border-b border-slate-700/50 text-sm\"><span class=\"text-slate-400 w-24">' + date + '</span><span class=\"' + (amt > 0 ? 'text-red-400' : 'text-green-400') + ' w-20">' + type + '</span><span class=\"text-white w-24 text-right">' + amt.toLocaleString() + '</span><span class=\"text-slate-400 flex-1 truncate">' + remark + '</span></div>';","var itemType = r.itemType || ''; return '<div class=\"flex items-center gap-4 py-2 border-b border-slate-700/50 text-sm\"><span class=\"text-slate-400 w-24">' + date + '</span><span class=\"' + (amt > 0 ? 'text-red-400' : 'text-green-400') + ' w-14">' + type + '</span><span class=\"text-amber-400/90 w-16">' + itemType + '</span><span class=\"text-white w-20 text-right">' + amt.toLocaleString() + '</span><span class=\"text-slate-400 flex-1 truncate">' + remark + '</span></div>';");
fs.writeFileSync(path, c, 'utf8');
console.log('ok');
