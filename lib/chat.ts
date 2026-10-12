import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { SessionPayload } from "@/lib/auth-token";

export const CHAT_PAGE_SIZE = 30;
export const CHAT_MAX_MESSAGE_LENGTH = 5_000;
export const CHAT_SEND_LIMIT = 8;
export const CHAT_SEND_WINDOW_MS = 10_000;

export function isRoomParticipant(room: { clientId: string; talentId: string }, userId: string) {
  return room.clientId === userId || room.talentId === userId;
}

export function counterpartId(room: { clientId: string; talentId: string }, userId: string) {
  return room.clientId === userId ? room.talentId : room.clientId;
}

export function normalizeMessageBody(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const body = value.replace(/\r\n/g, "\n").trim();
  return body && body.length <= CHAT_MAX_MESSAGE_LENGTH ? body : null;
}

export function containsOffPlatformContact(body: string): boolean {
  const email = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
  const phone = /(?:\+?\d[\s().-]*){8,}/;
  const payment = /\b(?:paypal|venmo|cash\s*app|wise|western\s*union|crypto|bitcoin|usdt)\b/i;
  return email.test(body) || phone.test(body) || payment.test(body);
}

export async function authorizedRoom(roomId: string, auth: Pick<SessionPayload, "userId">) {
  const room = await prisma.chatRoom.findUnique({
    where: { id: roomId },
    include: {
      project: { select: { id: true, title: true, status: true } },
      client: { select: { id: true, name: true, avatarUrl: true } },
      talent: { select: { id: true, name: true, avatarUrl: true } },
    },
  });
  return room && isRoomParticipant(room, auth.userId) ? room : null;
}

export function roomNotFound() {
  return NextResponse.json({ error: "Chat not found" }, { status: 404 });
}

export const messageInclude = {
  sender: { select: { id: true, name: true, avatarUrl: true } },
  replyTo: { select: { id: true, body: true, senderId: true, deletedAt: true } },
  reactions: { select: { emoji: true, userId: true } },
  attachments: { select: { id: true, fileName: true, mimeType: true, sizeBytes: true } },
} as const;

