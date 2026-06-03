import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { scorePostSchema } from "@/lib/validation/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const modeParam = req.nextUrl.searchParams.get("mode");
  const mode =
    modeParam === "MULTI" ? "MULTI" : modeParam === "SINGLE" ? "SINGLE" : null;

  const scores = await prisma.score.findMany({
    where: mode ? { mode } : {},
    orderBy: [{ points: "desc" }, { createdAt: "asc" }],
    take: 10,
  });

  return NextResponse.json({ scores });
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = scorePostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid score payload" }, { status: 400 });
  }
  const { username, points, mode, lines, level } = parsed.data;

  const created = await prisma.score.create({
    data: { username, points, mode, lines: lines ?? 0, level: level ?? 1 },
  });

  return NextResponse.json({ id: created.id });
}
