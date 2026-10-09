import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { isRateLimited } from "@/lib/rate-limit";
import { ALLOWED_DOCUMENT_TYPES, MAX_DOCUMENT_BYTES, detectMimeType, storage } from "@/lib/storage";
import { DOCUMENT_SIZE_LABEL } from "@/lib/upload-limits";

const DOC_TYPES = new Set(["ID_FRONT", "ID_BACK", "ORG_REGISTRATION", "OTHER"]);

/**
 * POST /api/verification/documents  (multipart: file, type)
 * Uploads one document into private storage. It is attached to a verification
 * request when the request is submitted; unattached uploads are purged.
 */
export async function POST(req: Request) {
  const auth = await requireRole("CLIENT", "TALENT");
  if (auth instanceof NextResponse) return auth;

  if (await isRateLimited(`doc-upload:${auth.userId}`, 20, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many uploads. Try again later." }, { status: 429 });
  }

  try {
    const form = await req.formData();
    const file = form.get("file");
    const type = String(form.get("type") ?? "");
    if (!(file instanceof File)) return NextResponse.json({ error: "Choose a file to upload" }, { status: 400 });
    if (!DOC_TYPES.has(type)) return NextResponse.json({ error: "Unknown document type" }, { status: 400 });
    if (file.size === 0) return NextResponse.json({ error: "Choose a non-empty file" }, { status: 400 });
    if (file.size > MAX_DOCUMENT_BYTES) return NextResponse.json({ error: `File is larger than ${DOCUMENT_SIZE_LABEL}` }, { status: 413 });

    const data = Buffer.from(await file.arrayBuffer());
    const mimeType = detectMimeType(data);
    if (!mimeType || !ALLOWED_DOCUMENT_TYPES.has(mimeType)) {
      return NextResponse.json({ error: "Upload a JPG, PNG, WebP or PDF" }, { status: 415 });
    }

    const storageKey = await storage.put(data, mimeType);
    let doc;
    try {
      doc = await prisma.document.create({
      data: { userId: auth.userId, type: type as "ID_FRONT" | "ID_BACK" | "ORG_REGISTRATION" | "OTHER", storageKey, mimeType, sizeBytes: data.byteLength },
      select: { id: true, type: true, mimeType: true, sizeBytes: true, createdAt: true },
      });
    } catch (error) {
      await storage.delete(storageKey);
      throw error;
    }
    return NextResponse.json({ success: true, document: doc });
  } catch (error) {
    console.error("Document upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
