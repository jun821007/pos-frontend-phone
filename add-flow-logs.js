const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'index.html');
let html = fs.readFileSync(file, 'utf8');

// Inject console.log in script block only (first occurrence of <script> to </script>)
const scriptStart = html.indexOf('<script>');
const scriptEnd = html.indexOf('</script>', scriptStart);
if (scriptStart === -1 || scriptEnd === -1) {
  console.error('Could not find script block');
  process.exit(1);
}
let js = html.substring(scriptStart + 8, scriptEnd);

// Helper: insert after first occurrence of pattern (on same line or next)
function injectAfter(code, pattern, injection) {
  const idx = code.indexOf(pattern);
  if (idx === -1) return code;
  const end = code.indexOf('\n', idx);
  const insertAt = end === -1 ? idx + pattern.length : end;
  return code.slice(0, insertAt) + '\n' + injection + code.slice(insertAt);
}
function injectBefore(code, pattern, injection) {
  const idx = code.indexOf(pattern);
  if (idx === -1) return code;
  return code.slice(0, idx) + injection + '\n' + code.slice(idx);
}

// 1) window.onload
js = injectAfter(js, "window.onload = () => {", "            console.log('[flow] window.onload');");

// 2) autoLogin
js = injectAfter(js, "(async function autoLogin() {", "                console.log('[flow] autoLogin');");
js = injectAfter(js, "if (!s) return;", "                    console.log('[flow] autoLogin no token');");
js = injectBefore(js, "const result = await API.verifyLogin(lastUser.trim(), lastPass);", "                            console.log('[flow] autoLogin before verifyLogin');");
js = injectAfter(js, "} catch (e) { console.warn('Auto login re-verify fail", "                        console.log('[flow] autoLogin re-verify catch');");

// 3) initSystem
js = injectAfter(js, "function initSystem() {", "            console.log('[flow] initSystem');");
js = injectAfter(js, "if(User && !User.isAdmin) {", "                console.log('[flow] initSystem non-admin');");

// 4) fetchData
js = injectAfter(js, "async function fetchData() {", "            console.log('[flow] fetchData');");
js = injectBefore(js, "const d = await API.getInventory();", "                console.log('[flow] fetchData before getInventory');");
js = injectAfter(js, "if (d.status === 'error') {", "                    console.log('[flow] fetchData getInventory error');");
js = injectAfter(js, "} catch(e) {", "            } catch(e) { console.log('[flow] fetchData catch', e);");
const catchIdx = js.indexOf("} catch(e) {");
const fetchCatch = js.indexOf("document.getElementById('sync-status').innerHTML = '<span class=\"text-red-500\">", catchIdx);
if (fetchCatch > catchIdx && fetchCatch < catchIdx + 200) {
  js = js.slice(0, fetchCatch) + "                console.log('[flow] fetchData catch');\n                " + js.slice(fetchCatch);
}

// 5) switchView
js = injectAfter(js, "var ev=document.getElementById('view-'+v); if(!ev)return;", "            if(!ev){ console.log('[flow] switchView no element', v); return; }\n            ");
// Fix: the original is "if(!ev)return" - inject after it
js = js.replace("var ev=document.getElementById('view-'+v); if(!ev)return;", "var ev=document.getElementById('view-'+v); if(!ev){ console.log('[flow] switchView no element', v); return; }");
js = injectAfter(js, "setTimeout(function(){ if (v === 'restock'", "                console.log('[flow] switchView setTimeout', v);");

// 6) openReport
js = injectAfter(js, "function openReport() {", "            console.log('[flow] openReport');");
js = injectAfter(js, "if (User && !User.isAdmin) {", "                console.log('[flow] openReport permission denied');");
// only first openReport - we need the one inside openReport
const openReportStart = js.indexOf("function openReport() {");
let afterOpenReport = js.indexOf("if (User && !User.isAdmin) {", openReportStart);
if (afterOpenReport !== -1 && afterOpenReport < openReportStart + 400) {
  js = js.slice(0, afterOpenReport) + "console.log('[flow] openReport permission denied');\n            " + js.slice(afterOpenReport);
}

// 7) openPending
js = injectAfter(js, "function openPending() {", "            console.log('[flow] openPending');");
const openPendingStart = js.indexOf("function openPending() {");
let openPendingPerm = js.indexOf("if (User && !User.isAdmin) {", openPendingStart);
if (openPendingPerm !== -1 && openPendingPerm < openPendingStart + 350) {
  js = js.slice(0, openPendingPerm) + "console.log('[flow] openPending permission denied');\n            " + js.slice(openPendingPerm);
}

