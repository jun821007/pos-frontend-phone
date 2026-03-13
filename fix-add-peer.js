const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');
const from = `            if (!r.isConfirmed || !r.value || !String(r.value).trim()) return;
            openPeerDetail(String(r.value).trim());`;
const to = `            if (!r.isConfirmed || !r.value || !String(r.value).trim()) return;
            const n = String(r.value).trim();
            addedPeerNames.add(n);
            openPeerDetail(n);`;
if (h.includes(from)) {
  h = h.replace(from, to);
  fs.writeFileSync('index.html', h);
  console.log('OK');
} else {
  console.log('NOT FOUND');
}
