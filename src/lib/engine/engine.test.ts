import { describe, expect, it } from "vitest";
import { makeBag, refill, seedFromString } from "./bag";
import {
  clearRows,
  collides,
  createBoard,
  dropDistance,
  getFullRows,
} from "./board";
import { clearScore, detectTSpin } from "./scoring";
import { gravityInterval, levelForLines } from "./gravity";
import { getKicks } from "./srs";
import { apply, createGame, getGhost, step } from "./game";
import { spawnState } from "./tetrominoes";
import {
  type ActivePiece,
  type Cell,
  COLS,
  NEXT_COUNT,
  PIECE_TYPES,
  TOTAL_ROWS,
} from "./types";

describe("7-bag randomizer", () => {
  it("each bag is a permutation of all 7 pieces", () => {
    const { bag } = makeBag(12345);
    expect(bag).toHaveLength(7);
    expect(new Set(bag)).toEqual(new Set(PIECE_TYPES));
  });

  it("is deterministic for a given seed", () => {
    const a = makeBag(999);
    const b = makeBag(999);
    expect(a.bag).toEqual(b.bag);
  });

  it("refills the queue to at least the requested minimum", () => {
    const { queue } = refill([], 42, NEXT_COUNT + 1);
    expect(queue.length).toBeGreaterThanOrEqual(NEXT_COUNT + 1);
    // multiples of 7 keep distribution fair
    expect(queue.length % 7).toBe(0);
  });

  it("seedFromString returns a stable integer", () => {
    expect(seedFromString("lobby-abc")).toBe(seedFromString("lobby-abc"));
    expect(seedFromString("a")).not.toBe(seedFromString("b"));
  });
});

describe("board operations", () => {
  it("creates an empty board of the right size", () => {
    const b = createBoard();
    expect(b).toHaveLength(TOTAL_ROWS);
    expect(b[0]).toHaveLength(COLS);
    expect(b.flat().every((c) => c === 0)).toBe(true);
  });

  it("detects wall and floor collisions", () => {
    const b = createBoard();
    const piece: ActivePiece = { type: "O", rotation: 0, x: -1, y: 0 };
    expect(collides(b, piece)).toBe(true); // off the left edge
    expect(collides(b, { type: "O", rotation: 0, x: 0, y: TOTAL_ROWS })).toBe(
      true,
    ); // below floor
    expect(collides(b, { type: "O", rotation: 0, x: 0, y: 0 })).toBe(false);
  });

  it("finds and clears full rows, shifting the stack down", () => {
    const b = createBoard();
    const bottom = TOTAL_ROWS - 1;
    for (let x = 0; x < COLS; x++) b[bottom][x] = 1;
    b[bottom - 1][3] = 2; // a lone block above
    expect(getFullRows(b)).toEqual([bottom]);
    const cleared = clearRows(b, [bottom]);
    // the lone block should have fallen one row, onto the new bottom row
    expect(cleared[bottom][3]).toBe(2);
    expect(getFullRows(cleared)).toEqual([]);
  });

  it("computes hard-drop distance to the floor", () => {
    const b = createBoard();
    const piece = spawnState("T");
    const d = dropDistance(b, piece);
    const dropped: ActivePiece = { ...piece, y: piece.y + d };
    expect(collides(b, dropped)).toBe(false);
    expect(collides(b, { ...dropped, y: dropped.y + 1 })).toBe(true);
  });
});

describe("scoring", () => {
  it("awards guideline line values times level", () => {
    expect(clearScore(1, "none", 1, false, -1).points).toBe(100);
    expect(clearScore(2, "none", 1, false, -1).points).toBe(300);
    expect(clearScore(3, "none", 1, false, -1).points).toBe(500);
    expect(clearScore(4, "none", 1, false, -1).points).toBe(800);
    expect(clearScore(4, "none", 3, false, -1).points).toBe(2400);
  });

  it("marks tetris/T-spin clears as difficult and applies back-to-back", () => {
    expect(clearScore(4, "none", 1, false, -1).difficult).toBe(true);
    // tetris after a difficult clear -> 1.5x
    expect(clearScore(4, "none", 1, true, -1).points).toBe(1200);
    const tsd = clearScore(2, "full", 1, false, -1);
    expect(tsd.points).toBe(1200);
    expect(tsd.difficult).toBe(true);
  });

  it("adds combo bonus only when lines are cleared", () => {
    // combo count 2 at level 1: +50*2*1 = 100 on top of a single (100)
    expect(clearScore(1, "none", 1, false, 2).points).toBe(200);
    // no lines -> no combo bonus
    expect(clearScore(0, "none", 1, false, 5).points).toBe(0);
  });

  it("detects a basic T-spin from the three-corner rule", () => {
    const b = createBoard();
    const y = TOTAL_ROWS - 4;
    // Build a T-slot: fill the two bottom corners + one top corner around center.
    // Place T at down-facing (rotation 2): center at (x+1, y+1).
    const t: ActivePiece = { type: "T", rotation: 2, x: 3, y };
    const cx = t.x + 1;
    const cy = t.y + 1;
    b[cy + 1][cx - 1] = 1;
    b[cy + 1][cx + 1] = 1;
    b[cy - 1][cx - 1] = 1;
    expect(detectTSpin(b, t, true, 0)).not.toBe("none");
    // without a preceding rotation it is never a T-spin
    expect(detectTSpin(b, t, false, 0)).toBe("none");
  });
});

