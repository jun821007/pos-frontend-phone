const fs = require('fs');
const path = 'index.html';
let c = fs.readFileSync(path, 'utf8');

// 1. Add id to submit restock button
c = c.replace(
  'onclick="submitRestock()" class="w-full bg-red-600',
  'id="btn-submit-restock" onclick="submitRestock()" class="w-full bg-red-600'
);

// 2. Update submitRestock - add Swal confirm and disable button
c = c.replace(
  `async function submitRestock() { 
            if(RestockCart.length===0) return; 
            const oid = 'EXP'+Date.now().toString().slice(-6); 
            try {
                const r = await API.handleRestock`,
  `async function submitRestock() { 
            if(RestockCart.length===0) return; 
            const confirm = await Swal.fire({ title: '確定要送出進貨清單？', text: '送出後無法撤回', showCancelButton: true, confirmButtonText: '確定送出', cancelButtonText: '取消', background: '#1e293b', color: 'white' });
            if (!confirm.isConfirmed) return;
            const btn = document.getElementById('btn-submit-restock');
            if(btn){ btn.disabled=true; btn.textContent='送出中...'; }
            const oid = 'EXP'+Date.now().toString().slice(-6); 
            try {
                const r = await API.handleRestock`
);

c = c.replace(
  `Swal.fire({icon:'success', title:'已送出', background:'#1e293b'});
            } catch(err) {
                Swal.fire({icon:'error', title:'進貨失敗'`,
  `Swal.fire({icon:'success', title:'已送出', background:'#1e293b'});
            } finally {
                const btn = document.getElementById('btn-submit-restock');
                if(btn){ btn.disabled=false; btn.textContent='確認送出'; }
            }
            } catch(err) {
                Swal.fire({icon:'error', title:'進貨失敗'`
);

// 3. Add eSIM to renderServiceGrid - add before modalShipping div
c = c.replace(
  '<div onclick="modalShipping()" class="glass p-6 rounded-xl border-l-4 border-slate-400',
  '<div onclick="modalESIM()" class="glass p-6 rounded-xl border-l-4 border-cyan-500 flex flex-col items-center justify-center gap-2 active:scale-95 transition"><i class="fa-solid fa-sim-card text-4xl text-cyan-500"></i><span class="font-bold">eSIM</span></div><div onclick="modalShipping()" class="glass p-6 rounded-xl border-l-4 border-slate-400'
);

// 4. Add modalESIM function after modalShipping
c = c.replace(
  "async function modalShipping(){const {value:v}=await Swal.fire({title:'運費'",
  "async function modalESIM(){const {value:v}=await Swal.fire({title:'eSIM',html:'<input id=\"es1\" class=\"swal2-input\" type=\"number\" placeholder=\"成本\"><input id=\"es2\" class=\"swal2-input\" type=\"number\" placeholder=\"結帳金額\">',background:'#1e293b',color:'white',preConfirm:()=>[document.getElementById('es1').value,document.getElementById('es2').value]});if(v&&v[1]){Cart.push({type:'esim',name:'eSIM',cost:Number(v[0])||0,price:Number(v[1])||0,quantity:1,itemId:'ESIM-'+Date.now()});renderCart();}}\n        async function modalShipping(){const {value:v}=await Swal.fire({title:'運費'"
);

