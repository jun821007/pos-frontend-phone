// ==========================================
// 內部 POS 系統後端 (完善版)
// ==========================================

const PHONE_SS_ID = "1EBmhc6YKZBuwnASCPorrRjvdsHWf7IPASr3-ZJ5DuAM";
const ACC_SS_ID = "1c3o-LAlGIh7drYZSGZNx4BdcQIOceBSgmqoJ09cwEQo";

function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('內部POS系統')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0');
}

// 寫入日誌（試算表「日誌」：時間、動作、帳號、訊息）
function writeLog(action, account, message) {
  try {
    const ss = SpreadsheetApp.openById(PHONE_SS_ID);
    const sh = ss.getSheetByName("日誌");
    if (sh) sh.appendRow([new Date(), action, account || "", message || ""]);
  } catch (e) { }
}

// 登入驗證：優先讀試算表「帳號」，無則沿用固定帳號 / Script Properties / admin
function apiVerifyLogin(username, password) {
  try {
    const u = (username || '').trim();
    const p = (password || '').trim();
    if (!u || !p) {
      return JSON.stringify({ success: false, message: '請輸入帳號與密碼' });
    }
    // 試算表「帳號」：A 帳號、B 密碼、C 名稱、D 管理員(Y/N)
    try {
      const ss = SpreadsheetApp.openById(PHONE_SS_ID);
      const accSheet = ss.getSheetByName("帳號");
      if (accSheet && accSheet.getLastRow() >= 2) {
        const rows = accSheet.getRange(2, 1, accSheet.getLastRow(), 4).getValues();
        for (let i = 0; i < rows.length; i++) {
          const acc = String(rows[i][0] || "").trim();
          const pw = String(rows[i][1] || "").trim();
          const name = String(rows[i][2] || acc).trim();
          const admin = String(rows[i][3] || "").toUpperCase() === "Y";
          if (acc === u && pw === p) {
            return JSON.stringify({ success: true, user: { name: name, isAdmin: admin } });
          }
        }
        writeLog("登入失敗", u, "帳號或密碼錯誤");
        return JSON.stringify({ success: false, message: '帳號或密碼錯誤' });
      }
    } catch (sheetErr) { }
    // 無「帳號」表時沿用固定帳號
    if (u === 'a001' && p === 'zz572356') {
      return JSON.stringify({ success: true, user: { name: '柏鈞', isAdmin: true } });
    }
    if (u === 'a002' && p === 'apple5757') {
      return JSON.stringify({ success: true, user: { name: '小良哥', isAdmin: false } });
    }
    const props = PropertiesService.getScriptProperties();
    const savedUser = props.getProperty('POS_ADMIN_USER');
    const savedPw = props.getProperty('POS_ADMIN_PW');
    if (savedUser && savedPw) {
      if (u === savedUser && p === savedPw) {
        return JSON.stringify({ success: true, user: { name: u, isAdmin: true } });
      }
      writeLog("登入失敗", u, "帳號或密碼錯誤");
      return JSON.stringify({ success: false, message: '帳號或密碼錯誤' });
    }
    if (u === 'admin' && p === 'admin') {
      return JSON.stringify({ success: true, user: { name: u, isAdmin: true } });
    }
    writeLog("登入失敗", u, "帳號或密碼錯誤");
    return JSON.stringify({ success: false, message: '帳號或密碼錯誤' });
  } catch (e) {
    writeLog("登入失敗", (username || "").trim(), e.message || "");
    return JSON.stringify({ success: false, message: '登入驗證失敗: ' + (e.message || '') });
  }
}

