/*
  Warnings:

  - You are about to drop the column `imageUrl` on the `sop_steps` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "sop_steps" ADD COLUMN     "imageId" TEXT;

-- Extract keys from existing URLs (format: /api/assets/{key})
UPDATE "sop_steps" SET "imageId" = substring("imageUrl" from '/api/assets/(.+)') WHERE "imageUrl" IS NOT NULL;

-- Drop the old column
ALTER TABLE "sop_steps" DROP COLUMN "imageUrl";
