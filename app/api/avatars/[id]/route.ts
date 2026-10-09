import { prisma } from "@/lib/prisma";

/** Only avatar-prefixed blobs linked to an active public profile can be read. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) return new Response(null, { status: 404 });
  const owner = await prisma.user.findFirst({ where: { avatarUrl: `/api/avatars/${id}`, suspendedAt: null }, select: { id: true } });
  if (!owner) return new Response(null, { status: 404 });
  const blob = await prisma.documentBlob.findUnique({ where: { key: `avatar:${id}` } });
  if (!blob) return new Response(null, { status: 404 });
  return new Response(new Uint8Array(blob.data), { headers: {
    "Content-Type": blob.mimeType, "Content-Length": String(blob.sizeBytes),
    "Cache-Control": "public, max-age=300", "X-Content-Type-Options": "nosniff",
  } });
}