// 1. 讀取全資料
function apiGetInventory() {
  let output = { inventory: [], todaySales: [], companyTemplates: [] };
  try {
    // A. 手機
    try {
      const pSS = SpreadsheetApp.openById(PHONE_SS_ID);
      const pSheet = pSS.getSheetByName("工作表1");
      const pData = pSheet.getDataRange().getValues();
      const ALLOWED_STATUS = ["庫存中", "客訂中", "寄賣中", "公司已售出未請款"];
      for (let i = 1; i < pData.length; i++) {
        let row = pData[i];
        let status = String(row[14] || "").trim();
        if (ALLOWED_STATUS.includes(status)) {
          output.inventory.push({
            id: row[0], stock_id: row[0], type: 'phone',
            name: `${row[2]} ${row[3]} ${row[4]}`,
            imei: row[9], price: Number(row[18]) || 0, cost: Number(row[12]) || 0,
            stock: 1, battery: row[6], ios: row[15], status_label: status, owner: 'self'
          });
        }
      }
    } catch (err) { }

    // B. 配件（庫存計算改成跟 AppSheet 一樣：基礎欄位 + 進出庫流水帳入/出庫差額）
    try {
      const aSS = SpreadsheetApp.openById(ACC_SS_ID);
      const aSheet = aSS.getSheetByName("庫存清單");
      const aData = aSheet.getDataRange().getValues();

      // 讀取「進出庫流水帳」，先彙總每個品項名稱的庫存變化量
      const logSheet = aSS.getSheetByName("進出庫流水帳");
      const logData = logSheet ? logSheet.getDataRange().getValues() : [];
      const stockDeltaMap = {};

      if (logData && logData.length > 1) {
        for (let j = 1; j < logData.length; j++) {
          const logRow = logData[j];
          const logName = String(logRow[2] || "").trim();  // [品項編號] / 品名
          if (!logName) continue;
          const type = String(logRow[4] || "").trim();     // 交易類型：入庫 / 出庫 / 調整入庫 / 調整出庫...
          const qty = Number(logRow[5] || 0);
          if (!qty) continue;

          let sign = 0;
          if (type === "入庫" || type === "調整入庫") sign = 1;
          else if (type === "出庫" || type === "調整出庫") sign = -1;
          if (!sign) continue;

          stockDeltaMap[logName] = (stockDeltaMap[logName] || 0) + sign * qty;
        }
      }

      const HIDDEN_KEYWORDS = ["已加工", "成品", "電池", "電芯", "排線", "中框", "螢幕", "後玻璃", "外配", "維修", "零件", "加工"];
      for (let i = 1; i < aData.length; i++) {
        let row = aData[i];
        let fullCheck = (String(row[1]) + String(row[2]) + String(row[3])).toLowerCase();
        let category = String(row[2]);
        let isHidden = HIDDEN_KEYWORDS.some(k => fullCheck.includes(k));
        const name = String(row[3] || "").trim();   // 對應 [_THISROW].[品項名稱]

        if (name) {
          // 基礎庫存 = 試算表上的 [庫存數量] 欄位（原本 POS 讀的那個數字）
          let baseStock = Number(row[7]);
          if (isNaN(baseStock)) baseStock = 0;

          // 變化量 = 進出庫流水帳中，該品項的「入庫/調整入庫 - 出庫/調整出庫」總和
          const delta = stockDeltaMap[name] || 0;
          const realStock = baseStock + delta;

          let defPrice = Number(row[8]);
          if (isNaN(defPrice)) defPrice = 0;

          output.inventory.push({
            id: row[0],
            type: 'accessory',
            category: category,
            name: name,
            cost: Number(row[4]),
            price: 0,
            defaultPrice: defPrice || 0,
            stock: realStock,
            owner: 'company',
            isHidden: isHidden
          });
        }
      }
    } catch (err) { }

    // C. 公司模板
    try {
      const aSS = SpreadsheetApp.openById(ACC_SS_ID);
      const tSheet = aSS.getSheetByName("公司配件設定");
      if (tSheet) {
        const tData = tSheet.getDataRange().getValues();
        for (let i = 1; i < tData.length; i++) {
          if (tData[i][0]) {
            output.companyTemplates.push({
              name: tData[i][0], cost: Number(tData[i][1]) || 0, price: Number(tData[i][2]) || 0
            });
          }
        }
      }
    } catch (err) { }

    // D. 今日流水：擴大讀取範圍、穩健日期比對（GMT+8 同日）
    try {
      const pSS = SpreadsheetApp.openById(PHONE_SS_ID);
      const dailySheet = pSS.getSheetByName("每日流水");
      if (dailySheet) {
        const lastRow = dailySheet.getLastRow();
        if (lastRow >= 1) {
          const startRow = Math.max(1, lastRow - 1999);
          const rows = dailySheet.getRange(startRow, 1, lastRow, 13).getValues();
          const now = new Date();
          const todayStr = Utilities.formatDate(now, "GMT+8", "yyyy/MM/dd");
          const twoHoursAgo = now.getTime() - 2 * 60 * 60 * 1000;
          for (let i = 0; i < rows.length; i++) {
            if (!rows[i][0]) continue;
            let dateCell = rows[i][0];
            if (typeof dateCell === 'string' && dateCell.indexOf('/') !== -1) {
              try { dateCell = new Date(dateCell.replace(/\s*下午\s*/, ' ').replace(/\s*上午\s*/, ' ')); } catch (e) { continue; }
            } else {
              dateCell = new Date(dateCell);
            }
            if (isNaN(dateCell.getTime())) continue;
            const rowDateStr = Utilities.formatDate(dateCell, "GMT+8", "yyyy/MM/dd");
            const isToday = (rowDateStr === todayStr);
            const isRecent = dateCell.getTime() >= twoHoursAgo;
            if (isToday || isRecent) {
              let itemName = rows[i][2] || "";
              let qty = 1;
              if (itemName.includes(" x")) {
                let parts = itemName.split(" x");
                let q = parseInt(parts[parts.length - 1]);
                if (!isNaN(q) && q > 0) qty = q;
              }
              output.todaySales.push({
                time: rows[i][0], orderId: rows[i][11], itemName: itemName,
                itemId: rows[i][3], type: rows[i][4],
                salePrice: rows[i][5], cost: rows[i][6], profit: rows[i][7], person: rows[i][8],
                payMethod: rows[i][9], customer: rows[i][10], status: rows[i][12] || 'Completed',
                quantity: qty
              });
            }
          }
        }
      }
    } catch (e) {
      return JSON.stringify({ status: 'error', msg: '讀取今日流水失敗: ' + (e.message || '') });
    }

    return JSON.stringify(output);
  } catch (e) {
    return JSON.stringify({ status: 'error', msg: e.message || 'apiGetInventory 失敗' });
  }
}