// 8) loadPending
js = injectAfter(js, "async function loadPending() {", "            console.log('[flow] loadPending');");
js = injectBefore(js, "const res = await API.getPendingOrders();", "                console.log('[flow] loadPending before getPendingOrders');");
js = injectAfter(js, "renderPendingList();", "                console.log('[flow] loadPending after getPendingOrders');");
// only in loadPending - the first renderPendingList after getPendingOrders
const loadPendingIdx = js.indexOf("async function loadPending()");
const renderPendingInLoad = js.indexOf("renderPendingList();", loadPendingIdx);
if (renderPendingInLoad !== -1 && renderPendingInLoad < loadPendingIdx + 600) {
  js = js.slice(0, renderPendingInLoad + 19) + "\n                console.log('[flow] loadPending after getPendingOrders');" + js.slice(renderPendingInLoad + 19);
}

// 9) doHistorySearch
js = injectAfter(js, "async function doHistorySearch() {", "            console.log('[flow] doHistorySearch');");
js = injectBefore(js, "const res = await API.getHistory(s, e);", "                console.log('[flow] doHistorySearch before getHistory');");
js = injectAfter(js, "renderHistoryList();", "                console.log('[flow] doHistorySearch after getHistory');");
const doHistIdx = js.indexOf("async function doHistorySearch()");
const renderHistInDo = js.indexOf("renderHistoryList();", doHistIdx);
if (renderHistInDo !== -1 && renderHistInDo < doHistIdx + 700) {
  js = js.slice(0, renderHistInDo + 19) + "\n                console.log('[flow] doHistorySearch after getHistory');" + js.slice(renderHistInDo + 19);
}

// 10) doLogin
js = injectAfter(js, "async function doLogin() {", "            console.log('[flow] doLogin');");
js = injectAfter(js, "if (!u || !p) {", "                console.log('[flow] doLogin empty creds');");
js = injectBefore(js, "const result = await API.verifyLogin(u, p);", "                console.log('[flow] doLogin before verifyLogin');");
js = injectAfter(js, "if (result && result.success) {", "                    console.log('[flow] doLogin success');");
js = injectAfter(js, "} else {", "                    console.log('[flow] doLogin result fail');");
const doLoginElse = js.indexOf("showError(result?.message");
const beforeShowError = js.lastIndexOf("} else {", doLoginElse);
if (beforeShowError !== -1 && beforeShowError > js.indexOf("async function doLogin()")) {
  js = js.slice(0, beforeShowError + 8) + "\n                    console.log('[flow] doLogin result fail');" + js.slice(beforeShowError + 8);
}

// 11) loginSuccess
js = injectAfter(js, "function loginSuccess(n, a, u, token) {", "            console.log('[flow] loginSuccess');");

// 12) setRestockMode - add at start (minified line)
js = js.replace("function setRestockMode(m) { UI.rsMode = m;", "function setRestockMode(m) { console.log('[flow] setRestockMode', m); UI.rsMode = m;");

// 13) openHistory (single line)
js = js.replace("function openHistory() { if(User&&!User.isAdmin)", "function openHistory() { console.log('[flow] openHistory'); if(User&&!User.isAdmin)");

// 14) Hash branch in fetchData - add logs for each hash
js = js.replace("if(['report','pending','history','restock','setting'].includes(h)){ if(h==='report')openReport();", "if(['report','pending','history','restock','setting'].includes(h)){ console.log('[flow] fetchData hash', h); if(h==='report'){ console.log('[flow] fetchData opening report'); openReport();");
js = js.replace("else if(h==='pending')openPending();", "} else if(h==='pending'){ console.log('[flow] fetchData opening pending'); openPending();");
js = js.replace("else if(h==='history')openHistory();", "} else if(h==='history'){ console.log('[flow] fetchData opening history'); openHistory();");
js = js.replace("else if(h==='restock'){switchView('restock');", "} else if(h==='restock'){ console.log('[flow] fetchData opening restock'); switchView('restock');");
js = js.replace("else if(h==='setting')switchView('setting'); }", "} else if(h==='setting'){ console.log('[flow] fetchData opening setting'); switchView('setting'); } }");

html = html.slice(0, scriptStart + 8) + js + html.slice(scriptEnd);
fs.writeFileSync(file, html);
console.log('Added flow console.log to index.html');
