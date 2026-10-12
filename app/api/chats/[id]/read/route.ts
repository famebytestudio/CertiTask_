import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { authorizedRoom, roomNotFound } from "@/lib/chat";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const auth = await requireRole("CLIENT", "TALENT");
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  if (!await authorizedRoom(id, auth)) return roomNotFound();
  const { messageId } = await req.json().catch(() => ({ messageId: null }));
  const message = typeof messageId === "string" ? await prisma.chatMessage.findFirst({ where: { id: messageId, roomId: id } }) : null;
  if (!message) return NextResponse.json({ error: "Message not found" }, { status: 400 });
  await prisma.chatRead.upsert({ where: { roomId_userId: { roomId: id, userId: auth.userId } }, update: { lastReadMessageId: message.id, readAt: new Date() }, create: { roomId: id, userId: auth.userId, lastReadMessageId: message.id } });
  return NextResponse.json({ success: true, readAt: new Date().toISOString() });
}