// 5. Add addNewAccessory after addNewCompanyTemplate
c = c.replace(
  "async function addNewCompanyTemplate() { const n = document.getElementById('new-cp-name').value.trim(); const c = document.getElementById('new-cp-cost').value; const p = document.getElementById('new-cp-price').value; if(!n || !c || !p) { Swal.fire({icon:'warning', title:'請填寫完整', toast:true, position:'top', background:'#1e293b'}); return; } try { const res = await API.addCompanyTemplate(n, c, p); if(res.status === 'success') { Swal.fire({icon:'success', title:'已新增', toast:true, position:'top', background:'#1e293b'}); document.getElementById('new-cp-name').value=''; document.getElementById('new-cp-cost').value=''; document.getElementById('new-cp-price').value=''; fetchData(); } else { Swal.fire({icon:'error', title:'新增失敗', text: res.msg || '', background:'#1e293b'}); } } catch(e) { Swal.fire({icon:'error', title:'新增失敗', text: e.message || '請重試', background:'#1e293b'}); } }",
  "async function addNewCompanyTemplate() { const n = document.getElementById('new-cp-name').value.trim(); const c = document.getElementById('new-cp-cost').value; const p = document.getElementById('new-cp-price').value; if(!n || !c || !p) { Swal.fire({icon:'warning', title:'請填寫完整', toast:true, position:'top', background:'#1e293b'}); return; } try { const res = await API.addCompanyTemplate(n, c, p); if(res.status === 'success') { Swal.fire({icon:'success', title:'已新增', toast:true, position:'top', background:'#1e293b'}); document.getElementById('new-cp-name').value=''; document.getElementById('new-cp-cost').value=''; document.getElementById('new-cp-price').value=''; fetchData(); renderCompanyTemplateList(); } else { Swal.fire({icon:'error', title:'新增失敗', text: res.msg || '', background:'#1e293b'}); } } catch(e) { Swal.fire({icon:'error', title:'新增失敗', text: e.message || '請重試', background:'#1e293b'}); } }\n        async function addNewAccessory(){const cat=document.getElementById('new-acc-category').value.trim();const nm=document.getElementById('new-acc-name').value.trim();if(!cat||!nm){Swal.fire({icon:'warning',title:'請填寫分類與品項名稱',toast:true,position:'top',background:'#1e293b'});return;}try{const res=await API.addAccessory(cat,nm);if(res.status==='success'){Swal.fire({icon:'success',title:'已新增 '+res.id,toast:true,position:'top',background:'#1e293b'});document.getElementById('new-acc-category').value='';document.getElementById('new-acc-name').value='';fetchData();}else{Swal.fire({icon:'error',title:'新增失敗',text:res.msg||'',background:'#1e293b'});}}catch(e){Swal.fire({icon:'error',title:'新增失敗',text:e.message||'請重試',background:'#1e293b'});}}\n        function renderCompanyTemplateList(){const el=document.getElementById('company-template-list');if(!el)return;el.innerHTML='';(DB.companyTemplates||[]).forEach(t=>{el.innerHTML+=`<div class=\"flex justify-between items-center p-2 bg-slate-800 rounded\"><span>${t.name}</span><button onclick=\"deleteCompanyTemplate('${t.name.replace(/'/g,\"\\\\'\")}')\" class=\"text-red-400 hover:text-red-300 text-xs\"><i class=\"fa-solid fa-trash\"></i></button></div>`;});}\n        async function deleteCompanyTemplate(name){const r=await Swal.fire({title:'確定刪除？',text:name,showCancelButton:true,confirmButtonText:'刪除',cancelButtonText:'取消',background:'#1e293b',color:'white'});if(!r.isConfirmed)return;try{const res=await API.deleteCompanyTemplate(name);if(res.status==='success'){Swal.fire({icon:'success',title:'已刪除',toast:true,background:'#1e293b'});fetchData();renderCompanyTemplateList();}else{Swal.fire({icon:'error',title:'刪除失敗',text:res.msg,background:'#1e293b'});}}catch(e){Swal.fire({icon:'error',title:'刪除失敗',text:e.message,background:'#1e293b'});} }"
);

// 6. Call renderCompanyTemplateList when toggleSettingSection opens company-template
c = c.replace(
  "if (isHidden) {\n                content.classList.remove('hidden');\n                icon.classList.remove('fa-chevron-down');\n                icon.classList.add('fa-chevron-up');\n            } else {",
  "if (isHidden) {\n                content.classList.remove('hidden');\n                icon.classList.remove('fa-chevron-down');\n                icon.classList.add('fa-chevron-up');\n                if (sectionId === 'company-template') renderCompanyTemplateList();\n            } else {"
);

fs.writeFileSync(path, c, 'utf8');
console.log('Frontend patched');
