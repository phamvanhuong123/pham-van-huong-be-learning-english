import { prisma } from '@/config/prisma';
import ApiError from '@/utils/ApiError';
import { StatusCodes } from 'http-status-codes';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import { z } from 'zod';

const csvRowSchema = z.object({
  word: z.string().min(1).max(100).trim(),
  meaning: z.string().min(1).max(500).trim(),
  phonetic: z.string().max(100).optional().nullable(),
  audioUrl: z.string().url().optional().nullable().or(z.literal('')),
  example: z.string().max(1000).optional().nullable(),
  toeicTopic: z.enum(['Business', 'Office', 'Travel', 'Health', 'Finance', 'General', '']).optional().nullable(),
  collocations: z.string().max(500).optional().nullable(),
});

export const vocabImportService = {
  importCsv: async (userId: string | null, fileBuffer: Buffer) => {
    try {
      const records = parse(fileBuffer, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true
      });

      if (records.length === 0) {
        throw new ApiError('File CSV trống', StatusCodes.BAD_REQUEST);
      }

      if (records.length > 1000) {
        throw new ApiError('Chỉ hỗ trợ import tối đa 1000 từ mỗi lần', StatusCodes.BAD_REQUEST);
      }

      const validRecords: any[] = [];
      const errors: any[] = [];

      records.forEach((row: any, index: number) => {
        try {
          const validated = csvRowSchema.parse({
            word: row.word,
            meaning: row.meaning,
            phonetic: row.phonetic || null,
            audioUrl: row.audioUrl || null,
            example: row.example || null,
            toeicTopic: row.toeicTopic || null,
            collocations: row.collocations || null,
          });

          if (validated.toeicTopic === '') validated.toeicTopic = null;
          if (validated.audioUrl === '') validated.audioUrl = null;

          validRecords.push({
            ...validated,
            userId,
            id: undefined
          });
        } catch (err: any) {
          errors.push({ row: index + 2, error: err.errors || 'Lỗi định dạng' });
        }
      });

      if (validRecords.length === 0) {
        throw new ApiError(`Không có từ hợp lệ nào. Lỗi: ${JSON.stringify(errors.slice(0, 5))}`, StatusCodes.BAD_REQUEST);
      }

      const result = await prisma.vocab.createMany({
        data: validRecords,
        skipDuplicates: true
      });

      // Tạo VocabSchedule cho các từ vừa import (chỉ với client, không áp dụng cho admin userId = null)
      if (userId && result.count > 0) {
        const vocabsWithoutSchedule = await prisma.vocab.findMany({
          where: {
            userId,
            word: { in: validRecords.map(r => r.word) },
            schedule: null
          },
          select: { id: true }
        });

        if (vocabsWithoutSchedule.length > 0) {
          await prisma.vocabSchedule.createMany({
            data: vocabsWithoutSchedule.map(v => ({ vocabId: v.id })),
            skipDuplicates: true
          });
        }
      }

      return {
        successCount: result.count,
        totalValidCount: validRecords.length,
        errorCount: errors.length,
        errors: errors.slice(0, 10)
      };

    } catch (err: any) {
      if (err instanceof ApiError) throw err;
      throw new ApiError(`Lỗi đọc file CSV: ${err.message}`, StatusCodes.BAD_REQUEST);
    }
  },

  exportCsv: async (userId: string | null) => {
    const vocabs = await prisma.vocab.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    const data = vocabs.map(v => ({
      word: v.word,
      meaning: v.meaning,
      phonetic: v.phonetic || '',
      audioUrl: v.audioUrl || '',
      example: v.example || '',
      toeicTopic: v.toeicTopic || '',
      collocations: v.collocations || ''
    }));

    const csvString = stringify(data, {
      header: true,
      columns: ['word', 'meaning', 'phonetic', 'audioUrl', 'example', 'toeicTopic', 'collocations']
    });

    return csvString;
  }
};
