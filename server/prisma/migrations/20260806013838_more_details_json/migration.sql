/*
  Warnings:

  - The `more_details` column on the `Product` table was `text[]` but every
    write path (both admin product forms) has always sent a plain
    key/value object, which Prisma rejects for a scalar list field —
    "Invalid `prisma.product.create()` invocation ... more_details: { ... } / + set: String[]".
    Converting it to `jsonb` so it actually matches what's being stored.
    Existing empty arrays become an empty JSON array (`[]`), which is
    harmless: no product has ever successfully saved a populated
    more_details value, since every attempt hit this same error.

*/
-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "more_details" DROP DEFAULT,
ALTER COLUMN "more_details" DROP NOT NULL,
ALTER COLUMN "more_details" TYPE JSONB USING to_jsonb("more_details");
