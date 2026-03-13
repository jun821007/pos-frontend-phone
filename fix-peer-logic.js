const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');

// 1. Fix type comparison - use Unicode escapes to avoid encoding issues
const debt = '\u6b20\u5e33';      // 欠帳
const repay = '\u9084\u6b3e';     // 還款  
const myDebt = '\u6211\u6b20';    // 我欠
const myRepay = '\u6211\u9084';   // 我還

h = h.replace(/if \(t === '[^']*' \|\| t === '[^']*'\) \{ receivable \+= amt; recvRows\.push\(r\); \}/,
  `if (t === '${debt}' || t === '${repay}') { receivable += amt; recvRows.push(r); }`);

h = h.replace(/else if \(t === '[^']*' \|\| t === '[^']*'\) \{ payable \+= amt; payRows\.push\(r\); \}/,
  `else if (t === '${myDebt}' || t === '${myRepay}') { payable += amt; payRows.push(r); }`);

h = h.replace(/const typeClass = \(type === '[^']*' \? 'text-red-400' : type === '[^']*' \? 'text-green-400' : type === '[^']*' \? 'text-orange-400' : 'text-teal-400'\);/,
  `const typeClass = (type === '${debt}' ? 'text-red-400' : type === '${repay}' ? 'text-green-400' : type === '${myDebt}' ? 'text-orange-400' : 'text-teal-400');`);

// 2. Fix loadPeerList type comparison
h = h.replace(/if \(t === '[^']*' \|\| t === '[^']*'\) byPeer\[pn\]\.receivable \+= amt;/,
  `if (t === '${debt}' || t === '${repay}') byPeer[pn].receivable += amt;`);
h = h.replace(/else if \(t === '[^']*' \|\| t === '[^']*'\) byPeer\[pn\]\.payable \+= amt;/,
  `else if (t === '${myDebt}' || t === '${myRepay}') byPeer[pn].payable += amt;`);

// 3. Fix doAddPeerDebt - use preConfirm to capture form values before Swal closes
const debtSwal = `async function doAddPeerDebt() {
            const peer = (document.getElementById('peer-selector')&&document.getElementById('peer-selector').value.trim())||selectedPeer;
            if (!peer) { Swal.fire({ icon: 'warning', title: '\u8acb\u5148\u9078\u64c7\u540c\u884c', background: '#1e293b', color: 'white' }); return; }
            const r = await Swal.fire({ 
                title: '\u65b0\u589e\u6b20\u5e33', 
                html: '<select id="swal-itemtype" class="swal2-input"><option value="\u4e8c\u624b\u6a5f">\u4e8c\u624b\u6a5f</option><option value="\u7db2\u5361">\u7db2\u5361</option><option value="\u8edf\u9ad4">\u8edf\u9ad4</option><option value="\u5176\u4ed6">\u5176\u4ed6</option></select><input id="swal-amount" type="number" class="swal2-input" placeholder="\u91d1\u984d"><input id="swal-remark" class="swal2-input" placeholder="\u5099\u8a3b">', 
                showCancelButton: true, confirmButtonText: '\u78ba\u5b9a', cancelButtonText: '\u53d6\u6d88', background: '#1e293b', color: 'white',
                preConfirm: () => {
                    const amount = Number(document.getElementById('swal-amount')?.value) || 0;
                    if (amount <= 0) { Swal.showValidationMessage('\u8acb\u586b\u5beb\u91d1\u984d'); return false; }
                    return { itemType: document.getElementById('swal-itemtype')?.value || '\u5176\u4ed6', amount, remark: (document.getElementById('swal-remark')?.value||'').trim() };
                }
            });
            if (!r.isConfirmed || !r.value) return;
            const { itemType, amount, remark } = r.value;
            try { 
                const res = await API.addPeerDebt({ peerName: peer, amount, remark, itemType, person: User.name }); 
                if (res && res.status === "error") { Swal.fire({ icon: "error", title: "\u65b0\u589e\u5931\u6557", text: res.msg || "\u672a\u77e5\u932f\u8aa4", background: "#1e293b", color: "white" }); return; } 
                loadPeerLedger(); 
            } catch (e) { Swal.fire({ icon: "error", title: "\u65b0\u589e\u5931\u6557", text: e.message, background: "#1e293b", color: "white" }); }
        }`;

const debtRegex = /async function doAddPeerDebt\(\) \{[^}]+\}[^}]*\{[^}]+\}[^}]*\}[^}]*\}[^}]*\}[^}]*\}[\s\S]*?catch \(e\)[^}]+\}[\s]*\}/;
h = h.replace(debtRegex, debtSwal);

fs.writeFileSync('index.html', h);
console.log('Done - debt fixed');
process.exit(0);
