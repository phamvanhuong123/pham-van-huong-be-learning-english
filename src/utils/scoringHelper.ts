// TOEIC Conversion Table (Approximate ETS standard)
// 100 questions -> scaled score 5 to 495
const LISTENING_SCALED_SCORE: Record<number, number> = {
  0: 5, 1: 5, 2: 5, 3: 5, 4: 5, 5: 5, 6: 5, 7: 10, 8: 15, 9: 20, 10: 25,
  11: 30, 12: 35, 13: 40, 14: 45, 15: 50, 16: 55, 17: 60, 18: 65, 19: 70, 20: 75,
  21: 80, 22: 85, 23: 90, 24: 95, 25: 100, 26: 105, 27: 110, 28: 115, 29: 120, 30: 125,
  31: 130, 32: 135, 33: 140, 34: 145, 35: 150, 36: 155, 37: 160, 38: 165, 39: 170, 40: 175,
  41: 180, 42: 185, 43: 190, 44: 195, 45: 200, 46: 205, 47: 210, 48: 215, 49: 220, 50: 225,
  51: 230, 52: 235, 53: 240, 54: 245, 55: 250, 56: 255, 57: 260, 58: 265, 59: 270, 60: 275,
  61: 280, 62: 285, 63: 290, 64: 295, 65: 300, 66: 305, 67: 310, 68: 315, 69: 320, 70: 325,
  71: 330, 72: 335, 73: 340, 74: 345, 75: 350, 76: 355, 77: 360, 78: 365, 79: 370, 80: 375,
  81: 380, 82: 385, 83: 390, 84: 395, 85: 400, 86: 405, 87: 410, 88: 415, 89: 420, 90: 425,
  91: 430, 92: 435, 93: 440, 94: 445, 95: 450, 96: 455, 97: 460, 98: 465, 99: 470, 100: 495
};

const READING_SCALED_SCORE: Record<number, number> = {
  0: 5, 1: 5, 2: 5, 3: 5, 4: 5, 5: 5, 6: 5, 7: 5, 8: 5, 9: 5, 10: 10,
  11: 15, 12: 20, 13: 25, 14: 30, 15: 35, 16: 40, 17: 45, 18: 50, 19: 55, 20: 60,
  21: 65, 22: 70, 23: 75, 24: 80, 25: 85, 26: 90, 27: 95, 28: 100, 29: 105, 30: 110,
  31: 115, 32: 120, 33: 125, 34: 130, 35: 135, 36: 140, 37: 145, 38: 150, 39: 155, 40: 160,
  41: 165, 42: 170, 43: 175, 44: 180, 45: 185, 46: 190, 47: 195, 48: 200, 49: 205, 50: 210,
  51: 215, 52: 220, 53: 225, 54: 230, 55: 235, 56: 240, 57: 245, 58: 250, 59: 255, 60: 260,
  61: 265, 62: 270, 63: 275, 64: 280, 65: 285, 66: 290, 67: 295, 68: 300, 69: 305, 70: 310,
  71: 315, 72: 320, 73: 325, 74: 330, 75: 335, 76: 340, 77: 345, 78: 350, 79: 355, 80: 360,
  81: 365, 82: 370, 83: 375, 84: 380, 85: 385, 86: 390, 87: 395, 88: 400, 89: 405, 90: 410,
  91: 415, 92: 420, 93: 425, 94: 430, 95: 435, 96: 440, 97: 445, 98: 450, 99: 455, 100: 495
};

export const getScaledScore = (type: 'LISTENING' | 'READING', correctAnswers: number, totalQuestions: number): number => {
  const scoreMap = type === 'LISTENING' ? LISTENING_SCALED_SCORE : READING_SCALED_SCORE;
  // Quy đổi tỷ lệ: nếu đề chỉ có 5 câu listening mà đúng 3 → tỷ lệ 3/5 = 60% → quy ra 60/100
  const scaledCorrect = totalQuestions > 0
    ? Math.round((correctAnswers / totalQuestions) * 100)
    : 0;
  const safeCorrect = Math.min(Math.max(0, scaledCorrect), 100);
  return scoreMap[safeCorrect] || 5;
};

export const calculatePartialScore = (correctAnswers: number, totalQuestions: number): number => {
  // Điểm theo tỷ lệ phần trăm, thang 100
  if (totalQuestions === 0) return 0;
  return Math.round((correctAnswers / totalQuestions) * 100);
};

export const scoringHelper = {
  getScaledScore,
  calculatePartialScore,
};
