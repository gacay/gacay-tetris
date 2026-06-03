import path from "node:path";
import { defineConfig } from "prisma/config";

// Load .env for local CLI usage (db push / studio / seed). On Vercel the env
// vars are already injected into process.env, and no .env file exists there.
try {
  process.loadEnvFile(path.join(process.cwd(), ".env"));
} catch {
  // No .env file present (CI / Vercel) — fall back to process.env as-is.
}

// Direct (non-pooled) connection is required for DDL (db push / migrations).
// Support several common names so the Neon × Vercel integration works out of the box.
const directUrl =
  process.env.DIRECT_URL ??
  process.env.DATABASE_URL_UNPOOLED ??
  process.env.POSTGRES_URL_NON_POOLING ??
  process.env.DATABASE_URL ??
  "";

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    path: path.join("prisma", "migrations"),
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: directUrl,
  },
});
