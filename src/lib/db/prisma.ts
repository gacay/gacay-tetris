import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";
import { PrismaClient } from "@/generated/prisma/client";

// Neon's serverless driver talks to Postgres over a WebSocket; in Node.js we
// must provide a WebSocket implementation. (No-op cost on the edge/runtime.)
neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL ?? "";

const createPrismaClient = () =>
  new PrismaClient({ adapter: new PrismaNeon({ connectionString }) });

// Reuse a single client across hot reloads in dev and across warm serverless
// invocations to avoid exhausting Neon's connection pool.
const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof createPrismaClient>;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
