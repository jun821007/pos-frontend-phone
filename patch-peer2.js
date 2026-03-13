const fs = require('fs');
let c = fs.readFileSync('index.html', 'utf8');

// Fix: add 他們還我 and two new buttons (replace the one that has 新增還款)
c = c.replace('>新增還款</button>', '>他們還我</button>\n                <button onclick="doAddPeerMyDebt()" class="bg-orange-600 hover:bg-orange-500 px-4 py-2 rounded text-sm font-bold">我欠他們</button>\n                <button onclick="doAddPeerMyRepay()" class="bg-teal-600 hover:bg-teal-500 px-4 py-2 rounded text-sm font-bold">我還他們</button>');

// Add API
c = c.replace(
  "return await res.json();\n          }\n        };",
  "return await res.json();\n          },\n          addPeerMyDebt: async (data) => { const r = await fetch(API_BASE_URL + '/peer-my-debt', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); return await r.json(); },\n          addPeerMyRepay: async (data) => { const r = await fetch(API_BASE_URL + '/peer-my-repay', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); return await r.json(); }\n        };"
);

// Fix renderPeerLedger: use new IDs and 應收/應付 logic
c = c.replace(
  "const sumDebtEl = document.getElementById('peer-sum-debt');\n            const sumRepayEl = document.getElementById('peer-sum-repay');",
  "const sumRecvEl = document.getElementById('peer-sum-receivable');\n            const sumPayEl = document.getElementById('peer-sum-payable');"
);
c = c.replace(
  "let sumDebt = 0, sumRepay = 0;\n            peerLedgerData.forEach(function(r) {\n                const amt = Number(r.amount) || 0;\n                if (amt > 0) sumDebt += amt;\n                else if (amt < 0) sumRepay += amt;\n            });\n            const balance = sumDebt + sumRepay;\n            if (sumDebtEl) sumDebtEl.textContent = sumDebt.toLocaleString();\n            if (sumRepayEl) sumRepayEl.textContent = sumRepay.toLocaleString();",
  "let receivable = 0, payable = 0;\n            peerLedgerData.forEach(function(r) {\n                const amt = Number(r.amount) || 0;\n                const t = (r.type || '');\n                if (t === '欠帳' || t === '還款') receivable += amt;\n                else if (t === '我欠' || t === '我還') payable += Math.abs(amt);\n                else { if (amt > 0) receivable += amt; else payable += Math.abs(amt); }\n            });\n            const balance = receivable - payable;\n            if (sumRecvEl) sumRecvEl.textContent = receivable.toLocaleString();\n            if (sumPayEl) sumPayEl.textContent = payable.toLocaleString();"
);

// Row: use r.type, add repayMethod
c = c.replace(
  "const type = amt > 0 ? '欠帳' : '還款';",
  "const type = r.type || (amt > 0 ? '欠帳' : '還款');\n                const repayMethod = r.repayMethod || '';"
);
c = c.replace(
  "return '<div class=\"flex items-center gap-4 py-2 border-b border-slate-700/50 text-sm\"><span class=\"text-slate-400 w-24">' + date + '</span><span class=\"' + (amt > 0 ? 'text-red-400' : 'text-green-400') + ' w-14">' + type + '</span><span class=\"text-amber-400/90 w-16">' + itemType + '</span><span class=\"text-white w-20 text-right">' + amt.toLocaleString() + '</span><span class=\"text-slate-400 flex-1 truncate">' + remark + '</span></div>';",
  "var tc = (type === '欠帳' || type === '我欠') ? 'text-red-400' : 'text-green-400';\n                return '<div class=\"flex items-center gap-2 py-2 border-b border-slate-700/50 text-sm\"><span class=\"text-slate-400 w-20\">' + date + '</span><span class=\"' + tc + ' w-10\">' + type + '</span><span class=\"text-amber-400/90 w-12\">' + itemType + '</span><span class=\"text-slate-500 w-12\">' + repayMethod + '</span><span class=\"text-white w-16 text-right\">' + amt.toLocaleString() + '</span><span class=\"text-slate-400 flex-1 truncate\">' + remark + '</span></div>';"
);