// 2. 交易處理
function apiHandleTransaction(data) {
  try {
    const pSS = SpreadsheetApp.openById(PHONE_SS_ID);
    const aSS = SpreadsheetApp.openById(ACC_SS_ID);

    if (data.action === 'delete') {
      try {
        const dailySheet = pSS.getSheetByName("每日流水");
        if (!dailySheet) return JSON.stringify({ status: 'success' });
        const rows = dailySheet.getRange(1, 1, dailySheet.getLastRow(), 13).getValues();
        for (let i = 1; i < rows.length; i++) {
          if (rows[i][11] == data.orderId) {
            dailySheet.getRange(i + 1, 13).setValue('Deleted');
          }
        }
        SpreadsheetApp.flush();
      } catch (e) {
        writeLog("刪單失敗", data.person || "", e.message || "");
        return JSON.stringify({ status: 'error', msg: '刪單失敗: ' + (e.message || '') });
      }
      return JSON.stringify({ status: 'success' });
    }

    if (!data.action || data.action === 'checkout') {
      let qty = data.quantity || 1;
      let customerName = data.customer || "過路客";
      let logRemark = `${customerName} POS: ${data.orderId}`;

      try {
        const dailySheet = pSS.getSheetByName("每日流水");
        if (dailySheet) {
          let status = (data.payMethod === 'cash') ? 'Completed' : 'Pending';
          let displayName = data.itemName + (qty > 1 ? ` x${qty}` : "");
          dailySheet.appendRow([new Date(), "出庫", displayName, data.itemId, data.type, data.salePrice, data.cost, data.profit, data.person, data.payMethod, data.customer, data.orderId, status]);
        }
      } catch (e) {
        return JSON.stringify({ status: 'error', msg: '寫入流水失敗: ' + (e.message || '') });
      }

      if (data.type == 'phone' || data.type == 'peer_phone') {
        try {
          const outSheet = pSS.getSheetByName("二手機出貨紀錄");
          if (outSheet) outSheet.appendRow([new Date(), data.itemId, data.imei, data.customer + data.salePrice]);
          if (data.type == 'phone') {
            const stockSheet = pSS.getSheetByName("工作表1");
            const rows = stockSheet.getDataRange().getValues();
            for (let i = 1; i < rows.length; i++) { if (rows[i][0] == data.itemId) { stockSheet.getRange(i + 1, 15).setValue("已售出"); break; } }
          }
        } catch (e) { }
      }
      if (data.type == 'new_phone') { try { const newSheet = pSS.getSheetByName("新機出貨紀錄"); if (newSheet) newSheet.appendRow([new Date(), data.itemId, data.imei, data.customer + data.salePrice]); } catch (e) { } }
      if (data.type == 'repair') {
        try { const repairSheet = pSS.getSheetByName("維修紀錄"); if (repairSheet) repairSheet.appendRow([new Date(), data.modelName, data.imei, data.reason, data.customer, "", data.salePrice, data.reason, "完修結案"]); } catch (e) { }
        if (data.isStockBattery) { try { const logSheet = aSS.getSheetByName("進出庫流水帳"); if (logSheet) logSheet.appendRow([Utilities.getUuid().slice(0, 8), data.batteryCat || "電池", data.itemName, new Date(), "出庫", 1, "維修: " + logRemark]); } catch (e) { } }
      }
      if (data.type == 'accessory') { try { const logSheet = aSS.getSheetByName("進出庫流水帳"); if (logSheet) logSheet.appendRow([Utilities.getUuid().slice(0, 8), data.category || "配件", data.itemId || data.itemName, new Date(), "出庫", qty, logRemark]); } catch (e) { } }
      SpreadsheetApp.flush();
    }
    else if (data.action === 'settle') {
      try {
        const dailySheet = pSS.getSheetByName("每日流水");
        const rows = dailySheet.getRange(1, 1, dailySheet.getLastRow(), 13).getValues();
        for (let i = 1; i < rows.length; i++) {
          if (rows[i][11] == data.orderId) {
            dailySheet.getRange(i + 1, 13).setValue("Completed");
          }
        }
        SpreadsheetApp.flush();
      } catch (e) {
        return JSON.stringify({ status: 'error', msg: '入帳失敗: ' + (e.message || '') });
      }
    }
    else if (data.action === 'return') {
      try {
        const dailySheet = pSS.getSheetByName("每日流水");
        const rows = dailySheet.getValues();
        for (let i = rows.length - 1; i >= 1; i--) {
          if (rows[i][11] == data.orderId) {
            dailySheet.getRange(i + 1, 13).setValue("Returned");
            let itemType = rows[i][4], itemId = rows[i][3], itemName = rows[i][2], customer = rows[i][10];
            let cleanName = itemName.replace(" (贈)", "").split(" x")[0];
            if (itemType === 'phone') {
              const stockSheet = pSS.getSheetByName("工作表1"); const sRows = stockSheet.getValues();
              for (let j = 1; j < sRows.length; j++) { if (sRows[j][0] == itemId) { stockSheet.getRange(j + 1, 15).setValue("庫存中"); const outSheet = pSS.getSheetByName("二手機出貨紀錄"); if (outSheet) { const oRows = outSheet.getValues(); for (let k = oRows.length - 1; k >= 1; k--) { if (oRows[k][1] == itemId) { outSheet.deleteRow(k + 1); break; } } } break; } }
            }
            if (itemType === 'accessory' || (itemType === 'repair' && itemName.includes("電池"))) {
              const aSheet = aSS.getSheetByName("庫存清單");
              const aRows = aSheet ? aSheet.getDataRange().getValues() : [];
              let category = "配件";
              cleanName = cleanName.replace(/^\(維\)\s*維修:庫存電池\s*/, "").replace(/^\(配\)\s*/, "").replace(/^\(二\)\s*/, "").replace(/^\(包\)\s*/, "").trim();
              for (let k = 1; k < aRows.length; k++) {
                if (aRows[k][3] && cleanName.includes(aRows[k][3])) {
                  category = aRows[k][2];
                  break;
                }
              }
              let qty = 1;
              if (itemName.includes(" x")) {
                let parts = itemName.split(" x");
                let q = parseInt(parts[parts.length - 1]);
                if (!isNaN(q) && q > 0) qty = q;
              } else if (data.quantity != null && data.quantity !== '' && !isNaN(Number(data.quantity)) && Number(data.quantity) > 0) {
                qty = Number(data.quantity);
              }
              const logSheet = aSS.getSheetByName("進出庫流水帳");
              if (logSheet) logSheet.appendRow([Utilities.getUuid().slice(0, 8), category, cleanName, new Date(), "調整入庫", qty, `[退貨回補] 原客戶:${customer}`]);
            }
            break;
          }
        }
      } catch (e) {
        return JSON.stringify({ status: 'error', msg: '退貨失敗: ' + (e.message || '') });
      }
    }
    else if (data.action === 'reverse') {
      try {
        const dailySheet = pSS.getSheetByName("每日流水"); const rows = dailySheet.getValues(); let rowsToDelete = [];
        for (let i = 1; i < rows.length; i++) {
          if (rows[i][11] == data.orderId) {
            let itemType = rows[i][4];
            if (itemType === 'phone') { let phoneId = rows[i][3]; const stockSheet = pSS.getSheetByName("工作表1"); const sRows = stockSheet.getValues(); for (let j = 1; j < sRows.length; j++) { if (sRows[j][0] == phoneId) { stockSheet.getRange(j + 1, 15).setValue("庫存中"); break; } } }
            let itemName = rows[i][2]; if (itemType === 'accessory') { const logSheet = aSS.getSheetByName("進出庫流水帳"); if (logSheet) logSheet.appendRow([Utilities.getUuid().slice(0, 8), "衝正", itemName, new Date(), "調整入庫", 1, "衝正補回: " + data.orderId]); }
            rowsToDelete.push(i + 1);
          }
        }
        for (let i = rowsToDelete.length - 1; i >= 0; i--) dailySheet.deleteRow(rowsToDelete[i]);
      } catch (e) {
        return JSON.stringify({ status: 'error', msg: '衝正失敗: ' + (e.message || '') });
      }
    }

    return JSON.stringify({ status: 'success' });
  } catch (e) {
    if (data.person) writeLog("交易失敗", data.person, e.message || "");
    return JSON.stringify({ status: 'error', msg: e.message || '交易處理失敗' });
  }
}

