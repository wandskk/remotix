import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  // Migrações/introspecção usam a conexão direta (sem pgbouncer) — o
  // PrismaClient em runtime usa a conexão pooled via adapter (lib/db/prisma.ts).
  datasource: {
    url: env("DIRECT_URL"),
  },
});
