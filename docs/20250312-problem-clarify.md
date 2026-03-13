# Blank Page Problem Clarification

## 1. What is pos-backend?

pos-backend = Backend API server, deployed on Railway.
- Provides: login, inventory, checkout, transaction, restock, today-sales, pending, history, peer-ledger, etc.
- Frontend calls it via fetch(API_BASE_URL + '/...')
- API: https://web-production-4ab5e4.up.railway.app/api

Since POS/cashier page works, the backend is reachable.

## 2. Data source for the 4 blank pages

| Page | Data Source | If no data |
|------|-------------|------------|
| Pending | API /pending | Title + "no data" or "load failed" |
| History | API /history | Title, date picker, stats, list area |
| Report | API /today-sales, local DB | Title, stats, list |
| Restock | API /inventory (DB.inv) | Tabs, search, grid |
| **Setting** | **Pure static HTML, no API** | Title, sync btn, company template, version, logout |

## 3. Conclusion: NOT missing data

Setting page is 100% static. If it shows blank, the problem is layout/CSS, not backend or data.

## 4. Likely cause

Layout/CSS issue - the view-sections (with initial `hidden`) may have height 0 or wrong display when shown after switchView().