// 還款 form: add repayMethod dropdown
c = c.replace(
  "html: '<select id=\"swal-itemtype2\" class=\"swal2-input\"><option value=\"二手機\">二手機</option><option value=\"網卡\">網卡</option><option value=\"軟體\">軟體</option><option value=\"其他\">其他</option></select><input id=\"swal-peer2\"",
  "html: '<select id=\"swal-itemtype2\" class=\"swal2-input\"><option value=\"二手機\">二手機</option><option value=\"網卡\">網卡</option><option value=\"軟體\">軟體</option><option value=\"其他\">其他</option></select><select id=\"swal-repay2\" class=\"swal2-input\"><option value=\"現金\">現金</option><option value=\"商品抵債\">商品抵債</option></select><input id=\"swal-peer2\""
);
c = c.replace(
  "itemType: (document.getElementById('swal-itemtype2') && document.getElementById('swal-itemtype2').value) || '其他', person: User.name }); loadPeerLedger(); } catch (e) { Swal.fire({ icon: 'error', title: '新增失敗', text: e.message, background: '#1e293b', color: 'white' }); }\n        }\n        function openPending()",
  "itemType: (document.getElementById('swal-itemtype2') && document.getElementById('swal-itemtype2').value) || '其他', repayMethod: (document.getElementById('swal-repay2') && document.getElementById('swal-repay2').value) || '現金', person: User.name }); loadPeerLedger(); } catch (e) { Swal.fire({ icon: 'error', title: '新增失敗', text: e.message, background: '#1e293b', color: 'white' }); }\n        }\n        async function doAddPeerMyDebt() {\n            const r = await Swal.fire({ title: '新增我欠（我欠同行）', html: '<select id=\"swal-myd-itemtype\" class=\"swal2-input\"><option value=\"二手機\">二手機</option><option value=\"網卡\">網卡</option><option value=\"軟體\">軟體</option><option value=\"其他\">其他</option></select><input id=\"swal-myd-peer\" class=\"swal2-input\" placeholder=\"同行名稱\"><input id=\"swal-myd-amount\" type=\"number\" class=\"swal2-input\" placeholder=\"金額\"><input id=\"swal-myd-remark\" class=\"swal2-input\" placeholder=\"備註\">', showCancelButton: true, confirmButtonText: '確定', cancelButtonText: '取消', background: '#1e293b', color: 'white' });\n            if (!r.isConfirmed) return;\n            const peerName = (document.getElementById('swal-myd-peer') && document.getElementById('swal-myd-peer').value.trim()) || selectedPeer;\n            const amount = Number(document.getElementById('swal-myd-amount') && document.getElementById('swal-myd-amount').value) || 0;\n            const remark = (document.getElementById('swal-myd-remark') && document.getElementById('swal-myd-remark').value.trim()) || '';\n            if (!peerName || amount <= 0) { Swal.fire({ icon: 'warning', title: '請填寫同行名稱與金額', background: '#1e293b', color: 'white' }); return; }\n            try { await API.addPeerMyDebt({ peerName, amount, remark, itemType: (document.getElementById('swal-myd-itemtype') && document.getElementById('swal-myd-itemtype').value) || '其他', person: User.name }); loadPeerLedger(); } catch (e) { Swal.fire({ icon: 'error', title: '新增失敗', text: e.message, background: '#1e293b', color: 'white' }); }\n        }\n        async function doAddPeerMyRepay() {\n            const r = await Swal.fire({ title: '新增我還（我還同行）', html: '<select id=\"swal-myr-itemtype\" class=\"swal2-input\"><option value=\"二手機\">二手機</option><option value=\"網卡\">網卡</option><option value=\"軟體\">軟體</option><option value=\"其他\">其他</option></select><select id=\"swal-myr-repay\" class=\"swal2-input\"><option value=\"現金\">現金</option><option value=\"商品抵債\">商品抵債</option></select><input id=\"swal-myr-peer\" class=\"swal2-input\" placeholder=\"同行名稱\"><input id=\"swal-myr-amount\" type=\"number\" class=\"swal2-input\" placeholder=\"金額\"><input id=\"swal-myr-remark\" class=\"swal2-input\" placeholder=\"備註（可手打，商品抵債可寫明細）\">', showCancelButton: true, confirmButtonText: '確定', cancelButtonText: '取消', background: '#1e293b', color: 'white' });\n            if (!r.isConfirmed) return;\n            const peerName = (document.getElementById('swal-myr-peer') && document.getElementById('swal-myr-peer').value.trim()) || selectedPeer;\n            const amount = Number(document.getElementById('swal-myr-amount') && document.getElementById('swal-myr-amount').value) || 0;\n            const remark = (document.getElementById('swal-myr-remark') && document.getElementById('swal-myr-remark').value.trim()) || '';\n            if (!peerName || amount <= 0) { Swal.fire({ icon: 'warning', title: '請填寫同行名稱與金額', background: '#1e293b', color: 'white' }); return; }\n            try { await API.addPeerMyRepay({ peerName, amount, remark, itemType: (document.getElementById('swal-myr-itemtype') && document.getElementById('swal-myr-itemtype').value) || '其他', repayMethod: (document.getElementById('swal-myr-repay') && document.getElementById('swal-myr-repay').value) || '現金', person: User.name }); loadPeerLedger(); } catch (e) { Swal.fire({ icon: 'error', title: '新增失敗', text: e.message, background: '#1e293b', color: 'white' }); }\n        }\n        function openPending()"
);

fs.writeFileSync('index.html', c, 'utf8');
console.log('patch2 done');
