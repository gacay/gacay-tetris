export const DURATIONS = [60, 180, 300] as const;
export type Duration = (typeof DURATIONS)[number];

export function isValidDuration(n: number): n is Duration {
  return (DURATIONS as readonly number[]).includes(n);
}

export function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s === 0 ? `${m}m` : `${m}m ${s}s`;
}

export function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// Server-authoritative pre-game countdown added to startedAt on the 2nd join.
export const COUNTDOWN_MS = 3500;

// Sanity bound for submitted scores (light anti-cheat).
export const MAX_SCORE = 50_000_000;

// Public lobby list hides WAITING lobbies older than this.
export const STALE_LOBBY_MS = 10 * 60 * 1000;
