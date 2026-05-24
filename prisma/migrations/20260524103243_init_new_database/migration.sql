-- AlterTable
ALTER TABLE "Passage" ADD COLUMN     "transcript" TEXT;

-- CreateTable
CREATE TABLE "Result" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "examId" TEXT,
    "grammarTopicId" TEXT,
    "score" INTEGER NOT NULL DEFAULT 0,
    "totalQ" INTEGER NOT NULL DEFAULT 0,
    "correctQ" INTEGER NOT NULL DEFAULT 0,
    "timeTaken" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "listeningScore" INTEGER,
    "readingScore" INTEGER,
    "listeningCorrect" INTEGER,
    "readingCorrect" INTEGER,
    "tabSwitchCount" INTEGER NOT NULL DEFAULT 0,
    "isFullTest" BOOLEAN NOT NULL DEFAULT false,
    "partBreakdown" JSONB,
    "weakPoints" JSONB,
    "xpEarned" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Result_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResultDetail" (
    "id" TEXT NOT NULL,
    "resultId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "selectedLabel" "OptionLabel",
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "timeTakenSeconds" INTEGER,

    CONSTRAINT "ResultDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminLog" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "detail" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Result_userId_submittedAt_idx" ON "Result"("userId", "submittedAt");

-- CreateIndex
CREATE INDEX "Result_examId_idx" ON "Result"("examId");

-- CreateIndex
CREATE INDEX "ResultDetail_resultId_idx" ON "ResultDetail"("resultId");

-- CreateIndex
CREATE UNIQUE INDEX "ResultDetail_resultId_questionId_key" ON "ResultDetail"("resultId", "questionId");

-- CreateIndex
CREATE INDEX "AdminLog_adminId_idx" ON "AdminLog"("adminId");

-- CreateIndex
CREATE INDEX "AdminLog_action_createdAt_idx" ON "AdminLog"("action", "createdAt");

-- CreateIndex
CREATE INDEX "AdminLog_targetType_targetId_idx" ON "AdminLog"("targetType", "targetId");

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultDetail" ADD CONSTRAINT "ResultDetail_resultId_fkey" FOREIGN KEY ("resultId") REFERENCES "Result"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultDetail" ADD CONSTRAINT "ResultDetail_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminLog" ADD CONSTRAINT "AdminLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
