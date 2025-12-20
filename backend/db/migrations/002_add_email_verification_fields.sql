-- Migration: add_email_verification_fields
-- Created at: 2025-12-19T17:33:00.000Z

BEGIN;

ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "isEmailVerified" BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS "emailVerificationToken" TEXT,
ADD COLUMN IF NOT EXISTS "emailVerificationExpires" TIMESTAMP;

COMMIT;
