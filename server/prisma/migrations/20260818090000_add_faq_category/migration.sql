-- AlterTable
ALTER TABLE "Faq" ADD COLUMN "category" TEXT;

-- CreateIndex
CREATE INDEX "Faq_category_idx" ON "Faq"("category");
