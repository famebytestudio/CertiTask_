import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { authorizedRoom, messageInclude, normalizeMessageBody, roomNotFound } from "@/lib/chat";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

async function ownMessage(id: string, userId: string) {
  return prisma.chatMessage.findUnique({ where: { id }, select: { id: true, roomId: true, senderId: true, deletedAt: true } }).then(message => message?.senderId === userId ? message : null);
}

export async function PATCH(req: Request, { params }: Params) {
  const auth = await requireRole("CLIENT", "TALENT");
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const message = await ownMessage(id, auth.userId);
  if (!message) return NextResponse.json({ error: "Message not found" }, { status: 404 });
  const room = await authorizedRoom(message.roomId, auth);
  if (!room) return roomNotFound();
  if (room.status !== "ACTIVE" || message.deletedAt) return NextResponse.json({ error: "Message cannot be edited" }, { status: 409 });
  const input = await req.json().catch(() => null);
  const body = normalizeMessageBody(input?.body);
  if (!body) return NextResponse.json({ error: "A valid message is required" }, { status: 400 });
  const updated = await prisma.chatMessage.update({ where: { id }, data: { body, editedAt: new Date() }, include: messageInclude });
  return NextResponse.json({ message: updated });
}

export async function DELETE(_req: Request, { params }: Params) {
  const auth = await requireRole("CLIENT", "TALENT");
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const message = await ownMessage(id, auth.userId);
  if (!message) return NextResponse.json({ error: "Message not found" }, { status: 404 });
  const room = await authorizedRoom(message.roomId, auth);
  if (!room) return roomNotFound();
  if (room.status !== "ACTIVE") return NextResponse.json({ error: "Message cannot be deleted in a locked chat" }, { status: 409 });
  await prisma.chatMessage.update({ where: { id }, data: { body: "", deletedAt: new Date(), editedAt: null } });
  return NextResponse.json({ success: true });
}

