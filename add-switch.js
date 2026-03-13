const fs=require("fs");
let h=fs.readFileSync("index.html","utf8");
const old="} else if(h==='setting')switchView('setting'); }";
const neu="} else if(h==='setting')switchView('setting'); } else { switchView('pos'); }";
if(h.indexOf(old)>=0){ h=h.replace(old,neu); fs.writeFileSync("index.html",h); console.log("OK"); } else console.log("not found");
