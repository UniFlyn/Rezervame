-- Password reset OTP codes (forgot password / email verification flow).
CREATE TABLE IF NOT EXISTS "PasswordResetCode" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PasswordResetCode_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PasswordResetCode_email_idx" ON "PasswordResetCode"("email");
CREATE INDEX IF NOT EXISTS "PasswordResetCode_userId_idx" ON "PasswordResetCode"("userId");
CREATE INDEX IF NOT EXISTS "PasswordResetCode_expiresAt_idx" ON "PasswordResetCode"("expiresAt");

DO $$ BEGIN
  ALTER TABLE "PasswordResetCode" ADD CONSTRAINT "PasswordResetCode_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
