import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { lobbyScoreSchema } from "@/lib/validation/schemas";
import { CH, EV, trigger } from "@/lib/pusher/pusherServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = lobbyScoreSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const { username, score } = parsed.data;

  const lobby = await prisma.lobby.findUnique({ where: { id } });
  if (!lobby) {
    return NextResponse.json({ error: "Lobby not found" }, { status: 404 });
  }
  if (lobby.status !== "PLAYING") {
    return NextResponse.json({ ok: true }); // game not running; ignore
  }

  // Monotonic, player-scoped update (score only ever goes up).
  if (username === lobby.hostUsername) {
    await prisma.lobby.updateMany({
      where: { id, status: "PLAYING", hostScore: { lt: score } },
      data: { hostScore: score },
    });
  } else if (username === lobby.guestUsername) {
    await prisma.lobby.updateMany({
      where: { id, status: "PLAYING", guestScore: { lt: score } },
      data: { guestScore: score },
    });
  } else {
    return NextResponse.json({ error: "Not a player" }, { status: 403 });
  }

  await trigger(CH.lobby(id), EV.scoreUpdated, { username, score });
  return NextResponse.json({ ok: true });
}
