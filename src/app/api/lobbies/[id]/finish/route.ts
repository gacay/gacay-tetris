import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { lobbyFinishSchema } from "@/lib/validation/schemas";
import { finalizeLobby, serializeLobby } from "@/lib/lobby";

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
  const parsed = lobbyFinishSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const { username } = parsed.data;

  const lobby = await prisma.lobby.findUnique({ where: { id } });
  if (!lobby) {
    return NextResponse.json({ error: "Lobby not found" }, { status: 404 });
  }

  // Record that this player's run has ended (topped out or timer hit zero).
  if (username === lobby.hostUsername) {
    await prisma.lobby.update({ where: { id }, data: { hostFinished: true } });
  } else if (username === lobby.guestUsername) {
    await prisma.lobby.update({ where: { id }, data: { guestFinished: true } });
  }

  // Finalize if the game is actually over (both done or time elapsed).
  const finalized = (await finalizeLobby(id)) ?? lobby;
  return NextResponse.json(serializeLobby(finalized));
}
