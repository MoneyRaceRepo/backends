-- CreateTable
CREATE TABLE "rooms" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "vaultId" TEXT,
    "creatorAddress" TEXT NOT NULL,
    "totalPeriods" INTEGER NOT NULL,
    "depositAmount" BIGINT NOT NULL,
    "strategyId" INTEGER NOT NULL,
    "startTimeMs" BIGINT NOT NULL,
    "periodLengthMs" BIGINT NOT NULL,
    "transactionDigest" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "rooms_roomId_key" ON "rooms"("roomId");

-- CreateIndex
CREATE INDEX "rooms_createdAt_idx" ON "rooms"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "rooms_creatorAddress_idx" ON "rooms"("creatorAddress");
