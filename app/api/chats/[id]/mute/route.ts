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
  const { muted } = await req.json().catch(() => ({ muted: null }));
  if (typeof muted !== "boolean") return NextResponse.json({ error: "muted must be boolean" }, { status: 400 });
  const key = { roomId_userId: { roomId: id, userId: auth.userId } };
  if (muted) await prisma.chatMute.upsert({ where: key, update: {}, create: { roomId: id, userId: auth.userId } });
  else await prisma.chatMute.deleteMany({ where: { roomId: id, userId: auth.userId } });
  return NextResponse.json({ muted });
}

