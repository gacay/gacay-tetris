import path from "node:path";
import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";
import { PrismaClient } from "../src/generated/prisma/client";
import { GameMode } from "../src/generated/prisma/enums";

try {
  process.loadEnvFile(path.join(process.cwd(), ".env"));
} catch {
  // rely on process.env
}
neonConfig.webSocketConstructor = ws;

const demoSingle = [
  { username: "BlockMaster", points: 42800, lines: 92, level: 10 },
  { username: "TetraQueen", points: 38150, lines: 84, level: 9 },
  { username: "SpinDoctor", points: 29900, lines: 70, level: 8 },
  { username: "LineCook", points: 21450, lines: 55, level: 6 },
  { username: "Pastelle", points: 15300, lines: 41, level: 5 },
];

const demoMulti = [
  { username: "Duelist", points: 18200, lines: 44, level: 5 },
  { username: "RushHour", points: 16750, lines: 39, level: 5 },
  { username: "ComboKid", points: 12100, lines: 30, level: 4 },
  { username: "FastHands", points: 9800, lines: 25, level: 3 },
  { username: "Newbie", points: 4200, lines: 12, level: 2 },
];

async function main() {
  const prisma = new PrismaClient({
    adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL ?? "" }),
  });

  await prisma.score.createMany({
    data: [
      ...demoSingle.map((s) => ({ ...s, mode: GameMode.SINGLE })),
      ...demoMulti.map((s) => ({ ...s, mode: GameMode.MULTI })),
    ],
  });

  const count = await prisma.score.count();
  console.log(`Seeded demo scores. Total Score rows: ${count}`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
