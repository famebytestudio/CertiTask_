import type { Prisma } from "@prisma/client";

/** Serialize quota and subscription mutations for one account inside a transaction. */
export async function lockAccount(tx: Prisma.TransactionClient, userId: string): Promise<void> {
  await tx.$queryRaw`SELECT id FROM users WHERE id = ${userId} FOR UPDATE`;
}
