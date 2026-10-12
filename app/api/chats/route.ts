import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requireRole("CLIENT", "TALENT");
  if (auth instanceof NextResponse) return auth;

  const rooms = await prisma.chatRoom.findMany({
    where: { OR: [{ clientId: auth.userId }, { talentId: auth.userId }] },
    include: {
      project: { select: { id: true, title: true, status: true } },
      client: { select: { id: true, name: true, avatarUrl: true } },
      talent: { select: { id: true, name: true, avatarUrl: true } },
      messages: { orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 1, select: { id: true, body: true, type: true, senderId: true, createdAt: true, deletedAt: true } },
      reads: { where: { userId: auth.userId }, select: { readAt: true } },
      mutes: { where: { userId: auth.userId }, select: { userId: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const result = await Promise.all(rooms.map(async (room) => {
    const readAt = room.reads[0]?.readAt ?? room.createdAt;
    const unreadCount = await prisma.chatMessage.count({ where: { roomId: room.id, senderId: { not: auth.userId }, createdAt: { gt: readAt } } });
    const { reads: _reads, mutes: _mutes, ...data } = room;
    void _reads;
    void _mutes;
    return { ...data, unreadCount, muted: room.mutes.length > 0 };
  }));

  return NextResponse.json({ rooms: result, unreadCount: result.reduce((sum, room) => sum + room.unreadCount, 0) });
}

