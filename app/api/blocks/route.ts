import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { authorizedRoom, counterpartId, roomNotFound } from "@/lib/chat";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";

export async function POST(req: Request) {
  const auth = await requireRole("CLIENT", "TALENT");
  if (auth instanceof NextResponse) return auth;
  const { roomId, blocked } = await req.json().catch(() => ({ roomId: null, blocked: null }));
  if (typeof roomId !== "string" || typeof blocked !== "boolean") return NextResponse.json({ error: "roomId and blocked are required" }, { status: 400 });
  const room = await authorizedRoom(roomId, auth);
  if (!room) return roomNotFound();
  const blockedId = counterpartId(room, auth.userId);
  const key = { blockerId_blockedId: { blockerId: auth.userId, blockedId } };
  if (blocked) await prisma.chatBlock.upsert({ where: key, update: {}, create: { blockerId: auth.userId, blockedId } });
  else await prisma.chatBlock.deleteMany({ where: { blockerId: auth.userId, blockedId } });
  await audit(auth, blocked ? "chat.user_blocked" : "chat.user_unblocked", "user", blockedId, { roomId });
  return NextResponse.json({ blocked });
}

