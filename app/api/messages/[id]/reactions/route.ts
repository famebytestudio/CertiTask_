import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { authorizedRoom, roomNotFound } from "@/lib/chat";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const auth = await requireRole("CLIENT", "TALENT");
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const message = await prisma.chatMessage.findUnique({ where: { id }, select: { roomId: true, deletedAt: true } });
  if (!message) return NextResponse.json({ error: "Message not found" }, { status: 404 });
  const room = await authorizedRoom(message.roomId, auth);
  if (!room) return roomNotFound();
  if (room.status !== "ACTIVE" || message.deletedAt) return NextResponse.json({ error: "Reaction unavailable" }, { status: 409 });
  const { emoji } = await req.json().catch(() => ({ emoji: null }));
  if (typeof emoji !== "string" || !/^\p{Extended_Pictographic}$/u.test(emoji)) return NextResponse.json({ error: "Invalid emoji" }, { status: 400 });
  const key = { messageId_userId_emoji: { messageId: id, userId: auth.userId, emoji } };
  const existing = await prisma.chatReaction.findUnique({ where: key });
  if (existing) await prisma.chatReaction.delete({ where: key });
  else await prisma.chatReaction.create({ data: { messageId: id, userId: auth.userId, emoji } });
  const reactions = await prisma.chatReaction.findMany({ where: { messageId: id }, select: { emoji: true, userId: true } });
  return NextResponse.json({ reactions });
}

