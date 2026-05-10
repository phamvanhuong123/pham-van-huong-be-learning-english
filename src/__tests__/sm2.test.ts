import { calculateSM2, SM2Input, SM2Output } from '../lib/sm2';

// ============================================================
// Helpers
// ============================================================

/** Initial "blank" state for a brand-new vocab card */
const INITIAL_STATE: SM2Input = {
  ef: 2.5,
  interval: 1,
  repetitions: 0,
};

/**
 * Simulate multiple consecutive reviews with the same rating.
 * Useful for building up repetition state.
 */
function applyRatings(
  ratings: (0 | 1 | 2 | 3)[],
  initial: SM2Input = INITIAL_STATE
): SM2Output {
  let state: SM2Input = { ...initial };
  let result!: SM2Output;

  for (const rating of ratings) {
    result = calculateSM2(rating, state);
    state = {
      ef: result.ef,
      interval: result.interval,
      repetitions: result.repetitions,
    };
  }

  return result;
}

// ============================================================
// Test Suite
// ============================================================

describe('SM-2 Algorithm', () => {
  // ----------------------------------------------------------
  // Case 1: Good x3 → interval tăng đúng (1 → 6 → 15+)
  // ----------------------------------------------------------
  describe('Case 1: Good x3 consecutive', () => {
    it('rep=0: interval should be 1 after first Good', () => {
      const result = calculateSM2(2, INITIAL_STATE); // Good
      expect(result.interval).toBe(1);
      expect(result.repetitions).toBe(1);
    });

    it('rep=1: interval should be 6 after second Good', () => {
      const afterFirst = applyRatings([2]); // Good x1
      const result = calculateSM2(2, {
        ef: afterFirst.ef,
        interval: afterFirst.interval,
        repetitions: afterFirst.repetitions,
      });
      expect(result.interval).toBe(6);
      expect(result.repetitions).toBe(2);
    });

    it('rep>=2: interval should be >= 15 after third Good (interval * ef)', () => {
      const result = applyRatings([2, 2, 2]); // Good x3
      // After Good x2: interval=6, ef≈2.5. Third Good: round(6 * 2.5) = 15
      expect(result.interval).toBeGreaterThanOrEqual(15);
      expect(result.repetitions).toBe(3);
    });

    it('interval sequence is 1 → 6 → 15+ across 3 consecutive Good reviews', () => {
      const state0 = INITIAL_STATE;
      const r1 = calculateSM2(2, state0);   // Good #1
      const r2 = calculateSM2(2, { ef: r1.ef, interval: r1.interval, repetitions: r1.repetitions }); // Good #2
      const r3 = calculateSM2(2, { ef: r2.ef, interval: r2.interval, repetitions: r2.repetitions }); // Good #3

      expect(r1.interval).toBe(1);
      expect(r2.interval).toBe(6);
      expect(r3.interval).toBeGreaterThanOrEqual(15);
    });
  });

  // ----------------------------------------------------------
  // Case 2: Good x2 → Again → reset
  // ----------------------------------------------------------
  describe('Case 2: Again after Good x2 resets state', () => {
    it('repetitions should reset to 0 after Again', () => {
      const afterGoodX2 = applyRatings([2, 2]); // Good x2
      const result = calculateSM2(0, {  // Again
        ef: afterGoodX2.ef,
        interval: afterGoodX2.interval,
        repetitions: afterGoodX2.repetitions,
      });

      expect(result.repetitions).toBe(0);
    });

    it('interval should reset to 1 after Again', () => {
      const afterGoodX2 = applyRatings([2, 2]); // Good x2 → interval = 6
      expect(afterGoodX2.interval).toBe(6); // sanity check

      const result = calculateSM2(0, {  // Again
        ef: afterGoodX2.ef,
        interval: afterGoodX2.interval,
        repetitions: afterGoodX2.repetitions,
      });

      expect(result.interval).toBe(1);
    });

    it('status should be LEARNING after reset', () => {
      const afterGoodX2 = applyRatings([2, 2]);
      const result = calculateSM2(0, {
        ef: afterGoodX2.ef,
        interval: afterGoodX2.interval,
        repetitions: afterGoodX2.repetitions,
      });

      expect(result.status).toBe('LEARNING');
    });
  });

  // ----------------------------------------------------------
  // Case 3: Again x10 → EF không xuống dưới 1.3
  // ----------------------------------------------------------
  describe('Case 3: EF floor at 1.3 after repeated Again', () => {
    it('EF must never drop below 1.3 regardless of consecutive Again ratings', () => {
      let state: SM2Input = { ...INITIAL_STATE };

      for (let i = 0; i < 10; i++) {
        const result = calculateSM2(0, state); // Again
        expect(result.ef).toBeGreaterThanOrEqual(1.3);
        state = { ef: result.ef, interval: result.interval, repetitions: result.repetitions };
      }
    });

    it('EF converges to exactly 1.3 (minimum clamp) after many Again ratings', () => {
      let state: SM2Input = { ...INITIAL_STATE };

      for (let i = 0; i < 20; i++) {
        const result = calculateSM2(0, state); // Again
        state = { ef: result.ef, interval: result.interval, repetitions: result.repetitions };
      }

      // At this point EF should be clamped at 1.3
      expect(state.ef).toBeCloseTo(1.3, 5);
    });
  });

  // ----------------------------------------------------------
  // Case 4: Good x5 → status MASTERED (interval >= 21)
  // ----------------------------------------------------------
  describe('Case 4: Good x5 leads to MASTERED status', () => {
    it('After 5 consecutive Good reviews, interval should be >= 21', () => {
      const result = applyRatings([2, 2, 2, 2, 2]); // Good x5
      // Intervals: 1 → 6 → 15 → 37 → 92 (approx with EF ≈ 2.5)
      expect(result.interval).toBeGreaterThanOrEqual(21);
    });

    it('After 5 consecutive Good reviews, status should be MASTERED', () => {
      const result = applyRatings([2, 2, 2, 2, 2]); // Good x5
      expect(result.status).toBe('MASTERED');
    });
  });

  // ----------------------------------------------------------
  // Case 5: Invalid rating → throw Error
  // ----------------------------------------------------------
  describe('Case 5: Invalid rating throws Error', () => {
    it('should throw Error when rating is -1', () => {
      expect(() => calculateSM2(-1 as never, INITIAL_STATE)).toThrow(Error);
    });

    it('should throw Error when rating is 4', () => {
      expect(() => calculateSM2(4 as never, INITIAL_STATE)).toThrow(Error);
    });

    it('should throw Error when rating is a float (e.g. 1.5)', () => {
      expect(() => calculateSM2(1.5 as never, INITIAL_STATE)).toThrow(Error);
    });

    it('should throw Error when rating is a string', () => {
      expect(() => calculateSM2('Good' as never, INITIAL_STATE)).toThrow(Error);
    });

    it('should include descriptive message in thrown error', () => {
      expect(() => calculateSM2(99 as never, INITIAL_STATE)).toThrow(
        /Invalid SM-2 rating/
      );
    });
  });

  // ----------------------------------------------------------
  // Bonus: nextReviewAt sanity checks
  // ----------------------------------------------------------
  describe('nextReviewAt calculation', () => {
    it('nextReviewAt should be a future Date', () => {
      const result = calculateSM2(2, INITIAL_STATE); // Good
      expect(result.nextReviewAt).toBeInstanceOf(Date);
      expect(result.nextReviewAt.getTime()).toBeGreaterThan(new Date().getTime() - 1000);
    });

    it('nextReviewAt should be approximately today + interval days', () => {
      const result = calculateSM2(3, INITIAL_STATE); // Easy → interval=1

      const expected = new Date();
      expected.setHours(0, 0, 0, 0);
      expected.setDate(expected.getDate() + result.interval);

      // Compare date (day-level, not ms-level)
      expect(result.nextReviewAt.toDateString()).toBe(expected.toDateString());
    });
  });

  // ----------------------------------------------------------
  // Bonus: Status boundary checks
  // ----------------------------------------------------------
  describe('Status boundary checks', () => {
    it('repetitions=0 after reset → status LEARNING', () => {
      const result = calculateSM2(0, INITIAL_STATE); // Again
      expect(result.repetitions).toBe(0);
      expect(result.status).toBe('LEARNING');
    });

    it('interval=6 → status LEARNING (< 7)', () => {
      // Good x2 produces interval=6
      const result = applyRatings([2, 2]);
      expect(result.interval).toBe(6);
      expect(result.status).toBe('LEARNING');
    });

    it('interval=7-20 → status REVIEW', () => {
      // Good x3: interval ≈ 15
      const result = applyRatings([2, 2, 2]);
      expect(result.interval).toBeGreaterThanOrEqual(7);
      expect(result.interval).toBeLessThan(21);
      expect(result.status).toBe('REVIEW');
    });
  });
});
