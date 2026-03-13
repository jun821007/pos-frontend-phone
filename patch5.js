const fs = require('fs');
let s = fs.readFileSync('index.html', 'utf8');

// Non-admin - replace a002 check with isAdmin
s = s.replace("User.username === 'a002'", "!User.isAdmin");
s = s.replace("['d-nav-report','d-nav-pending','m-nav-report','m-nav-pending']", "['d-nav-report','d-nav-history','d-nav-peer','d-nav-pending','m-nav-report','m-nav-history','m-nav-peer','m-nav-pending']");
s = s.replace("el.classList.add('opacity-30', 'pointer-events-none');\n                        el.style.cursor = 'not-allowed';", "el.style.display = 'none';");

// loginSuccess - use remember-creds
s = s.replace("if(rem && rem.checked) { \n                // 記住帳號和密碼\n                localStorage.setItem('pos_user_v30', JSON.stringify(User)); \n                if(uEl) localStorage.setItem('pos_last_user', uEl.value.trim()); \n                if(pEl) localStorage.setItem('pos_last_pass', pEl.value.trim());\n            } else {\n                // 不記住：清除已保存的密碼，但保留帳號（方便下次輸入）\n                localStorage.removeItem('pos_last_pass');\n                if(uEl) localStorage.setItem('pos_last_user', uEl.value.trim());\n            }",
'const creds = document.getElementById("remember-creds"); if(rem && rem.checked) localStorage.setItem("pos_user_v30", JSON.stringify(User)); else localStorage.removeItem("pos_user_v30"); if(creds && creds.checked && uEl && pEl) { localStorage.setItem("pos_last_user", uEl.value.trim()); localStorage.setItem("pos_last_pass", pEl.value.trim()); } else { if(!creds || !creds.checked) localStorage.removeItem("pos_last_pass"); if(uEl) localStorage.setItem("pos_last_user", uEl.value.trim()); }');

// Load: 記住帳密 for creds
s = s.replace('if (lastUser && lastPass) {\n                    const rem = document.getElementById(\'remember-me\');\n                    if (rem) rem.checked = true;\n                }', 'if (lastUser || lastPass) { const c=document.getElementById("remember-creds"); if(c) c.checked=true; } if (localStorage.getItem("pos_user_v30")) { const r=document.getElementById("remember-me"); if(r) r.checked=true; }');

fs.writeFileSync('index.html', s);
console.log('ok');
