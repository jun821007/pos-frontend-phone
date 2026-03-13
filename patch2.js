const fs = require('fs');
let s = fs.readFileSync('index.html', 'utf8');

// 1. initSystem: remove login-page, change non-admin to hide 4 tabs
s = s.replace("document.getElementById('login-overlay').style.display = 'none';", "document.getElementById('login-overlay').style.display = 'none'; document.body.classList.remove('login-page');");
s = s.replace("// 限制 a002 帳號不能使用「今日」和「未結」功能\n            if(User && User.username === 'a002') {\n                ['d-nav-report','d-nav-pending','m-nav-report','m-nav-pending'].forEach(id => { \n                    const el = document.getElementById(id); \n                    if(el) {\n                        el.classList.add('opacity-30', 'pointer-events-none');\n                        el.style.cursor = 'not-allowed';\n                    }\n                }); \n            }", 
"// 非管理員只能看到 收銀/進貨/設定\n            if(User && !User.isAdmin) {\n                ['d-nav-report','d-nav-history','d-nav-peer','d-nav-pending','m-nav-report','m-nav-history','m-nav-peer','m-nav-pending'].forEach(id => { \n                    const el = document.getElementById(id); \n                    if(el) el.style.display = 'none';\n                }); \n            }");

// 2. loginSuccess: separate remember-me and remember-creds
s = s.replace("if(rem && rem.checked) { \n                // 記住帳號和密碼\n                localStorage.setItem('pos_user_v30', JSON.stringify(User)); \n                if(uEl) localStorage.setItem('pos_last_user', uEl.value.trim()); \n                if(pEl) localStorage.setItem('pos_last_pass', pEl.value.trim());\n            } else {\n                // 不記住：清除已保存的密碼，但保留帳號（方便下次輸入）\n                localStorage.removeItem('pos_last_pass');\n                if(uEl) localStorage.setItem('pos_last_user', uEl.value.trim());\n            }",
"const creds = document.getElementById('remember-creds');\n            if(rem && rem.checked) localStorage.setItem('pos_user_v30', JSON.stringify(User));\n            else localStorage.removeItem('pos_user_v30');\n            if(creds && creds.checked && uEl && pEl) {\n                localStorage.setItem('pos_last_user', uEl.value.trim());\n                localStorage.setItem('pos_last_pass', pEl.value.trim());\n            } else {\n                if(!creds || !creds.checked) localStorage.removeItem('pos_last_pass');\n                if(uEl) localStorage.setItem('pos_last_user', uEl.value.trim());\n            }");

// 3. Load remember-creds on init
s = s.replace("if (lastUser && lastPass) {\n                    const rem = document.getElementById('remember-me');\n                    if (rem) rem.checked = true;\n                }",
"if (lastUser && lastPass) {\n                    const creds = document.getElementById('remember-creds');\n                    if (creds) creds.checked = true;\n                }\n                if (lastUser) {\n                    const rem = document.getElementById('remember-me');\n                    if (rem) rem.checked = true;\n                }");

fs.writeFileSync('index.html', s);
console.log('patch2 ok');
