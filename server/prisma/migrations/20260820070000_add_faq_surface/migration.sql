-- AlterTable
ALTER TABLE "Faq" ADD COLUMN "surface" TEXT NOT NULL DEFAULT 'FAQ_PAGE';
ALTER TABLE "Faq" ADD COLUMN "productId" TEXT;

-- Backfill: rows already attached to a blog post were implicitly the
-- "embedded on that article" surface before this column existed.
UPDATE "Faq" SET "surface" = 'BLOG_POST' WHERE "blogId" IS NOT NULL;

-- CreateIndex
CREATE INDEX "Faq_surface_idx" ON "Faq"("surface");
CREATE INDEX "Faq_productId_idx" ON "Faq"("productId");
