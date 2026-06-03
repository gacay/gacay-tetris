import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { lobbyCreateSchema } from "@/lib/validation/schemas";
import { STALE_LOBBY_MS } from "@/lib/constants";
import { CH, EV, trigger } from "@/lib/pusher/pusherServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const cutoff = new Date(Date.now() - STALE_LOBBY_MS);
  const lobbies = await prisma.lobby.findMany({
    where: { status: "WAITING", createdAt: { gte: cutoff } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({
    lobbies: lobbies.map((l) => ({
      id: l.id,
      code: l.code,
      hostUsername: l.hostUsername,
      durationSec: l.durationSec,
      status: l.status,
      createdAt: l.createdAt.toISOString(),
    })),
  });
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = lobbyCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid lobby payload" }, { status: 400 });
  }
  const { hostUsername, durationSec } = parsed.data;
  const lobby = await prisma.lobby.create({
    data: { hostUsername, durationSec, status: "WAITING" },
  });
  await trigger(CH.lobbies, EV.listChanged, {});
  return NextResponse.json({ id: lobby.id, code: lobby.code });
}
