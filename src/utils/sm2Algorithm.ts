import { addDays } from 'date-fns';
import { VocabStatus } from '../../generated/prisma/enums';

export interface SM2Input {
  ef: number;
  interval: number;
  repetitions: number;
  rating: number; // 1 (AGAIN), 3 (HARD), 4 (GOOD), 5 (EASY)
}

export interface SM2Output {
  ef: number;
  interval: number;
  repetitions: number;
  nextReviewAt: Date;
  status: VocabStatus;
}

export function calculateSM2(input: SM2Input): SM2Output {
  const { ef, interval, repetitions, rating } = input;

  // Rating 1, 2 (Quên): Reset
  if (rating < 3) {
    return {
      ef: Math.max(1.3, ef - 0.2),
      interval: 1,
      repetitions: 0,
      nextReviewAt: addDays(new Date(), 1),
      status: 'LEARNING'
    };
  }

  // Rating >= 3: Advance
  const newEF = Math.max(1.3, ef + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02)));

  let newInterval: number;
  if (repetitions === 0) newInterval = 1;
  else if (repetitions === 1) newInterval = 6;
  else newInterval = Math.round(interval * newEF);

  const newRepetitions = repetitions + 1;
  const newStatus = newInterval >= 21 ? 'MASTERED' : 'REVIEW';

  return {
    ef: newEF,
    interval: newInterval,
    repetitions: newRepetitions,
    nextReviewAt: addDays(new Date(), newInterval),
    status: newStatus
  };
}
