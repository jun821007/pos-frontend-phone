const fs = require('fs');
let s = fs.readFileSync('index.html', 'utf8');

// Fix non-admin: use display none
s = s.replace("el.classList.add('opacity-30', 'pointer-events-none');\n                        el.style.cursor = 'not-allowed';", "el.style.display = 'none';");

// loginSuccess - smaller replace
s = s.replace("if(rem && rem.checked) { \n                // 記住帳號和密碼\n                localStorage.setItem('pos_user_v30'", "var creds=document.getElementById('remember-creds'); if(rem && rem.checked) localStorage.setItem('pos_user_v30'");
s = s.replace("if(uEl) localStorage.setItem('pos_last_user', uEl.value.trim()); \n                if(pEl) localStorage.setItem('pos_last_pass', pEl.value.trim());\n            } else {\n                // 不記住：清除已保存的密碼，但保留帳號（方便下次輸入）\n                localStorage.removeItem('pos_last_pass');\n                if(uEl) localStorage.setItem('pos_last_user', uEl.value.trim());\n            }",
"); else localStorage.removeItem('pos_user_v30'); if(creds && creds.checked && uEl && pEl) { localStorage.setItem('pos_last_user',uEl.value.trim()); localStorage.setItem('pos_last_pass',pEl.value.trim()); } else { if(!creds||!creds.checked) localStorage.removeItem('pos_last_pass'); if(uEl) localStorage.setItem('pos_last_user',uEl.value.trim()); }");

fs.writeFileSync('index.html', s);
console.log('ok');
