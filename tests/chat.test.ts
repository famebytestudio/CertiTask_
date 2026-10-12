import test from "node:test";
import assert from "node:assert/strict";
import { CHAT_MAX_MESSAGE_LENGTH, containsOffPlatformContact, counterpartId, isRoomParticipant, normalizeMessageBody } from "../lib/chat";
import { detectChatFileType, stripImageMetadata } from "../lib/chat-files";

test("chat authorization only admits the two server-stored participants", () => {
  const room = { clientId: "client-1", talentId: "talent-1" };
  assert.equal(isRoomParticipant(room, "client-1"), true);
  assert.equal(isRoomParticipant(room, "talent-1"), true);
  assert.equal(isRoomParticipant(room, "attacker"), false);
  assert.equal(counterpartId(room, "client-1"), "talent-1");
});

test("message validation rejects empty and oversized messages while preserving newlines", () => {
  assert.equal(normalizeMessageBody("  hello\r\nworld  "), "hello\nworld");
  assert.equal(normalizeMessageBody("   "), null);
  assert.equal(normalizeMessageBody("x".repeat(CHAT_MAX_MESSAGE_LENGTH + 1)), null);
});

test("configurable off-platform policy identifies contact and payment references", () => {
  assert.equal(containsOffPlatformContact("hello there"), false);
  assert.equal(containsOffPlatformContact("email me at person@example.test"), true);
  assert.equal(containsOffPlatformContact("pay me via USDT"), true);
});

test("attachment sniffing rejects renamed executables and recognizes documents", () => {
  assert.equal(detectChatFileType(Buffer.from("MZ executable payload"), "safe.pdf"), null);
  assert.equal(detectChatFileType(Buffer.from("%PDF-1.7\ncontent"), "file.pdf"), "application/pdf");
  assert.equal(detectChatFileType(Buffer.from([0xff, 0xd8, 0xff, 0xd9, ...Array(8).fill(0)]), "photo.jpg"), "image/jpeg");
});

test("JPEG metadata stripping removes EXIF application segments", () => {
  const exif = Buffer.from([0xff, 0xd8, 0xff, 0xe1, 0x00, 0x08, 0x45, 0x78, 0x69, 0x66, 0x00, 0x00, 0xff, 0xd9]);
  assert.deepEqual(stripImageMetadata(exif, "image/jpeg"), Buffer.from([0xff, 0xd8, 0xff, 0xd9]));
});

