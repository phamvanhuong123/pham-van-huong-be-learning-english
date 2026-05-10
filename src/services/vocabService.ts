import prisma from '../config/database';
import ApiError from '../utils/ApiError';

export const addVocab = async (userId: string, userRole: string, word: string, example?: string) => {
  const normalizedWord = word.trim().toLowerCase();

  // 1. Kiểm tra từ đã tồn tại chưa
  const existingVocab = await prisma.vocab.findFirst({
    where: { userId, word: normalizedWord }
  });

  if (existingVocab) {
    throw new ApiError('Từ này đã có trong Vocab của bạn', 409);
  }

  // 2. Kiểm tra giới hạn cho user STANDARD
  if (userRole === 'STANDARD') {
    const count = await prisma.vocab.count({ where: { userId } });
    if (count >= 50) {
      throw new ApiError('Đã đạt giới hạn 50 từ. Nâng cấp VIP để lưu không giới hạn!', 403, 'VOCAB_LIMIT_REACHED');
    }
  }

  // 3. Tạo mới Vocab (Meaning tạm thời để "Đang cập nhật...")
  // Note: Trong thực tế sẽ gọi Dictionary API ở đây
  const vocab = await prisma.vocab.create({
    data: {
      userId,
      word: normalizedWord,
      meaning: 'Đang cập nhật...', 
      example,
      // Tự động tạo schedule cho SM-2
      schedule: {
        create: {} 
      }
    },
    include: {
      schedule: true
    }
  });

  return vocab;
};
