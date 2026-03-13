const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Remove try-catch from setRestockMode to fix "Missing catch or finally after try"
// The bug: try { } has something wrong - remove entire try-catch
const old1 = "function setRestockMode(m) { try { console.log('";
const new1 = "function setRestockMode(m) { ";
if (html.includes(old1)) {
  html = html.replace(old1, new1);
  // Remove: " } } catch(e) { console.error('setRestockMode', e); }" -> keep " } }" 
  html = html.replace(/renderRestockCartList\(\); \} \} catch\(e\) \{ console\.error\('setRestockMode', e\); \}/g,
    "renderRestockCartList(); } }");
  // But wait - we removed "try {" so now we have one extra "}" - the old " } }" 
  // first } closes else, second } closed try. Now we don't have try so we need one } for function.
  // Actually: function setRestockMode(m) { ... if(...){...} else {...} } 
  // So we need " } }" - one closes else, one closes function. Good.
  fs.writeFileSync('index.html', html, 'utf8');
  console.log('Fixed setRestockMode');
} else {
  // Try alternate - maybe the catch has wrong structure. Add finally to satisfy parser?
  const idx = html.indexOf('function setRestockMode');
  const rest = html.slice(idx, idx + 500);
  const catchMatch = rest.match(/renderRestockCartList\(\);.*?function createRsPill/);
  console.log('setRestockMode region:', JSON.stringify(catchMatch ? catchMatch[0].slice(0, 150) : 'not found'));
}
