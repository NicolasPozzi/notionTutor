import { MockQuestionGenerator } from "./mock-adapter";
import { OpenAIQuestionGenerator } from "./openai-adapter";
import type { QuestionGenerator } from "./types";

export type {
  GenerateQuestionsInput,
  GenerateQuestionsResult,
  GeneratedQuestion,
  QuestionGenerator,
} from "./types";
export { LLMError } from "./types";
export type { LLMErrorCode } from "./types";

let instance: QuestionGenerator | null = null;

export function getQuestionGenerator(): QuestionGenerator {
  if (!instance) {
    instance =
      process.env.MOCK_LLM === "true" ? new MockQuestionGenerator() : new OpenAIQuestionGenerator();
  }
  return instance;
}
