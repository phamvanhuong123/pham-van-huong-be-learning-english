-- AlterTable
ALTER TABLE "Exam" ADD COLUMN     "parentExamId" TEXT;

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_parentExamId_fkey" FOREIGN KEY ("parentExamId") REFERENCES "Exam"("id") ON DELETE SET NULL ON UPDATE CASCADE;
