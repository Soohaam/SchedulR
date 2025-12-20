CREATE TABLE IF NOT EXISTS "User" (
  "id" SERIAL PRIMARY KEY,
  "email" TEXT UNIQUE NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "firstName" TEXT,
  "lastName" TEXT,
  "isTwoFactorEnabled" BOOLEAN DEFAULT FALSE,
  "twoFactorSecret" TEXT,
  "twoFactorTempSecret" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "TwoFactorSession" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER REFERENCES "User"("id") ON DELETE CASCADE,
  "tokenHash" TEXT UNIQUE NOT NULL,
  "expiresAt" TIMESTAMP NOT NULL
);
