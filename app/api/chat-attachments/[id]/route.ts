import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { authorizedRoom, roomNotFound } from "@/lib/chat";
import { prisma } from "@/lib/prisma";
import { storage } from "@/lib/storage";

type Params = { params: Promise<{ id: string }> };
export async function GET(_req: Request, { params }: Params) {
  const auth = await requireRole("CLIENT", "TALENT");
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const attachment = await prisma.chatAttachment.findUnique({ where: { id }, include: { message: { select: { roomId: true } } } });
  if (!attachment) return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
  if (!await authorizedRoom(attachment.message.roomId, auth)) return roomNotFound();
  const blob = await storage.get(attachment.storageKey);
  if (!blob) return NextResponse.json({ error: "Attachment unavailable" }, { status: 410 });
  const safeName = attachment.fileName.replace(/["\r\n]/g, "_");
  return new Response(new Uint8Array(blob.data), { headers: { "Content-Type": attachment.mimeType, "Content-Length": String(blob.data.length), "Content-Disposition": `${attachment.mimeType.startsWith("image/") ? "inline" : "attachment"}; filename="${safeName}"`, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
}