describe("gravity", () => {
  it("levels up every ten lines", () => {
    expect(levelForLines(0)).toBe(1);
    expect(levelForLines(9)).toBe(1);
    expect(levelForLines(10)).toBe(2);
    expect(levelForLines(25)).toBe(3);
  });

  it("falls faster at higher levels", () => {
    expect(gravityInterval(1)).toBeGreaterThan(gravityInterval(5));
    expect(gravityInterval(20)).toBeGreaterThanOrEqual(16);
  });
});

describe("SRS kicks", () => {
  it("provides 5 kick offsets for J/L/S/T/Z and I, and 1 for O", () => {
    expect(getKicks("T", 0, 1)).toHaveLength(5);
    expect(getKicks("I", 0, 1)).toHaveLength(5);
    expect(getKicks("O", 0, 1)).toHaveLength(1);
    // first kick is always the no-op
    expect(getKicks("T", 0, 1)[0]).toEqual([0, 0]);
  });
});

describe("game flow", () => {
  it("starts playing with an active piece and a filled preview queue", () => {
    const g = createGame(123);
    expect(g.status).toBe("playing");
    expect(g.active).not.toBeNull();
    expect(g.queue.length).toBeGreaterThanOrEqual(NEXT_COUNT);
    expect(g.score).toBe(0);
  });

  it("moves the active piece horizontally", () => {
    const g = createGame(7);
    const x0 = g.active!.x;
    const moved = apply(g, "right");
    expect(moved.active!.x).toBe(x0 + 1);
    const back = apply(moved, "left");
    expect(back.active!.x).toBe(x0);
  });

  it("does not mutate the input state (structural sharing)", () => {
    const g = createGame(7);
    const x0 = g.active!.x;
    apply(g, "right");
    expect(g.active!.x).toBe(x0); // original unchanged
  });

  it("hard drop locks a piece, scores drop points, and spawns the next", () => {
    const g = createGame(55);
    const after = apply(g, "hardDrop");
    expect(after.pieces).toBe(1);
    expect(after.score).toBeGreaterThan(0);
    expect(after.active).not.toBeNull();
    // board now has the 4 locked cells
    const filled = after.board.flat().filter((c: Cell) => c !== 0).length;
    expect(filled).toBe(4);
    // the next piece was pulled from the front of the queue
    expect(after.active!.type).toBe(g.queue[0]);
  });

  it("hold swaps the active piece and blocks a second hold until lock", () => {
    const g = createGame(88);
    const first = g.active!.type;
    const held = apply(g, "hold");
    expect(held.hold).toBe(first);
    expect(held.canHold).toBe(false);
    // a second hold is ignored
    const held2 = apply(held, "hold");
    expect(held2.hold).toBe(first);
  });

  it("ghost piece rests on the floor below the active piece", () => {
    const g = createGame(11);
    const ghost = getGhost(g)!;
    expect(ghost.y).toBeGreaterThanOrEqual(g.active!.y);
    expect(collides(g.board, ghost)).toBe(false);
  });

  it("gravity eventually advances the piece downward", () => {
    const g = createGame(11);
    const y0 = g.active!.y;
    const after = step(g, 2000); // well beyond one level-1 interval
    expect(after.active!.y).toBeGreaterThan(y0);
  });

  it("clears a completed row through normal play", () => {
    // Hand-build a board missing a single column on the bottom row, then drop
    // a vertical I piece into the gap.
    let g = createGame(3);
    const bottom = TOTAL_ROWS - 1;
    const board = g.board.map((r) => r.slice());
    for (let x = 0; x < COLS; x++) board[bottom][x] = 1;
    board[bottom][0] = 0; // gap in column 0
    const iVertical: ActivePiece = { type: "I", rotation: 1, x: -2, y: 0 };
    // I rotation 1 occupies column x+2 = 0
    g = { ...g, board, active: iVertical };
    const after = apply(g, "hardDrop");
    expect(after.lines).toBe(1);
    expect(after.score).toBeGreaterThan(0);
  });
});
