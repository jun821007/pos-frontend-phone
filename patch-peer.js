const fs = require('fs');
let c = fs.readFileSync('index.html', 'utf8');

// 1. Add API addPeerMyDebt addPeerMyRepay
c = c.replace(
  'return await res.json();\n          }\n        };',
  'return await res.json();\n          },\n          addPeerMyDebt: async (data) => { const r = await fetch(API_BASE_URL + "/peer-my-debt", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }); return await r.json(); },\n          addPeerMyRepay: async (data) => { const r = await fetch(API_BASE_URL + "/peer-my-repay", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }); return await r.json(); }\n        };'
);

// 2. Add buttons
c = c.replace(
  '>新增還款</button>\n            </div>',
  '>他們還我</button>\n                <button onclick="doAddPeerMyDebt()" class="bg-orange-600 hover:bg-orange-500 px-4 py-2 rounded text-sm font-bold">我欠他們</button>\n                <button onclick="doAddPeerMyRepay()" class="bg-teal-600 hover:bg-teal-500 px-4 py-2 rounded text-sm font-bold">我還他們</button>\n            </div>'
);

// 3. Rename 新增欠帳
c = c.replace('>新增欠帳</button>', '>他們欠我</button>');

// 4. Summary cards
c = c.replace('peer-sum-debt', 'peer-sum-receivable');
c = c.replace('peer-sum-repay', 'peer-sum-payable');
c = c.replace('>總欠款</div>', '>應收（他們欠我）</div>');
c = c.replace('>總還款</div>', '>應付（我欠他們）</div>');
c = c.replace('border-l-4 border-green-500', 'border-l-4 border-orange-500');
c = c.replace('>餘額</div>', '>淨餘額</div>');

fs.writeFileSync('index.html', c, 'utf8');
console.log('done');
