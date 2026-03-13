const fs = require('fs');
const path = 'index.html';
let c = fs.readFileSync(path, 'utf8');

// 1) Add API methods
c = c.replace(
  `addPeerRepayment: async (data) => {
            const res = await fetch(\`\${API_BASE_URL}/peer-repayment\`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data)
            });
            return await res.json();
          }
        };`,
  `addPeerRepayment: async (data) => {
            const res = await fetch(\`\${API_BASE_URL}/peer-repayment\`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data)
            });
            return await res.json();
          },
          addPeerMyDebt: async (data) => {
            const res = await fetch(\`\${API_BASE_URL}/peer-my-debt\`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data)
            });
            return await res.json();
          },
          addPeerMyRepay: async (data) => {
            const res = await fetch(\`\${API_BASE_URL}/peer-my-repay\`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data)
            });
            return await res.json();
          }
        };`
);

// 2) Add 新增我欠 新增我還 buttons
c = c.replace(
  `<button onclick="doAddPeerRepayment()" class="bg-green-600 hover:bg-green-500 px-4 py-2 rounded text-sm font-bold">新增還款</button>
            </div>`,
  `<button onclick="doAddPeerRepayment()" class="bg-green-600 hover:bg-green-500 px-4 py-2 rounded text-sm font-bold">他們還我</button>
                <button onclick="doAddPeerMyDebt()" class="bg-orange-600 hover:bg-orange-500 px-4 py-2 rounded text-sm font-bold">我欠他們</button>
                <button onclick="doAddPeerMyRepay()" class="bg-teal-600 hover:bg-teal-500 px-4 py-2 rounded text-sm font-bold">我還他們</button>
            </div>`
);

// 3) Update summary cards: 應收 應付 淨餘額
c = c.replace(
  `<div class="grid grid-cols-3 gap-3 mb-4">
                <div class="glass p-3 rounded-xl border-l-4 border-red-500"><div class="text-[10px] text-slate-400">總欠款</div><div class="text-lg font-bold text-red-400" id="peer-sum-debt">0</div></div>
                <div class="glass p-3 rounded-xl border-l-4 border-green-500"><div class="text-[10px] text-slate-400">總還款</div><div class="text-lg font-bold text-green-400" id="peer-sum-repay">0</div></div>
                <div class="glass p-3 rounded-xl border-l-4 border-yellow-500"><div class="text-[10px] text-slate-400">餘額</div><div class="text-lg font-bold text-yellow-400" id="peer-balance">0</div></div>
            </div>`,
  `<div class="grid grid-cols-3 gap-3 mb-4">
                <div class="glass p-3 rounded-xl border-l-4 border-red-500"><div class="text-[10px] text-slate-400">應收（他們欠我）</div><div class="text-lg font-bold text-red-400" id="peer-sum-receivable">0</div></div>
                <div class="glass p-3 rounded-xl border-l-4 border-orange-500"><div class="text-[10px] text-slate-400">應付（我欠他們）</div><div class="text-lg font-bold text-orange-400" id="peer-sum-payable">0</div></div>
                <div class="glass p-3 rounded-xl border-l-4 border-yellow-500"><div class="text-[10px] text-slate-400">淨餘額</div><div class="text-lg font-bold text-yellow-400" id="peer-balance">0</div></div>
            </div>`
);

// 4) Rename 新增欠帳 to 他們欠我
c = c.replace(
  'class="bg-red-600 hover:bg-red-500 px-4 py-2 rounded text-sm font-bold">新增欠帳</button>',
  'class="bg-red-600 hover:bg-red-500 px-4 py-2 rounded text-sm font-bold">他們欠我</button>'
);

// 5) Update list header: add 方式
c = c.replace(
  '<div class="flex text-xs text-slate-400 px-3 pb-2 border-b border-slate-700"><div class="w-24">日期</div><div class="w-14">類型</div><div class="w-16">品項</div><div class="w-20 text-right">金額</div><div class="flex-1 min-w-0">備註</div></div>',
  '<div class="flex text-xs text-slate-400 px-3 pb-2 border-b border-slate-700"><div class="w-20">日期</div><div class="w-12">類型</div><div class="w-12">品項</div><div class="w-12">方式</div><div class="w-16 text-right">金額</div><div class="flex-1 min-w-0">備註</div></div>'
);

