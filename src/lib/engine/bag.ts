import { PIECE_TYPES, type PieceType } from "./types";

/** Deterministic PRNG (splitmix32). Returns a value in [0,1) and the next state. */
export function nextRandom(state: number): { value: number; state: number } {
  const a = (state + 0x9e3779b9) | 0;
  let t = a ^ (a >>> 16);
  t = Math.imul(t, 0x21f0aaad);
  t = t ^ (t >>> 15);
  t = Math.imul(t, 0x735a2d97);
  t = t ^ (t >>> 15);
  return { value: (t >>> 0) / 4294967296, state: a };
}

/** Produce one shuffled 7-bag (Fisher–Yates), threading the RNG state. */
export function makeBag(state: number): { bag: PieceType[]; state: number } {
  const bag: PieceType[] = [...PIECE_TYPES];
  let s = state;
  for (let i = bag.length - 1; i > 0; i--) {
    const r = nextRandom(s);
    s = r.state;
    const j = Math.floor(r.value * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return { bag, state: s };
}

/** Ensure the queue holds at least `min` upcoming pieces, refilling by bags. */
export function refill(
  queue: PieceType[],
  state: number,
  min: number,
): { queue: PieceType[]; state: number } {
  let q = queue;
  let s = state;
  while (q.length < min) {
    const r = makeBag(s);
    s = r.state;
    q = [...q, ...r.bag];
  }
  return { queue: q, state: s };
}

/** Seed from a string (e.g. a lobby id) so two clients share a sequence. */
export function seedFromString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h | 0;
}
