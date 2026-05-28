import { prisma } from '@/config/prisma';
import ApiError from '@/utils/ApiError';
import { StatusCodes } from 'http-status-codes';

export const adminResultService = {
  getUserResults: async (userId: string, query: any) => {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where = { userId };

    const [results, total] = await Promise.all([
      prisma.result.findMany({
        where,
        skip,
        take: limit,
        orderBy: { submittedAt: 'desc' },
        include: {
          exam: {
            select: { title: true, type: true }
          }
        }
      }),
      prisma.result.count({ where })
    ]);

    return {
      results,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  },

  getResultDetails: async (resultId: string) => {
    const result = await prisma.result.findUnique({
      where: { id: resultId },
      include: {
        exam: {
          select: { title: true, type: true, part: true }
        },
        user: {
          select: { name: true, email: true }
        },
        resultDetails: {
          include: {
            question: {
              include: {
                options: true,
                passageGroup: {
                  include: {
                    passages: true
                  }
                }
              }
            }
          },
          orderBy: { question: { order: 'asc' } }
        }
      }
    });

    if (!result) {
      throw new ApiError('Result not found', StatusCodes.NOT_FOUND);
    }

    return result;
  }
};
