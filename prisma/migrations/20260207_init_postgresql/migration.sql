-- CreateTable
CREATE TABLE IF NOT EXISTS "rooms" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "name" TEXT,
    "vaultId" TEXT,
    "creatorAddress" TEXT NOT NULL,
    "totalPeriods" INTEGER NOT NULL,
    "depositAmount" BIGINT NOT NULL,
    "strategyId" INTEGER NOT NULL,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "passwordHash" TEXT,
    "startTimeMs" BIGINT NOT NULL,
    "periodLengthMs" BIGINT NOT NULL,
    "transactionDigest" TEXT NOT NULL,
    "accumulatedYield" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastYieldUpdateMs" BIGINT NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "rooms_roomId_key" ON "rooms"("roomId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "rooms_createdAt_idx" ON "rooms"("createdAt" DESC);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "rooms_creatorAddress_idx" ON "rooms"("creatorAddress");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "rooms_passwordHash_idx" ON "rooms"("passwordHash");
