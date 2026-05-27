import { z } from 'zod';
import { Difficulty, ExamPart, OptionLabel } from '../../generated/prisma/enums';

export const createGrammarTopicSchema = z.object({
  name: z.string().min(1, 'Tên chủ đề không được để trống').max(200),
  slug: z.string().min(1, 'Slug không được để trống').max(200),
  description: z.string().optional().nullable()
});

export const updateGrammarTopicSchema = createGrammarTopicSchema.partial();

export const queryGrammarTopicSchema = z.object({
  search: z.string().optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional().default(1),
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default(10),
});

export const submitAnswerSchema = z.object({
  questionId: z.string().uuid('ID câu hỏi không hợp lệ'),
  selectedLabel: z.nativeEnum(OptionLabel),
  timeTakenSeconds: z.number().int().min(0).optional().default(0)
});
