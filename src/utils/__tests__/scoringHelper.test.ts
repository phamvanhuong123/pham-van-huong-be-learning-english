import { describe, it, expect } from 'vitest';
import { getScaledScore, calculatePartialScore } from '../scoringHelper';

describe('Scoring Helper (Tính điểm TOEIC)', () => {
  
  describe('calculatePartialScore', () => {
    it('Trả về 0 nếu tổng số câu hỏi là 0', () => {
      expect(calculatePartialScore(5, 0)).toBe(0);
    });

    it('Tính điểm phần trăm chính xác (làm tròn)', () => {
      expect(calculatePartialScore(3, 10)).toBe(30);
      expect(calculatePartialScore(1, 3)).toBe(33); // 33.333... -> 33
      expect(calculatePartialScore(2, 3)).toBe(67); // 66.666... -> 67
      expect(calculatePartialScore(5, 5)).toBe(100);
    });
  });

  describe('getScaledScore (Listening)', () => {
    it('Đúng 0 câu Listening -> 5 điểm', () => {
      expect(getScaledScore('LISTENING', 0, 100)).toBe(5);
    });

    it('Đúng 50 câu Listening -> 225 điểm', () => {
      expect(getScaledScore('LISTENING', 50, 100)).toBe(225);
    });

    it('Đúng 100 câu Listening -> 495 điểm tuyệt đối', () => {
      expect(getScaledScore('LISTENING', 100, 100)).toBe(495);
    });

    it('Xử lý bài test mini: Đúng 3/5 câu (tương đương 60%) -> Điểm của 60 câu', () => {
      // 60% listening = 275 điểm
      expect(getScaledScore('LISTENING', 3, 5)).toBe(275);
    });
  });

  describe('getScaledScore (Reading)', () => {
    it('Đúng dưới 10 câu Reading -> 5 điểm (thang điểm thấp nhất)', () => {
      expect(getScaledScore('READING', 0, 100)).toBe(5);
      expect(getScaledScore('READING', 9, 100)).toBe(5);
    });

    it('Đúng 50 câu Reading -> 210 điểm', () => {
      expect(getScaledScore('READING', 50, 100)).toBe(210);
    });

    it('Đúng 100 câu Reading -> 495 điểm tuyệt đối', () => {
      expect(getScaledScore('READING', 100, 100)).toBe(495);
    });

    it('Xử lý bài test mini: Đúng 4/5 câu (tương đương 80%) -> Điểm của 80 câu', () => {
      // 80% reading = 360 điểm
      expect(getScaledScore('READING', 4, 5)).toBe(360);
    });
  });

});
