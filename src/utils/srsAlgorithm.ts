export type VocabStatus = 'NEW' | 'LEARNING' | 'REVIEW' | 'MASTERED';
export type Rating = 1 | 2 | 3 | 4; // 1: Lại, 2: Khó, 3: Tốt, 4: Dễ

export interface CurrentSchedule {
  status: VocabStatus;
  repetitions: number;
  interval: number;
  ef: number;
}

export interface NextSchedule {
  status: VocabStatus;
  repetitions: number;
  interval: number;
  ef: number;
  nextReviewAt: Date;
}

/**
 * Tính toán lịch học tiếp theo dựa trên đánh giá của User.
 * Áp dụng thuật toán SM-2 kết hợp Learning Steps. (Pure Function)
 */
export function calculateNextReview(current: CurrentSchedule, rating: Rating): NextSchedule {
  let { status, repetitions, interval, ef } = current;
  let nextReviewMinutes = 0;
  const now = new Date();

  if (status === 'NEW') {
    if (rating === 1) {
      status = 'LEARNING';
      repetitions = 0;
      nextReviewMinutes = 1;
    } else if (rating === 2) {
      status = 'LEARNING';
      repetitions = 0;
      nextReviewMinutes = 5;
    } else if (rating === 3) {
      status = 'LEARNING';
      repetitions = 1;
      nextReviewMinutes = 10;
    } else if (rating === 4) {
      status = 'REVIEW';
      interval = 3;
      nextReviewMinutes = interval * 24 * 60;
    }
  } 
  else if (status === 'LEARNING') {
    if (repetitions === 0) {
      if (rating === 1) {
        nextReviewMinutes = 1;
      } else if (rating === 2) {
        nextReviewMinutes = 5;
      } else if (rating === 3) {
        repetitions = 1;
        nextReviewMinutes = 10;
      } else if (rating === 4) {
        status = 'REVIEW';
        interval = 3;
        nextReviewMinutes = interval * 24 * 60;
      }
    } else {
      if (rating === 1) {
        repetitions = 0;
        nextReviewMinutes = 1;
      } else if (rating === 2) {
        nextReviewMinutes = 10;
      } else if (rating === 3) {
        status = 'REVIEW';
        interval = 1;
        nextReviewMinutes = interval * 24 * 60;
      } else if (rating === 4) {
        status = 'REVIEW';
        interval = 3;
        nextReviewMinutes = interval * 24 * 60;
      }
    }
  } 
  else {
    status = 'REVIEW';
    
    if (rating === 1) {
      status = 'LEARNING';
      repetitions = 0;
      ef = Math.max(1.3, ef - 0.2);
      interval = 1;
      nextReviewMinutes = 1;
    } else if (rating === 2) {
      interval = Math.round(interval * 1.2);
      ef = Math.max(1.3, ef - 0.15);
      nextReviewMinutes = interval * 24 * 60;
    } else if (rating === 3) {
      interval = Math.round(interval * ef);
      nextReviewMinutes = interval * 24 * 60;
    } else if (rating === 4) {
      interval = Math.round(interval * ef * 1.3);
      ef = ef + 0.15;
      nextReviewMinutes = interval * 24 * 60;
    }
    
    if (status === 'REVIEW' && interval < 1) {
      interval = 1;
      nextReviewMinutes = 24 * 60;
    }
  }

  const nextReviewAt = new Date(now.getTime() + nextReviewMinutes * 60000);

  return {
    status,
    repetitions,
    interval,
    ef,
    nextReviewAt
  };
}

/**
 * Tính toán trước thời gian cho từng nút bấm để hiển thị lên UI
 */
export function previewNextIntervals(current: CurrentSchedule) {
  return {
    again: calculateNextReview(current, 1).nextReviewAt,
    hard: calculateNextReview(current, 2).nextReviewAt,
    good: calculateNextReview(current, 3).nextReviewAt,
    easy: calculateNextReview(current, 4).nextReviewAt,
  };
}
