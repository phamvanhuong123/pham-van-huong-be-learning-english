import { Request, Response, NextFunction } from 'express';
import * as adminVocabService from '../services/adminVocabService';
import { VocabCreateBody, VocabUpdateBody } from '../services/adminVocabService';
import { StatusCodes } from 'http-status-codes';
import ApiError from '../utils/ApiError';
import * as XLSX from 'xlsx';

export const getVocabs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { topic, search, page, limit } = req.query;
    const result = await adminVocabService.getAdminVocabs({
      topic: topic as string,
      search: search as string,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    res.status(StatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
};

export const createVocab = async (req: Request<any, any, VocabCreateBody>, res: Response, next: NextFunction) => {
  try {
    const vocab = await adminVocabService.createAdminVocab(req.body);
    res.status(StatusCodes.CREATED).json(vocab);
  } catch (error) {
    next(error);
  }
};

export const updateVocab = async (req: Request<{ id: string }, any, VocabUpdateBody>, res: Response, next: NextFunction) => {
  try {
    const vocab = await adminVocabService.updateAdminVocab(req.params.id, req.body);
    res.status(StatusCodes.OK).json(vocab);
  } catch (error) {
    next(error);
  }
};

export const deleteVocab = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await adminVocabService.deleteAdminVocab(req.params.id as string);
    res.status(StatusCodes.NO_CONTENT).send();
  } catch (error) {
    next(error);
  }
};

export const bulkImport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      throw new ApiError('Vui lòng tải lên file Excel (.xlsx hoặc .csv)', StatusCodes.BAD_REQUEST);
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet) as Record<string, any>[];

    // Map fields from Excel to DB
    // Expecting columns: Word, Meaning, Phonetic, Audio, Topic, Example
    const vocabs = data.map((row) => ({
      word: String(row.Word || row['Từ vựng'] || row.word || '').trim(),
      meaning: String(row.Meaning || row['Nghĩa'] || row.meaning || '').trim(),
      phonetic: String(row.Phonetic || row['Phiên âm'] || row.phonetic || '').trim() || null,
      audioUrl: String(row.Audio || row['Âm thanh'] || row.audio || '').trim() || null,
      topic: String(row.Topic || row['Chủ đề'] || row.topic || '').trim() || null,
      example: String(row.Example || row['Ví dụ'] || row.example || '').trim() || null,
    })).filter(v => v.word && v.meaning);

    if (vocabs.length === 0) {
      throw new ApiError('Không tìm thấy dữ liệu hợp lệ trong file', StatusCodes.BAD_REQUEST);
    }

    const result = await adminVocabService.bulkImportAdminVocab(vocabs);
    res.status(StatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
};
