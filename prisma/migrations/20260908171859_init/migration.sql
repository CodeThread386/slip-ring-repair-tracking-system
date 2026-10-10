-- CreateTable
CREATE TABLE "ReceivingEntry" (
    "id" SERIAL NOT NULL,
    "sno" INTEGER NOT NULL,
    "slipRingType" TEXT NOT NULL,
    "clientGpNo" TEXT NOT NULL,
    "clientGpDate" TIMESTAMP(3) NOT NULL,
    "qtyReceived" INTEGER NOT NULL,
    "location" TEXT NOT NULL,
    "remarks" TEXT,
    "isAdjustment" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueOverride" INTEGER,

    CONSTRAINT "ReceivingEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DispatchEntry" (
    "id" SERIAL NOT NULL,
    "receivingEntryId" INTEGER NOT NULL,
    "internalGpNo" TEXT NOT NULL,
    "dispatchDate" TIMESTAMP(3) NOT NULL,
    "dispatchQty" INTEGER NOT NULL,
    "dispatchTo" TEXT NOT NULL,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DispatchEntry_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DispatchEntry" ADD CONSTRAINT "DispatchEntry_receivingEntryId_fkey" FOREIGN KEY ("receivingEntryId") REFERENCES "ReceivingEntry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
