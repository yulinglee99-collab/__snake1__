# 經典復古貪食蛇

這是一個使用 React、TypeScript 和 Canvas 打造的經典貪食蛇遊戲。專注於本地開發與遊玩，已清除 Google AI Studio 的額外設定檔與環境依賴。

## 本地運行

**必要條件:** Node.js

1. 安裝依賴:
   `npm install`
2. 啟動開發伺服器:
   `npm run dev`
3. 在瀏覽器打開:
   `http://localhost:3000`

## GitHub Pages 部署

本專案已設定 GitHub Actions 自動部署到 GitHub Pages。只要把程式碼 push 到 `main` 分支，Actions 會自動執行建置並部署 `dist` 資料夾到 `gh-pages` 分支。

預期 GitHub Pages 網址：
`https://<your-username>.github.io/__snake1__/`

## 專案說明

- `src/App.tsx`：遊戲邏輯與畫面呈現
- `src/constants.ts`：遊戲配置常數
- `src/types.ts`：遊戲類型定義
- `src/index.css`：TailwindCSS 風格樣式

## 清理內容

已移除以下 AI Studio 專用檔案與依賴：
- `metadata.json`
- `.env.example`
- `@google/genai`
- `express`
- `dotenv`
- `@types/express`
