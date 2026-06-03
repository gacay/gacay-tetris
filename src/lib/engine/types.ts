export type PieceType = "I" | "O" | "T" | "S" | "Z" | "J" | "L";

export const PIECE_TYPES: readonly PieceType[] = [
  "I",
  "O",
  "T",
  "S",
  "Z",
  "J",
  "L",
] as const;

/** Color id stored in board cells (0 = empty). Used by the renderer for palette. */
export const COLOR_ID: Record<PieceType, number> = {
  I: 1,
  O: 2,
  T: 3,
  S: 4,
  Z: 5,
  J: 6,
  L: 7,
};

// Board geometry. Two hidden "vanish" rows on top for spawning / upward kicks.
export const COLS = 10;
export const VISIBLE_ROWS = 20;
export const BUFFER_ROWS = 2;
export const TOTAL_ROWS = VISIBLE_ROWS + BUFFER_ROWS;
export const NEXT_COUNT = 5;

export type Cell = number; // 0 empty, 1..7 = piece color id
export type Rotation = 0 | 1 | 2 | 3;

export interface ActivePiece {
  type: PieceType;
  rotation: Rotation;
  x: number; // column of the piece bounding-box origin
  y: number; // row of the piece bounding-box origin (may be < BUFFER_ROWS)
}

export type GameStatus = "playing" | "paused" | "over";
export type TSpin = "none" | "mini" | "full";

export type Action =
  | "left"
  | "right"
  | "softDrop"
  | "hardDrop"
  | "rotateCW"
  | "rotateCCW"
  | "rotate180"
  | "hold";

export type GameEvent =
  | { type: "move" }
  | { type: "rotate" }
  | { type: "softdrop" }
  | { type: "harddrop"; cells: number }
  | { type: "lock" }
  | { type: "hold" }
  | {
      type: "lineclear";
      lines: number;
      rows: number[];
      tspin: TSpin;
      b2b: boolean;
      combo: number;
    }
  | { type: "levelup"; level: number }
  | { type: "gameover" };

export interface GameState {
  board: Cell[][];
  active: ActivePiece | null;
  hold: PieceType | null;
  canHold: boolean;
  queue: PieceType[];
  rngState: number;
  status: GameStatus;

  score: number;
  lines: number;
  level: number;
  pieces: number;
  combo: number; // -1 = no active combo
  backToBack: boolean;

  // timers (ms)
  gravityAcc: number;
  lockTimer: number | null; // null = airborne / not pending lock
  lockResets: number;

  // for T-spin detection
  lastMoveWasRotation: boolean;
  lastKickIndex: number;

  events: GameEvent[];
}
