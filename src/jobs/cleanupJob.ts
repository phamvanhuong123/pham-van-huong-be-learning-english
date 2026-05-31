import { prisma } from '@/config/prisma';

export const cleanupAbandonedSessions = async () => {
  try {
    // Tìm các session chưa completed và lastActiveAt quá 24h
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // Theo DB schema, VocabStudySession không có status, chỉ có completedAt (null = IN_PROGRESS)
    const abandonedSessions = await prisma.vocabStudySession.findMany({
      where: {
        completedAt: null,
        lastActiveAt: {
          lt: cutoffTime
        }
      }
    });

    if (abandonedSessions.length === 0) {
      console.log('[Cron] No abandoned sessions found.');
      return;
    }

    console.log(`[Cron] Found ${abandonedSessions.length} abandoned sessions. Cleaning up...`);

    // Force complete (đánh dấu completedAt = lastActiveAt)
    // Những session này sẽ được tính là kết thúc sớm, card chưa được review sẽ giữ nguyên nextReviewAt
    for (const session of abandonedSessions) {
      await prisma.vocabStudySession.update({
        where: { id: session.id },
        data: {
          completedAt: session.lastActiveAt
        }
      });
    }

    console.log('[Cron] Abandoned sessions cleanup completed.');
  } catch (error) {
    console.error('[Cron] Error cleaning up abandoned sessions:', error);
  }
};
