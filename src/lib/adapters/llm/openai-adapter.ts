import OpenAI from "openai";

import { CircuitBreaker } from "./circuit-breaker";
import type {
  GenerateQuestionsInput,
  GenerateQuestionsResult,
  GeneratedQuestion,
  QuestionGenerator,
} from "./types";
import { LLMError } from "./types";

const SYSTEM_PROMPT = `Tu es un tuteur expert. À partir du contenu suivant, génère des questions de révision pertinentes et variées. Les questions doivent :
- Tester la compréhension, pas juste la mémorisation
- Être formulées clairement
- Avoir des réponses trouvables dans le contenu

Réponds UNIQUEMENT avec un tableau JSON valide, sans markdown ni explication :
[{"question": "...", "answerExcerpt": "..."}]`;

export class OpenAIQuestionGenerator implements QuestionGenerator {
  private readonly client: OpenAI;
  private readonly circuitBreaker: CircuitBreaker;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 30_000,
    });
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 5,
      resetTimeoutMs: 60_000,
    });
  }

  async generateQuestions(input: GenerateQuestionsInput): Promise<GenerateQuestionsResult> {
    const start = Date.now();

    try {
      return await this.circuitBreaker.execute(async () => {
        const response = await this.client.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            {
              role: "user",
              content: `Génère ${input.count} questions à partir de ce contenu :\n\n${input.pageContent}`,
            },
          ],
          max_tokens: 1000,
          temperature: 0.7,
        });

        const content = response.choices[0]?.message?.content;
        if (!content) {
          throw new LLMError("Empty response from OpenAI", "INVALID_RESPONSE");
        }

        const questions = this.parseResponse(content);

        return {
          questions,
          model: "gpt-4o-mini",
          durationMs: Date.now() - start,
        };
      });
    } catch (error) {
      if (error instanceof LLMError) throw error;

      if (error instanceof Error && error.message === "Circuit breaker is open") {
        throw new LLMError("LLM service temporarily unavailable", "CIRCUIT_OPEN", error);
      }

      if (error instanceof OpenAI.RateLimitError) {
        throw new LLMError("OpenAI rate limit exceeded", "RATE_LIMITED", error);
      }

      if (error instanceof OpenAI.APIConnectionError) {
        throw new LLMError("OpenAI connection timeout", "TIMEOUT", error);
      }

      throw new LLMError(
        `OpenAI API error: ${error instanceof Error ? error.message : "Unknown"}`,
        "API_ERROR",
        error
      );
    }
  }

  private parseResponse(content: string): GeneratedQuestion[] {
    try {
      // Strip potential markdown code fences
      const cleaned = content
        .replace(/```json?\n?/g, "")
        .replace(/```/g, "")
        .trim();
      const parsed: unknown = JSON.parse(cleaned);

      if (!Array.isArray(parsed)) {
        throw new LLMError("Response is not an array", "INVALID_RESPONSE");
      }

      return parsed.map((item: Record<string, unknown>) => {
        if (
          typeof item !== "object" ||
          item === null ||
          typeof item.question !== "string" ||
          typeof item.answerExcerpt !== "string"
        ) {
          throw new LLMError("Invalid question format in response", "INVALID_RESPONSE");
        }
        return {
          question: item.question,
          answerExcerpt: item.answerExcerpt,
        };
      });
    } catch (error) {
      if (error instanceof LLMError) throw error;
      throw new LLMError("Failed to parse OpenAI response as JSON", "INVALID_RESPONSE", error);
    }
  }
}
