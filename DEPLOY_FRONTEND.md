# 前端部署指南

## 目前狀態
- ✅ 後端已部署到 Railway：`https://web-production-4ab5e4.up.railway.app`
- ❌ 前端還是本地檔案，需要部署到網路上

## 最簡單的部署方式（3 種選擇）

### 方式 1：Netlify Drop（最簡單，推薦）

1. **打開 Netlify Drop**
   - 訪問：https://app.netlify.com/drop
   - 或訪問：https://drop.netlify.com

2. **拖放檔案**
   - 直接將 `index.html` 檔案拖放到頁面上
   - 等待上傳完成（幾秒鐘）

3. **獲得網址**
   - Netlify 會自動生成一個網址，例如：`https://random-name-123.netlify.app`
   - 這個網址就是你的 POS 系統網址！

4. **完成**
   - 現在可以用這個網址在任何地方訪問你的 POS 系統了

**優點：**
- 完全免費
- 不需要註冊（可以選擇註冊以獲得自訂域名）
- 幾秒鐘就能完成
- 自動 HTTPS

---

### 方式 2：Vercel（也很簡單）

1. **打開 Vercel**
   - 訪問：https://vercel.com
   - 點擊 "Deploy" 或 "Get Started"

2. **上傳檔案**
   - 選擇 "Upload" 或直接拖放 `index.html`

3. **獲得網址**
   - Vercel 會自動生成網址

**優點：**
- 完全免費
- 速度快
- 自動 HTTPS

---

### 方式 3：GitHub Pages（需要 Git）

如果你想要更正式的方式：

1. **創建 GitHub 倉庫**
   ```bash
   cd /Users/apple/Desktop/pos
   git init
   git add index.html
   git commit -m "Initial commit: POS Frontend"
   ```

2. **推送到 GitHub**
   - 在 GitHub 創建新倉庫
   - 推送代碼

3. **啟用 GitHub Pages**
   - 在倉庫設定中啟用 GitHub Pages
   - 選擇 `main` 分支和 `/` 根目錄

4. **獲得網址**
   - 網址格式：`https://你的用戶名.github.io/pos/`

---

## 推薦：使用 Netlify Drop

**步驟：**
1. 打開 https://app.netlify.com/drop
2. 將 `index.html` 拖放到頁面上
3. 等待幾秒鐘
4. 複製生成的網址
5. 完成！

**就是這麼簡單！**

---

## 部署後檢查

部署完成後，請：
1. 打開部署的網址
2. 嘗試登入（帳號：`a001`，密碼：`zz572356`）
3. 測試主要功能是否正常

如果有問題，檢查瀏覽器 Console（F12）是否有錯誤。
