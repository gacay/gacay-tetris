import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { finalizeLobby, isExpired } from "@/lib/lobby";
import { STALE_LOBBY_MS } from "@/lib/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Optional hygiene endpoint (Vercel Cron). Correctness does not depend on it:
// stale lobbies are filtered from the list and expired games finalize lazily.
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const cutoff = new Date(Date.now() - STALE_LOBBY_MS);
  const deleted = await prisma.lobby.deleteMany({
    where: { status: "WAITING", createdAt: { lt: cutoff } },
  });

  const playing = await prisma.lobby.findMany({ where: { status: "PLAYING" } });
  let finalized = 0;
  for (const l of playing) {
    if (isExpired(l)) {
      await finalizeLobby(l.id);
      finalized += 1;
    }
  }

  return NextResponse.json({ deleted: deleted.count, finalized });
}

export async function GET(req: NextRequest) {
  // Vercel Cron issues GET requests; reuse the same logic.
  return POST(req);
}