// 6) Update renderPeerLedger: summary calc + row display
c = c.replace(
  `const sumDebtEl = document.getElementById('peer-sum-debt');
            const sumRepayEl = document.getElementById('peer-sum-repay');
            const balanceEl = document.getElementById('peer-balance');
            if (!listEl) return;
            let sumDebt = 0, sumRepay = 0;
            peerLedgerData.forEach(function(r) {
                const amt = Number(r.amount) || 0;
                if (amt > 0) sumDebt += amt;
                else if (amt < 0) sumRepay += amt;
            });
            const balance = sumDebt + sumRepay;
            if (sumDebtEl) sumDebtEl.textContent = sumDebt.toLocaleString();
            if (sumRepayEl) sumRepayEl.textContent = sumRepay.toLocaleString();
            if (balanceEl) balanceEl.textContent = balance.toLocaleString();`,
  `const sumRecvEl = document.getElementById('peer-sum-receivable');
            const sumPayEl = document.getElementById('peer-sum-payable');
            const balanceEl = document.getElementById('peer-balance');
            if (!listEl) return;
            let receivable = 0, payable = 0;
            peerLedgerData.forEach(function(r) {
                const amt = Number(r.amount) || 0;
                const t = r.type || '';
                if (t === '欠帳') receivable += amt;
                else if (t === '還款') receivable += amt;
                else if (t === '我欠') payable += amt;
                else if (t === '我還') payable += amt;
                else { if (amt > 0) receivable += amt; else payable += Math.abs(amt); }
            });
            const balance = receivable - payable;
            if (sumRecvEl) sumRecvEl.textContent = receivable.toLocaleString();
            if (sumPayEl) sumPayEl.textContent = payable.toLocaleString();
            if (balanceEl) balanceEl.textContent = balance.toLocaleString();`
);

// 7) Update row display: type from r.type, add repayMethod
c = c.replace(
  `const type = amt > 0 ? '欠帳' : '還款';
                const date = r.date || r.createdAt || '';
                const remark = r.remark || r.note || '';
                const itemType = r.itemType || '';
                return '<div class="flex items-center gap-4 py-2 border-b border-slate-700/50 text-sm"><span class="text-slate-400 w-24">' + date + '</span><span class="' + (amt > 0 ? 'text-red-400' : 'text-green-400') + ' w-14">' + type + '</span><span class="text-amber-400/90 w-16">' + itemType + '</span><span class="text-white w-20 text-right">' + amt.toLocaleString() + '</span><span class="text-slate-400 flex-1 truncate">' + remark + '</span></div>';`,
  `const type = r.type || (amt > 0 ? '欠帳' : '還款');
                const date = r.date || r.createdAt || '';
                const remark = r.remark || r.note || '';
                const itemType = r.itemType || '';
                const repayMethod = r.repayMethod || '';
                const typeCls = type === '欠帳' || type === '我欠' ? 'text-red-400' : 'text-green-400';
                return '<div class="flex items-center gap-2 py-2 border-b border-slate-700/50 text-sm"><span class="text-slate-400 w-20 shrink-0">' + date + '</span><span class="' + typeCls + ' w-12 shrink-0">' + type + '</span><span class="text-amber-400/90 w-12 shrink-0">' + itemType + '</span><span class="text-slate-500 w-12 shrink-0">' + repayMethod + '</span><span class="text-white w-16 text-right shrink-0">' + amt.toLocaleString() + '</span><span class="text-slate-400 flex-1 truncate">' + remark + '</span></div>';`
);

// 8) doAddPeerRepayment: add repayMethod dropdown
c = c.replace(
  `html: '<select id="swal-itemtype2" class="swal2-input"><option value="二手機">二手機</option><option value="網卡">網卡</option><option value="軟體">軟體</option><option value="其他">其他</option></select><input id="swal-peer2" class="swal2-input" placeholder="同行名稱"><input id="swal-amount2" type="number" class="swal2-input" placeholder="金額"><input id="swal-remark2" class="swal2-input" placeholder="備註（可手打）">'`,
  `html: '<select id="swal-itemtype2" class="swal2-input"><option value="二手機">二手機</option><option value="網卡">網卡</option><option value="軟體">軟體</option><option value="其他">其他</option></select><select id="swal-repay2" class="swal2-input"><option value="現金">現金</option><option value="商品抵債">商品抵債</option></select><input id="swal-peer2" class="swal2-input" placeholder="同行名稱"><input id="swal-amount2" type="number" class="swal2-input" placeholder="金額"><input id="swal-remark2" class="swal2-input" placeholder="備註（可手打）">'`
);

