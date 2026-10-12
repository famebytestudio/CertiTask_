-- CreateEnum
CREATE TYPE "ChatRoomStatus" AS ENUM ('ACTIVE', 'LOCKED', 'ARCHIVED');
CREATE TYPE "ChatMessageType" AS ENUM ('TEXT', 'IMAGE', 'FILE', 'SYSTEM');
CREATE TYPE "ChatDeliveryStatus" AS ENUM ('SENT', 'DELIVERED');

-- CreateTable
CREATE TABLE "chat_rooms" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "talentId" TEXT NOT NULL,
  "status" "ChatRoomStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lockedAt" TIMESTAMP(3),
  CONSTRAINT "chat_rooms_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "chat_messages" (
  "id" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "roomId" TEXT NOT NULL,
  "senderId" TEXT,
  "type" "ChatMessageType" NOT NULL DEFAULT 'TEXT',
  "body" TEXT NOT NULL,
  "replyToId" TEXT,
  "deliveryStatus" "ChatDeliveryStatus" NOT NULL DEFAULT 'SENT',
  "editedAt" TIMESTAMP(3),
  "deletedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "chat_reactions" (
  "id" TEXT NOT NULL,
  "messageId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "emoji" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "chat_reactions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "chat_attachments" (
  "id" TEXT NOT NULL,
  "messageId" TEXT NOT NULL,
  "storageKey" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "sizeBytes" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "chat_attachments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "chat_reads" (
  "roomId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "lastReadMessageId" TEXT,
  "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "chat_reads_pkey" PRIMARY KEY ("roomId", "userId")
);

CREATE TABLE "chat_mutes" (
  "roomId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "chat_mutes_pkey" PRIMARY KEY ("roomId", "userId")
);

CREATE TABLE "chat_blocks" (
  "blockerId" TEXT NOT NULL,
  "blockedId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "chat_blocks_pkey" PRIMARY KEY ("blockerId", "blockedId"),
  CONSTRAINT "chat_blocks_not_self" CHECK ("blockerId" <> "blockedId")
);

CREATE TABLE "chat_reports" (
  "id" TEXT NOT NULL,
  "roomId" TEXT NOT NULL,
  "messageId" TEXT NOT NULL,
  "reporterId" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "chat_reports_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "chat_rooms_projectId_key" ON "chat_rooms"("projectId");
CREATE INDEX "chat_rooms_clientId_status_idx" ON "chat_rooms"("clientId", "status");
CREATE INDEX "chat_rooms_talentId_status_idx" ON "chat_rooms"("talentId", "status");
CREATE UNIQUE INDEX "chat_messages_senderId_clientId_key" ON "chat_messages"("senderId", "clientId");
CREATE INDEX "chat_messages_roomId_createdAt_id_idx" ON "chat_messages"("roomId", "createdAt", "id");
CREATE UNIQUE INDEX "chat_reactions_messageId_userId_emoji_key" ON "chat_reactions"("messageId", "userId", "emoji");
CREATE INDEX "chat_reactions_userId_idx" ON "chat_reactions"("userId");
CREATE UNIQUE INDEX "chat_attachments_storageKey_key" ON "chat_attachments"("storageKey");
CREATE INDEX "chat_attachments_messageId_idx" ON "chat_attachments"("messageId");
CREATE INDEX "chat_reads_userId_idx" ON "chat_reads"("userId");
CREATE INDEX "chat_mutes_userId_idx" ON "chat_mutes"("userId");
CREATE INDEX "chat_blocks_blockedId_idx" ON "chat_blocks"("blockedId");
CREATE UNIQUE INDEX "chat_reports_messageId_reporterId_key" ON "chat_reports"("messageId", "reporterId");
CREATE INDEX "chat_reports_roomId_createdAt_idx" ON "chat_reports"("roomId", "createdAt");

ALTER TABLE "chat_rooms" ADD CONSTRAINT "chat_rooms_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "chat_rooms" ADD CONSTRAINT "chat_rooms_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "chat_rooms" ADD CONSTRAINT "chat_rooms_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "chat_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "chat_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "chat_reactions" ADD CONSTRAINT "chat_reactions_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "chat_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "chat_reactions" ADD CONSTRAINT "chat_reactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "chat_attachments" ADD CONSTRAINT "chat_attachments_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "chat_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "chat_reads" ADD CONSTRAINT "chat_reads_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "chat_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "chat_reads" ADD CONSTRAINT "chat_reads_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "chat_mutes" ADD CONSTRAINT "chat_mutes_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "chat_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "chat_mutes" ADD CONSTRAINT "chat_mutes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "chat_blocks" ADD CONSTRAINT "chat_blocks_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "chat_blocks" ADD CONSTRAINT "chat_blocks_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "chat_reports" ADD CONSTRAINT "chat_reports_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "chat_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "chat_reports" ADD CONSTRAINT "chat_reports_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "chat_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "chat_reports" ADD CONSTRAINT "chat_reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Down migration (manual): drop chat_reports, chat_blocks, chat_mutes, chat_reads,
-- chat_attachments, chat_reactions, chat_messages, chat_rooms, then the three enums.
