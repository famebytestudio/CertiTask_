import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { messageInclude } from "@/lib/chat";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

/** Every administrative chat view is explicitly audited. */
export async function GET(req: Request, { params }: Params) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const room = await prisma.chatRoom.findUnique({ where: { id }, include: { project: { select: { id: true, title: true } }, client: { select: { id: true, name: true } }, talent: { select: { id: true, name: true } } } });
  if (!room) return NextResponse.json({ error: "Chat not found" }, { status: 404 });
  const before = new URL(req.url).searchParams.get("before");
  const cursor = before ? await prisma.chatMessage.findFirst({ where: { id: before, roomId: id }, select: { id: true, createdAt: true } }) : null;
  const messages = await prisma.chatMessage.findMany({ where: { roomId: id, ...(cursor ? { OR: [{ createdAt: { lt: cursor.createdAt } }, { createdAt: cursor.createdAt, id: { lt: cursor.id } }] } : {}) }, include: messageInclude, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 30 });
  await audit(auth, "admin.chat_viewed", "chat_room", id, { before });
  return NextResponse.json({ room, messages: messages.reverse(), nextCursor: messages.length === 30 ? messages.at(-1)?.id : null });
}

