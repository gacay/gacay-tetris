import {
  type ActivePiece,
  type Cell,
  COLS,
  TOTAL_ROWS,
  type TSpin,
} from "./types";

export const SOFT_DROP_POINTS = 1;
export const HARD_DROP_POINTS = 2;

export interface ClearResult {
  points: number;
  difficult: boolean;
}

/**
 * Guideline line-clear scoring (already multiplied by level, with back-to-back
 * and combo bonuses applied).
 * @param comboCount consecutive line-clearing locks minus one (>=1 scores combo)
 * @param b2bActive  whether the previous clear was also a "difficult" clear
 */
export function clearScore(
  lines: number,
  tspin: TSpin,
  level: number,
  b2bActive: boolean,
  comboCount: number,
): ClearResult {
  let base: number;
  let difficult = false;

  if (tspin === "full") {
    base = lines === 0 ? 400 : lines === 1 ? 800 : lines === 2 ? 1200 : 1600;
    difficult = lines > 0;
  } else if (tspin === "mini") {
    base = lines === 0 ? 100 : lines === 1 ? 200 : 400;
    difficult = lines > 0;
  } else {
    base = lines === 1 ? 100 : lines === 2 ? 300 : lines === 3 ? 500 : lines === 4 ? 800 : 0;
    difficult = lines === 4;
  }

  let points = base * level;
  if (difficult && b2bActive) points = Math.floor(points * 1.5);
  if (lines > 0 && comboCount >= 1) points += 50 * comboCount * level;

  return { points, difficult };
}

function isBlocked(board: Cell[][], x: number, y: number): boolean {
  if (x < 0 || x >= COLS) return true;
  if (y >= TOTAL_ROWS) return true;
  if (y < 0) return false;
  return board[y][x] !== 0;
}

/** Three-corner T-spin detection. Only meaningful right after a rotation. */
export function detectTSpin(
  board: Cell[][],
  piece: ActivePiece,
  rotated: boolean,
  kickIndex: number,
): TSpin {
  if (piece.type !== "T" || !rotated) return "none";
  const cx = piece.x + 1;
  const cy = piece.y + 1; // T's center is box cell (1,1)
  const corners: [number, number][] = [
    [cx - 1, cy - 1], // 0 top-left
    [cx + 1, cy - 1], // 1 top-right
    [cx - 1, cy + 1], // 2 bottom-left
    [cx + 1, cy + 1], // 3 bottom-right
  ];
  const filled = corners.map(([x, y]) => isBlocked(board, x, y));
  const count = filled.filter(Boolean).length;
  if (count < 3) return "none";

  const frontByFacing: Record<number, [number, number]> = {
    0: [0, 1], // pointing up -> top corners
    1: [1, 3], // pointing right -> right corners
    2: [2, 3], // pointing down -> bottom corners
    3: [0, 2], // pointing left -> left corners
  };
  const front = frontByFacing[piece.rotation];
  const frontFilled = (filled[front[0]] ? 1 : 0) + (filled[front[1]] ? 1 : 0);

  if (frontFilled === 2) return "full";
  if (kickIndex === 4) return "full"; // the last kick (TST/fin) upgrades to full
  return "mini";
}
