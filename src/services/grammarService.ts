import prisma from '../config/database';
import ApiError from '../utils/ApiError';
import { StatusCodes } from 'http-status-codes';

export const getGrammarTopics = async () => {
  return prisma.grammarTopic.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: { questions: { where: { isDeleted: false } } }
      }
    }
  });
};

export const getQuestionsByTopic = async (slug: string, limit: number = 10) => {
  const topic = await prisma.grammarTopic.findUnique({
    where: { slug }
  });

  if (!topic) {
    throw new ApiError('Chủ đề không tồn tại', StatusCodes.NOT_FOUND);
  }

  // Lấy ngẫu nhiên câu hỏi thuộc chủ đề này
  // Lưu ý: Prisma chưa hỗ trợ lấy ngẫu nhiên trực tiếp, ta dùng raw query hoặc lấy all rồi random
  // Với số lượng câu hỏi vừa phải, lấy all ID rồi chọn random là ổn.
  
  const questions = await prisma.question.findMany({
    where: { 
      grammarTopicId: topic.id,
      isDeleted: false
    },
    include: {
      options: true,
      passageGroup: {
        include: { passages: true }
      }
    }
  });

  // Randomize and limit
  return questions
    .sort(() => Math.random() - 0.5)
    .slice(0, limit);
};
