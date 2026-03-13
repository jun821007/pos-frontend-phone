# 空白頁問題 — 整體結構分析

> 2025-03-13 暫停修改，先釐清根因

---

## 一、關鍵發現

### 正常 vs 異常的對照

| 分頁 | 有無被我們加 position:fixed | 結果 |
|------|---------------------------|------|
| 收銀 (view-pos) | **無** | 正常 |
| 同行 (view-peer) | **無** | 正常 |
| 未結、歷史、今日、進貨、設定 | **有** | 空白（getBoundingClientRect 0×0）|

**結論**：我們後來加的 `position: fixed` / `position: absolute` 規則，很可能是**造成**空白的原因，不是修復。

---

## 二、目前 CSS 結構（有問題的部分）

```css
/* 第 69-75 行 — 這整段可能是禍源 */
#view-pending:not(.hidden), #view-history:not(.hidden), #view-report:not(.hidden),
#view-restock:not(.hidden), #view-setting:not(.hidden), #view-category-sort:not(.hidden) {
    position: fixed !important; ...
    width: 100vw !important; height: calc(100dvh - 3.5rem) !important;
}
```

view-peer **沒有**被這段選到，所以同行維持原本 flex 佈局，可以正常顯示。

---

## 三、修復方案文件的原始建議

`空白頁-修復方案.md` 寫的是：

- **刪除** `.view-section:not(.hidden)` 那類「修復」規則
- **不要**再對 view 額外加 `flex: 1 1 0`、`overflow-y: auto` 等

我們後來反其道而行，加了 `position: absolute` / `position: fixed`，反而讓這些頁面變成 0×0。

---

## 四、建議的修正方向

**移除**上面那段 `position: fixed` 規則，讓這些 view 跟 view-peer 一樣，只用：

- `.view-section { display: flex; min-height: 0; }`
- `.view-section.hidden { display: none !important; }`
- 各自原有的 Tailwind：`flex-1 flex flex-col min-h-0`

也就是：**不要再對這些 view 做額外定位**，讓它們跟 view-peer 用同一套 flex 佈局。

---

## 五、自動登入說明

無痕模式下仍自動登入，可能是：

1. 該無痕分頁先前已登入，localStorage 在整個無痕工作階段中會保留
2. 或使用「在無痕視窗中開啟」時，部分狀態被帶過去

登入邏輯會檢查：`pos_user_v30`（保持登入）、`pos_last_user` + `pos_last_pass`（記住帳密）。  
若要完全乾淨測試：關閉所有無痕分頁後，重新開一個新的無痕視窗再打開網址。

---

## 六、下一步（暫不實作，等你決定）

建議先做：

1. **刪除** 第 69–75 行的 `position: fixed` 規則
2. 部署後再測：未結、歷史、今日、進貨、設定是否恢復顯示

若要保留「高度」相關設定（例如 `main` 的高度），也建議分開測試，避免一次動太多。
