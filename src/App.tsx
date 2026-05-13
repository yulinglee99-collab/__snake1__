/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Trophy, Play, RotateCcw, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import { Point, Direction, GameStatus } from './types';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  GRID_SIZE,
  ROWS,
  COLS,
  INITIAL_SNAKE_LENGTH,
  INITIAL_SPEED,
  SPEED_INCREMENT,
  COLORS,
} from './constants';

export default function App() {
  // 遊戲狀態
  const [snake, setSnake] = useState<Point[]>([]);
  const [food, setFood] = useState<Point>({ x: 10, y: 10 });
  const [direction, setDirection] = useState<Direction>(Direction.RIGHT);
  const [status, setStatus] = useState<GameStatus>(GameStatus.IDLE);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [speed, setSpeed] = useState(INITIAL_SPEED);

  // Canvas 引用
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // 記錄下一幀的方向，防止在同一幀內快速轉向 180 度導致自殺
  const nextDirection = useRef<Direction>(Direction.RIGHT);

  // 隨機生成食物 (穩定版)
  const spawnFood = useCallback((currentSnake: Point[]) => {
    let newFood: Point;
    let attempts = 0;
    while (attempts < 1000) {
      newFood = {
        x: Math.floor(Math.random() * COLS),
        y: Math.floor(Math.random() * ROWS),
      };
      const onSnake = currentSnake.some((s) => s.x === newFood.x && s.y === newFood.y);
      if (!onSnake) {
        setFood(newFood);
        return;
      }
      attempts++;
    }
  }, []);

  // 初始化遊戲狀態，從 LocalStorage 讀取最高分
  useEffect(() => {
    const savedHighScore = localStorage.getItem('snake-high-score');
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore, 10));
    }
  }, []);

  // 遊戲結束邏輯
  const gameOver = useCallback(() => {
    setStatus(GameStatus.GAME_OVER);
    setScore(currentScore => {
      setHighScore(prevHighScore => {
        if (currentScore > prevHighScore) {
          localStorage.setItem('snake-high-score', currentScore.toString());
          return currentScore;
        }
        return prevHighScore;
      });
      return currentScore;
    });
  }, []);

  // 初始化遊戲
  const initGame = useCallback(() => {
    const initialSnake: Point[] = [];
    for (let i = 0; i < INITIAL_SNAKE_LENGTH; i++) {
       initialSnake.push({ x: INITIAL_SNAKE_LENGTH - i, y: Math.floor(ROWS / 2) });
    }
    setSnake(initialSnake);
    setDirection(Direction.RIGHT);
    nextDirection.current = Direction.RIGHT;
    
    // 初始食物生成
    let firstFood: Point;
    while (true) {
      firstFood = {
        x: Math.floor(Math.random() * COLS),
        y: Math.floor(Math.random() * ROWS),
      };
      if (!initialSnake.some(s => s.x === firstFood.x && s.y === firstFood.y)) break;
    }
    setFood(firstFood);
    
    setScore(0);
    setSpeed(INITIAL_SPEED);
    setStatus(GameStatus.PLAYING);
  }, []);

  // 移動蛇 (優化版：解決食物消失與狀態同步問題)
  const moveSnake = useCallback(() => {
    if (status !== GameStatus.PLAYING) return;

    setSnake((prevSnake) => {
      if (prevSnake.length === 0) return prevSnake;

      const head = prevSnake[0];
      const newHead = { ...head };

      // 更新方向
      const currentDir = nextDirection.current;
      setDirection(currentDir);
      
      switch (currentDir) {
        case Direction.UP: newHead.y -= 1; break;
        case Direction.DOWN: newHead.y += 1; break;
        case Direction.LEFT: newHead.x -= 1; break;
        case Direction.RIGHT: newHead.x += 1; break;
      }

      // 檢查牆壁碰撞
      if (
        newHead.x < 0 ||
        newHead.x >= COLS ||
        newHead.y < 0 ||
        newHead.y >= ROWS
      ) {
        gameOver();
        return prevSnake;
      }

      // 檢查自身碰撞
      if (prevSnake.some((segment) => segment.x === newHead.x && segment.y === newHead.y)) {
        gameOver();
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // 檢查是否吃到食物
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore((s) => s + 10);
        setSpeed((prev) => Math.max(50, prev - SPEED_INCREMENT));
        
        // 立即計算新食物位置，避免使用舊狀態
        let nextFood: Point;
        let attempts = 0;
        while (attempts < 1000) {
          nextFood = {
            x: Math.floor(Math.random() * COLS),
            y: Math.floor(Math.random() * ROWS),
          };
          // 確保新食物不在當前（更新後的）蛇身上
          if (!newSnake.some(s => s.x === nextFood.x && s.y === nextFood.y)) {
            setFood(nextFood);
            break;
          }
          attempts++;
        }
      } else {
        newSnake.pop(); // 沒吃到食物，移除尾巴
      }

      return newSnake;
    });
  }, [status, food, gameOver]);

  // 監聽鍵盤事件 (支援 WASD 和方向鍵)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      switch (key) {
        case 'arrowup':
        case 'w':
          if (direction !== Direction.DOWN) nextDirection.current = Direction.UP;
          break;
        case 'arrowdown':
        case 's':
          if (direction !== Direction.UP) nextDirection.current = Direction.DOWN;
          break;
        case 'arrowleft':
        case 'a':
          if (direction !== Direction.RIGHT) nextDirection.current = Direction.LEFT;
          break;
        case 'arrowright':
        case 'd':
          if (direction !== Direction.LEFT) nextDirection.current = Direction.RIGHT;
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction]);

  // 遊戲迴圈
  useEffect(() => {
    if (status !== GameStatus.PLAYING) return;
    const intervalId = setInterval(moveSnake, speed);
    return () => clearInterval(intervalId);
  }, [status, moveSnake, speed]);

  // 繪製畫布
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 清除畫布
    ctx.fillStyle = COLORS.CANVAS_BG;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 繪製背景網格 (視覺輔助 - 使用點狀網格)
    ctx.fillStyle = COLORS.GRID;
    const dotSize = 1;
    for (let x = GRID_SIZE; x < CANVAS_WIDTH; x += GRID_SIZE) {
      for (let y = GRID_SIZE; y < CANVAS_HEIGHT; y += GRID_SIZE) {
        ctx.beginPath();
        ctx.arc(x, y, dotSize, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 當狀態不是 IDLE 時才繪製蛇和食物
    if (status !== GameStatus.IDLE) {
      // 繪製食物 (外發光效果)
      ctx.shadowBlur = 15;
      ctx.shadowColor = COLORS.FOOD;
      ctx.fillStyle = COLORS.FOOD;
      ctx.beginPath();
      ctx.arc(
        food.x * GRID_SIZE + GRID_SIZE / 2,
        food.y * GRID_SIZE + GRID_SIZE / 2,
        GRID_SIZE / 2 - 4,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.shadowBlur = 0;

      // 繪製蛇
      snake.forEach((segment, index) => {
        const isHead = index === 0;
        ctx.fillStyle = isHead ? COLORS.SNAKE_HEAD : COLORS.SNAKE_BODY;
        
        if (isHead) {
          ctx.shadowBlur = 20;
          ctx.shadowColor = COLORS.SNAKE_HEAD;
        } else {
          ctx.shadowBlur = 10;
          ctx.shadowColor = COLORS.SNAKE_BODY;
          ctx.globalAlpha = Math.max(0.2, 1 - index / (snake.length + 5));
        }

        const padding = 2;
        ctx.beginPath();
        ctx.roundRect(
          segment.x * GRID_SIZE + padding,
          segment.y * GRID_SIZE + padding,
          GRID_SIZE - padding * 2,
          GRID_SIZE - padding * 2,
          2
        );
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
        
        // 如果是蛇頭，畫眼睛
        if (isHead) {
          ctx.fillStyle = 'rgba(0,0,0,0.6)';
          const eyeSize = 3;
          const offset = 6;
          if (direction === Direction.RIGHT || direction === Direction.LEFT) {
            ctx.beginPath();
            ctx.arc(segment.x * GRID_SIZE + (direction === Direction.RIGHT ? 14 : 6), segment.y * GRID_SIZE + offset, eyeSize / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(segment.x * GRID_SIZE + (direction === Direction.RIGHT ? 14 : 6), segment.y * GRID_SIZE + GRID_SIZE - offset, eyeSize / 2, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.beginPath();
            ctx.arc(segment.x * GRID_SIZE + offset, segment.y * GRID_SIZE + (direction === Direction.DOWN ? 14 : 6), eyeSize / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(segment.x * GRID_SIZE + GRID_SIZE - offset, segment.y * GRID_SIZE + (direction === Direction.DOWN ? 14 : 6), eyeSize / 2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      });
    }
  }, [snake, food, status, direction]);

  return (
    <div className="h-screen w-screen bg-[#09090b] text-zinc-100 font-sans flex items-center justify-center overflow-hidden select-none tracking-tight">
      <div className="w-full max-w-[1024px] h-full max-h-[768px] flex flex-col bg-zinc-950 border border-zinc-800 shadow-2xl relative overflow-hidden">
        {/* Header Section */}
        <header className="h-20 border-b border-zinc-800/50 flex items-center justify-between px-10 bg-zinc-950/50 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-3 h-3 bg-green-500 rounded-full shadow-[0_0_12px_rgba(34,197,94,0.8)]"></div>
            <h1 className="text-xl font-bold tracking-widest uppercase italic text-zinc-300">Snake // 系統協定 v2.4</h1>
          </div>
          <div className="flex gap-12">
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold">當前得分</span>
              <span className="text-2xl font-mono text-green-400 leading-none">{score.toString().padStart(6, '0')}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold">最高紀錄</span>
              <span className="text-2xl font-mono text-zinc-400 leading-none">{highScore.toString().padStart(6, '0')}</span>
            </div>
          </div>
        </header>

        {/* Main Interface */}
        <main className="flex-1 flex p-6 gap-6 min-h-0">
          {/* Sidebar Controls */}
          <aside className="w-64 flex flex-col gap-6 shrink-0 h-full">
            <div className="flex-1 bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-6 flex flex-col overflow-hidden">
              <h2 className="text-[11px] uppercase tracking-widest text-zinc-500 mb-6 font-bold">命脈與診斷</h2>
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500 font-mono">成長速率</span>
                    <span className="text-green-500 font-mono">{Math.floor((snake.length / 50) * 100)}%</span>
                  </div>
                  <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (snake.length / 50) * 100)}%` }}
                      className="h-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500 font-mono">處理速度</span>
                    <span className="text-blue-500 font-mono">{Math.floor(((INITIAL_SPEED - speed) / INITIAL_SPEED) * 100)}%</span>
                  </div>
                  <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, ((INITIAL_SPEED - speed) / INITIAL_SPEED) * 100)}%` }}
                      className="h-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                    />
                  </div>
                </div>
              </div>
              
              <div className="mt-auto">
                <div className="p-4 border border-green-500/20 bg-green-500/5 rounded-lg font-mono text-[9px] leading-relaxed">
                  <p className="text-green-500/80 uppercase">
                    &gt; 系統狀態: {status === GameStatus.PLAYING ? '正常運作' : status === GameStatus.GAME_OVER ? '核心故障' : '等待指令'}
                    <br />&gt; 處理週期: {speed}ms
                    <br />&gt; 目標座標: [{food.x}, {food.y}]
                    <br />&gt; 碰撞偵測: 啟動中
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-4 shrink-0">
              <h3 className="text-[10px] uppercase tracking-widest text-zinc-500 mb-3 font-bold">操作綁定</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-zinc-950 border border-zinc-800 rounded flex flex-col items-center">
                  <span className="text-[9px] text-zinc-500 mb-1">向上</span>
                  <span className="text-xs font-mono">[{direction === Direction.UP ? '●' : 'W'}]</span>
                </div>
                <div className="p-2 bg-zinc-950 border border-zinc-800 rounded flex flex-col items-center">
                  <span className="text-[9px] text-zinc-500 mb-1">向左</span>
                  <span className="text-xs font-mono">[{direction === Direction.LEFT ? '●' : 'A'}]</span>
                </div>
                <div className="p-2 bg-zinc-950 border border-zinc-800 rounded flex flex-col items-center">
                  <span className="text-[9px] text-zinc-500 mb-1">向下</span>
                  <span className="text-xs font-mono">[{direction === Direction.DOWN ? '●' : 'S'}]</span>
                </div>
                <div className="p-2 bg-zinc-950 border border-zinc-800 rounded flex flex-col items-center">
                  <span className="text-[9px] text-zinc-500 mb-1">向右</span>
                  <span className="text-xs font-mono">[{direction === Direction.RIGHT ? '●' : 'D'}]</span>
                </div>
              </div>
            </div>
          </aside>

          {/* Game Canvas Rendering Area */}
          <div className="flex-1 relative bg-black rounded-2xl border-2 border-zinc-800/80 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex items-center justify-center p-4">
            {/* Grid Overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #262626 1px, transparent 0)', backgroundSize: '12px 12px' }}></div>
            
            <div className="relative">
              <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                className="block max-w-full h-auto rounded shadow-inner"
              />

              {/* Scanline Effect */}
              <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]"></div>

              {/* HUD Elements */}
              <div className="absolute top-2 left-2 flex gap-2 pointer-events-none">
                <div className="px-2 py-0.5 bg-zinc-950/80 border border-zinc-800 rounded text-[8px] font-mono tracking-tighter text-zinc-400">
                  座標: {status === GameStatus.PLAYING ? `${snake[0]?.x}, ${snake[0]?.y}` : '---, ---'}
                </div>
                <div className="px-2 py-0.5 bg-zinc-950/80 border border-zinc-800 rounded text-[8px] font-mono tracking-tighter text-blue-400">
                  狀態: {status === GameStatus.PLAYING ? '執行中' : status === GameStatus.GAME_OVER ? '終止' : '就緒'}
                </div>
              </div>

              {/* Overlays */}
              <AnimatePresence>
                {status !== GameStatus.PLAYING && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-zinc-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center rounded"
                  >
                    {status === GameStatus.IDLE ? (
                      <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        className="space-y-8"
                      >
                        <div className="space-y-3">
                          <h2 className="text-4xl font-black italic tracking-tighter text-white">
                            貪食蛇協定
                          </h2>
                          <div className="h-0.5 w-24 bg-green-500 mx-auto rounded-full shadow-[0_0_10px_#22c55e]"></div>
                          <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-mono">
                            身份驗證成功 / 等待輸入指令
                          </p>
                        </div>
                        
                        <button
                          onClick={initGame}
                          className="group relative inline-flex items-center gap-3 bg-white text-black px-10 py-4 rounded-full font-bold text-sm tracking-widest uppercase hover:bg-green-500 transition-all duration-300 active:scale-95"
                        >
                          <Play size={16} fill="currentColor" />
                          初始化系統
                        </button>
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ scale: 1.1, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="space-y-8"
                      >
                        <div className="space-y-2">
                          <h2 className="text-5xl font-black italic tracking-tighter text-rose-500">
                            核心故障
                          </h2>
                          <p className="text-rose-500/40 font-mono text-[9px] uppercase tracking-[0.3em]">
                            蛇體結構完整性已損毀
                          </p>
                        </div>

                        <div className="bg-black/60 border border-white/5 p-8 rounded-2xl flex gap-12 items-center justify-center">
                          <div className="text-center">
                            <p className="text-[9px] text-zinc-500 uppercase tracking-wider font-mono mb-1 text-zinc-400 font-bold">本次積分</p>
                            <p className="text-4xl font-mono leading-none tracking-tighter">{score}</p>
                          </div>
                          <div className="w-px h-10 bg-zinc-800"></div>
                          <div className="text-center">
                            <p className="text-[9px] text-zinc-500 uppercase tracking-wider font-mono mb-1 text-zinc-400 font-bold">最高紀錄</p>
                            <p className="text-2xl font-mono leading-tight text-green-500 tracking-tighter">{highScore}</p>
                          </div>
                        </div>
                        
                        <button
                          onClick={initGame}
                          className="inline-flex items-center gap-3 bg-rose-600 text-white px-10 py-4 rounded-full font-bold text-sm tracking-widest uppercase hover:bg-rose-500 transition-all duration-300 active:scale-95"
                        >
                          <RotateCcw size={16} />
                          重啟階段
                        </button>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="absolute bottom-4 right-4 pointer-events-none">
              <div className="px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-[9px] text-green-400 font-medium italic tracking-widest uppercase">
                即時數據流 v2
              </div>
            </div>
          </div>
        </main>

        {/* Footer Status */}
        <footer className="h-12 border-t border-zinc-800/50 bg-zinc-950/80 flex items-center px-10 justify-between shrink-0">
          <div className="flex gap-8 items-center">
            <div className="text-[10px] font-mono text-zinc-500">
              <span className="text-zinc-600 tracking-widest uppercase font-bold">引擎:</span> <span className="text-zinc-400">React 19 + motion</span>
            </div>
            <div className="text-[10px] font-mono text-zinc-500">
              <span className="text-zinc-600 tracking-widest uppercase font-bold">環境:</span> <span className="text-zinc-400">Vite + TS</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${status === GameStatus.PLAYING ? 'bg-green-500' : status === GameStatus.GAME_OVER ? 'bg-rose-500' : 'bg-blue-500'}`}></div>
            <span className="text-[10px] tracking-[0.2em] text-zinc-400 uppercase font-mono">
              {status === GameStatus.PLAYING ? '連線穩定' : '系統待命'}
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
