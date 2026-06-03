"use client";

import { useEffect, useRef } from "react";
import { COLOR_ID, type PieceType, shapeCells } from "@/lib/engine";
import { useTheme } from "@/lib/theme/useTheme";
import { drawCell, pieceColor, readPalette } from "./palette";

export function PiecePreview({
  type,
  className,
}: {
  type: PieceType | null;
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const theme = useTheme((s) => s.theme);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const box = canvas.clientWidth || 80;
    canvas.width = Math.floor(box * dpr);
    canvas.height = Math.floor(box * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, box, box);
    if (!type) return;

    const pal = readPalette();
    const cells = shapeCells(type, 0);
    const xs = cells.map((c) => c[0]);
    const ys = cells.map((c) => c[1]);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const w = maxX - minX + 1;
    const h = maxY - minY + 1;

    const cell = box / 4.4; // consistent scale across pieces
    const offX = (box - w * cell) / 2 - minX * cell;
    const offY = (box - h * cell) / 2 - minY * cell;
    const color = pieceColor(COLOR_ID[type], pal);
    for (const [cx, cy] of cells) {
      drawCell(ctx, offX + cx * cell, offY + cy * cell, cell, color, pal);
    }
  }, [type, theme]);

  return (
    <canvas
      ref={ref}
      className={className}
      style={{ width: "100%", aspectRatio: "1 / 1" }}
    />
  );
}
