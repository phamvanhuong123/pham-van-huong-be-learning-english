import { Request, Response, NextFunction } from 'express';
import * as vocabService from '../services/vocabService';
import ApiError from '../utils/ApiError';
import { SM2Rating } from '../lib/sm2';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const requireUser = (req: Request) => {
  const userId = req.user?.id as string | undefined;
  const userRole = req.user?.role as string | undefined;
  if (!userId || !userRole) {
    throw new ApiError('Bạn cần đăng nhập', 401);
  }
  return { userId, userRole };
};

// ─── GET /api/vocab ───────────────────────────────────────────────────────────
export const getVocabs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, userRole } = requireUser(req);
    const { status, topic, search, page, limit } = req.query;

    const result = await vocabService.getVocabs(userId, userRole, {
      status: status as string | undefined,
      topic: topic as string | undefined,
      search: search as string | undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/vocab  (text-selection based add, from Phase 1) ─────────────
export const addVocab = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, userRole } = requireUser(req);
    const { word, example } = req.body as { word?: unknown; example?: unknown };

    if (!word || typeof word !== 'string' || !word.trim()) {
      throw new ApiError('Từ vựng không hợp lệ', 400);
    }

    const vocab = await vocabService.addVocab(
      userId,
      userRole,
      word,
      typeof example === 'string' ? example : undefined
    );
    res.status(201).json(vocab);
  } catch (error) {
    next(error);
  }
};

// ─── PATCH /api/vocab/:vocabId ─────────────────────────────────────────────
export const updateVocab = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = requireUser(req);
    const vocabId = req.params.vocabId as string;
    const { meaning, topic } = req.body as { meaning?: unknown; topic?: unknown };

    if (!vocabId) {
      throw new ApiError('vocabId không hợp lệ', 400);
    }

    // At least one field required
    if (meaning === undefined && topic === undefined) {
      throw new ApiError('Cần cung cấp ít nhất một trường để cập nhật (meaning, topic)', 400);
    }

    const updated = await vocabService.updateVocab(userId, vocabId, {
      meaning: typeof meaning === 'string' ? meaning.trim() : undefined,
      topic: typeof topic === 'string' ? topic.trim() : undefined,
    });

    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
};

// ─── DELETE /api/vocab/bulk ────────────────────────────────────────────────
// NOTE: This route MUST be registered before /:vocabId in router
export const bulkDeleteVocab = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = requireUser(req);
    const { ids } = req.body as { ids?: unknown };

    if (!Array.isArray(ids) || ids.length === 0) {
      throw new ApiError('ids phải là một mảng không rỗng', 400);
    }

    if (!ids.every((id) => typeof id === 'string')) {
      throw new ApiError('Tất cả ids phải là string', 400);
    }

    const result = await vocabService.bulkDeleteVocab(userId, ids as string[]);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// ─── DELETE /api/vocab/:vocabId ────────────────────────────────────────────
export const deleteVocab = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = requireUser(req);
    const vocabId = req.params.vocabId as string;

    if (!vocabId) {
      throw new ApiError('vocabId không hợp lệ', 400);
    }

    await vocabService.deleteVocab(userId, vocabId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/vocab/bulk-import ──────────────────────────────────────────
// NOTE: This route MUST be registered before /:vocabId in router
export const bulkImportVocab = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, userRole } = requireUser(req);
    const { vocabs } = req.body as { vocabs?: unknown };

    if (!Array.isArray(vocabs) || vocabs.length === 0) {
      throw new ApiError('vocabs phải là một mảng không rỗng', 400);
    }

    // Validate each item
    for (const item of vocabs) {
      if (
        typeof item !== 'object' ||
        item === null ||
        typeof (item as Record<string, unknown>).word !== 'string' ||
        typeof (item as Record<string, unknown>).meaning !== 'string'
      ) {
        throw new ApiError(
          'Mỗi từ phải có cả word (string) và meaning (string)',
          400
        );
      }
    }

    const result = await vocabService.bulkImportVocab(
      userId,
      userRole,
      vocabs as vocabService.BulkImportItem[]
    );

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/vocab/due ────────────────────────────────────────────────────
// NOTE: This route MUST be registered before /:vocabId in router
export const getDueVocabs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = requireUser(req);
    const result = await vocabService.getDueVocabs(userId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/vocab/:vocabId/review ──────────────────────────────────────
export const reviewVocab = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = requireUser(req);
    const vocabId = req.params.vocabId as string;
    const { rating } = req.body as { rating?: unknown };

    if (!vocabId) {
      throw new ApiError('vocabId không hợp lệ', 400);
    }

    if (rating === undefined || rating === null || ![0, 1, 2, 3].includes(Number(rating))) {
      throw new ApiError(
        'rating không hợp lệ. Phải là 0 (Again), 1 (Hard), 2 (Good), hoặc 3 (Easy)',
        400
      );
    }

    const result = await vocabService.reviewVocab(userId, vocabId, Number(rating) as SM2Rating);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
