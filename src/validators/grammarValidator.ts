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

// ─── Grammar Question Schemas ─────────────────────────────────────
const grammarOptionSchema = z.object({
  label: z.nativeEnum(OptionLabel, { message: 'Label đáp án phải là A, B, C hoặc D' }),
  text: z.string().min(1, 'Nội dung đáp án không được để trống'),
  isCorrect: z.boolean(),
});

export const createGrammarQuestionSchema = z.object({
  questionText: z.string().min(1, 'Nội dung câu hỏi không được để trống'),
  difficulty: z.nativeEnum(Difficulty).optional().default(Difficulty.MEDIUM),
  explanation: z.string().optional().nullable(),
  options: z.array(grammarOptionSchema)
    .min(2, 'Câu hỏi phải có ít nhất 2 đáp án')
    .max(4, 'Câu hỏi không được có quá 4 đáp án')
    .refine(
      (opts) => opts.filter(o => o.isCorrect).length === 1,
      { message: 'Câu hỏi phải có đúng 1 đáp án đúng' }
    )
    .refine(
      (opts) => new Set(opts.map(o => o.label)).size === opts.length,
      { message: 'Các đáp án không được trùng label' }
    ),
});

export const updateGrammarQuestionSchema = z.object({
  questionText: z.string().min(1, 'Nội dung câu hỏi không được để trống').optional(),
  difficulty: z.nativeEnum(Difficulty).optional(),
  explanation: z.string().optional().nullable(),
  options: z.array(grammarOptionSchema)
    .min(2, 'Câu hỏi phải có ít nhất 2 đáp án')
    .max(4, 'Câu hỏi không được có quá 4 đáp án')
    .refine(
      (opts) => opts.filter(o => o.isCorrect).length === 1,
      { message: 'Câu hỏi phải có đúng 1 đáp án đúng' }
    )
    .refine(
      (opts) => new Set(opts.map(o => o.label)).size === opts.length,
      { message: 'Các đáp án không được trùng label' }
    )
    .optional(),
});
