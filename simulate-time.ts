import { prisma } from './src/config/prisma';

async function main() {
  const daysToSkip = 14;
  const skipMs = daysToSkip * 24 * 60 * 60 * 1000;

  console.log(` Đang tua nhanh thời gian về tương lai ${daysToSkip} ngày...`);

  const schedules = await prisma.vocabSchedule.findMany();
  let updatedCount = 0;

  for (const s of schedules) {
    if (s.nextReviewAt) {

      const newTime = new Date(s.nextReviewAt.getTime() - skipMs);
      await prisma.vocabSchedule.update({
        where: { vocabId: s.vocabId },
        data: { nextReviewAt: newTime }
      });
      updatedCount++;
    }
  }

  console.log(` Hoàn tất! Đã tua nhanh thời gian cho ${updatedCount} thẻ từ vựng.`);
  console.log(` Lúc này bạn chỉ cần F5 lại giao diện Web là sẽ thấy các thẻ của tương lai xuất hiện ở mục ÔN TẬP!`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
