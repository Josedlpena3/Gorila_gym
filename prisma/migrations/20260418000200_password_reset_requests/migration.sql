CREATE TABLE IF NOT EXISTS "password_reset_requests" (
  "email" TEXT NOT NULL,
  "lastRequestedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "password_reset_requests_pkey" PRIMARY KEY ("email")
);
