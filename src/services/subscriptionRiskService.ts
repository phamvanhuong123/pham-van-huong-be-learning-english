import { prisma } from '@/config/prisma';

export const subscriptionRiskService = {
  calculateRiskScore: async (userId: string, proofHash: string, bankAccountNo: string, ipAddress: string | undefined): Promise<{ score: number, flags: string[] }> => {
    let score = 0;
    const flags: string[] = [];

    // 1. Check duplicate proof hash
    const duplicateProof = await prisma.subscription.findFirst({
      where: { proofHash, userId: { not: userId } }
    });
    if (duplicateProof) {
      score += 80;
      flags.push('DUPLICATE_PROOF');
    }

    // 2. Check banned bank account
    const bannedBank = await prisma.bannedBankAccount.findUnique({
      where: { bankAccountNo }
    });
    if (bannedBank) {
      score += 100;
      flags.push('BANNED_BANK_ACCOUNT');
    }

    // 3. Check multiple pending requests
    const pendingRequests = await prisma.subscription.count({
      where: { userId, status: 'PENDING' }
    });
    if (pendingRequests >= 3) {
      score += 50;
      flags.push('MULTIPLE_PENDING');
    }

    // 4. Check suspicious IP (e.g. many distinct users from same IP requesting today)
    if (ipAddress) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const sameIpRequests = await prisma.subscription.findMany({
        where: { ipAddress, createdAt: { gte: today } },
        select: { userId: true }
      });
      const distinctUsers = new Set(sameIpRequests.map(s => s.userId));
      if (distinctUsers.size >= 5) {
        score += 60;
        flags.push('SUSPICIOUS_IP');
      }
    }

    // Max score is 100
    return {
      score: Math.min(score, 100),
      flags
    };
  }
};
