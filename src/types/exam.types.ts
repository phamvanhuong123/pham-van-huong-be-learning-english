export type ExamPart = 'PART1' | 'PART2' | 'PART3' | 'PART4' | 'PART5' | 'PART6' | 'PART7' | 'FULL';
export type ExamType = 'FREE' | 'VIP';
export type QuestionDifficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type OptionLabel = 'A' | 'B' | 'C' | 'D';
export type QuestionStatus = 'DRAFT' | 'PUBLISHED';
export interface ExamCreatePayload {
    title: string,
    description?: string,
    part: ExamPart,
    difficulty: QuestionDifficulty,
    type: ExamType,
    duration: number,
    childrenIdExam?: string[]
}


export interface ExamUpdatePayload {
    title?: string,
    description?: string,
    part?: ExamPart,
    difficulty?: QuestionDifficulty,
    type?: ExamType,
    duration?: number,
    childrenIdExam?: string[],
    isPublished?: boolean
}
