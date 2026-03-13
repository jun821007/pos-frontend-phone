const fs = require("fs");
let h = fs.readFileSync("index.html", "utf8");
h = h.replace("if(User && !User.isAdmin) {", "// VERIFY-A: if(User && !User.isAdmin) {");
h = h.replace("function switchView(v) {", "function switchView(v) { console.log('switchView', v);");
h = h.replace("min-h-[100dvh] h-[100dvh] min-h-screen", "h-screen");
h = h.replace("flex-1 flex flex-col min-h-0 relative bg-slate-950 overflow-hidden w-full pb-16 md:pb-0", "flex-1 flex flex-col relative bg-slate-950 overflow-hidden w-full");
fs.writeFileSync("index.html", h);
console.log("OK");
