import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { lobbyJoinSchema } from "@/lib/validation/schemas";
import { COUNTDOWN_MS } from "@/lib/constants";
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
  const parsed = lobbyJoinSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const { guestUsername } = parsed.data;
  const startedAt = new Date(Date.now() + COUNTDOWN_MS);

  // Atomic capacity guard: only one request can take the open seat.
  const res = await prisma.lobby.updateMany({
    where: { id, status: "WAITING", guestUsername: null },
    data: { guestUsername, status: "PLAYING", startedAt },
  });

  if (res.count !== 1) {
    return NextResponse.json(
      { ok: false, reason: "full" },
      { status: 409 },
    );
  }

  await trigger(CH.lobby(id), EV.gameStarted, {
    startedAt: startedAt.toISOString(),
  });
  await trigger(CH.lobbies, EV.listChanged, {});

  return NextResponse.json({ ok: true });
}
