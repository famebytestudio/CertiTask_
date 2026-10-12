import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { authorizedRoom, roomNotFound } from "@/lib/chat";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";

export async function POST(req: Request) {
  const auth = await requireRole("CLIENT", "TALENT");
  if (auth instanceof NextResponse) return auth;
  const { messageId, reason } = await req.json().catch(() => ({ messageId: null, reason: null }));
  if (typeof messageId !== "string" || typeof reason !== "string" || reason.trim().length < 3 || reason.length > 500) return NextResponse.json({ error: "A valid message and reason are required" }, { status: 400 });
  const message = await prisma.chatMessage.findUnique({ where: { id: messageId }, select: { roomId: true } });
  if (!message) return NextResponse.json({ error: "Message not found" }, { status: 404 });
  if (!await authorizedRoom(message.roomId, auth)) return roomNotFound();
  const report = await prisma.chatReport.upsert({ where: { messageId_reporterId: { messageId, reporterId: auth.userId } }, update: { reason: reason.trim() }, create: { messageId, roomId: message.roomId, reporterId: auth.userId, reason: reason.trim() } });
  await audit(auth, "chat.message_reported", "chat_message", messageId, { reportId: report.id, roomId: message.roomId });
  return NextResponse.json({ success: true }, { status: 201 });
}

