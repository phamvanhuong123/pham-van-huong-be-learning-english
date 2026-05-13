-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('TEXT', 'AUDIO', 'IMAGE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ExamPart" ADD VALUE 'PART1';
ALTER TYPE "ExamPart" ADD VALUE 'PART2';
ALTER TYPE "ExamPart" ADD VALUE 'PART3';
ALTER TYPE "ExamPart" ADD VALUE 'PART4';

-- AlterTable
ALTER TABLE "Passage" ADD COLUMN     "mediaType" "MediaType" NOT NULL DEFAULT 'TEXT',
ALTER COLUMN "content" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "metadata" JSONB;
