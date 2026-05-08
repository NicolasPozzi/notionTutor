/** LLM Adapter types for question generation (ARCH-9, NFR15) */

export interface GenerateQuestionsInput {
  /** The text content of the Notion page */
  pageContent: string;
  /** Number of questions to generate */
  count: number;
  /** Notion page ID for reference */
  notionPageId: string;
}

export interface GeneratedQuestion {
  question: string;
  answerExcerpt: string;
}

export interface GenerateQuestionsResult {
  questions: GeneratedQuestion[];
  /** Model used for generation */
  model: string;
  /** Duration in milliseconds */
  durationMs: number;
}

export interface QuestionGenerator {
  generateQuestions(input: GenerateQuestionsInput): Promise<GenerateQuestionsResult>;
}

/** Error types for LLM operations */
export class LLMError extends Error {
  constructor(
    message: string,
    public readonly code: LLMErrorCode,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "LLMError";
  }
}

export type LLMErrorCode =
  | "RATE_LIMITED"
  | "TIMEOUT"
  | "INVALID_RESPONSE"
  | "CIRCUIT_OPEN"
  | "API_ERROR";