// 整筆結帳：一次接收整筆訂單，後端迴圈寫入（減少來回次數）
// 配件庫存以「進出庫流水帳」為準；庫存清單 H 欄由試算表公式回算，不在此寫入。
function apiCheckoutOrder(data) {
  const pSS = SpreadsheetApp.openById(PHONE_SS_ID);
  const aSS = SpreadsheetApp.openById(ACC_SS_ID);
  const orderId = data.orderId || ("ORD" + Date.now().toString().slice(-6));
  const customer = data.customer || "過路客";
  const payMethod = data.payMethod || "cash";
  const person = data.person || "";
  const items = data.items || [];
  if (items.length === 0) return JSON.stringify({ status: 'error', msg: '無品項' });
  try {
    let dailySheet = pSS.getSheetByName("每日流水");
    if (!dailySheet) {
      dailySheet = pSS.insertSheet("每日流水");
      dailySheet.appendRow(["日期時間", "類型", "品名", "品項編號", "交易類型", "售價", "成本", "淨利", "經手人", "付款方式", "客戶", "訂單編號", "狀態"]);
    }
    const status = (payMethod === 'cash') ? 'Completed' : 'Pending';
    const logRemark = `${customer} POS: ${orderId}`;
    const now = new Date();
    const dateStr = Utilities.formatDate(now, "GMT+8", "M/d");
    var dailyRows = [];
    var stockLogRows = [];
    var invSheet = aSS.getSheetByName("庫存清單");
    var invRows = invSheet ? invSheet.getDataRange().getValues() : [];
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const qty = it.quantity || 1;
      const displayName = (it.itemName || "") + (qty > 1 ? " x" + qty : "");
      dailyRows.push([now, "出庫", displayName, it.itemId, it.type, it.salePrice, it.cost, it.profit, person, payMethod, customer, orderId, status]);
      if (it.type === 'phone' || it.type === 'peer_phone') {
        try {
          const outSheet = pSS.getSheetByName("二手機出貨紀錄");
          if (outSheet) {
            const rowCustomer = it.customer || customer;
            // 欄位：日期、編號、IMEI、客戶價格（與試算表抬頭一致）
            if (it.type === 'peer_phone' && it.dealerName != null && it.dealerName !== '') {
              outSheet.appendRow([dateStr, it.dealerName + it.cost, it.imei || "", rowCustomer + it.salePrice]);
            } else {
              outSheet.appendRow([dateStr, it.itemId, it.imei || "", rowCustomer + it.salePrice]);
            }
          }
          if (it.type === 'phone') {
            const stockSheet = pSS.getSheetByName("工作表1");
            if (stockSheet) {
              const rows = stockSheet.getDataRange().getValues();
              for (let r = 1; r < rows.length; r++) {
                if (rows[r][0] == it.itemId) { stockSheet.getRange(r + 1, 15).setValue("已售出"); break; }
              }
            }
          }
        } catch (e) { }
      }
      if (it.type === 'new_phone') {
        try {
          const newSheet = pSS.getSheetByName("新機出貨紀錄");
          if (newSheet) newSheet.appendRow([dateStr, (it.dealerName || "") + it.cost, it.imei || "", (it.customer || customer) + it.salePrice]);
        } catch (e) { }
      }
      if (it.type === 'repair') {
        try { const repairSheet = pSS.getSheetByName("維修紀錄"); if (repairSheet) repairSheet.appendRow([now, it.modelName || "", it.imei || "", it.reason || "", customer, "", it.salePrice, it.reason || "", "完修結案"]); } catch (e) { }
        if (it.isStockBattery) {
          let cleanBatteryName = (it.itemName || "").replace(/^\(維\)\s*維修:庫存電池\s*/, "").trim();
          if (!cleanBatteryName) cleanBatteryName = it.itemName || "";
          stockLogRows.push([Utilities.getUuid().slice(0, 8), it.batteryCat || "電池", cleanBatteryName, now, "出庫", 1, "維修: " + logRemark]);
        }
      }
      if (it.type === 'accessory') {
        stockLogRows.push([Utilities.getUuid().slice(0, 8), it.category || "配件", it.itemId || it.itemName || "", now, "出庫", qty, logRemark]);
        if (invSheet && invRows.length > 1) {
          const wantId = it.itemId != null ? String(it.itemId).trim() : "";
          const wantName = (it.itemName || "").replace(/^(\(配\)|\(二\)|\(維\)|\(包\))\s*/, "").replace(/\s*\(贈\)\s*/, "").replace(/\s*x\d+$/i, "").trim();
          for (let r = 1; r < invRows.length; r++) {
            const rowId = String(invRows[r][0] != null ? invRows[r][0] : "").trim();
            const rowName = String(invRows[r][3] != null ? invRows[r][3] : "").trim();
            const matchById = wantId && (rowId === wantId || rowId === String(Number(wantId)) || String(Number(rowId)) === wantId);
            const matchByName = wantName && (rowName === wantName || rowName.indexOf(wantName) !== -1 || wantName.indexOf(rowName) !== -1);
            if (matchById || matchByName) {
              const currentStock = Number(invRows[r][7]);
              const newStock = Math.max(0, (isNaN(currentStock) ? 0 : currentStock) - qty);
              invRows[r][7] = newStock;
              break;
            }
          }
        }
      }
    }
    if (dailyRows.length > 0) {
      const lastR = dailySheet.getLastRow();
      dailySheet.getRange(lastR + 1, 1, dailyRows.length, 13).setValues(dailyRows);
    }
    const logSheet = aSS.getSheetByName("進出庫流水帳");
    if (logSheet && stockLogRows.length > 0) {
      const logLast = logSheet.getLastRow();
      logSheet.getRange(logLast + 1, 1, stockLogRows.length, 7).setValues(stockLogRows);
    }
    SpreadsheetApp.flush();
    return JSON.stringify({ status: 'success' });
  } catch (e) {
    writeLog("結帳失敗", person, e.message || "");
    return JSON.stringify({ status: 'error', msg: e.message || '結帳寫入失敗' });
  }
}

