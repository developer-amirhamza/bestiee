-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "pricingNotes" TEXT,
ADD COLUMN     "pack" TEXT,
ADD COLUMN     "absorbency" TEXT,
ADD COLUMN     "keyFeatures" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
