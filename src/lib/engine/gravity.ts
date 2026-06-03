export const LOCK_DELAY_MS = 500;
export const MAX_LOCK_RESETS = 15;
export const LINES_PER_LEVEL = 10;

export function levelForLines(lines: number): number {
  return Math.floor(lines / LINES_PER_LEVEL) + 1;
}

/** Milliseconds the active piece takes to fall one row at a given level. */
export function gravityInterval(level: number): number {
  const l = Math.max(1, level);
  const seconds = Math.pow(0.8 - (l - 1) * 0.007, l - 1);
  return Math.max(16, seconds * 1000);
}
