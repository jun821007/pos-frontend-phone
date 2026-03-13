const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');
const toRemove = `        /* main 固定高度（桌機+手機），讓 flex 子元素可正確計算 */
        main { height: calc(100dvh - 3.5rem); min-height: 0; }
        /* 顯示中的 view-section 強制 flex 且佔滿空間（hidden 用 display:none 覆蓋） */
        .view-section { display: flex; min-height: 0; }
        .view-section.hidden { display: none !important; }
        /* 僅對「曾有空白問題」的 view 用絕對定位，明確給寬高避免 0x0 */
        #view-pending:not(.hidden), #view-history:not(.hidden), #view-report:not(.hidden),
        #view-restock:not(.hidden), #view-setting:not(.hidden), #view-category-sort:not(.hidden) {
            position: fixed !important; top: 3.5rem !important; left: 0 !important; right: 0 !important; bottom: 0 !important;
            width: 100vw !important; height: calc(100dvh - 3.5rem) !important; z-index: 5;
            flex-direction: column !important; overflow-y: auto !important; -webkit-overflow-scrolling: touch;
        }
        /* 捲動清單需 min-height:0 才不會在 flex 內塌陷 */
        #pending-list, #today-list, #history-list, #peer-list-body { min-height: 0; -webkit-overflow-scrolling: touch; }
        `;
h = h.replace(toRemove, '');
fs.writeFileSync('index.html', h);
console.log('Done');