c = c.replace(
  `try { await API.addPeerRepayment({ peerName, amount, remark, itemType: (document.getElementById('swal-itemtype2') && document.getElementById('swal-itemtype2').value) || '其他', person: User.name }); loadPeerLedger(); }`,
  `try { await API.addPeerRepayment({ peerName, amount, remark, itemType: (document.getElementById('swal-itemtype2') && document.getElementById('swal-itemtype2').value) || '其他', repayMethod: (document.getElementById('swal-repay2') && document.getElementById('swal-repay2').value) || '現金', person: User.name }); loadPeerLedger(); }`
);

// 9) Add doAddPeerMyDebt and doAddPeerMyRepay
c = c.replace(
  `async function doAddPeerRepayment() {
            const r = await Swal.fire`,
  `async function doAddPeerMyDebt() {
            const r = await Swal.fire({ title: '新增我欠（我欠同行）', html: '<select id="swal-myd-itemtype" class="swal2-input"><option value="二手機">二手機</option><option value="網卡">網卡</option><option value="軟體">軟體</option><option value="其他">其他</option></select><input id="swal-myd-peer" class="swal2-input" placeholder="同行名稱"><input id="swal-myd-amount" type="number" class="swal2-input" placeholder="金額"><input id="swal-myd-remark" class="swal2-input" placeholder="備註">', showCancelButton: true, confirmButtonText: '確定', cancelButtonText: '取消', background: '#1e293b', color: 'white' });
            if (!r.isConfirmed) return;
            const peerName = (document.getElementById('swal-myd-peer') && document.getElementById('swal-myd-peer').value.trim()) || selectedPeer;
            const amount = Number(document.getElementById('swal-myd-amount') && document.getElementById('swal-myd-amount').value) || 0;
            const remark = (document.getElementById('swal-myd-remark') && document.getElementById('swal-myd-remark').value.trim()) || '';
            if (!peerName || amount <= 0) { Swal.fire({ icon: 'warning', title: '請填寫同行名稱與金額', background: '#1e293b', color: 'white' }); return; }
            try { await API.addPeerMyDebt({ peerName, amount, remark, itemType: (document.getElementById('swal-myd-itemtype') && document.getElementById('swal-myd-itemtype').value) || '其他', person: User.name }); loadPeerLedger(); } catch (e) { Swal.fire({ icon: 'error', title: '新增失敗', text: e.message, background: '#1e293b', color: 'white' }); }
        }
        async function doAddPeerMyRepay() {
            const r = await Swal.fire({ title: '新增我還（我還同行）', html: '<select id="swal-myr-itemtype" class="swal2-input"><option value="二手機">二手機</option><option value="網卡">網卡</option><option value="軟體">軟體</option><option value="其他">其他</option></select><select id="swal-myr-repay" class="swal2-input"><option value="現金">現金</option><option value="商品抵債">商品抵債</option></select><input id="swal-myr-peer" class="swal2-input" placeholder="同行名稱"><input id="swal-myr-amount" type="number" class="swal2-input" placeholder="金額"><input id="swal-myr-remark" class="swal2-input" placeholder="備註（可手打，商品抵債可寫明細）">', showCancelButton: true, confirmButtonText: '確定', cancelButtonText: '取消', background: '#1e293b', color: 'white' });
            if (!r.isConfirmed) return;
            const peerName = (document.getElementById('swal-myr-peer') && document.getElementById('swal-myr-peer').value.trim()) || selectedPeer;
            const amount = Number(document.getElementById('swal-myr-amount') && document.getElementById('swal-myr-amount').value) || 0;
            const remark = (document.getElementById('swal-myr-remark') && document.getElementById('swal-myr-remark').value.trim()) || '';
            if (!peerName || amount <= 0) { Swal.fire({ icon: 'warning', title: '請填寫同行名稱與金額', background: '#1e293b', color: 'white' }); return; }
            try { await API.addPeerMyRepay({ peerName, amount, remark, itemType: (document.getElementById('swal-myr-itemtype') && document.getElementById('swal-myr-itemtype').value) || '其他', repayMethod: (document.getElementById('swal-myr-repay') && document.getElementById('swal-myr-repay').value) || '現金', person: User.name }); loadPeerLedger(); } catch (e) { Swal.fire({ icon: 'error', title: '新增失敗', text: e.message, background: '#1e293b', color: 'white' }); }
        }
        async function doAddPeerRepayment() {
            const r = await Swal.fire`
);

fs.writeFileSync(path, c, 'utf8');
console.log('patched');
