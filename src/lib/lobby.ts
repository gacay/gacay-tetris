import type { Lobby } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { CH, EV, trigger } from "@/lib/pusher/pusherServer";

export interface SerializedLobby {
  id: string;
  code: string;
  status: Lobby["status"];
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

export function serializeLobby(l: Lobby, serverNow = Date.now()): SerializedLobby {
  return {
    id: l.id,
    code: l.code,
    status: l.status,
    durationSec: l.durationSec,
    hostUsername: l.hostUsername,
    guestUsername: l.guestUsername,
    hostScore: l.hostScore,
    guestScore: l.guestScore,
    hostFinished: l.hostFinished,
    guestFinished: l.guestFinished,
    startedAt: l.startedAt ? l.startedAt.toISOString() : null,
    winner: l.winner,
    serverNow,
  };
}

export function isExpired(l: Lobby, now = Date.now()): boolean {
  if (l.status !== "PLAYING" || !l.startedAt) return false;
  return now >= l.startedAt.getTime() + l.durationSec * 1000;
}

export function computeWinner(l: Lobby): string {
  if (l.hostScore > l.guestScore) return l.hostUsername;
  if (l.guestScore > l.hostScore) return l.guestUsername ?? l.hostUsername;
  return "DRAW";
}

/**
 * Finalize a lobby once it is over (time elapsed OR both players reported done).
 * Idempotent: the conditional update guarantees scores are recorded only once.
 */
export async function finalizeLobby(id: string): Promise<Lobby | null> {
  const lobby = await prisma.lobby.findUnique({ where: { id } });
  if (!lobby) return null;
  if (lobby.status === "FINISHED") return lobby;

  const bothDone = lobby.hostFinished && lobby.guestFinished;
  if (!isExpired(lobby) && !bothDone) return lobby; // not over yet

  const winner = computeWinner(lobby);
  const res = await prisma.lobby.updateMany({
    where: { id, status: { not: "FINISHED" } },
    data: { status: "FINISHED", winner },
  });

  if (res.count === 1) {
    // Only the request that actually flipped the status records the scores.
    await prisma.score.createMany({
      data: [
        { username: lobby.hostUsername, points: lobby.hostScore, mode: "MULTI" },
        ...(lobby.guestUsername
          ? [
              {
                username: lobby.guestUsername,
                points: lobby.guestScore,
                mode: "MULTI" as const,
              },
            ]
          : []),
      ],
    });
    await trigger(CH.lobby(id), EV.gameFinished, { winner });
  }

  return prisma.lobby.findUnique({ where: { id } });
}
