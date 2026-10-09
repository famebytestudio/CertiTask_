import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { storage } from "@/lib/storage";
import { DOCUMENT_RETENTION_DAYS } from "@/lib/verification";
import { audit } from "@/lib/audit";
export const maxDuration = 300;

/**
 * GET /api/cron/purge-documents  (Authorization: Bearer $CRON_SECRET)
 * Deletes verification documents 90 days after the admin decision, and any
 * upload that was never attached to a request after 7 days. Keeps the
 * Document rows (with deletedAt) so the audit trail stays intact.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const decidedBefore = new Date(Date.now() - DOCUMENT_RETENTION_DAYS * 86_400_000);
  const orphanBefore = new Date(Date.now() - 7 * 86_400_000);

  const docs = await prisma.document.findMany({
    where: {
      deletedAt: null,
      OR: [
        { verificationRequest: { status: { in: ["VERIFIED", "REJECTED"] }, reviewedAt: { lt: decidedBefore } } },
        { verificationRequestId: null, createdAt: { lt: orphanBefore } },
      ],
    },
    select: { id: true, storageKey: true, userId: true },
    take: 500,
  });

  let purged = 0;
  for (const d of docs) {
    try {
      await storage.delete(d.storageKey);
      await prisma.document.update({ where: { id: d.id }, data: { deletedAt: new Date() } });
      purged++;
    } catch (err) {
      console.error("purge failed for document", d.id, err);
    }
  }
  if (purged > 0) await audit("system", "documents.purged", "document", "batch", { purged });
  return NextResponse.json({ purged, candidates: docs.length });
}
