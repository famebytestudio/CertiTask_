import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { lockAccount } from "@/lib/account-lock";
import { detectMimeType } from "@/lib/storage";
import { isRateLimited } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const auth = await requireRole("CLIENT", "TALENT");
  if (auth instanceof NextResponse) return auth;
  if (await isRateLimited(`avatar:${auth.userId}`, 10, 3600_000)) return NextResponse.json({ error: "Too many photo changes. Try again later." }, { status: 429 });
  try {
    const file = (await req.formData()).get("file");
    if (!(file instanceof File) || !file.size) return NextResponse.json({ error: "Choose an image" }, { status: 400 });
    if (file.size > 2 * 1024 * 1024) return NextResponse.json({ error: "Choose an image up to 2 MB" }, { status: 413 });
    const bytes = Buffer.from(await file.arrayBuffer());
    const mimeType = detectMimeType(bytes);
    if (!mimeType || !["image/jpeg", "image/png", "image/webp"].includes(mimeType)) return NextResponse.json({ error: "Choose a JPG, PNG, or WebP image" }, { status: 415 });
    const id = randomUUID();
    const avatarUrl = `/api/avatars/${id}`;
    await prisma.$transaction(async tx => {
      await lockAccount(tx, auth.userId);
      const user = await tx.user.findUniqueOrThrow({ where: { id: auth.userId }, select: { avatarUrl: true } });
      await tx.documentBlob.create({ data: { key: `avatar:${id}`, data: new Uint8Array(bytes), mimeType, sizeBytes: bytes.length } });
      await tx.user.update({ where: { id: auth.userId }, data: { avatarUrl } });
      const oldId = user.avatarUrl?.match(/^\/api\/avatars\/([0-9a-f-]{36})$/)?.[1];
      if (oldId) await tx.documentBlob.deleteMany({ where: { key: `avatar:${oldId}` } });
    });
    return NextResponse.json({ success: true, avatarUrl });
  } catch (error) {
    console.error("Avatar upload failed:", error);
    return NextResponse.json({ error: "Could not upload your photo. Please try again." }, { status: 500 });
  }
}
