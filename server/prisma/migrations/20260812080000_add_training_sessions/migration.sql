-- CreateTable
CREATE TABLE "TrainingSession" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "tag" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "audience" TEXT NOT NULL,
    "durationMin" INTEGER NOT NULL,
    "sessionType" TEXT NOT NULL DEFAULT 'LIVE',
    "startsAt" TIMESTAMP(3),
    "capacity" INTEGER,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingRegistration" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "sessionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrainingRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TrainingSession_isPublished_idx" ON "TrainingSession"("isPublished");

-- CreateIndex
CREATE INDEX "TrainingSession_startsAt_idx" ON "TrainingSession"("startsAt");

-- CreateIndex
CREATE INDEX "TrainingRegistration_sessionId_idx" ON "TrainingRegistration"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingRegistration_sessionId_email_key" ON "TrainingRegistration"("sessionId", "email");

-- AddForeignKey
ALTER TABLE "TrainingRegistration" ADD CONSTRAINT "TrainingRegistration_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "TrainingSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
