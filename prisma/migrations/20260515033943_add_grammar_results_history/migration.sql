-- AlterTable
ALTER TABLE "Result" ADD COLUMN     "grammarTopicId" TEXT,
ALTER COLUMN "examId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_grammarTopicId_fkey" FOREIGN KEY ("grammarTopicId") REFERENCES "GrammarTopic"("id") ON DELETE SET NULL ON UPDATE CASCADE;
