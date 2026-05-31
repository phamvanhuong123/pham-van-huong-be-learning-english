const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const schedules = await prisma.vocabSchedule.findMany({
    include: { vocab: { select: { word: true, userId: true, toeicTopic: true } } }
  });
  console.log(JSON.stringify(schedules, null, 2));
}

main().finally(() => prisma.$disconnect());
