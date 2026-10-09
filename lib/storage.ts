import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";

/**
 * Private document storage behind a tiny interface.
 * Current backend: Postgres (DocumentBlob). To move to Cloudflare R2 / S3,
 * implement this interface with the S3 SDK and swap `storage` below.
 */
export interface DocumentStorage {
  put(data: Buffer, mimeType: string): Promise<string>; // returns storage key
  get(key: string): Promise<{ data: Buffer; mimeType: string } | null>;
  delete(key: string): Promise<void>;
}

export { MAX_DOCUMENT_BYTES } from "@/lib/upload-limits";
export const ALLOWED_DOCUMENT_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

const postgresStorage: DocumentStorage = {
  async put(data, mimeType) {
    const key = `pg:${randomUUID()}`;
    const bytes = new Uint8Array(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer);
    await prisma.documentBlob.create({ data: { key, data: bytes, mimeType, sizeBytes: data.byteLength } });
    return key;
  },
  async get(key) {
    const blob = await prisma.documentBlob.findUnique({ where: { key } });
    return blob ? { data: Buffer.from(blob.data), mimeType: blob.mimeType } : null;
  },
  async delete(key) {
    await prisma.documentBlob.deleteMany({ where: { key } });
  },
};

export const storage: DocumentStorage = postgresStorage;

/** Sniff the real file type from magic bytes; never trust the client's Content-Type. */
export function detectMimeType(buf: Buffer): string | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "image/png";
  if (buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  if (buf.subarray(0, 5).toString("ascii") === "%PDF-") return "application/pdf";
  return null;
}
