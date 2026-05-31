import { prisma } from './src/config/prisma';

async function test() {
  const schedules = await prisma.vocabSchedule.findMany({
    include: { vocab: true }
  });
  console.log(JSON.stringify(schedules, null, 2));
}

test().finally(() => prisma.$disconnect());