// 只讀今日流水（輕量，結帳後更新今日帳務用）
function apiGetTodaySalesOnly() {
  var todaySales = [];
  try {
    var pSS = SpreadsheetApp.openById(PHONE_SS_ID);
    var dailySheet = pSS.getSheetByName("每日流水");
    if (dailySheet) {
      var lastRow = dailySheet.getLastRow();
      if (lastRow >= 1) {
        var startRow = Math.max(1, lastRow - 1999);
        var rows = dailySheet.getRange(startRow, 1, lastRow, 13).getValues();
        var now = new Date();
        var todayStr = Utilities.formatDate(now, "GMT+8", "yyyy/MM/dd");
        var twoHoursAgo = now.getTime() - 2 * 60 * 60 * 1000;
        for (var i = 0; i < rows.length; i++) {
          if (!rows[i][0]) continue;
          var dateCell = rows[i][0];
          if (typeof dateCell === 'string' && dateCell.indexOf('/') !== -1) {
            try { dateCell = new Date(dateCell.replace(/\s*下午\s*/, ' ').replace(/\s*上午\s*/, ' ')); } catch (e) { continue; }
          } else {
            dateCell = new Date(dateCell);
          }
          if (isNaN(dateCell.getTime())) continue;
          var rowDateStr = Utilities.formatDate(dateCell, "GMT+8", "yyyy/MM/dd");
          var isToday = (rowDateStr === todayStr);
          var isRecent = dateCell.getTime() >= twoHoursAgo;
          if (isToday || isRecent) {
            let itemName = rows[i][2] || "";
            let qty = 1;
            if (itemName.includes(" x")) {
              let parts = itemName.split(" x");
              let q = parseInt(parts[parts.length - 1]);
              if (!isNaN(q) && q > 0) qty = q;
            }
            todaySales.push({
              time: rows[i][0], orderId: rows[i][11], itemName: itemName,
              itemId: rows[i][3], type: rows[i][4],
              salePrice: rows[i][5], cost: rows[i][6], profit: rows[i][7], person: rows[i][8],
              payMethod: rows[i][9], customer: rows[i][10], status: rows[i][12] || 'Completed',
              quantity: qty
            });
          }
        }
      }
    }
    return JSON.stringify({ todaySales: todaySales });
  } catch (e) {
    return JSON.stringify({ status: 'error', msg: e.message || '', todaySales: [] });
  }
}

