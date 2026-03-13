const fs = require('fs');
let s = fs.readFileSync('index.html', 'utf8');
s = s.replace('<body class="h-screen flex flex-col md:flex-row overflow-hidden select-none">', '<body class="h-screen flex flex-col md:flex-row overflow-hidden select-none login-page">');
if (!s.includes('body.login-page aside')) {
  s = s.replace('</style>', 'body.login-page aside, body.login-page nav { display: none !important; }\n    </style>');
}
s = s.replace('gap-2 mt-2"><input type="checkbox" id="remember-me"', 'gap-4 mt-2 flex-wrap"><label class="flex items-center gap-2 text-slate-400 text-sm cursor-pointer"><input type="checkbox" id="remember-me"');
s = s.replace('">保持登入</label></div>', '">保持登入</label><label class="flex items-center gap-2 text-slate-400 text-sm cursor-pointer"><input type="checkbox" id="remember-creds" class="w-4 h-4 rounded border-slate-600 bg-slate-800 text-yellow-500">記住帳密</label></div>');
fs.writeFileSync('index.html', s);
console.log('ok');
