-- CreateTable
CREATE TABLE "ScPlan" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "participant" TEXT NOT NULL,
    "ndisNumber" TEXT,
    "coordinator" TEXT NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "travelRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "itemCode" TEXT NOT NULL,
    "travelItemCode" TEXT,
    "budget" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT NOT NULL,
    "reportLeadDays" INTEGER NOT NULL DEFAULT 42,
    "color" TEXT NOT NULL DEFAULT '#2f6feb',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScTimeEntry" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "planId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "hours" DOUBLE PRECISION NOT NULL,
    "type" TEXT NOT NULL,
    "activity" TEXT NOT NULL,
    "note" TEXT,
    "coordinator" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScTimeEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ScTimeEntry_planId_idx" ON "ScTimeEntry"("planId");

-- CreateIndex
CREATE INDEX "ScTimeEntry_date_idx" ON "ScTimeEntry"("date");

-- AddForeignKey
ALTER TABLE "ScTimeEntry" ADD CONSTRAINT "ScTimeEntry_planId_fkey" FOREIGN KEY ("planId") REFERENCES "ScPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
