const fs = require('fs');
const path = 'index.html';
let html = fs.readFileSync(path, 'utf8');
// Add addedPeerNames declaration
html = html.replace('        let peerListData = [];\n        async function loadPeerList()', 
  '        let addedPeerNames = new Set();\n        let peerListData = [];\n        async function loadPeerList()');
// Add addedPeerNames.add in doAddNewPeer
html = html.replace(
  '            if (!r.isConfirmed || !r.value || !String(r.value).trim()) return;\n            openPeerDetail(String(r.value).trim());',
  '            if (!r.isConfirmed || !r.value || !String(r.value).trim()) return;\n            const name = String(r.value).trim();\n            addedPeerNames.add(name);\n            openPeerDetail(name);');
fs.writeFileSync(path, html);
console.log('Patch applied');
