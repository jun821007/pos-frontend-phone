# 如何更新部署（保持網址不變）

## 重要：保持網址不變的方法

### 方法 1：在 Netlify Dashboard 中更新（推薦）

如果你已經在 Netlify 建立了專案：

1. **登入 Netlify**
   - 訪問：https://app.netlify.com
   - 使用你的帳號登入

2. **找到你的專案**
   - 在 Dashboard 中找到你的 POS 專案
   - 點擊進入專案

3. **更新部署**
   - 在專案頁面中，找到 "Production deploys" 區域
   - 將更新後的 `index.html` 拖放到這個區域
   - **網址不會改變！** 還是同一個 `xxxxx.netlify.app`

4. **完成**
   - 等待幾秒鐘部署完成
   - 重新整理網頁即可看到更新

---

### 方法 2：使用 GitHub Pages（最穩定）

如果你想要一個永遠不變的網址：

1. **創建 GitHub 倉庫**
   ```bash
   cd /Users/apple/Desktop/pos
   git init
   git add index.html
   git commit -m "POS Frontend"
   ```

2. **推送到 GitHub**
   - 在 GitHub 創建新倉庫（例如：`pos-frontend`）
   - 推送代碼：
   ```bash
   git remote add origin https://github.com/你的用戶名/pos-frontend.git
   git branch -M main
   git push -u origin main
   ```

3. **啟用 GitHub Pages**
   - 在 GitHub 倉庫中：Settings → Pages
   - Source: Deploy from a branch
   - Branch: main, folder: / (root)
   - 儲存

4. **獲得網址**
   - 網址：`https://你的用戶名.github.io/pos-frontend/`
   - **這個網址永遠不會變！**

5. **更新時**
   - 修改 `index.html`
   - 推送更新：
   ```bash
   git add index.html
   git commit -m "Update"
   git push
   ```
   - 幾分鐘後自動更新，網址不變

---

### 方法 3：Netlify 專案（需要註冊）

1. **登入 Netlify**
   - 訪問：https://app.netlify.com
   - 註冊/登入

2. **創建新專案**
   - 點擊 "Add new site" → "Deploy manually"
   - 拖放 `index.html`
   - 設定專案名稱（例如：`pos-system`）

3. **獲得固定網址**
   - 網址：`https://pos-system.netlify.app`
   - **這個網址不會變！**

4. **更新時**
   - 進入專案 → "Production deploys"
   - 拖放新的 `index.html`
   - 網址保持不變

---

## 推薦方案

**如果你已經用 Netlify Drop 部署了：**

1. **登入 Netlify**（如果還沒登入）
2. **找到你的專案**（在 Dashboard 中）
3. **以後更新時**：在同一個專案中拖放新的 `index.html`
4. **網址不會變！**

**或者改用 GitHub Pages：**
- 網址更穩定
- 更新更方便（推送代碼即可）
- 完全免費

---

## 注意事項

- **Netlify Drop**：每次拖放可能產生新網址（除非登入並在同一個專案中更新）
- **Netlify 專案**：網址固定，可以持續更新
- **GitHub Pages**：網址固定，更新最方便
