# 內部 POS 專案架構與部署

## 專案總覽

| 層級 | 說明 | GitHub | 本機路徑 | 部署 |
|------|------|--------|----------|------|
| **前端** | 收銀介面 (HTML/JS) | jun821007/pos-frontend-phone | /Users/apple/Desktop/pos | Netlify → pos-jun.netlify.app |
| **後端** | API 橋接 (Node) | jun821007/pos-backend | /Users/apple/Desktop/pos-backend | Railway |
| **資料** | 庫存／流水／帳號 | — | Google Sheets（試算表） | — |

---

## 開發與部署流程

1. 在本機修改程式（前端在 pos、後端在 pos-backend）
2. git add、git commit、git push
3. Netlify（前端）與 Railway（後端）會自動部署

---

## 登入與權限

需具備：Netlify（前端與網域 pos-jun.netlify.app）、Railway（後端 API）、Google（試算表／服務帳號與試算表共用）。

---

## 相關文件

- API_CONFIG.md — 前端 API URL 設定
- DEPLOY_FRONTEND.md — 前端部署方式
- DEPLOY_UPDATE.md — 更新部署（保持網址不變）
