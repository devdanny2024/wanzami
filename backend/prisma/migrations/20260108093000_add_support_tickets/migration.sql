-- Add support ticket status enum
CREATE TYPE "SupportTicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- Create support tickets table
CREATE TABLE "SupportTicket" (
    "id" BIGSERIAL PRIMARY KEY,
    "userId" BIGINT REFERENCES "User"("id") ON DELETE SET NULL,
    "email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "SupportTicketStatus" NOT NULL DEFAULT 'OPEN',
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "source" TEXT NOT NULL DEFAULT 'web',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
    "lastReplyAt" TIMESTAMP(3)
);

CREATE INDEX "support_ticket_status_created_idx"
    ON "SupportTicket" ("status", "createdAt");

-- Create support ticket messages table
CREATE TABLE "SupportTicketMessage" (
    "id" BIGSERIAL PRIMARY KEY,
    "ticketId" BIGINT NOT NULL REFERENCES "SupportTicket"("id") ON DELETE CASCADE,
    "userId" BIGINT REFERENCES "User"("id") ON DELETE SET NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT FALSE,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW()
);

CREATE INDEX "support_ticket_message_ticket_idx"
    ON "SupportTicketMessage" ("ticketId", "createdAt");

