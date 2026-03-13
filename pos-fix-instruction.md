# 手機 POS 修正指令

## 一、管理員可看的跟員工一樣

試算表「帳號」D 欄存 Y 時，後端回傳 role: "Y"，前端只判斷 role === 'admin'，導致管理員被當員工。

修正：後端 auth.js 將 D 欄 Y/admin 轉成 role: 'admin'；或前端改為 isAdmin = result.user.role === 'admin' || result.user.role === 'Y' || result.user.isAdmin === true

## 二、部分頁面空白

可能原因：API 回傳格式改變、view div 不存在、API 失敗無錯誤提示、手機 CSS 隱藏內容。確認 /inventory 回傳結構、各 view-xxx 元素存在、API 失敗時顯示錯誤。

## 三、管理員應見

收銀、今日、歷史、同行、未結、進貨、設定。員工僅：收銀、進貨、設定。

## 四、相關檔案

pos/index.html (doLogin initSystem)、pos-backend/src/services/auth.js
