import {
  clearRows,
  collides,
  createBoard,
  dropDistance,
  getFullRows,
  lockPiece,
} from "./board";
import { refill } from "./bag";
import {
  gravityInterval,
  LOCK_DELAY_MS,
  levelForLines,
  MAX_LOCK_RESETS,
} from "./gravity";
import {
  clearScore,
  detectTSpin,
  HARD_DROP_POINTS,
  SOFT_DROP_POINTS,
} from "./scoring";
import { getKicks } from "./srs";
import { spawnState } from "./tetrominoes";
import {
  type Action,
  type ActivePiece,
  type Cell,
  type GameState,
  NEXT_COUNT,
  type Rotation,
} from "./types";

const QUEUE_MIN = NEXT_COUNT + 1;

function canMoveDown(board: Cell[][], piece: ActivePiece): boolean {
  return !collides(board, { ...piece, y: piece.y + 1 });
}

/** Fresh working copy: shares board/queue (replaced when mutated), fresh events. */
function begin(s: GameState): GameState {
  return { ...s, active: s.active ? { ...s.active } : null, events: [] };
}

function ensureQueue(ns: GameState) {
  const r = refill(ns.queue, ns.rngState, QUEUE_MIN);
  ns.queue = r.queue;
  ns.rngState = r.state;
}

function placeSpawn(ns: GameState, type: ActivePiece["type"]) {
  const active = spawnState(type);
  ns.active = active;
  ns.gravityAcc = 0;
  ns.lockTimer = null;
  ns.lockResets = 0;
  ns.lastMoveWasRotation = false;
  ns.lastKickIndex = -1;
  if (collides(ns.board, active)) {
    ns.status = "over";
    ns.events.push({ type: "gameover" });
  }
}

function pullAndSpawn(ns: GameState) {
  ensureQueue(ns);
  const type = ns.queue[0];
  ns.queue = ns.queue.slice(1);
  ensureQueue(ns);
  placeSpawn(ns, type);
}

function spawnNext(ns: GameState) {
  pullAndSpawn(ns);
  ns.canHold = true;
}

function touchLock(ns: GameState) {
  if (!ns.active) return;
  if (canMoveDown(ns.board, ns.active)) {
    ns.lockTimer = null;
  } else if (ns.lockTimer === null) {
    ns.lockTimer = LOCK_DELAY_MS;
  } else if (ns.lockResets < MAX_LOCK_RESETS) {
    ns.lockTimer = LOCK_DELAY_MS;
    ns.lockResets += 1;
  }
}

function tryMoveHoriz(ns: GameState, dx: number): boolean {
  if (!ns.active) return false;
  const cand = { ...ns.active, x: ns.active.x + dx };
  if (collides(ns.board, cand)) return false;
  ns.active = cand;
  ns.lastMoveWasRotation = false;
  ns.events.push({ type: "move" });
  touchLock(ns);
  return true;
}

function tryRotate(ns: GameState, dir: 1 | 2 | 3): boolean {
  if (!ns.active) return false;
  const from = ns.active.rotation;
  const to = (((from + dir) % 4) + 4) % 4 as Rotation;
  const kicks = getKicks(ns.active.type, from, to);
  for (let i = 0; i < kicks.length; i++) {
    const [dx, dy] = kicks[i];
    const cand = {
      ...ns.active,
      rotation: to,
      x: ns.active.x + dx,
      y: ns.active.y + dy,
    };
    if (!collides(ns.board, cand)) {
      ns.active = cand;
      ns.lastMoveWasRotation = true;
      ns.lastKickIndex = i;
      ns.events.push({ type: "rotate" });
      touchLock(ns);
      return true;
    }
  }
  return false;
}

function softDrop(ns: GameState) {
  if (!ns.active) return;
  if (canMoveDown(ns.board, ns.active)) {
    ns.active = { ...ns.active, y: ns.active.y + 1 };
    ns.score += SOFT_DROP_POINTS;
    ns.gravityAcc = 0;
    ns.lockResets = 0;
    ns.lastMoveWasRotation = false;
    ns.events.push({ type: "softdrop" });
    if (!canMoveDown(ns.board, ns.active) && ns.lockTimer === null) {
      ns.lockTimer = LOCK_DELAY_MS;
    }
  } else if (ns.lockTimer === null) {
    ns.lockTimer = LOCK_DELAY_MS;
  }
}

function hardDrop(ns: GameState) {
  if (!ns.active) return;
  const dist = dropDistance(ns.board, ns.active);
  if (dist > 0) {
    ns.active = { ...ns.active, y: ns.active.y + dist };
    ns.score += HARD_DROP_POINTS * dist;
    ns.lastMoveWasRotation = false;
  }
  ns.events.push({ type: "harddrop", cells: dist });
  lockActive(ns);
}

