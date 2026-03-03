-- Migration: Rename BASIC plan to STARTER, add AI credit tracking
-- Run this against your PostgreSQL database after deploying the new code.

-- 1. Add credit tracking columns
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "aiCreditsUsed" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "aiCreditsReset" TIMESTAMP;

-- 2. Add STARTER value to the Plan enum
DO $$ BEGIN
  ALTER TYPE "Plan" ADD VALUE IF NOT EXISTS 'STARTER';
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 3. Migrate existing BASIC users -> STARTER (no access loss)
UPDATE "User" SET plan = 'STARTER' WHERE plan = 'BASIC';

-- 4. Give migrated STARTER users their full 20 credits (already paid)
UPDATE "User" SET "aiCreditsUsed" = 0 WHERE plan = 'STARTER';

-- Verify result
SELECT plan, COUNT(*) FROM "User" GROUP BY plan;

-- Add AuditLog table for observability
CREATE TABLE IF NOT EXISTS "AuditLog" (
  "id"         TEXT NOT NULL PRIMARY KEY,
  "event"      TEXT NOT NULL,
  "userId"     TEXT,
  "plan"       TEXT,
  "ip"         TEXT,
  "severity"   TEXT NOT NULL DEFAULT 'info',
  "durationMs" INTEGER,
  "meta"       TEXT,
  "createdAt"  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "AuditLog_event_idx"            ON "AuditLog"("event");
CREATE INDEX IF NOT EXISTS "AuditLog_userId_idx"           ON "AuditLog"("userId");
CREATE INDEX IF NOT EXISTS "AuditLog_severity_createdAt"   ON "AuditLog"("severity", "createdAt");
CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx"        ON "AuditLog"("createdAt");

-- Cover letter table
CREATE TABLE IF NOT EXISTS "CoverLetter" (
  "id"        TEXT        NOT NULL PRIMARY KEY,
  "userId"    TEXT        NOT NULL,
  "title"     TEXT        NOT NULL DEFAULT 'خطاب تقديم',
  "language"  TEXT        NOT NULL DEFAULT 'AR',
  "tone"      TEXT        NOT NULL DEFAULT 'professional',
  "content"   TEXT        NOT NULL,
  "contentEn" TEXT,
  "jobTitle"  TEXT,
  "company"   TEXT,
  "cvId"      TEXT,
  "createdAt" TIMESTAMP   NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP   NOT NULL DEFAULT NOW(),
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "CoverLetter_userId_idx"   ON "CoverLetter"("userId");
CREATE INDEX IF NOT EXISTS "CoverLetter_createdAt_idx" ON "CoverLetter"("createdAt");
