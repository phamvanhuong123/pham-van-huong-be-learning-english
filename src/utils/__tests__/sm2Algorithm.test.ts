import { describe, it, expect, vi } from 'vitest';
import { calculateSM2, SM2Input } from '../sm2Algorithm';
import { addDays } from 'date-fns';

describe('SM-2 Algorithm (Lặp lại ngắt quãng)', () => {
  it('Quên từ (Rating 1 hoặc 2) -> Interval về 1, Repetition về 0', () => {
    const input: SM2Input = { ef: 2.5, interval: 6, repetitions: 2, rating: 2 };
    const result = calculateSM2(input);
    
    expect(result.interval).toBe(1);
    expect(result.repetitions).toBe(0);
    expect(result.status).toBe('LEARNING');
    expect(result.ef).toBe(2.3); // Giảm 0.2
  });

  it('Học từ mới (Repetition = 0, Rating = 4) -> Interval = 1', () => {
    const input: SM2Input = { ef: 2.5, interval: 1, repetitions: 0, rating: 4 };
    const result = calculateSM2(input);
    
    expect(result.interval).toBe(1);
    expect(result.repetitions).toBe(1);
    expect(result.status).toBe('REVIEW');
  });

  it('Ôn lần 2 (Repetition = 1, Rating = 4) -> Interval = 6', () => {
    const input: SM2Input = { ef: 2.5, interval: 1, repetitions: 1, rating: 4 };
    const result = calculateSM2(input);
    
    expect(result.interval).toBe(6);
    expect(result.repetitions).toBe(2);
    expect(result.status).toBe('REVIEW');
  });

  it('Ôn lần 3+ (Repetition = 2, Rating = 4) -> Interval tăng cấp số nhân', () => {
    const input: SM2Input = { ef: 2.5, interval: 6, repetitions: 2, rating: 4 };
    const result = calculateSM2(input);
    
    // rating 4 -> newEF không đổi (2.5) -> newInterval = 6 * 2.5 = 15
    expect(result.interval).toBe(15);
    expect(result.repetitions).toBe(3);
    expect(result.ef).toBe(2.5);
    expect(result.status).toBe('REVIEW');
  });

  it('Từ dễ (Rating = 5) -> Tăng mạnh Interval và EF', () => {
    const input: SM2Input = { ef: 2.5, interval: 10, repetitions: 2, rating: 5 };
    const result = calculateSM2(input);
    
    // newEF tăng 0.1 vì rating 5 -> 2.6
    expect(result.ef).toBeCloseTo(2.6, 2);
    expect(result.interval).toBe(26); // 10 * 2.6 = 26
    expect(result.status).toBe('MASTERED'); // >= 21
  });

  it('EF không bao giờ giảm xuống dưới 1.3', () => {
    const input: SM2Input = { ef: 1.3, interval: 10, repetitions: 2, rating: 1 };
    const result = calculateSM2(input);
    
    expect(result.ef).toBe(1.3);
  });
});
