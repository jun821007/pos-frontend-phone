const fs=require('fs');
let c=fs.readFileSync('index.html','utf8');
const r=/const POS_VERSION = 'v(\d+)\.(\d+)'/;
const m=c.match(r);
if(!m)process.exit(1);
const next='v'+m[1]+'.'+(parseInt(m[2],10)+1);
c=c.replace(r,"const POS_VERSION = '"+next+"'");
fs.writeFileSync('index.html',c);
console.log('Bumped to',next);
