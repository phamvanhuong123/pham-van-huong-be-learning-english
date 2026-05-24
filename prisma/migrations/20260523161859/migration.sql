-- CreateEnum
CREATE TYPE "ExamPart" AS ENUM ('PART1', 'PART2', 'PART3', 'PART4', 'PART5', 'PART6', 'PART7', 'FULL');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "ExamType" AS ENUM ('FREE', 'VIP');

-- CreateEnum
CREATE TYPE "PassageType" AS ENUM ('SINGLE', 'DOUBLE', 'TRIPLE');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('TEXT', 'AUDIO', 'IMAGE', 'VIDEO');

-- CreateEnum
CREATE TYPE "OptionLabel" AS ENUM ('A', 'B', 'C', 'D');

-- CreateTable
CREATE TABLE "Exam" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "part" "ExamPart" NOT NULL,
    "difficulty" "Difficulty" NOT NULL,
    "type" "ExamType" NOT NULL DEFAULT 'FREE',
    "duration" INTEGER NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "parentExamId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Exam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrammarTopic" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "GrammarTopic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PassageGroup" (
    "id" TEXT NOT NULL,
    "examId" TEXT,
    "type" "PassageType" NOT NULL DEFAULT 'SINGLE',

    CONSTRAINT "PassageGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Passage" (
    "id" TEXT NOT NULL,
    "passageGroupId" TEXT NOT NULL,
    "content" TEXT,
    "order" INTEGER NOT NULL,
    "mediaUrl" TEXT,
    "mediaType" "MediaType" NOT NULL DEFAULT 'TEXT',

    CONSTRAINT "Passage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "examId" TEXT,
    "passageGroupId" TEXT,
    "grammarTopicId" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "questionText" TEXT,
    "difficulty" "Difficulty" NOT NULL DEFAULT 'MEDIUM',
    "explanation" TEXT,
    "metadata" JSONB,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Option" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "label" "OptionLabel" NOT NULL,
    "text" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Option_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Exam_part_difficulty_type_isPublished_isDeleted_idx" ON "Exam"("part", "difficulty", "type", "isPublished", "isDeleted");

-- CreateIndex
CREATE INDEX "Exam_isDeleted_deletedAt_idx" ON "Exam"("isDeleted", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "GrammarTopic_name_key" ON "GrammarTopic"("name");

-- CreateIndex
CREATE UNIQUE INDEX "GrammarTopic_slug_key" ON "GrammarTopic"("slug");

-- CreateIndex
CREATE INDEX "PassageGroup_examId_idx" ON "PassageGroup"("examId");

-- CreateIndex
CREATE INDEX "Passage_passageGroupId_idx" ON "Passage"("passageGroupId");

-- CreateIndex
CREATE INDEX "Question_examId_order_idx" ON "Question"("examId", "order");

-- CreateIndex
CREATE INDEX "Question_grammarTopicId_idx" ON "Question"("grammarTopicId");

-- CreateIndex
CREATE INDEX "Question_isDeleted_idx" ON "Question"("isDeleted");

-- CreateIndex
CREATE INDEX "Option_questionId_idx" ON "Option"("questionId");

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_parentExamId_fkey" FOREIGN KEY ("parentExamId") REFERENCES "Exam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PassageGroup" ADD CONSTRAINT "PassageGroup_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Passage" ADD CONSTRAINT "Passage_passageGroupId_fkey" FOREIGN KEY ("passageGroupId") REFERENCES "PassageGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_passageGroupId_fkey" FOREIGN KEY ("passageGroupId") REFERENCES "PassageGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_grammarTopicId_fkey" FOREIGN KEY ("grammarTopicId") REFERENCES "GrammarTopic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Option" ADD CONSTRAINT "Option_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;
