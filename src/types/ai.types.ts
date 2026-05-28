export interface ExplainQuestionPayload {
  questionId: string;
  questionText?: string;
  options: { label: string; text: string }[];
  correctLabel?: string;
  part?: string;
  passageContent?: string;
  forceRefresh?: boolean;
}

export interface AskFollowUpPayload {
  questionContext?: string;
  originalExplanation: string;
  chatHistory?: { user: string; ai: string }[];
  userQuestion: string;
}

export interface BuildExplanationPromptParams {
  part?: string;
  passageContent?: string;
  questionText?: string;
  options: { label: string; text: string }[];
  correctLabel?: string;
}

export interface BuildFollowUpPromptParams {
  questionContext?: string;
  originalExplanation: string;
  chatHistory?: { user: string; ai: string }[];
  userQuestion: string;
}
