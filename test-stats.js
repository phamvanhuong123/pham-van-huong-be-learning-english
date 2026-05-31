const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const now = new Date();
  try {
    const stats = await prisma.$queryRaw`
      SELECT 
        COALESCE(v."toeicTopic", 'Uncategorized') as topic,
        CAST(SUM(CASE WHEN vs.status = 'NEW'::"VocabStatus" THEN 1 ELSE 0 END) AS INTEGER) as new_count,
        CAST(SUM(CASE WHEN vs.status = 'LEARNING'::"VocabStatus" THEN 1 ELSE 0 END) AS INTEGER) as learning_count,
        CAST(SUM(CASE WHEN vs.status = 'REVIEW'::"VocabStatus" AND vs."nextReviewAt" <= ${now} THEN 1 ELSE 0 END) AS INTEGER) as review_count
      FROM "Vocab" v
      JOIN "VocabSchedule" vs ON v.id = vs."vocabId"
      GROUP BY COALESCE(v."toeicTopic", 'Uncategorized')
    `;
    console.log(stats);
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
