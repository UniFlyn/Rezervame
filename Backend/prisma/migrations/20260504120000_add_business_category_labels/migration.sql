-- AlterTable
ALTER TABLE "Business" ADD COLUMN "categoryLabels" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
