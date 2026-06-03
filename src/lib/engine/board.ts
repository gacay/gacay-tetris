import { shapeCells } from "./tetrominoes";
import {
  type ActivePiece,
  type Cell,
  COLOR_ID,
  COLS,
  TOTAL_ROWS,
} from "./types";

export function createBoard(): Cell[][] {
  return Array.from({ length: TOTAL_ROWS }, () =>
    new Array<Cell>(COLS).fill(0),
  );
}

/** Absolute [col,row] cells occupied by a piece. */
export function pieceCells(piece: ActivePiece): [number, number][] {
  return shapeCells(piece.type, piece.rotation).map(
    ([dx, dy]) => [piece.x + dx, piece.y + dy] as [number, number],
  );
}

/**
 * Collision test. Out of bounds left/right/bottom collides; cells above the top
 * (row < 0, the vanish zone) are allowed so upward wall-kicks can work.
 */
export function collides(board: Cell[][], piece: ActivePiece): boolean {
  for (const [x, y] of pieceCells(piece)) {
    if (x < 0 || x >= COLS) return true;
    if (y >= TOTAL_ROWS) return true;
    if (y >= 0 && board[y][x] !== 0) return true;
  }
  return false;
}

export function lockPiece(board: Cell[][], piece: ActivePiece): Cell[][] {
  const next = board.map((row) => row.slice());
  const id = COLOR_ID[piece.type];
  for (const [x, y] of pieceCells(piece)) {
    if (y >= 0 && y < TOTAL_ROWS && x >= 0 && x < COLS) next[y][x] = id;
  }
  return next;
}

export function getFullRows(board: Cell[][]): number[] {
  const rows: number[] = [];
  for (let y = 0; y < TOTAL_ROWS; y++) {
    if (board[y].every((c) => c !== 0)) rows.push(y);
  }
  return rows;
}

/** Remove the given rows and drop everything above down, refilling the top. */
export function clearRows(board: Cell[][], rows: number[]): Cell[][] {
  if (rows.length === 0) return board;
  const remove = new Set(rows);
  const kept = board.filter((_, y) => !remove.has(y));
  const empties = Array.from({ length: rows.length }, () =>
    new Array<Cell>(COLS).fill(0),
  );
  return [...empties, ...kept];
}

/** How many rows the piece can fall before colliding. */
export function dropDistance(board: Cell[][], piece: ActivePiece): number {
  let d = 0;
  while (!collides(board, { ...piece, y: piece.y + d + 1 })) d++;
  return d;
}
