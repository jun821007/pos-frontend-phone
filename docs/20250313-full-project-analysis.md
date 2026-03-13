# 空白頁問題 — 專案整體檢查報告

> 2025-03-13

---

## 一、專案架構

| 項目 | 說明 |
|------|------|
| **前端** | pos/，單頁 index.html，Tailwind CDN，部署 Netlify |
| **後端** | pos-backend/，Node + Express，部署 Railway |
| **切換邏輯** | switchView(v) 用 classList add/remove('hidden') 切換 view-section |
| **權限** | initSystem() 對非 admin 隱藏 d-nav-report/history/peer/pending（按鈕），view 本身都存在 |

---

## 二、問題時間線（依文件推斷）

1. **原始設計**：多個 view-section，用 `hidden` 切換，view-pos 預設顯示
2. **新增權限**：非 admin 時隱藏今日/歷史/同行/未結的 nav 按鈕（el.style.display='none'）
3. **空白頁出現**：手機版點 未結/歷史/進貨/設定 時內容區空白
4. **修復嘗試**：加 main 高度、.view-section 規則、position absolute/fixed，均無效或惡化
5. **目前狀態**：已移除所有「修復」CSS，問題仍存在

---

## 三、結構對比

### 3.1 各版本 main / body

| 版本 | body | main |
|------|------|------|
| index-from-751（較舊） | h-screen | flex-1 flex flex-col relative，無 min-h-0、無 pb-16 |
| 備份 20260312 | min-h-[100dvh] h-[100dvh] | 同左 + 手機 main height、view-section 規則 |
| 目前 | min-h-[100dvh] h-[100dvh] | flex-1 flex flex-col min-h-0 pb-16 md:pb-0 |

### 3.2 view 結構

| view | 共同點 | 差異 |
|------|--------|------|
| view-pos | flex-1 flex flex-col，無 hidden（預設顯示） | 內層有 h-full，md:flex-row |
| view-peer | hidden + flex-1 flex flex-col min-h-0 | 內層 peer-list-body 捲動 |
| view-report | 同上 | 內層 today-list 捲動 |
| view-pending | 同上 | 內層 pending-list |
| view-history | 同上 | 內層 history-list |
| view-restock | 同上 | 結構同 view-pos（h-full） |
| view-setting | 同上 | **目前**：外層 overflow-hidden + 內層 overflow-y-auto；**備份**：直接 overflow-y-auto |

---

## 四、已排除的可能性

1. **API/資料**：設定頁為靜態 HTML，與 API 無關
2. **switchView**：診斷顯示 hidden 已正確移除、display: flex
3. **我們加的 CSS**：移除 position absolute/fixed、main 高度、view-section 規則後，問題依舊

---

## 五、可能的根本原因

### 5.1 Flex 高度鏈在手機上的行為

- body: h-[100dvh]
- main: flex-1 flex flex-col min-h-0
- 子元素：header (shrink-0) + 多個 view-section（僅一個非 hidden）

部分手機瀏覽器在這種情境下，對「從 display:none 切換到 display:flex」的 flex 子元素，可能不會正確重算高度，導致高度為 0。

### 5.2 Tailwind CDN 的侷限

- 使用 CDN 時，只會產生 HTML 中出現的 utility
- 沒有自訂 `.view-section` 規則時，完全依賴 Tailwind
- 可能存在樣式順序或選擇器優先級問題

### 5.3 多個 flex-1 同層

- main 內有多個 view-section，皆為 flex-1
- 隱藏的用 display:none 移出排版
- 若某環境對「多個 flex 子、部分 display:none」處理不當，可能影響單一可見子元素的高度計算

---

## 六、建議的修復方向

### A. 改 HTML 結構：用單一 content 容器

把 view-section 放進單一 `#view-container`，避免多個 flex-1 同層：

```
main
  header
  div#view-container (flex-1 flex flex-col min-h-0 overflow-hidden)
    view-pos (或切換時只放一個 view 的內容)
    view-report
    ...
```

需要較大改動：switchView 改為置換 #view-container 的 children 或 innerHTML。

### B. 用 JS 強制 reflow

在 switchView 中，移除 hidden 後強制 reflow：

```javascript
ev.classList.remove('hidden');
ev.offsetHeight; // 或 requestAnimationFrame
```

先做低成本驗證。

### C. 改用 visibility 而非 display

- hidden：`visibility: hidden; height: 0; overflow: hidden`
- 顯示：`visibility: visible; height: auto`

元素始終在 DOM 中，僅改變可見性與高度，可能減少 flex 重算異常。

### D. 還原備份 HTML 結構，只做最小 CSS

把 view-setting 還原成備份的單層結構（直接 overflow-y-auto），再加上「不含 overflow-y:auto」的 view-section 規則做高度控制。

---

## 七、相關檔案

- pos/index.html（主檔）
- pos/index.html.20260312-2215（備份）
- pos/index-from-751.html（較舊版）
- pos/20250312/空白頁-修復方案.md
- pos/20250312/手機版空白頁-處理方式.md

---

## 八、建議下一步

1. 先試 **方案 B**：在 switchView 中加入 `ev.offsetHeight` 強制 reflow
2. 若無效，再試 **方案 D**：還原 view-setting 結構並加回精簡的 view-section 規則
3. 若仍無效，考慮 **方案 A**：重構為單一 content 容器