function hold(ns: GameState) {
  if (!ns.canHold || !ns.active) return;
  const cur = ns.active.type;
  if (ns.hold === null) {
    ns.hold = cur;
    pullAndSpawn(ns);
  } else {
    const prev = ns.hold;
    ns.hold = cur;
    placeSpawn(ns, prev);
  }
  ns.canHold = false;
  ns.events.push({ type: "hold" });
}

function lockActive(ns: GameState) {
  if (!ns.active) return;
  const piece = ns.active;
  const tspin = detectTSpin(
    ns.board,
    piece,
    ns.lastMoveWasRotation,
    ns.lastKickIndex,
  );
  ns.board = lockPiece(ns.board, piece);
  ns.pieces += 1;
  ns.events.push({ type: "lock" });

  const full = getFullRows(ns.board);
  const lines = full.length;
  const wasB2B = ns.backToBack;

  if (lines > 0) {
    ns.board = clearRows(ns.board, full);
    ns.combo += 1;
    const res = clearScore(lines, tspin, ns.level, wasB2B, ns.combo);
    ns.score += res.points;
    ns.backToBack = res.difficult;
    ns.lines += lines;
    ns.events.push({
      type: "lineclear",
      lines,
      rows: full,
      tspin,
      b2b: res.difficult && wasB2B,
      combo: ns.combo,
    });
    const newLevel = levelForLines(ns.lines);
    if (newLevel > ns.level) {
      ns.level = newLevel;
      ns.events.push({ type: "levelup", level: newLevel });
    }
  } else {
    ns.combo = -1;
    if (tspin !== "none") {
      const res = clearScore(0, tspin, ns.level, wasB2B, -1);
      ns.score += res.points;
    }
  }

  ns.active = null;
  spawnNext(ns);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function createGame(seed?: number): GameState {
  const rngState =
    seed ?? ((Math.floor(Math.random() * 0xffffffff) | 0) || 1);
  const state: GameState = {
    board: createBoard(),
    active: null,
    hold: null,
    canHold: true,
    queue: [],
    rngState,
    status: "playing",
    score: 0,
    lines: 0,
    level: 1,
    pieces: 0,
    combo: -1,
    backToBack: false,
    gravityAcc: 0,
    lockTimer: null,
    lockResets: 0,
    lastMoveWasRotation: false,
    lastKickIndex: -1,
    events: [],
  };
  spawnNext(state);
  state.events = [];
  return state;
}

export function apply(s: GameState, action: Action): GameState {
  const ns = begin(s);
  if (ns.status !== "playing" || !ns.active) return ns;
  switch (action) {
    case "left":
      tryMoveHoriz(ns, -1);
      break;
    case "right":
      tryMoveHoriz(ns, 1);
      break;
    case "softDrop":
      softDrop(ns);
      break;
    case "hardDrop":
      hardDrop(ns);
      break;
    case "rotateCW":
      tryRotate(ns, 1);
      break;
    case "rotateCCW":
      tryRotate(ns, 3);
      break;
    case "rotate180":
      tryRotate(ns, 2);
      break;
    case "hold":
      hold(ns);
      break;
  }
  return ns;
}

export function step(s: GameState, dt: number): GameState {
  const ns = begin(s);
  if (ns.status !== "playing" || !ns.active) return ns;

  if (canMoveDown(ns.board, ns.active)) {
    ns.gravityAcc += dt;
    const interval = gravityInterval(ns.level);
    while (ns.gravityAcc >= interval && canMoveDown(ns.board, ns.active)) {
      ns.active = { ...ns.active, y: ns.active.y + 1 };
      ns.gravityAcc -= interval;
      ns.lockResets = 0;
      ns.lastMoveWasRotation = false;
    }
    if (!canMoveDown(ns.board, ns.active)) {
      if (ns.lockTimer === null) ns.lockTimer = LOCK_DELAY_MS;
    } else {
      ns.lockTimer = null;
    }
  } else {
    if (ns.lockTimer === null) ns.lockTimer = LOCK_DELAY_MS;
    ns.lockTimer -= dt;
    if (ns.lockTimer <= 0) lockActive(ns);
  }
  return ns;
}

export function togglePause(s: GameState): GameState {
  if (s.status === "playing") return { ...s, status: "paused", events: [] };
  if (s.status === "paused") return { ...s, status: "playing", events: [] };
  return s;
}

export function getGhost(s: GameState): ActivePiece | null {
  if (!s.active) return null;
  const d = dropDistance(s.board, s.active);
  return { ...s.active, y: s.active.y + d };
}
