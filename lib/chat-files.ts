import { createHash } from "node:crypto";

export const CHAT_MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
export const CHAT_ATTACHMENT_TYPES = new Set([
  "image/jpeg", "image/png", "image/webp", "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/msword", "application/vnd.ms-excel", "application/vnd.ms-powerpoint",
]);

export function detectChatFileType(buf: Buffer, name: string): string | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return "image/png";
  if (buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  if (buf.subarray(0, 5).toString("ascii") === "%PDF-") return "application/pdf";
  if (buf.subarray(0, 8).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]))) {
    const ext = name.toLowerCase().split(".").pop();
    return ext === "doc" ? "application/msword" : ext === "xls" ? "application/vnd.ms-excel" : ext === "ppt" ? "application/vnd.ms-powerpoint" : null;
  }
  if (buf.subarray(0, 4).toString("binary") === "PK\u0003\u0004") {
    const sample = buf.subarray(0, Math.min(buf.length, 2_000_000)).toString("latin1");
    if (sample.includes("word/")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    if (sample.includes("xl/")) return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    if (sample.includes("ppt/")) return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
  }
  return null;
}

/** Remove EXIF and common metadata chunks without decoding image pixels. */
export function stripImageMetadata(buf: Buffer, mime: string): Buffer {
  if (mime === "image/jpeg") {
    const parts = [buf.subarray(0, 2)]; let offset = 2;
    while (offset + 2 <= buf.length && buf[offset] === 0xff) {
      const marker = buf[offset + 1];
      if (marker === 0xda || marker === 0xd9) { parts.push(buf.subarray(offset)); break; }
      if (offset + 4 > buf.length) return buf;
      const length = buf.readUInt16BE(offset + 2);
      if (length < 2 || offset + 2 + length > buf.length) return buf;
      if (marker !== 0xe1 && marker !== 0xed) parts.push(buf.subarray(offset, offset + 2 + length));
      offset += 2 + length;
    }
    return Buffer.concat(parts);
  }
  if (mime === "image/png") {
    const parts = [buf.subarray(0, 8)]; let offset = 8;
    while (offset + 12 <= buf.length) {
      const length = buf.readUInt32BE(offset), type = buf.subarray(offset + 4, offset + 8).toString("ascii"), end = offset + 12 + length;
      if (end > buf.length) return buf;
      if (!["eXIf", "tEXt", "iTXt", "zTXt"].includes(type)) parts.push(buf.subarray(offset, end));
      offset = end;
      if (type === "IEND") break;
    }
    return Buffer.concat(parts);
  }
  return buf;
}

export interface VirusScanner { scan(data: Buffer, name: string): Promise<{ clean: boolean; reference?: string }> }
export const virusScanner: VirusScanner = {
  async scan(data, name) {
    // Integration hook: replace with an asynchronous ClamAV/vendor adapter in production.
    return { clean: true, reference: `placeholder:${createHash("sha256").update(data).digest("hex").slice(0, 16)}:${name.length}` };
  },
};

