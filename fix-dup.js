const fs=require('fs');
let h=fs.readFileSync('index.html','utf8');
const dup="} else { switchView('pos'); } else { switchView('pos'); }";
const single="} else { switchView('pos'); }";
h=h.replace(dup, single);
fs.writeFileSync('index.html', h);
console.log('OK');
