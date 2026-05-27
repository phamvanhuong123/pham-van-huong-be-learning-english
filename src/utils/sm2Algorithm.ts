/**
 * SM-2 Spaced Repetition Algorithm
 * 
 * 4-button UI mapping:
 * 🔴 Quên (AGAIN) → rating = 1  → reset hoàn toàn
 * 🟠 Khó  (HARD)  → rating = 3  → advance chậm
 * 🟢 Tốt  (GOOD)  → rating = 4  → advance bình thường
 * 🔵 Dễ   (EASY)  → rating = 5  → advance nhanh
 */

export interface SM2Input {
  ef: number;           // Ease Factor hiện tại (min 1.3)
  interval: number;     // Interval hiện tại (ngày)
  repetitions: number;  // Số lần repetition liên tiếp
  rating: number;       // 1, 3, 4, 5
}

export interface SM2Output {
  ef: number;
  interval: number;
  repetitions: number;
  nextReviewAt: Date;
  status: 'NEW' | 'LEARNING' | 'REVIEW' | 'MASTERED';
}

// Rating constants matching 4-button UI
export const RATING = {
  AGAIN: 1,  // Quên
  HARD: 3,   // Khó
  GOOD: 4,   // Tốt
  EASY: 5,   // Dễ
} as const;

export const VALID_RATINGS = [RATING.AGAIN, RATING.HARD, RATING.GOOD, RATING.EASY] as const;

const MIN_EF = 1.3;
const MASTERED_THRESHOLD_DAYS = 21;

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function calculateSM2(input: SM2Input): SM2Output {
  const { ef, interval, repetitions, rating } = input;

  // Rating < 3 (AGAIN): quên hoàn toàn → reset
  if (rating < 3) {
    const newEF = Math.max(MIN_EF, ef - 0.2);
    return {
      ef: newEF,
      interval: 1,
      repetitions: 0,
      nextReviewAt: addDays(new Date(), 1),
      status: 'LEARNING',
    };
  }

  // Rating >= 3 (HARD/GOOD/EASY): advance
  // SM-2 EF formula: EF' = EF + (0.1 - (5-q) * (0.08 + (5-q) * 0.02))
  const newEF = Math.max(
    MIN_EF,
    ef + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02))
  );

  let newInterval: number;
  if (repetitions === 0) {
    newInterval = 1;
  } else if (repetitions === 1) {
    newInterval = 6;
  } else {
    newInterval = Math.round(interval * newEF);
  }

  const newRepetitions = repetitions + 1;

  // Status based on interval length
  let newStatus: SM2Output['status'];
  if (newInterval >= MASTERED_THRESHOLD_DAYS) {
    newStatus = 'MASTERED';
  } else if (newRepetitions <= 1) {
    newStatus = 'LEARNING';
  } else {
    newStatus = 'REVIEW';
  }

  return {
    ef: Math.round(newEF * 100) / 100, // Round to 2 decimal places
    interval: newInterval,
    repetitions: newRepetitions,
    nextReviewAt: addDays(new Date(), newInterval),
    status: newStatus,
  };
}
