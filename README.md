# 台北・城市探索指南

純 HTML、CSS、JavaScript 多頁網站，保留 1080 × 960 介面及等比例縮放，無 Nuxt 或 Vue 相依。

## 網站與首頁

https://janshawn.github.io/taipei-city-vision-exhibition-html/

根網址預設讀取 index.html，首頁導覽使用 ./，不需要加 /index。

| 介面 | 獨立檔案 |
| --- | --- |
| 首頁 | index.html |
| 精選景點 | attractions.html |
| 商圈資訊 | food.html |
| 旅遊推薦 | routes.html |
| 未來藍圖 | vision.html |

## 本機開發

安裝 Node.js 後，執行 `npm run dev` 或雙擊 start.cmd，開啟 http://127.0.0.1:4173/ 。無須 npm install 或建置。使用 fetch 讀取 JSON，請透過 HTTP 預覽，不要直接雙擊 HTML。

## JSON 資料

五個頁面直接讀取 `data/tourism.json`，沿用原始專案 public/tourism.json 的內容與結構；圖片使用 JSON 的官方網址。更新 JSON 即可，不需要同步 JavaScript 資料檔。

assets/js/common.js 以腳本網址解析 JSON 路徑，支援 GitHub Pages 子目錄。資料載入失敗時會顯示重試按鈕。

保留首頁精選、行政區篩選、每頁六筆、詳細介紹、QR Code、三條路線與願景投票。投票使用 taipei-vision-votes localStorage，僅保存在目前瀏覽器，不跨裝置同步。

## 部署

GitHub Settings → Pages → Source 選擇 GitHub Actions。推送 main 後，.github/workflows/pages.yml 會執行檢查，並部署 HTML、assets 與 data。

## 檢查

`npm run check` 驗證各頁連結、JSON 子目錄載入路徑、載入失敗處理、QR Code、篩選、分頁、路線及投票。互動檢查使用 DOM 替身，並非瀏覽器視覺驗證。

授權詳見 THIRD_PARTY_NOTICES.md。
