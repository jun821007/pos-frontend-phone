# 空白頁問題 — 專案整體檢查報告
> 2025-03-13

## 一、專案架構
- 前端: pos/ 單頁 index.html，Tailwind CDN，部署 Netlify
- 切換: switchView 用 hidden class 切換 view-section
- 權限: initSystem 隱藏 nav 按鈕，view 都存在

## 二、結構對比
- view-pos: 無 hidden，結構複雜 → 正常
- view-peer: 有 hidden → 正常
- 有問題的: view-report, pending, history, restock, setting → 皆有 hidden，結構較單純

## 三、可能根因
1. 手機 Flex: 從 display:none 切到 display:flex 時，高度可能未正確重算
2. 多個 flex-1 同層，隱藏用 display:none，可見 view 被算成 0 高

## 四、建議修復
A. 強制 reflow: switchView 中 ev.classList.remove('hidden') 後加 ev.offsetHeight
B. 還原 view-setting 為備份的單層結構
C. 改用 visibility 代替 display
