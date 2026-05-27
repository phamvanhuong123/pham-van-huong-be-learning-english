import { z } from 'zod';

export const createVocabSchema = z.object({
  word: z.string().min(1, 'Từ vựng không được để trống').max(100).trim().toLowerCase(),
  meaning: z.string().min(1, 'Nghĩa không được để trống').max(500).trim(),
  phonetic: z.string().max(100).optional().nullable(),
  audioUrl: z.string().url('URL audio không hợp lệ').optional().nullable(),
  example: z.string().max(1000).optional().nullable(),
  toeicTopic: z.string().max(100).optional().nullable(),
  collocations: z.string().max(500).optional().nullable(),
});

export const updateVocabSchema = createVocabSchema.partial();

export const queryVocabSchema = z.object({
  search: z.string().optional(),
  toeicTopic: z.string().optional(),
  status: z.enum(['NEW', 'LEARNING', 'REVIEW', 'MASTERED']).optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional().default(1),
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default(10),
});