// 3. API & Tools
function apiGetHistory(s, e) { let h = []; try { const ss = SpreadsheetApp.openById(PHONE_SS_ID); const sh = ss.getSheetByName("每日流水"); if (sh) { const d = sh.getDataRange().getValues(); let sd = new Date(s); sd.setHours(0, 0, 0, 0); let ed = new Date(e); ed.setHours(23, 59, 59, 999); for (let i = 1; i < d.length; i++) { if (!d[i][0]) continue; let rd = new Date(d[i][0]); if (rd >= sd && rd <= ed) h.push({ time: d[i][0], orderId: d[i][11], itemName: d[i][2], itemId: d[i][3], type: d[i][4], salePrice: d[i][5], cost: d[i][6], profit: d[i][7], person: d[i][8], payMethod: d[i][9], customer: d[i][10], status: d[i][12] || 'Completed' }); } } } catch (err) { } return JSON.stringify(h); }
function apiGetPendingOrders() { let o = []; try { const ss = SpreadsheetApp.openById(PHONE_SS_ID); const sh = ss.getSheetByName("每日流水"); if (sh) { const d = sh.getDataRange().getValues(); for (let i = 1; i < d.length; i++) { if (d[i][12] === 'Pending') o.push({ time: d[i][0], orderId: d[i][11], itemName: d[i][2], itemId: d[i][3], type: d[i][4], salePrice: d[i][5], cost: d[i][6], profit: d[i][7], person: d[i][8], payMethod: d[i][9], customer: d[i][10], status: d[i][12] }); } } } catch (e) { } return JSON.stringify(o); }
function apiHandleRestock(data) { const pSS = SpreadsheetApp.openById(PHONE_SS_ID); const aSS = SpreadsheetApp.openById(ACC_SS_ID); try { const dailySheet = pSS.getSheetByName("每日流水"); const stockSheet = aSS.getSheetByName("進出庫流水帳"); const isReturn = (data.orderId || "").indexOf("ORD") === 0; data.items.forEach(item => { let totalCost = item.cost * item.quantity; let itemName = item.name; if (dailySheet && !isReturn) dailySheet.appendRow([new Date(), "支出", itemName, "", item.type, 0, totalCost, -totalCost, data.person, "cash", "廠商/雜支", data.orderId, "Completed"]); if (item.type === 'restock' && stockSheet) { let transType = isReturn ? "調整入庫" : "入庫"; let remark = isReturn ? `[退貨回補] ${data.orderId}` : `進貨: ${data.orderId}`; let qty = Number(item.quantity) || 1; stockSheet.appendRow([Utilities.getUuid().slice(0, 8), item.category || "進貨", item.name, new Date(), transType, qty, remark]); } }); SpreadsheetApp.flush(); } catch (e) { writeLog("進貨失敗", data.person || "", e.message || ""); return JSON.stringify({ status: 'error', msg: e.message || '進貨寫入失敗' }); } return JSON.stringify({ status: 'success' }); }
function apiAddCompanyTemplate(name, cost, price) { try { const ss = SpreadsheetApp.openById(ACC_SS_ID); let sheet = ss.getSheetByName("公司配件設定"); if (!sheet) { sheet = ss.insertSheet("公司配件設定"); sheet.appendRow(["品名", "成本", "建議售價"]); } sheet.appendRow([name, cost, price]); return "SUCCESS"; } catch (e) { return "ERROR"; } }
function apiChangePhoneStatus(id, s) { const ss = SpreadsheetApp.openById(PHONE_SS_ID); const sh = ss.getSheetByName("工作表1"); const d = sh.getDataRange().getValues(); let ns = (s === "庫存中") ? "客訂中" : "庫存中"; for (let i = 1; i < d.length; i++) { if (d[i][0] == id) { sh.getRange(i + 1, 15).setValue(ns); return "SUCCESS"; } } return "FAIL"; }
function autoBackupSheet() { const ss = SpreadsheetApp.getActiveSpreadsheet(); const n = `POS備份_${ss.getName()}_${Utilities.formatDate(new Date(), "GMT+8", "yyyyMMdd_HHmm")}`; DriveApp.getFileById(ss.getId()).makeCopy(n); }

function apiUpdateAccessory(id, newCost, newPrice) {
  try {
    const ss = SpreadsheetApp.openById(ACC_SS_ID);
    const sheet = ss.getSheetByName("庫存清單");
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] == id) {
        sheet.getRange(i + 1, 5).setValue(Number(newCost));
        sheet.getRange(i + 1, 9).setValue(Number(newPrice));
        return "SUCCESS";
      }
    }
    return "FAIL";
  } catch (e) {
    return "ERROR";
  }
}