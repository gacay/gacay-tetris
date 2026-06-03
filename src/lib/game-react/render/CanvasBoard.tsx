"use client";

import { useEffect, useRef } from "react";
import {
  BUFFER_ROWS,
  COLS,
  getGhost,
  pieceCells,
  TOTAL_ROWS,
  VISIBLE_ROWS,
} from "@/lib/engine";
import { useTheme } from "@/lib/theme/useTheme";
import type { TetrisController } from "../useTetris";
import { drawCell, pieceColor, readPalette, roundRect, type Palette } from "./palette";

interface Flash {
  rows: number[];
  start: number;
}
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export function CanvasBoard({ controller }: { controller: TetrisController }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const paletteRef = useRef<Palette>(readPalette());
  const theme = useTheme((s) => s.theme);

  useEffect(() => {
    paletteRef.current = readPalette();
  }, [theme]);

  // The controller object is recreated every render; read it through a stable
  // ref so the draw loop below can be set up exactly once (its inner refs —
  // stateRef / visualQueueRef — are themselves stable).
  const controllerRef = useRef(controller);
  useEffect(() => {
    controllerRef.current = controller;
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let logicalW = 300;
    let logicalH = 600;
    let cell = 30;
    let dpr = 1;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      logicalW = rect.width;
      logicalH = rect.height;
      cell = logicalW / COLS;
      canvas.width = Math.max(1, Math.floor(logicalW * dpr));
      canvas.height = Math.max(1, Math.floor(logicalH * dpr));
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    const flashes: Flash[] = [];
    const particles: Particle[] = [];
    let shakeStart = -9999;
    let shakeMag = 0;
    let raf = 0;

    const draw = (now: number) => {
      const s = controllerRef.current.stateRef.current;
      const pal = paletteRef.current;

      // Consume visual events.
      const q = controllerRef.current.visualQueueRef.current;
      while (q.length) {
        const e = q.shift()!;
        if (e.type === "lineclear") {
          flashes.push({ rows: e.rows, start: now });
          for (const row of e.rows) {
            const screenRow = row - BUFFER_ROWS;
            for (let c = 0; c < COLS; c++) {
              const colorId = ((c + row) % 7) + 1;
              particles.push({
                x: (c + 0.5) * cell,
                y: (screenRow + 0.5) * cell,
                vx: (Math.random() - 0.5) * cell * 0.25,
                vy: -Math.random() * cell * 0.3 - cell * 0.05,
                life: 0,
                maxLife: 480 + Math.random() * 220,
                color: pieceColor(colorId, pal),
                size: cell * (0.18 + Math.random() * 0.16),
              });
            }
          }
        } else if (e.type === "harddrop") {
          shakeStart = now;
          shakeMag = Math.min(7, 1.5 + e.cells * 0.35);
        }
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, logicalW, logicalH);

      let oy = 0;
      const shakeT = now - shakeStart;
      if (shakeT < 130) {
        oy = Math.sin(shakeT / 11) * shakeMag * (1 - shakeT / 130);
      }
      ctx.save();
      ctx.translate(0, oy);

      // Board background.
      roundRect(ctx, 0, 0, logicalW, logicalH, cell * 0.25);
      ctx.fillStyle = pal.board;
      ctx.fill();

      // Grid lines.
      ctx.strokeStyle = pal.grid;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let c = 1; c < COLS; c++) {
        ctx.moveTo(c * cell, 0);
        ctx.lineTo(c * cell, logicalH);
      }
      for (let r = 1; r < VISIBLE_ROWS; r++) {
        ctx.moveTo(0, r * cell);
        ctx.lineTo(logicalW, r * cell);
      }
      ctx.stroke();

      if (s) {
        // Locked cells.
        for (let y = BUFFER_ROWS; y < TOTAL_ROWS; y++) {
          const row = s.board[y];
          for (let x = 0; x < COLS; x++) {
            if (row[x] !== 0) {
              drawCell(
                ctx,
                x * cell,
                (y - BUFFER_ROWS) * cell,
                cell,
                pieceColor(row[x], pal),
                pal,
              );
            }
          }
        }

        // Ghost piece.
        const ghost = getGhost(s);
        if (ghost && s.active && ghost.y !== s.active.y) {
          const color = pieceColor(colorOf(s.active.type), pal);
          for (const [x, y] of pieceCells(ghost)) {
            if (y >= BUFFER_ROWS) {
              drawCell(ctx, x * cell, (y - BUFFER_ROWS) * cell, cell, color, pal, true);
            }
          }
        }

        // Active piece.
        if (s.active) {
          const color = pieceColor(colorOf(s.active.type), pal);
          for (const [x, y] of pieceCells(s.active)) {
            if (y >= BUFFER_ROWS) {
              drawCell(ctx, x * cell, (y - BUFFER_ROWS) * cell, cell, color, pal);
            }
          }
        }
      }

      // Line-clear flashes.
      for (let i = flashes.length - 1; i >= 0; i--) {
        const f = flashes[i];
        const t = (now - f.start) / 260;
        if (t >= 1) {
          flashes.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = (1 - t) * 0.85;
        ctx.fillStyle = "#ffffff";
        for (const row of f.rows) {
          ctx.fillRect(0, (row - BUFFER_ROWS) * cell, logicalW, cell);
        }
        ctx.globalAlpha = 1;
      }

      // Particles.
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life += 16;
        if (p.life >= p.maxLife) {
          particles.splice(i, 1);
          continue;
        }
        p.x += p.vx;
        p.y += p.vy;
        p.vy += cell * 0.02; // gravity
        const a = 1 - p.life / p.maxLife;
        ctx.globalAlpha = a;
        ctx.fillStyle = p.color;
        roundRect(ctx, p.x, p.y, p.size, p.size, p.size * 0.3);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      ctx.restore();
      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
    // Set up once; the loop reads live state through controllerRef.
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden rounded-2xl"
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}

// Local color-id lookup (kept here to avoid importing the engine COLOR_ID twice).
function colorOf(type: string): number {
  const map: Record<string, number> = {
    I: 1,
    O: 2,
    T: 3,
    S: 4,
    Z: 5,
    J: 6,
    L: 7,
  };
  return map[type] ?? 1;
}
