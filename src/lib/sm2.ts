// ============================================================
// SM-2 Algorithm — Pure Function Implementation
// Ref: https://www.supermemo.com/en/blog/application-of-a-computer-to-improve-the-results-obtained-in-working-with-the-supermemo-method
// ============================================================

export type SM2Rating = 0 | 1 | 2 | 3; // Again | Hard | Good | Easy

export interface SM2Input {
  /** Easiness Factor, minimum 1.3 */
  ef: number;
  /** Review interval in days */
  interval: number;
  /** Number of consecutive successful repetitions */
  repetitions: number;
}

export interface SM2Output {
  ef: number;
  interval: number;
  repetitions: number;
  status: 'NEW' | 'LEARNING' | 'REVIEW' | 'MASTERED';
  nextReviewAt: Date;
}

/**
 * Map SM2Rating (0-3) to SuperMemo q-value (1-5).
 *   Again=0 → q=1
 *   Hard=1  → q=2
 *   Good=2  → q=4
 *   Easy=3  → q=5
 */
const RATING_TO_Q: Record<SM2Rating, number> = {
  0: 1,
  1: 2,
  2: 4,
  3: 5,
};

/**
 * Calculate the next SM-2 state after a review.
 *
 * @param rating - User's rating: 0 (Again) | 1 (Hard) | 2 (Good) | 3 (Easy)
 * @param current - Current SM-2 state
 * @returns Updated SM-2 state with nextReviewAt date
 * @throws Error if rating is not 0 | 1 | 2 | 3
 */
export function calculateSM2(rating: SM2Rating, current: SM2Input): SM2Output {
  // --- Validate rating ---
  if (!Number.isInteger(rating) || rating < 0 || rating > 3) {
    throw new Error(
      `Invalid SM-2 rating: "${rating}". Must be 0 (Again), 1 (Hard), 2 (Good), or 3 (Easy).`
    );
  }

  const q = RATING_TO_Q[rating];

  let { ef, interval, repetitions } = current;

  // --- Interval & Repetitions Logic ---
  if (q < 3) {
    // Failed response (Again or Hard): reset progress
    repetitions = 0;
    interval = 1;
  } else {
    // Successful response (Good or Easy)
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      // repetitions >= 2
      interval = Math.round(interval * ef);
    }
    repetitions += 1;
  }

  // --- EF (Easiness Factor) Update ---
  // ef = max(1.3, ef + 0.1 - (5-q) * (0.08 + (5-q) * 0.02))
  const newEF = ef + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02);
  ef = Math.max(1.3, newEF);

  // --- Status Determination ---
  let status: SM2Output['status'];
  if (repetitions === 0) {
    status = 'LEARNING';
  } else if (interval < 7) {
    status = 'LEARNING';
  } else if (interval < 21) {
    status = 'REVIEW';
  } else {
    status = 'MASTERED';
  }

  // --- nextReviewAt Calculation ---
  // Start from midnight today, add interval days
  const nextReviewAt = new Date();
  nextReviewAt.setHours(0, 0, 0, 0);
  nextReviewAt.setDate(nextReviewAt.getDate() + interval);

  return {
    ef,
    interval,
    repetitions,
    status,
    nextReviewAt,
  };
}
