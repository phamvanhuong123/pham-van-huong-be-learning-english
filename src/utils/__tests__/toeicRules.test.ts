import { describe, it, expect } from 'vitest';
import { validatePartMedia, validateQuestionText } from '../toeicRules';
import { ExamPart } from '@/types/exam.types';
import { PassagePayload } from '@/types/question.types';

describe('TOEIC Rules Validator', () => {

  describe('validatePartMedia', () => {
    it('Part 1 bắt buộc có AUDIO hoặc VIDEO, không có TEXT', () => {
      const validPassages: PassagePayload[] = [{ mediaType: 'AUDIO', mediaUrl: 'url', order: 1 }];
      expect(() => validatePartMedia('PART1', validPassages)).not.toThrow();

      const invalidNoMedia: PassagePayload[] = [];
      expect(() => validatePartMedia('PART1', invalidNoMedia)).toThrow('Part 1 bắt buộc phải có file âm thanh');

      const invalidWithText: PassagePayload[] = [{ mediaType: 'AUDIO', mediaUrl: 'url', order: 1 }, { mediaType: 'TEXT', content: 'text', order: 2 }];
      expect(() => validatePartMedia('PART1', invalidWithText)).toThrow('Part 1 không được có passage dạng TEXT');
    });

    it('Part 3 & 4 bắt buộc có AUDIO hoặc VIDEO', () => {
      const validPassages: PassagePayload[] = [{ mediaType: 'AUDIO', mediaUrl: 'url', order: 1 }];
      expect(() => validatePartMedia('PART3', validPassages)).not.toThrow();
      expect(() => validatePartMedia('PART4', validPassages)).not.toThrow();

      const invalidPassages: PassagePayload[] = [{ mediaType: 'TEXT', content: 'text', order: 1 }];
      expect(() => validatePartMedia('PART3', invalidPassages)).toThrow('PART3 bắt buộc phải có file âm thanh');
    });

    it('Part 6 & 7 bắt buộc có TEXT', () => {
      const validPassages: PassagePayload[] = [{ mediaType: 'TEXT', content: 'Đoạn văn', order: 1 }];
      expect(() => validatePartMedia('PART7', validPassages)).not.toThrow();

      const invalidPassages: PassagePayload[] = [{ mediaType: 'AUDIO', mediaUrl: 'url', order: 1 }];
      expect(() => validatePartMedia('PART6', invalidPassages)).toThrow('PART6 bắt buộc phải có đoạn văn (TEXT passage)');
    });

    it('Part 5 không được dùng nhóm (group)', () => {
      expect(() => validatePartMedia('PART5', [])).toThrow('Part 5 sử dụng câu hỏi đơn');
    });

    it('Đề FULL không được thêm câu hỏi trực tiếp', () => {
      expect(() => validatePartMedia('FULL', [])).toThrow('Không thể thêm câu hỏi trực tiếp vào đề FULL');
    });
  });

  describe('validateQuestionText', () => {
    it('Part 1 & 2 không được có câu hỏi (questionText)', () => {
      expect(() => validateQuestionText('PART1', 'What is this?', 0)).toThrow('PART1 không được hiển thị nội dung câu hỏi');
      expect(() => validateQuestionText('PART2', 'Where are you?', 1)).toThrow('PART2 không được hiển thị nội dung câu hỏi');
    });

    it('Part 1 & 2 hợp lệ khi questionText trống', () => {
      expect(() => validateQuestionText('PART1', null, 0)).not.toThrow();
      expect(() => validateQuestionText('PART2', undefined, 0)).not.toThrow();
      expect(() => validateQuestionText('PART2', '', 0)).not.toThrow();
    });

    it('Part 3,4,5,6,7 cho phép có questionText', () => {
      expect(() => validateQuestionText('PART3', 'What is this?', 0)).not.toThrow();
      expect(() => validateQuestionText('PART7', 'Where are you?', 1)).not.toThrow();
    });
  });

});
