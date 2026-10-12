import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { authorizedRoom, messageInclude, roomNotFound } from "@/lib/chat";
import { CHAT_ATTACHMENT_TYPES, CHAT_MAX_ATTACHMENT_BYTES, detectChatFileType, stripImageMetadata, virusScanner } from "@/lib/chat-files";
import { storage } from "@/lib/storage";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };
export async function POST(req: Request, { params }: Params) {
  const auth = await requireRole("CLIENT", "TALENT");
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const room = await authorizedRoom(id, auth);
  if (!room) return roomNotFound();
  if (room.status !== "ACTIVE") return NextResponse.json({ error: "This chat is read-only" }, { status: 409 });
  const form = await req.formData();
  const file = form.get("file");
  const clientId = form.get("clientId");
  if (!(file instanceof File) || typeof clientId !== "string" || !/^[a-zA-Z0-9:_-]{8,100}$/.test(clientId)) return NextResponse.json({ error: "A file and clientId are required" }, { status: 400 });
  if (file.size <= 0 || file.size > CHAT_MAX_ATTACHMENT_BYTES) return NextResponse.json({ error: "Files must be 10 MB or smaller" }, { status: 413 });
  const original = Buffer.from(await file.arrayBuffer());
  const mime = detectChatFileType(original, file.name);
  if (!mime || !CHAT_ATTACHMENT_TYPES.has(mime)) return NextResponse.json({ error: "Unsupported or disguised file type" }, { status: 415 });
  const safe = stripImageMetadata(original, mime);
  const scan = await virusScanner.scan(safe, file.name);
  if (!scan.clean) return NextResponse.json({ error: "The file did not pass security scanning" }, { status: 422 });
  const storageKey = await storage.put(safe, mime);
  try {
    const message = await prisma.chatMessage.create({
      data: { roomId: id, senderId: auth.userId, clientId, type: mime.startsWith("image/") ? "IMAGE" : "FILE", body: file.name, attachments: { create: { storageKey, fileName: file.name.slice(0, 255), mimeType: mime, sizeBytes: safe.length } } },
      include: messageInclude,
    });
    return NextResponse.json({ message }, { status: 201 });
  } catch (error) { await storage.delete(storageKey); throw error; }
}

