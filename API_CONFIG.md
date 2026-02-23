# 前端 API 配置說明

## 當前配置

前端 API URL 設定在 `index.html` 第 201 行：

```javascript
const API_BASE_URL = 'http://localhost:3001/api';
```

## 部署後更新

部署雲端後，需要將此 URL 改為你的後端部署 URL。

### 方式 1：直接修改（簡單）

找到 `index.html` 中的這行：
```javascript
const API_BASE_URL = 'http://localhost:3001/api';
```

改為：
```javascript
const API_BASE_URL = 'https://你的部署URL/api';
```

例如：
```javascript
const API_BASE_URL = 'https://pos-backend-production.up.railway.app/api';
```

### 方式 2：根據環境自動切換（推薦）

修改為：
```javascript
// 根據當前域名自動判斷環境
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE_URL = isLocalhost 
  ? 'http://localhost:3001/api'  // 本地開發
  : 'https://你的部署URL/api';     // 生產環境
```

### 方式 3：使用配置文件（最靈活）

建立 `config.js`：
```javascript
const CONFIG = {
  API_BASE_URL: window.location.hostname === 'localhost' 
    ? 'http://localhost:3001/api'
    : 'https://你的部署URL/api'
};
```

然後在 `index.html` 中引入：
```html
<script src="config.js"></script>
<script>
  const API_BASE_URL = CONFIG.API_BASE_URL;
  // ... 其餘代碼
</script>
```

---

## 測試 API 連線

部署後，打開瀏覽器開發者工具（F12），檢查：

1. **Network 標籤**：查看 API 請求是否成功
2. **Console 標籤**：查看是否有 CORS 錯誤

如果看到 CORS 錯誤，確認後端的 `cors()` 已啟用。

---

## 注意事項

- 確保後端 URL 正確（包含 `https://`）
- 確保後端路徑包含 `/api`（如果有的話）
- 本地測試時使用 `http://localhost:3001/api`
- 生產環境使用 `https://你的部署URL/api`
