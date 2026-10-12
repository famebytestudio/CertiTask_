import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { authorizedRoom, CHAT_PAGE_SIZE, CHAT_SEND_LIMIT, CHAT_SEND_WINDOW_MS, containsOffPlatformContact, messageInclude, normalizeMessageBody, roomNotFound, counterpartId } from "@/lib/chat";
import { prisma } from "@/lib/prisma";
import { getClientRateLimitKey, isRateLimited } from "@/lib/rate-limit";
import { notify } from "@/lib/notifications";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Params) {
  const auth = await requireRole("CLIENT", "TALENT");
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const room = await authorizedRoom(id, auth);
  if (!room) return roomNotFound();

  const url = new URL(req.url);
  const before = url.searchParams.get("before");
  const requested = Number(url.searchParams.get("limit") ?? CHAT_PAGE_SIZE);
  const limit = Math.max(1, Math.min(50, Number.isFinite(requested) ? requested : CHAT_PAGE_SIZE));
  const cursor = before ? await prisma.chatMessage.findFirst({ where: { id: before, roomId: id }, select: { createdAt: true, id: true } }) : null;
  if (before && !cursor) return NextResponse.json({ error: "Invalid cursor" }, { status: 400 });

  const messages = await prisma.chatMessage.findMany({
    where: { roomId: id, ...(cursor ? { OR: [{ createdAt: { lt: cursor.createdAt } }, { createdAt: cursor.createdAt, id: { lt: cursor.id } }] } : {}) },
    include: messageInclude,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
  });
  const hasMore = messages.length > limit;
  const page = messages.slice(0, limit).reverse();
  return NextResponse.json({ messages: page, nextCursor: hasMore ? page[0]?.id ?? null : null });
}

export async function POST(req: Request, { params }: Params) {
  const auth = await requireRole("CLIENT", "TALENT");
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const room = await authorizedRoom(id, auth);
  if (!room) return roomNotFound();
  if (room.status !== "ACTIVE") return NextResponse.json({ error: "This chat is read-only" }, { status: 409 });
  const otherId = counterpartId(room, auth.userId);
  const blocked = await prisma.chatBlock.findFirst({ where: { OR: [{ blockerId: auth.userId, blockedId: otherId }, { blockerId: otherId, blockedId: auth.userId }] } });
  if (blocked) return NextResponse.json({ error: "Messaging is unavailable between these users" }, { status: 403 });
  if (await isRateLimited(getClientRateLimitKey(req, "chat-send", auth.userId), CHAT_SEND_LIMIT, CHAT_SEND_WINDOW_MS)) {
    return NextResponse.json({ error: "You are sending messages too quickly" }, { status: 429, headers: { "Retry-After": "10" } });
  }

  const input = await req.json().catch(() => null);
  const body = normalizeMessageBody(input?.body);
  const clientId = typeof input?.clientId === "string" && /^[a-zA-Z0-9:_-]{8,100}$/.test(input.clientId) ? input.clientId : null;
  if (!body || !clientId) return NextResponse.json({ error: "A valid message and clientId are required" }, { status: 400 });
  if (input.replyToId) {
    const reply = await prisma.chatMessage.findFirst({ where: { id: input.replyToId, roomId: id }, select: { id: true } });
    if (!reply) return NextResponse.json({ error: "Reply target not found" }, { status: 400 });
  }
  if (process.env.CHAT_CONTACT_POLICY === "block" && containsOffPlatformContact(body)) {
    return NextResponse.json({ error: "Contact details or off-platform payment references are not allowed" }, { status: 422 });
  }

  const message = await prisma.chatMessage.upsert({
    where: { senderId_clientId: { senderId: auth.userId, clientId } },
    update: {},
    create: { roomId: id, senderId: auth.userId, clientId, body, replyToId: input.replyToId ?? null },
    include: messageInclude,
  });
  const muted = await prisma.chatMute.findUnique({ where: { roomId_userId: { roomId: id, userId: otherId } } });
  if (!muted) await notify(otherId, "chat.message", `New message from ${auth.name}`, body.slice(0, 160), `${auth.role === "CLIENT" ? "/talent" : "/client"}/dashboard?tab=messages&room=${id}`);
  return NextResponse.json({ message, contactWarning: process.env.CHAT_CONTACT_POLICY === "warn" && containsOffPlatformContact(body) }, { status: 201 });
}

