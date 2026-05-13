/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// 畫布寬高
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// 網格大小 (像素)
export const GRID_SIZE = 20;

// 計算網格中的行數與列數
export const ROWS = CANVAS_HEIGHT / GRID_SIZE;
export const COLS = CANVAS_WIDTH / GRID_SIZE;

// 遊戲初始值
export const INITIAL_SNAKE_LENGTH = 3;
export const INITIAL_SPEED = 150; // 毫秒 (越小越快)
export const SPEED_INCREMENT = 2; // 吃到食物後的加速度

// 顏色設定
export const COLORS = {
  BG: '#09090b',         // 整體背景
  CANVAS_BG: '#050505',  // 畫布背景
  GRID: '#1a1a1a',       // 網格點/線顏色
  SNAKE_HEAD: '#4ade80', // 蛇頭 (Green 400)
  SNAKE_BODY: '#22c55e', // 蛇身 (Green 500)
  FOOD: '#f43f5e',       // 食物 (Rose 500)
  TEXT_PRIMARY: '#f4f4f5', // 主要文字 (Zinc 100)
  TEXT_SECONDARY: '#71717a', // 次要文字 (Zinc 500)
  ACCENT: '#3b82f6',     // 藍色點綴 (Blue 500)
};
