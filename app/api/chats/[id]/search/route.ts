import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { authorizedRoom, messageInclude, roomNotFound } from "@/lib/chat";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };
export async function GET(req: Request, { params }: Params) {
  const auth = await requireRole("CLIENT", "TALENT");
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  if (!await authorizedRoom(id, auth)) return roomNotFound();
  const q = new URL(req.url).searchParams.get("q")?.trim();
  if (!q || q.length < 2 || q.length > 100) return NextResponse.json({ error: "Search must be 2-100 characters" }, { status: 400 });
  const messages = await prisma.chatMessage.findMany({ where: { roomId: id, deletedAt: null, body: { contains: q, mode: "insensitive" } }, include: messageInclude, orderBy: { createdAt: "desc" }, take: 50 });
  return NextResponse.json({ messages });
}

