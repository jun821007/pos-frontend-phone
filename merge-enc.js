const fs=require("fs");
let h=fs.readFileSync("index.html","utf8");
h=h.replace(/!i\.category\.includes/g, "!(i.category||'').includes");
fs.writeFileSync("index.html",h);
console.log("Fixed category");
