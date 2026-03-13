const fs = require("fs");
const path = "C:/Users/rsz97/pos/index.html";
let s = fs.readFileSync(path, "utf8");

// 1) After addPeerRepayment, add two new API methods
const apiEnd = "            return await res.json();\r\n          }\r\n        };";
const apiInsert = "            return await res.json();\r\n          },\r\n          addPeerMyDebt: async (data) => { const r = await fetch(API_BASE_URL + '/peer-my-debt', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); return await r.json(); },\r\n          addPeerMyRepay: async (data) => { const r = await fetch(API_BASE_URL + '/peer-my-repay', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); return await r.json(); }\r\n        };";
let idx = s.lastIndexOf(apiEnd);
if (idx === -1) { console.log("Edit 1 fail: API end not found"); process.exit(1); }
s = s.slice(0, idx) + apiInsert + s.slice(idx + apiEnd.length);
console.log("Edit 1 OK");

// 2) Before "function openPending()" add doAddPeerMyDebt and doAddPeerMyRepay
const openPendingMark = "        function openPending()";
const myDebtRepayFuncs = `        async function doAddPeerMyDebt() {
            const r = await Swal.fire({ title: '新增我欠', html: '<select id="swal-itemtype-my" class="swal2-input"><option value="二手機">二手機</option><option value="網卡">網卡</option><option value="軟體">軟體</option><option value="其他">其他</option></select><input id="swal-peer-my" class="swal2-input" placeholder="同行名稱"><input id="swal-amount-my" type="number" class="swal2-input" placeholder="金額"><input id="swal-remark-my" class="swal2-input" placeholder="備註（可手打）">', showCancelButton: true, confirmButtonText: '確定', cancelButtonText: '取消', background: '#1e293b', color: 'white' });
            if (!r.isConfirmed) return;
            const peerName = (document.getElementById('swal-peer-my') && document.getElementById('swal-peer-my').value.trim()) || selectedPeer;
            const amount = Number(document.getElementById('swal-amount-my') && document.getElementById('swal-amount-my').value) || 0;
            const remark = (document.getElementById('swal-remark-my') && document.getElementById('swal-remark-my').value.trim()) || '';
            if (!peerName || amount <= 0) { Swal.fire({ icon: 'warning', title: '請填寫同行與金額', background: '#1e293b', color: 'white' }); return; }
            try { await API.addPeerMyDebt({ peerName, amount, remark, itemType: (document.getElementById('swal-itemtype-my') && document.getElementById('swal-itemtype-my').value) || '其他', person: User.name }); loadPeerLedger(); } catch (e) { Swal.fire({ icon: 'error', title: '新增失敗', text: e.message, background: '#1e293b', color: 'white' }); }
        }
        async function doAddPeerMyRepay() {
            const r = await Swal.fire({ title: '新增我還', html: '<select id="swal-repaymethod-my" class="swal2-input"><option value="現金">現金</option><option value="商品抵債">商品抵債</option></select><select id="swal-itemtype-myrepay" class="swal2-input"><option value="二手機">二手機</option><option value="網卡">網卡</option><option value="軟體">軟體</option><option value="其他">其他</option></select><input id="swal-peer-myrepay" class="swal2-input" placeholder="同行名稱"><input id="swal-amount-myrepay" type="number" class="swal2-input" placeholder="金額"><input id="swal-remark-myrepay" class="swal2-input" placeholder="備註（可手打）">', showCancelButton: true, confirmButtonText: '確定', cancelButtonText: '取消', background: '#1e293b', color: 'white' });
            if (!r.isConfirmed) return;
            const peerName = (document.getElementById('swal-peer-myrepay') && document.getElementById('swal-peer-myrepay').value.trim()) || selectedPeer;
            const amount = Number(document.getElementById('swal-amount-myrepay') && document.getElementById('swal-amount-myrepay').value) || 0;
            const remark = (document.getElementById('swal-remark-myrepay') && document.getElementById('swal-remark-myrepay').value.trim()) || '';
            const repayMethod = (document.getElementById('swal-repaymethod-my') && document.getElementById('swal-repaymethod-my').value) || '現金';
            if (!peerName || amount <= 0) { Swal.fire({ icon: 'warning', title: '請填寫同行與金額', background: '#1e293b', color: 'white' }); return; }
            try { await API.addPeerMyRepay({ peerName, amount, remark, itemType: (document.getElementById('swal-itemtype-myrepay') && document.getElementById('swal-itemtype-myrepay').value) || '其他', repayMethod, person: User.name }); loadPeerLedger(); } catch (e) { Swal.fire({ icon: 'error', title: '新增失敗', text: e.message, background: '#1e293b', color: 'white' }); }
        }

`;
idx = s.indexOf(openPendingMark);
if (idx === -1) { console.log("Edit 2 fail: openPending not found"); process.exit(1); }
s = s.slice(0, idx) + myDebtRepayFuncs + s.slice(idx);
console.log("Edit 2 OK");

fs.writeFileSync(path, s);
console.log("Saved.");
