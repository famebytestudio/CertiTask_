import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { attachDatabasePool } from "@vercel/functions";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getPrisma(): PrismaClient {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured");
  }

  const databaseUrl = new URL(connectionString);
  const sslMode = databaseUrl.searchParams.get("sslmode")?.toLowerCase();
  if (sslMode === "prefer" || sslMode === "require" || sslMode === "verify-ca") {
    databaseUrl.searchParams.set("sslmode", "verify-full");
  }

  const pool = new Pool({
    connectionString: databaseUrl.toString(),
    // Let pg honour sslmode, including local databases using sslmode=disable.
    max: 5,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
  });
  const adapter = new PrismaPg(pool);
  if (process.env.VERCEL) attachDatabasePool(pool);
  const client = new PrismaClient({ adapter });

  // Reuse the pool across warm serverless invocations as well as development.
  globalForPrisma.prisma = client;
  return client;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = getPrisma();
    const value = Reflect.get(client, property);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
