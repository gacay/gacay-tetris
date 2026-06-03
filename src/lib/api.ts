export type Mode = "SINGLE" | "MULTI";
export type LobbyStatus = "WAITING" | "PLAYING" | "FINISHED";

export interface ScoreRow {
  id: string;
  username: string;
  points: number;
  mode: Mode;
  lines: number;
  level: number;
  createdAt: string;
}

export interface LobbyListItem {
  id: string;
  code: string;
  hostUsername: string;
  durationSec: number;
  status: LobbyStatus;
  createdAt: string;
}

export interface LobbyState {
  id: string;
  code: string;
  status: LobbyStatus;
  durationSec: number;
  hostUsername: string;
  guestUsername: string | null;
  hostScore: number;
  guestScore: number;
  hostFinished: boolean;
  guestFinished: boolean;
  startedAt: string | null;
  winner: string | null;
  serverNow: number;
}

async function postJSON<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
  return data;
}

// --- scores ----------------------------------------------------------------

export async function fetchScores(mode: Mode): Promise<ScoreRow[]> {
  const res = await fetch(`/api/scores?mode=${mode}`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.scores ?? []) as ScoreRow[];
}

export async function postScore(input: {
  username: string;
  points: number;
  mode: Mode;
  lines?: number;
  level?: number;
}): Promise<void> {
  await postJSON("/api/scores", input);
}

// --- lobbies ---------------------------------------------------------------

export async function listLobbies(): Promise<LobbyListItem[]> {
  const res = await fetch("/api/lobbies", { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.lobbies ?? []) as LobbyListItem[];
}

export async function createLobby(
  hostUsername: string,
  durationSec: number,
): Promise<{ id: string; code: string }> {
  return postJSON("/api/lobbies", { hostUsername, durationSec });
}

export async function getLobby(id: string): Promise<LobbyState> {
  const res = await fetch(`/api/lobbies/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Lobby not found (${res.status})`);
  return (await res.json()) as LobbyState;
}

export async function joinLobby(
  id: string,
  guestUsername: string,
): Promise<{ ok: boolean; reason?: string }> {
  const res = await fetch(`/api/lobbies/${id}/join`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ guestUsername }),
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 409) return { ok: false, reason: data?.reason ?? "full" };
  if (!res.ok) throw new Error(data?.error || "Failed to join");
  return { ok: true };
}

export async function postLobbyScore(
  id: string,
  username: string,
  score: number,
): Promise<void> {
  await fetch(`/api/lobbies/${id}/score`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username, score }),
  });
}

export async function finishLobby(
  id: string,
  username: string,
): Promise<LobbyState> {
  return postJSON(`/api/lobbies/${id}/finish`, { username });
}
