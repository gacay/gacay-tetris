import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { finalizeLobby, isExpired, serializeLobby } from "@/lib/lobby";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  let lobby = await prisma.lobby.findUnique({ where: { id } });
  if (!lobby) {
    return NextResponse.json({ error: "Lobby not found" }, { status: 404 });
  }
  // Lazy finalize: if the clock has run out but nobody reported in, end it now.
  if (lobby.status === "PLAYING" && isExpired(lobby)) {
    lobby = (await finalizeLobby(id)) ?? lobby;
  }
  return NextResponse.json(serializeLobby(lobby));
}
